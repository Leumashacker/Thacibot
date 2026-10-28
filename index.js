const fs = require('fs');
const path = require('path');
const http = require('http');
const pino = require('pino');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
} = require('@whiskeysockets/baileys');

const config = require('./config');
const { getText, numberOf } = require('./lib/utils');
const { saved, save, load: loadState } = require('./lib/state');
const ai = require('./lib/ai');
const { awayWelcome } = require('./lib/style');
const { useSupabaseAuthState } = require('./lib/supaAuth');
const usage = require('./lib/usage');

// ---- Safety settings (change them in Render > Environment) -----------------
const REPLY_DELAY_MS = Number(process.env.REPLY_DELAY_MS || 3000); // base wait before each reply
const REPLY_JITTER_MS = Number(process.env.REPLY_JITTER_MS || 1500); // random extra wait
const MAX_REPLIES_PER_HOUR = Number(process.env.MAX_REPLIES_PER_HOUR || 30); // per chat, owner excluded

// ---- Where the WhatsApp login is kept ---------------------------------------
// With SESSION_URL + BOT_SECRET set, the login lives in Supabase and survives restarts.
const SESSION_URL = process.env.SESSION_URL;
const BOT_SECRET = process.env.BOT_SECRET;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const hits = new Map(); // chat id -> timestamps of recent bot replies

function replyAllowed(jid) {
  const now = Date.now();
  const list = (hits.get(jid) || []).filter((t) => now - t < 3600 * 1000);
  if (list.length >= MAX_REPLIES_PER_HOUR) {
    hits.set(jid, list);
    return false;
  }
  list.push(now);
  hits.set(jid, list);
  return true;
}

// ---- Tiny web server so Render (web service) sees an open port --------------
http
  .createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`${config.BOT_NAME} is running`);
  })
  .listen(process.env.PORT || 3000, () => console.log('Web server listening'));

// ---- Load plugins (every file in /plugins is one feature) -------------------
const commands = new Map(); // name or alias -> plugin
const listeners = []; // plugins that react to plain messages (games)

// Fixed: handles both Plugins and plugins, and creates folder if missing
let pluginsPath = path.join(__dirname, 'plugins');
if (!fs.existsSync(pluginsPath)) {
  pluginsPath = path.join(__dirname, 'Plugins');
}
if (!fs.existsSync(pluginsPath)) {
  pluginsPath = path.join(__dirname, 'src', 'plugins');
}
if (!fs.existsSync(pluginsPath)) {
  fs.mkdirSync(path.join(__dirname, 'plugins'), { recursive: true });
  pluginsPath = path.join(__dirname, 'plugins');
  console.log('Created empty plugins folder at', pluginsPath);
}

console.log(`Loading plugins from: ${pluginsPath}`);

for (const file of fs.readdirSync(pluginsPath)) {
  if (!file.endsWith('.js')) continue;
  try {
    const plugin = require(path.join(pluginsPath, file));
    if (plugin.name) {
      commands.set(plugin.name, plugin);
      (plugin.aliases || []).forEach((a) => commands.set(a, plugin));
    }
    if (typeof plugin.onMessage === 'function') listeners.push(plugin);
  } catch (e) {
    console.error(`Failed to load plugin ${file}:`, e.message);
  }
}

const uniquePlugins = () => [...new Set(commands.values())];

// ---- Start the bot ----------------------------------------------------------
let current = null; // only ever keep one live socket

async function start() {
  // Make sure an old socket can never keep running next to a new one.
  if (current) {
    try {
      current.ev.removeAllListeners();
      current.end(undefined);
    } catch (_) {
      /* already closed */
    }
    current = null;
  }

  const logger = pino({ level: 'silent' });

  let state;
  let saveCreds;
  let clearSession = null;
  if (SESSION_URL && BOT_SECRET) {
    try {
      ({ state, saveCreds, clear: clearSession } = await useSupabaseAuthState(SESSION_URL, BOT_SECRET));
    } catch (e) {
      // Never fall back to a throwaway login here: that would hide the problem and burn pairing codes.
      console.error('Could not reach the Supabase session store, retrying in 10s:', e.message);
      setTimeout(start, 10000);
      return;
    }
  } else {
    console.log('SESSION_URL/BOT_SECRET not set: keeping the login on local disk (lost on restart).');
    ({ state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'session')));
  }
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    logger,
    browser: Browsers.ubuntu('Chrome'),
    printQRInTerminal: false,
    markOnlineOnConnect: false,
  });
  current = sock;

  // First run: link with a pairing code instead of a QR.
  if (!sock.authState.creds.registered) {
    if (!config.PAIRING_NUMBER) {
      console.error('Set PAIRING_NUMBER (or OWNER_NUMBER) in .env first.');
      console.error('Add PAIRING_NUMBER in Render > Environment');
      process.exit(1);
    }
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(config.PAIRING_NUMBER);
        console.log(`\n${config.BOT_NAME} pairing code: ${code}`);
        console.log('WhatsApp > Settings > Linked Devices > Link with phone number\n');
      } catch (e) {
        console.error('Could not get pairing code:', e.message);
      }
    }, 3000);
  }

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
    if (connection === 'open') console.log(`✅ ${config.BOT_NAME} is online`);
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code === DisconnectReason.loggedOut) {
        if (clearSession) {
          console.log('Logged out from WhatsApp. Clearing the saved login and asking for a new pairing code...');
          try {
            await clearSession();
          } catch (e) {
            console.error('Could not clear saved login:', e.message);
          }
          setTimeout(start, 2000);
        } else {
          console.log('Logged out. Delete the "session" folder and start again.');
        }
      } else {
        console.log('Connection closed, reconnecting...');
        setTimeout(start, 2000);
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const m of messages) {
      try {
        await handle(sock, m);
      } catch (e) {
        console.error('Handler error:', e);
      }
    }
  });
}

async function handle(sock, m) {
  if (!m.message || m.message.protocolMessage) return;
  const jid = m.key.remoteJid;
  if (!jid || jid === 'status@broadcast' || jid.endsWith('@newsletter')) return;

  const fromMe = !!m.key.fromMe;
  const isGroup = jid.endsWith('@g.us');
  const sender = fromMe ? sock.user.id : m.key.participant || jid;
  const isOwner = fromMe || numberOf(sender) === config.OWNER_NUMBER;
  const text = getText(m);
  if (!text) return;

  const who = fromMe ? '' : ` | ${m.pushName || 'unknown'} (${numberOf(sender)})`;
  const cmd = text.startsWith(config.PREFIX) ? `command ${text.slice(config.PREFIX.length).trim().split(/\s+/)[0].toLowerCase()}` : 'text';
  console.log(`Message received (${isGroup ? 'group' : 'chat'}, ${fromMe ? 'from me' : 'from friend'}, ${cmd})${who}`);

  // Remember who is using the bot (counts only, the .users command shows it to you).
  if (!fromMe) {
    const typed = text.startsWith(config.PREFIX) ? text.slice(config.PREFIX.length).trim().split(/\s+/)[0].toLowerCase() : '';
    const known = typed && commands.has(typed) ? commands.get(typed).name : null;
    usage.record({ id: sender, name: m.pushName, number: numberOf(sender), isGroup, cmd: known });
  }

  // Every reply waits a few seconds and shows "typing..." first, and each chat has an hourly limit.
  const reply = async (t) => {
    if (!isOwner && !replyAllowed(jid)) return;
    try {
      await sock.sendPresenceUpdate('composing', jid);
    } catch (_) {
      /* not critical */
    }
    await sleep(REPLY_DELAY_MS + Math.random() * REPLY_JITTER_MS);
    try {
      await sock.sendPresenceUpdate('paused', jid);
    } catch (_) {
      /* not critical */
    }
    return sock.sendMessage(jid, { text: t }, { quoted: m });
  };
  const ctx = {
    sock, m, jid, sender, text, isGroup, fromMe, isOwner, reply, config,
    commands: uniquePlugins(),
  };

  // 1) A command like ".dice"
  if (text.startsWith(config.PREFIX)) {
    const [name, ...args] = text.slice(config.PREFIX.length).trim().split(/\s+/);
    const plugin = commands.get((name || '').toLowerCase());
    if (!plugin) return;
    if (plugin.ownerOnly && !isOwner) return;
    await plugin.run({ ...ctx, args });
    return;
  }

  // Never react to your own plain messages.
  if (fromMe) return;

  // 2) An ongoing game / story waiting for an answer
  for (const p of listeners) {
    if (await p.onMessage(ctx)) return;
  }

  // 3) Away mode: greet friends who text while you're offline
  if (saved.away && !isGroup) {
    const last = saved.greeted[jid] || 0;
    const waitMs = config.AWAY_COOLDOWN_HOURS * 3600 * 1000;
    const first = Date.now() - last > waitMs;
    if (first) {
      saved.greeted[jid] = Date.now();
      save();
    }

    // Your own welcome text (set with .away msg) is sent once; after that, and by default, the AI chats.
    const customWelcome = first && saved.awayMsg;
    let answer = null;
    if (!customWelcome && saved.ai && ai.enabled) {
      answer = await ai.reply({
        jid,
        name: m.pushName,
        text,
        ownerName: config.OWNER_NAME,
        botName: config.BOT_NAME,
        persona: saved.aiPersona,
      });
    }
    if (answer) {
      await reply(first ? `${answer}\n\n🎮 Send *${config.PREFIX}menu* to play games while you wait` : answer);
    } else if (first) {
      await reply(saved.awayMsg || awayWelcome(config));
    }
  }
}

// On Render a redeploy runs the old and the new copy side by side for a few seconds.
// Two copies sharing one WhatsApp login corrupt each other's encryption state, so the new
// copy waits until the old one has been shut down before it connects.
const START_DELAY_MS = SESSION_URL && BOT_SECRET ? Number(process.env.START_DELAY_MS || 30000) : 0;
console.log(`Waiting ${Math.round(START_DELAY_MS / 1000)}s so any old copy shuts down first...`);
console.log(ai.enabled ? 'AI chat is available (AI_KEY found)' : 'AI chat is off (no AI_KEY set)');
Promise.all([usage.load(), loadState()])
  .then(() => sleep(START_DELAY_MS))
  .then(start);

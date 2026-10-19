const fs = require('fs');
const path = require('path');
const pino = require('pino');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
} = require('@whiskeysockets/baileys');

const config = require('./config');
const { getText, numberOf } = require('./lib/utils');
const { saved, save } = require('./lib/state');

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
async function start() {
  const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'session'));
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: Browsers.ubuntu('Chrome'),
    printQRInTerminal: false,
  });

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

  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'open') console.log(`✅ ${config.BOT_NAME} is online`);
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code === DisconnectReason.loggedOut) {
        console.log('Logged out. Delete the "session" folder and start again.');
      } else {
        console.log('Connection closed, reconnecting...');
        start();
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

  const reply = (t) => sock.sendMessage(jid, { text: t }, { quoted: m });
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
    if (Date.now() - last > waitMs) {
      saved.greeted[jid] = Date.now();
      save();
      const msg =
        saved.awayMsg ||
        `Hey! 👋 ${config.OWNER_NAME} is offline right now, but I'm *${config.BOT_NAME}* and I'll keep you company.\n\nTry:\n• ${config.PREFIX}menu - see everything I can do\n• ${config.PREFIX}story - an adventure where you choose\n• ${config.PREFIX}ttt - tic tac toe\n• ${config.PREFIX}guess - guess my number`;
      await reply(msg);
    }
  }
}

start();

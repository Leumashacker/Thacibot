const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DIR, 'state.json');

const URL = process.env.SESSION_URL;
const SECRET = process.env.BOT_SECRET;
const ROW = 'state';

// Saved on disk AND in Supabase (when configured), so it survives restarts and redeploys.
const defaults = { away: false, awayMsg: '', greeted: {}, ai: true, aiPersona: '' };
const saved = { ...defaults }; // same object everywhere: plugins keep their reference to it

try {
  Object.assign(saved, JSON.parse(fs.readFileSync(FILE, 'utf8')));
} catch (_) {
  /* first run */
}

async function call(body) {
  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-bot-secret': SECRET },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`store answered ${res.status}`);
  return res.json();
}

async function load() {
  if (!URL || !SECRET) return;
  try {
    const { rows } = await call({ op: 'get', ids: [ROW] });
    if (rows && rows[0]) {
      Object.assign(saved, defaults, JSON.parse(rows[0].value));
      console.log(`Settings loaded (away ${saved.away ? 'ON' : 'OFF'}, AI ${saved.ai ? 'ON' : 'OFF'})`);
    } else {
      console.log('No saved settings in Supabase yet');
    }
  } catch (e) {
    console.error('Could not load settings:', e.message);
  }
}

let timer = null;
async function pushRemote() {
  timer = null;
  if (!URL || !SECRET) return;
  try {
    await call({ op: 'set', rows: [{ id: ROW, value: JSON.stringify(saved) }] });
  } catch (e) {
    console.error('Could not save settings to Supabase:', e.message);
  }
}

function save() {
  try {
    fs.mkdirSync(DIR, { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(saved, null, 2));
  } catch (e) {
    console.error('Could not save state:', e.message);
  }
  if (URL && SECRET && !timer) timer = setTimeout(pushRemote, 1000);
}

process.on('SIGTERM', () => {
  if (timer) {
    clearTimeout(timer);
    pushRemote();
  }
});

// Kept in memory only: one active game/story per chat.
const sessions = new Map();

module.exports = { saved, save, load, sessions };

// Remembers who texted the bot and which commands they used (counts only, never message text).
// Saved in Supabase through the same locked function as the WhatsApp login, so restarts keep it.
const URL = process.env.SESSION_URL;
const SECRET = process.env.BOT_SECRET;
const ROW = 'usage';
const MAX_USERS = 300;
const MAX_RECENT = 40;

let data = { users: {}, recent: [] };
let dirty = false;

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
      const saved = JSON.parse(rows[0].value);
      data = { users: saved.users || {}, recent: saved.recent || [] };
    }
    console.log(`Usage stats loaded (${Object.keys(data.users).length} people)`);
  } catch (e) {
    console.error('Could not load usage stats:', e.message);
  }
}

async function flush() {
  if (!dirty || !URL || !SECRET) return;
  dirty = false;
  try {
    await call({ op: 'set', rows: [{ id: ROW, value: JSON.stringify(data) }] });
  } catch (e) {
    dirty = true;
    console.error('Could not save usage stats:', e.message);
  }
}

function record({ id, name, number, isGroup, cmd }) {
  const now = Date.now();
  const u = data.users[id] || (data.users[id] = { name: '', number, first: now, msgs: 0, chat: 0, group: 0, cmds: {} });
  if (name) u.name = name;
  u.number = number;
  u.last = now;
  u.msgs += 1;
  if (isGroup) u.group += 1;
  else u.chat += 1;
  if (cmd) u.cmds[cmd] = (u.cmds[cmd] || 0) + 1;

  if (cmd) {
    data.recent.unshift({ t: now, id, name: u.name, cmd, group: !!isGroup });
    if (data.recent.length > MAX_RECENT) data.recent.length = MAX_RECENT;
  }

  const ids = Object.keys(data.users);
  if (ids.length > MAX_USERS) {
    ids.sort((a, b) => (data.users[a].last || 0) - (data.users[b].last || 0));
    for (const old of ids.slice(0, ids.length - MAX_USERS)) delete data.users[old];
  }
  dirty = true;
}

function snapshot() {
  return data;
}

async function clear() {
  data = { users: {}, recent: [] };
  dirty = true;
  await flush();
}

setInterval(flush, 20000).unref();
process.on('SIGTERM', () => {
  flush().finally(() => process.exit(0));
});

module.exports = { load, record, snapshot, clear, flush };

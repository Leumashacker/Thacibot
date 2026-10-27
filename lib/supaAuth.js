// Keeps the WhatsApp login in Supabase (through the locked "wa-session" function)
// so it survives Render restarts, redeploys and sleep.
const { proto, initAuthCreds, BufferJSON } = require('@whiskeysockets/baileys');

const enc = (v) => JSON.stringify(v, BufferJSON.replacer);
const dec = (s) => JSON.parse(s, BufferJSON.reviver);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function useSupabaseAuthState(url, secret) {
  async function call(body) {
    let lastErr;
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-bot-secret': secret },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`session store answered ${res.status}`);
        return await res.json();
      } catch (e) {
        lastErr = e;
        await sleep(500 * attempt);
      }
    }
    throw lastErr;
  }

  // Saves run one after another so an older write can never overwrite a newer one.
  let chain = Promise.resolve();
  const enqueue = (fn) => {
    chain = chain.then(fn).catch((e) => console.error('Session save failed:', e.message));
    return chain;
  };

  async function readMany(ids) {
    const out = new Map();
    for (let i = 0; i < ids.length; i += 100) {
      const { rows } = await call({ op: 'get', ids: ids.slice(i, i + 100) });
      for (const r of rows || []) out.set(r.id, r.value);
    }
    return out;
  }

  const stored = await readMany(['creds']);
  const creds = stored.has('creds') ? dec(stored.get('creds')) : initAuthCreds();
  console.log(stored.has('creds') ? 'Loaded saved WhatsApp login from Supabase' : 'No saved login in Supabase yet');

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const rows = await readMany(ids.map((id) => `${type}:${id}`));
          const data = {};
          for (const id of ids) {
            const raw = rows.get(`${type}:${id}`);
            if (!raw) continue;
            let value = dec(raw);
            if (type === 'app-state-sync-key' && value) {
              value = proto.Message.AppStateSyncKeyData.fromObject(value);
            }
            data[id] = value;
          }
          return data;
        },
        set: (data) => {
          const rows = [];
          const dels = [];
          for (const type of Object.keys(data)) {
            for (const id of Object.keys(data[type])) {
              const value = data[type][id];
              if (value) rows.push({ id: `${type}:${id}`, value: enc(value) });
              else dels.push(`${type}:${id}`);
            }
          }
          return enqueue(async () => {
            if (rows.length) await call({ op: 'set', rows });
            if (dels.length) await call({ op: 'del', ids: dels });
          });
        },
      },
    },
    saveCreds: () => enqueue(() => call({ op: 'set', rows: [{ id: 'creds', value: enc(creds) }] })),
    clear: () => enqueue(() => call({ op: 'clear' })),
  };
}

module.exports = { useSupabaseAuthState };

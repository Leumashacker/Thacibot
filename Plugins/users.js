const usage = require('../lib/usage');
const { box } = require('../lib/style');

const TZ = process.env.TIMEZONE || 'Africa/Nairobi';

function ago(t) {
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function clock(t) {
  return new Date(t).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ,
  });
}

function label(u) {
  const n = String(u.number || '').replace(/\D/g, '');
  const tail = n.length >= 6 ? `…${n.slice(-4)}` : n;
  return `${u.name || 'unknown'}${tail ? ` (${tail})` : ''}`;
}

module.exports = {
  name: 'users',
  aliases: ['who', 'people'],
  desc: 'see who is using the bot',
  ownerOnly: true,
  async run({ reply, args, config }) {
    const p = config.PREFIX;
    const sub = (args[0] || '').toLowerCase();
    const { users, recent } = usage.snapshot();

    if (sub === 'clear') {
      await usage.clear();
      return reply('🧹 Cleared the user list.');
    }

    if (sub === 'recent') {
      if (!recent.length) return reply('No commands used yet.');
      const lines = recent.slice(0, 15).map((e) => `🕒 ${clock(e.t)} · *${e.name || 'unknown'}* ➜ ${p}${e.cmd}${e.group ? ' 👥' : ''}`);
      return reply([box('📜 *RECENT COMMANDS*', ['Newest first']), '', lines.join('\n')].join('\n'));
    }

    const list = Object.values(users).sort((a, b) => (b.last || 0) - (a.last || 0));
    if (!list.length) return reply('Nobody has messaged me yet.');

    const totalCmds = list.reduce((n, u) => n + Object.values(u.cmds).reduce((a, b) => a + b, 0), 0);
    const head = box('👥 *WHO IS USING ME*', [
      `People: *${list.length}*`,
      `Commands used: *${totalCmds}*`,
    ]);

    const rows = list.slice(0, 12).map((u, i) => {
      const cmds = Object.entries(u.cmds).sort((a, b) => b[1] - a[1]);
      const top = cmds.length ? cmds.slice(0, 4).map(([c, n]) => `${p}${c}×${n}`).join('  ') : 'no commands yet';
      return `*${i + 1}. ${label(u)}*\n   💬 ${u.msgs} msgs (${u.chat} chat, ${u.group} group) · ⏱️ ${ago(u.last)}\n   🎮 ${top}`;
    });

    const more = list.length > 12 ? `\n\n…and ${list.length - 12} more` : '';
    await reply([head, '', rows.join('\n\n') + more, '', `💡 _${p}users recent for the latest commands, ${p}users clear to reset_`].join('\n'));
  },
};

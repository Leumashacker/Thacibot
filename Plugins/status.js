const ai = require('../lib/ai');
const usage = require('../lib/usage');
const { saved } = require('../lib/state');
const { box } = require('../lib/style');

function fmt(sec) {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return [d && `${d}d`, (d || h) && `${h}h`, `${m}m`, !d && !h && `${s}s`].filter(Boolean).join(' ');
}

module.exports = {
  name: 'status',
  aliases: ['uptime'],
  desc: 'bot uptime and health',
  async run({ reply, config, commands }) {
    const info = ai.info();
    let people = 0;
    try {
      const snap = usage.snapshot();
      const u = snap && snap.users;
      people = Array.isArray(u) ? u.length : u ? Object.keys(u).length : 0;
    } catch (_) {
      /* not critical */
    }
    const mb = Math.round(process.memoryUsage().rss / 1048576);
    await reply(
      box(`📊 *${config.BOT_NAME.toUpperCase()} STATUS*`, [
        `🟢 Online for: *${fmt(process.uptime())}*`,
        `🌙 Away mode: *${saved.away ? 'ON' : 'OFF'}*`,
        `🤖 AI chat: *${!ai.enabled ? 'not set up' : saved.ai ? 'ON' : 'OFF'}*${info.model ? ` (${info.model})` : ''}`,
        `🧩 Commands: *${commands.length}*`,
        `👥 People seen: *${people}*`,
        `💾 Memory: *${mb} MB*`,
      ])
    );
  },
};

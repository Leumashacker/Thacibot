const { sessions } = require('../lib/state');
const { pick } = require('../lib/random');

// a = answers that count as correct (lowercase)
const RIDDLES = [
  { q: 'I have keys but no locks, and space but no room. You can enter, but you cannot go outside. What am I?', a: ['keyboard'] },
  { q: 'The more you take, the more you leave behind. What am I?', a: ['footsteps', 'steps', 'footstep'] },
  { q: 'I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?', a: ['echo'] },
  { q: 'What has hands but cannot clap?', a: ['clock', 'a clock', 'watch'] },
  { q: 'What gets wetter the more it dries?', a: ['towel', 'a towel'] },
  { q: 'I have cities but no houses, mountains but no trees, and water but no fish. What am I?', a: ['map', 'a map'] },
  { q: 'What can travel around the world while staying in one corner?', a: ['stamp', 'a stamp'] },
  { q: 'What has a neck but no head?', a: ['bottle', 'a bottle'] },
  { q: 'What comes once in a minute, twice in a moment, but never in a thousand years?', a: ['m', 'the letter m', 'letter m'] },
  { q: 'What can you catch but not throw?', a: ['cold', 'a cold'] },
];

module.exports = {
  name: 'riddle',
  desc: 'Solve a riddle (riddle hint | riddle skip)',

  async run({ jid, reply, args }) {
    const sub = (args[0] || '').toLowerCase();
    const s = sessions.get(jid);
    const active = s?.type === 'riddle';

    if (sub === 'skip' || sub === 'stop') {
      if (!active) return reply('No riddle is running.');
      sessions.delete(jid);
      return reply(`The answer was *${s.r.a[0]}*.`);
    }
    if (sub === 'hint') {
      if (!active) return reply('Start a riddle first.');
      return reply(`💡 The answer starts with *${s.r.a[0][0].toUpperCase()}*.`);
    }

    const r = pick(RIDDLES);
    sessions.set(jid, { type: 'riddle', r });
    await reply(`🧩 *Riddle*\n\n${r.q}\n\nSend your answer. Stuck? Use riddle hint or riddle skip.`);
  },

  async onMessage({ jid, text, reply }) {
    const s = sessions.get(jid);
    // Only treat short messages as answers so normal chat is not judged.
    if (!s || s.type !== 'riddle' || text.split(/\s+/).length > 4) return false;

    const guess = text.toLowerCase().replace(/[^a-z ]/g, '').trim();
    if (s.r.a.includes(guess)) {
      sessions.delete(jid);
      await reply(`🎉 Correct! The answer is *${s.r.a[0]}*.`);
    } else {
      await reply('❌ Not quite. Try again, or ask for a hint.');
    }
    return true;
  },
};

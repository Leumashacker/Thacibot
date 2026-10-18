const { sessions } = require('../lib/state');

const MAX_TRIES = 7;

module.exports = {
  name: 'guess',
  desc: 'Guess my number from 1 to 100 (guess stop to quit)',

  async run({ jid, reply, args }) {
    if ((args[0] || '').toLowerCase() === 'stop') {
      const s = sessions.get(jid);
      if (s?.type === 'guess') {
        sessions.delete(jid);
        return reply(`Game over. My number was *${s.number}*.`);
      }
      return reply('No guessing game is running.');
    }
    sessions.set(jid, {
      type: 'guess',
      number: Math.floor(Math.random() * 100) + 1,
      tries: 0,
    });
    await reply(`🔢 I'm thinking of a number from *1 to 100*.\nYou have *${MAX_TRIES}* tries. Send your guess!`);
  },

  async onMessage({ jid, text, reply }) {
    const s = sessions.get(jid);
    if (!s || s.type !== 'guess' || !/^\d{1,3}$/.test(text)) return false;

    const g = parseInt(text, 10);
    s.tries++;

    if (g === s.number) {
      sessions.delete(jid);
      await reply(`🎉 Correct! It was *${s.number}*. You got it in ${s.tries} ${s.tries === 1 ? 'try' : 'tries'}!`);
    } else if (s.tries >= MAX_TRIES) {
      sessions.delete(jid);
      await reply(`😅 Out of tries! My number was *${s.number}*. Send the guess command to play again.`);
    } else {
      await reply(`${g < s.number ? '⬆️ Higher' : '⬇️ Lower'}! (${MAX_TRIES - s.tries} tries left)`);
    }
    return true;
  },
};

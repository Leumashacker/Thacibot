const { sessions } = require('../lib/state');
const { pick, shuffle } = require('../lib/random');

const WORDS = [
  'elephant', 'safari', 'rainbow', 'football', 'internet', 'chocolate', 'mountain', 'guitar',
  'whatsapp', 'computer', 'sunshine', 'friendship', 'birthday', 'adventure', 'lighthouse',
  'umbrella', 'butterfly', 'kitchen', 'diamond', 'treasure', 'journey', 'thunder', 'giraffe',
];
const MAX_TRIES = 3;

function scramble(word) {
  let out = word;
  while (out === word) out = shuffle(word.split('')).join('');
  return out;
}

module.exports = {
  name: 'scramble',
  aliases: ['unscramble'],
  desc: 'Unscramble the word (scramble hint | scramble stop)',

  async run({ jid, reply, args }) {
    const sub = (args[0] || '').toLowerCase();
    const s = sessions.get(jid);
    const active = s?.type === 'scramble';

    if (sub === 'stop') {
      if (!active) return reply('No word game is running.');
      sessions.delete(jid);
      return reply(`Game over. The word was *${s.word}*.`);
    }
    if (sub === 'hint') {
      if (!active) return reply('Start a game first.');
      return reply(`💡 It starts with *${s.word[0]}* and has ${s.word.length} letters.`);
    }

    const word = pick(WORDS);
    sessions.set(jid, { type: 'scramble', word, tries: 0 });
    await reply(`🔤 *Unscramble this word:*\n\n*${scramble(word).toUpperCase().split('').join(' ')}*\n\nYou have ${MAX_TRIES} tries. Need help? Send the scramble command with "hint".`);
  },

  async onMessage({ jid, text, reply }) {
    const s = sessions.get(jid);
    if (!s || s.type !== 'scramble' || !/^[a-z]+$/i.test(text)) return false;

    if (text.toLowerCase() === s.word) {
      sessions.delete(jid);
      await reply(`🎉 Yes! The word was *${s.word}*. You got it in ${s.tries + 1} ${s.tries === 0 ? 'try' : 'tries'}.`);
      return true;
    }
    s.tries++;
    if (s.tries >= MAX_TRIES) {
      sessions.delete(jid);
      await reply(`😅 Out of tries! The word was *${s.word}*.`);
    } else {
      await reply(`❌ Not it. ${MAX_TRIES - s.tries} ${MAX_TRIES - s.tries === 1 ? 'try' : 'tries'} left.`);
    }
    return true;
  },
};

const { sessions } = require('../lib/state');
const { pick } = require('../lib/random');

const WORDS = [
  'nairobi', 'savannah', 'football', 'computer', 'dolphin', 'penguin', 'volcano', 'balloon',
  'keyboard', 'sandwich', 'jungle', 'pyramid', 'rocket', 'island', 'blanket', 'monkey',
  'calendar', 'telephone', 'zebra', 'lantern', 'whistle', 'cheetah',
];
const LIVES = 6;
const STAGES = ['😀', '🙂', '😐', '😟', '😨', '😵', '💀'];

const board = (s) => s.word.split('').map((c) => (s.guessed.has(c) ? c.toUpperCase() : '_')).join(' ');
const status = (s) =>
  `${STAGES[LIVES - s.lives]} Lives: ${'❤️'.repeat(s.lives)}${'🖤'.repeat(LIVES - s.lives)}\n\n*${board(s)}*\n\nUsed: ${[...s.guessed].join(', ').toUpperCase() || 'none'}`;

module.exports = {
  name: 'hangman',
  aliases: ['hm'],
  desc: 'Guess the word letter by letter (hangman stop | hangman <whole word>)',

  async run({ jid, reply, args, config }) {
    const sub = (args[0] || '').toLowerCase();
    const s = sessions.get(jid);
    const active = s?.type === 'hangman';

    if (sub === 'stop') {
      if (!active) return reply('No hangman game is running.');
      sessions.delete(jid);
      return reply(`Game over. The word was *${s.word}*.`);
    }

    // Guess the whole word: .hangman safari
    if (sub && active) {
      if (sub === s.word) {
        sessions.delete(jid);
        return reply(`🎉 Yes! The word was *${s.word.toUpperCase()}*. You win!`);
      }
      s.lives--;
      if (s.lives <= 0) {
        sessions.delete(jid);
        return reply(`💀 Wrong, and you're out of lives! The word was *${s.word}*.`);
      }
      return reply(`❌ Not the word.\n\n${status(s)}`);
    }

    const game = { type: 'hangman', word: pick(WORDS), guessed: new Set(), lives: LIVES };
    sessions.set(jid, game);
    await reply(`🪢 *Hangman*\nSend one letter at a time. To guess the whole word use ${config.PREFIX}hangman <word>.\n\n${status(game)}`);
  },

  async onMessage({ jid, text, reply }) {
    const s = sessions.get(jid);
    if (!s || s.type !== 'hangman' || !/^[a-z]$/i.test(text)) return false;

    const letter = text.toLowerCase();
    if (s.guessed.has(letter)) {
      await reply(`You already tried *${letter.toUpperCase()}*.`);
      return true;
    }
    s.guessed.add(letter);
    const hit = s.word.includes(letter);
    if (!hit) s.lives--;

    if (s.word.split('').every((c) => s.guessed.has(c))) {
      sessions.delete(jid);
      await reply(`🎉 You got it! The word was *${s.word.toUpperCase()}*.`);
    } else if (s.lives <= 0) {
      sessions.delete(jid);
      await reply(`💀 Game over! The word was *${s.word.toUpperCase()}*.`);
    } else {
      await reply(`${hit ? '✅ Good guess!' : '❌ Nope.'}\n\n${status(s)}`);
    }
    return true;
  },
};

const { sessions } = require('../lib/state');
const { shuffle } = require('../lib/random');

// q = question, o = options (A-D), a = index of the right option
const QUESTIONS = [
  { q: 'What is the capital city of Kenya?', o: ['Mombasa', 'Nairobi', 'Kisumu', 'Nakuru'], a: 1 },
  { q: 'Which is the largest planet in our solar system?', o: ['Saturn', 'Earth', 'Jupiter', 'Neptune'], a: 2 },
  { q: 'Mount Kilimanjaro is in which country?', o: ['Kenya', 'Uganda', 'Ethiopia', 'Tanzania'], a: 3 },
  { q: 'How many continents are there?', o: ['5', '6', '7', '8'], a: 2 },
  { q: 'What is the chemical formula of water?', o: ['CO2', 'H2O', 'O2', 'NaCl'], a: 1 },
  { q: 'Which is the largest ocean?', o: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], a: 3 },
  { q: 'Which is the fastest land animal?', o: ['Cheetah', 'Lion', 'Horse', 'Leopard'], a: 0 },
  { q: 'Which is the longest river in Africa?', o: ['Congo', 'Nile', 'Niger', 'Zambezi'], a: 1 },
  { q: 'Which planet is known as the Red Planet?', o: ['Venus', 'Mercury', 'Mars', 'Jupiter'], a: 2 },
  { q: 'How many days are there in a leap year?', o: ['364', '365', '366', '367'], a: 2 },
  { q: 'Who painted the Mona Lisa?', o: ['Leonardo da Vinci', 'Picasso', 'Van Gogh', 'Michelangelo'], a: 0 },
  { q: 'What is the currency of Kenya?', o: ['Rand', 'Birr', 'Naira', 'Shilling'], a: 3 },
  { q: 'How many players does one football team have on the pitch?', o: ['9', '10', '11', '12'], a: 2 },
  { q: 'What is the hardest natural substance?', o: ['Gold', 'Diamond', 'Iron', 'Quartz'], a: 1 },
  { q: 'Which is the largest country in Africa by area?', o: ['Algeria', 'Nigeria', 'Kenya', 'Egypt'], a: 0 },
  { q: 'How many sides does a hexagon have?', o: ['5', '6', '7', '8'], a: 1 },
  { q: 'Which gas do plants take in from the air?', o: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Helium'], a: 2 },
  { q: 'What is the largest mammal on Earth?', o: ['Elephant', 'Blue whale', 'Giraffe', 'Hippo'], a: 1 },
];

const ROUNDS = 5;
const LETTERS = ['A', 'B', 'C', 'D'];

function ask(s) {
  const item = s.deck[s.round];
  return `❓ *Question ${s.round + 1}/${ROUNDS}*\n${item.q}\n\n${item.o.map((o, i) => `*${LETTERS[i]}.* ${o}`).join('\n')}\n\nReply with A, B, C or D.`;
}

module.exports = {
  name: 'trivia',
  aliases: ['quiz'],
  desc: `${ROUNDS}-question quiz (trivia stop to quit)`,

  async run({ jid, reply, args }) {
    if ((args[0] || '').toLowerCase() === 'stop') {
      if (sessions.get(jid)?.type === 'trivia') {
        sessions.delete(jid);
        return reply('Quiz stopped.');
      }
      return reply('No quiz is running.');
    }
    const s = { type: 'trivia', deck: shuffle(QUESTIONS).slice(0, ROUNDS), round: 0, score: 0 };
    sessions.set(jid, s);
    await reply(`🧠 *Trivia time!* ${ROUNDS} questions.\n\n${ask(s)}`);
  },

  async onMessage({ jid, text, reply }) {
    const s = sessions.get(jid);
    if (!s || s.type !== 'trivia' || !/^[a-d]$/i.test(text)) return false;

    const item = s.deck[s.round];
    const picked = LETTERS.indexOf(text.toUpperCase());
    let msg;
    if (picked === item.a) {
      s.score++;
      msg = '✅ Correct!';
    } else {
      msg = `❌ Nope. The answer was *${LETTERS[item.a]}. ${item.o[item.a]}*`;
    }
    s.round++;

    if (s.round >= ROUNDS) {
      sessions.delete(jid);
      const medal = s.score === ROUNDS ? '🏆 Perfect!' : s.score >= 3 ? '👏 Nice one!' : '💪 Try again!';
      await reply(`${msg}\n\n*Final score: ${s.score}/${ROUNDS}* ${medal}\nSend the trivia command to play again.`);
      return true;
    }
    await reply(`${msg}\n\n${ask(s)}`);
    return true;
  },
};

const ai = require('../lib/ai');

const games = new Map(); // chat -> { type, turns, at }
const EXPIRE_MS = 30 * 60 * 1000;
const RULES = ' Plain text only, no markdown. Keep every message under 3 short sentences. Reply in the language the player uses.';

const SYSTEMS = {
  '20q':
    'You are playing 20 Questions. The player secretly thinks of an object, animal, person or place. YOU ask ONE yes/no question per message, numbered like Q1/20, to guess it. When you feel sure, make a guess ("Is it ...?"). If the player says yes, celebrate. If you reach Q20 without success, admit defeat and ask what it was.' + RULES,
  adventure:
    'You are the narrator of an interactive text adventure. Describe the scene vividly in 2 to 3 sentences, then offer exactly 3 numbered choices. React to the player choice and continue the story. End the story after about 12 turns with a satisfying finish. Keep it fun and PG.' + RULES,
  quiz:
    'You are a quiz host. Ask ONE question at a time with 4 options (A to D). When the player answers, say whether they are right (with a one-line explanation), keep score like "Score: 2/3", then ask the next question. Stop after 5 questions and give the final score.' + RULES,
};

const START = {
  '20q': () => 'I have thought of something. Start by asking your first question.',
  adventure: (theme) => `Start a new adventure${theme ? ` themed: ${theme}` : ''}.`,
  quiz: (topic) => `Start the quiz${topic ? ` on the topic: ${topic}` : ' on general knowledge'}. Ask question 1.`,
};

module.exports = {
  name: 'aigame',
  aliases: ['aig'],
  desc: '20q | adventure [theme] | quiz [topic]',
  async run({ reply, args, jid, config, text }) {
    const p = config.PREFIX;
    const type = (args[0] || '').toLowerCase();
    if (type === 'stop') {
      games.delete(jid);
      return reply('🛑 Game ended.');
    }
    if (!ai.enabled) return reply('🤖 The AI games are not set up yet.');
    if (!SYSTEMS[type]) {
      return reply(
        [
          '🧠 *AI GAMES*',
          `${p}aigame 20q ➜ you think of something, I guess it`,
          `${p}aigame adventure [theme] ➜ a story that reacts to you`,
          `${p}aigame quiz [topic] ➜ 5 questions on anything`,
          `Send *stop* anytime to quit.`,
        ].join('\n')
      );
    }
    const turns = [{ role: 'user', text: START[type](args.slice(1).join(' ').trim()) }];
    const out = await ai.chat({ system: SYSTEMS[type], turns });
    if (!out) return reply('😅 The AI is busy right now, try again in a minute.');
    turns.push({ role: 'model', text: out });
    games.set(jid, { type, turns, at: Date.now() });
    return reply(out);
  },

  // Answers to a running AI game
  async onMessage({ jid, text, reply }) {
    const g = games.get(jid);
    if (!g) return false;
    if (Date.now() - g.at > EXPIRE_MS) {
      games.delete(jid);
      return false;
    }
    if (/^(stop|quit|exit)$/i.test(text.trim())) {
      games.delete(jid);
      await reply('🛑 Game ended. Send .aigame to play again.');
      return true;
    }
    g.turns.push({ role: 'user', text });
    if (g.turns.length > 26) g.turns = g.turns.slice(-24);
    const out = await ai.chat({ system: SYSTEMS[g.type], turns: g.turns });
    if (!out) {
      g.turns.pop();
      await reply('😅 The AI is busy, send that again in a few seconds.');
      return true;
    }
    g.turns.push({ role: 'model', text: out });
    g.at = Date.now();
    await reply(out);
    return true;
  },
};

const { pick } = require('../lib/random');

const TRUTHS = [
  "What's the funniest thing that's ever happened to you at school or work?",
  "What's a song you secretly love but never admit to?",
  "What's the most embarrassing thing in your phone gallery? (describe it)",
  "Who was your first crush? (first name only)",
  "What's one habit of yours that annoys other people?",
  "What's the silliest thing you're afraid of?",
  "What's the best gift you've ever received?",
  "If you could swap lives with anyone for a day, who would it be?",
  "What's a lie you told that you still remember?",
  "What's the last thing you searched on your phone?",
];

const DARES = [
  'Send a voice note singing the chorus of your favourite song.',
  'Change your WhatsApp status to "I love Thaci bot" for one hour.',
  'Send a selfie making the silliest face you can.',
  'Type your next 3 messages using only emojis.',
  'Say a tongue twister three times fast in a voice note.',
  'Send a message to the owner telling them your best joke.',
  'Describe your day like a movie trailer.',
  'Do 10 jumping jacks and send a message saying you did them.',
  'Write a two-line poem about the last thing you ate.',
  "Talk like a pirate for your next 5 messages.",
];

module.exports = {
  name: 'tod',
  aliases: ['truth', 'dare'],
  desc: 'Truth or dare (example: tod truth | tod dare)',
  async run({ reply, args, text, config }) {
    // Works as ".tod truth", ".tod dare", ".truth" or ".dare"
    const used = text.slice(config.PREFIX.length).trim().split(/\s+/)[0].toLowerCase();
    const choice = used === 'tod' ? (args[0] || '').toLowerCase() : used;

    if (choice === 'truth') return reply(`🫣 *Truth:*\n${pick(TRUTHS)}`);
    if (choice === 'dare') return reply(`😈 *Dare:*\n${pick(DARES)}`);
    const t = Math.random() < 0.5;
    await reply(t ? `🫣 *Truth:*\n${pick(TRUTHS)}` : `😈 *Dare:*\n${pick(DARES)}`);
  },
};

const { pick } = require('../lib/random');

const BALL = [
  'It is certain.', 'Without a doubt.', 'Yes, definitely.', 'Most likely.', 'Signs point to yes.',
  'Ask again later.', 'Cannot predict now.', 'Better not tell you now.',
  "Don't count on it.", 'My sources say no.', 'Very doubtful.', 'Outlook not so good.',
];

module.exports = {
  name: '8ball',
  aliases: ['coin', 'flip'],
  desc: 'Ask the magic 8-ball (8ball <question>) or flip a coin (coin)',
  async run({ reply, args, text, config }) {
    const used = text.slice(config.PREFIX.length).trim().split(/\s+/)[0].toLowerCase();
    if (used === 'coin' || used === 'flip') {
      return reply(`🪙 ${Math.random() < 0.5 ? 'Heads' : 'Tails'}!`);
    }
    if (!args.length) return reply(`Ask me a question, like *${config.PREFIX}8ball will I pass my exam?*`);
    await reply(`🎱 ${pick(BALL)}`);
  },
};

module.exports = {
  name: 'dice',
  aliases: ['roll'],
  desc: 'Roll a dice (optionally: dice 20 for a 20-sided one)',
  async run({ reply, args }) {
    const sides = Math.min(Math.max(parseInt(args[0], 10) || 6, 2), 1000);
    const n = Math.floor(Math.random() * sides) + 1;
    await reply(`🎲 You rolled a *${n}* (1-${sides})`);
  },
};

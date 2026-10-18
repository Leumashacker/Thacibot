const { pick } = require('../lib/random');

const MOVES = { r: '🪨 Rock', p: '📄 Paper', s: '✂️ Scissors' };
const BEATS = { r: 's', p: 'r', s: 'p' };

module.exports = {
  name: 'rps',
  aliases: ['rockpaperscissors'],
  desc: 'Rock paper scissors (example: rps rock)',
  async run({ reply, args, config }) {
    const first = (args[0] || '').toLowerCase()[0];
    if (!MOVES[first]) {
      return reply(`Pick one: *${config.PREFIX}rps rock*, *${config.PREFIX}rps paper* or *${config.PREFIX}rps scissors*`);
    }
    const bot = pick(['r', 'p', 's']);
    let result = "🤝 It's a draw!";
    if (BEATS[first] === bot) result = '🎉 You win!';
    else if (BEATS[bot] === first) result = '🤖 I win!';
    await reply(`You: ${MOVES[first]}\nMe: ${MOVES[bot]}\n\n${result}`);
  },
};

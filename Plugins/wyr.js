const { sessions, saved, save } = require('../lib/state');
const { pick } = require('../lib/random');

// Each item is [option 1, option 2]. Add new ones at the END so saved vote counts stay matched.
const QUESTIONS = [
  ['have free data bundles for life', 'have free airtime for life'],
  ['never eat ugali again', 'never eat rice again'],
  ['live in Nairobi', 'live in Mombasa'],
  ['be able to fly', 'be invisible'],
  ['always be 10 minutes late', 'always be 20 minutes early'],
  ['have the fastest internet but only 1 hour a day', 'have slow internet all day'],
  ['give up music for a year', 'give up social media for a year'],
  ['fight one horse-sized duck', 'fight 100 duck-sized horses'],
  ['have a pet lion', 'have a pet monkey'],
  ['eat nyama choma every day', 'eat chips and chicken every day'],
  ['be famous but broke', 'be rich but unknown'],
  ['travel to the past', 'travel to the future'],
  ['always have to sing instead of speak', 'always have to dance when you walk'],
  ['lose your phone for a week', 'lose your wallet for a week'],
  ['work from home forever', 'work from a beach forever'],
  ['read minds', 'see the future'],
  ['never be stuck in traffic again', 'never have a power blackout again'],
  ['sleep only 4 hours and feel great', 'sleep 12 hours every day'],
  ['have a personal chef', 'have a personal driver'],
  ['speak every language', 'play every instrument'],
  ['always tell the truth', 'always get away with a lie'],
  ['go on a safari this weekend', 'go to the beach this weekend'],
  ['have 1 million shillings today', 'have 1,000 shillings every day for life'],
  ['be the best player on a bad team', 'be the worst player on the best team'],
  ['never use emojis again', 'never use voice notes again'],
  ['text back instantly all the time', 'never be able to text first'],
  ['live without chapati', 'live without mandazi'],
  ['have a rewind button for your life', 'have a pause button for your life'],
  ['have a super strong body', 'have a super smart brain'],
  ['be stuck in a lift with your crush', 'be stuck in a lift with your boss'],
];

function ask(id) {
  const [a, b] = QUESTIONS[id];
  return `🤔 *Would you rather...*\n\n*1.* ${a}\n*2.* ${b}\n\nReply with 1 or 2.`;
}

module.exports = {
  name: 'wyr',
  aliases: ['wouldyourather', 'rather'],
  desc: 'Would you rather? Pick 1 or 2 and see what others chose (wyr stop to quit)',

  async run({ jid, reply, args }) {
    if ((args[0] || '').toLowerCase() === 'stop') {
      if (sessions.get(jid)?.type === 'wyr') {
        sessions.delete(jid);
        return reply('Would you rather stopped.');
      }
      return reply('No game is running.');
    }
    const id = Math.floor(Math.random() * QUESTIONS.length);
    sessions.set(jid, { type: 'wyr', id });
    await reply(ask(id));
  },

  async onMessage({ jid, text, reply, config }) {
    const s = sessions.get(jid);
    if (!s || s.type !== 'wyr' || !/^[12]$/.test(text)) return false;

    const choice = parseInt(text, 10);
    if (!saved.wyr) saved.wyr = {};
    const votes = saved.wyr[s.id] || [0, 0];
    votes[choice - 1]++;
    saved.wyr[s.id] = votes;
    save();
    sessions.delete(jid);

    const total = votes[0] + votes[1];
    const same = Math.round((votes[choice - 1] / total) * 100);
    const picked = QUESTIONS[s.id][choice - 1];
    const stats =
      total === 1
        ? 'You are the first to vote on this one! 🏆'
        : `📊 *${same}%* of players picked the same (${total} votes).`;

    await reply(`You chose *${choice}*: ${picked}\n\n${stats}\n\nSend ${config.PREFIX}wyr for another one!`);
    return true;
  },
};

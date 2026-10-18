const { saved, save } = require('../lib/state');

module.exports = {
  name: 'away',
  desc: 'Owner only: away on | away off | away msg <text> | away msg reset',
  ownerOnly: true,
  async run({ reply, args, config }) {
    const sub = (args[0] || '').toLowerCase();

    if (sub === 'on') {
      saved.away = true;
      save();
      return reply('🌙 Away mode is ON. I will greet friends who text you.');
    }
    if (sub === 'off') {
      saved.away = false;
      saved.greeted = {};
      save();
      return reply('☀️ Away mode is OFF. Welcome back!');
    }
    if (sub === 'msg') {
      const text = args.slice(1).join(' ');
      if (!text || text.toLowerCase() === 'reset') {
        saved.awayMsg = '';
        save();
        return reply('Away message reset to the default.');
      }
      saved.awayMsg = text;
      save();
      return reply('✅ Away message updated.');
    }
    return reply(
      `Away mode is *${saved.away ? 'ON' : 'OFF'}*.\n\nUse:\n${config.PREFIX}away on\n${config.PREFIX}away off\n${config.PREFIX}away msg <your text>`
    );
  },
};

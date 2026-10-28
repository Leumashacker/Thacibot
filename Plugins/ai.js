const { saved, save } = require('../lib/state');
const ai = require('../lib/ai');

module.exports = {
  name: 'ai',
  desc: 'Owner only: ai on | ai off | ai persona <text> | ai persona reset',
  ownerOnly: true,
  async run({ reply, args, config }) {
    const p = config.PREFIX;
    const sub = (args[0] || '').toLowerCase();

    if (!ai.enabled) {
      return reply('🤖 The AI is not set up yet. Add AI_KEY (your Gemini key) in Render > Environment.');
    }
    if (sub === 'on') {
      saved.ai = true;
      save();
      return reply(`🤖 AI chat is ON. When away mode is on (${p}away on), I will chat with friends who text you.`);
    }
    if (sub === 'off') {
      saved.ai = false;
      save();
      return reply(`🤖 AI chat is OFF. Friends get the normal welcome message and the games.`);
    }
    if (sub === 'persona') {
      const text = args.slice(1).join(' ').trim();
      if (!text || text.toLowerCase() === 'reset') {
        saved.aiPersona = '';
        save();
        return reply('Personality reset to the default.');
      }
      saved.aiPersona = text.slice(0, 500);
      save();
      return reply('✅ Personality updated. I will follow it in new chats.');
    }
    if (sub === 'forget') {
      ai.forget();
      return reply('🧹 I forgot all the conversations.');
    }
    return reply(
      [
        `🤖 AI chat is *${saved.ai ? 'ON' : 'OFF'}*. It only talks to friends in private chats while away mode is *${saved.away ? 'ON' : 'OFF'}*.`,
        saved.aiPersona ? `🎭 Personality: ${saved.aiPersona}` : '',
        '',
        `${p}ai on / ${p}ai off`,
        `${p}ai persona <how I should talk>`,
        `${p}ai forget`,
      ]
        .filter((l, i) => l || i === 2)
        .join('\n')
    );
  },
};

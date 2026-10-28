const { saved, save } = require('../lib/state');
const ai = require('../lib/ai');

module.exports = {
  name: 'ai',
  desc: 'Owner only: ai on | off | persona <word or text> | style <my messages> | forget',
  ownerOnly: true,
  async run({ reply, args, config }) {
    const p = config.PREFIX;
    const sub = (args[0] || '').toLowerCase();
    const presets = Object.keys(ai.PRESETS);

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
      const preset = ai.PRESETS[text.toLowerCase()];
      saved.aiPersona = (preset || text).slice(0, 500);
      save();
      return reply(preset ? `✅ Personality set to *${text.toLowerCase()}*.` : '✅ Personality updated. I will follow it in new chats.');
    }
    if (sub === 'style') {
      const text = args.slice(1).join(' ').trim();
      if (!text || text.toLowerCase() === 'reset') {
        saved.aiStyle = '';
        save();
        return reply('✍️ Writing style cleared. I will use the normal style.');
      }
      saved.aiStyle = text.slice(0, 1500);
      save();
      return reply(`✍️ Got it! I will copy how you write. Tip: paste 5 to 10 of your own messages after ${p}ai style for the best match.`);
    }
    if (sub === 'forget') {
      ai.forget();
      return reply('🧹 I forgot all the conversations.');
    }
    return reply(
      [
        `🤖 AI chat is *${saved.ai ? 'ON' : 'OFF'}*. It only talks to friends in private chats while away mode is *${saved.away ? 'ON' : 'OFF'}*.`,
        saved.aiPersona ? `🎭 Personality: ${saved.aiPersona}` : '',
        saved.aiStyle ? '✍️ Copying your writing style: yes' : '',
        '',
        `${p}ai on / ${p}ai off`,
        `${p}ai persona ${presets.join(' | ')}`,
        `${p}ai persona <how I should talk>`,
        `${p}ai style <paste some of your messages>`,
        `${p}ai forget`,
        `${p}summary ➜ who texted while you were away`,
      ]
        .filter((l, i) => l || i === 3)
        .join('\n')
    );
  },
};

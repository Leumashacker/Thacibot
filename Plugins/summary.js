const ai = require('../lib/ai');
const { numberOf } = require('../lib/utils');

module.exports = {
  name: 'summary',
  aliases: ['recap'],
  desc: 'Owner only: who texted while you were away',
  ownerOnly: true,
  async run({ reply, config }) {
    if (!ai.enabled) return reply('🤖 Add AI_KEY first so I can summarise.');
    const chats = ai
      .recent()
      .filter((c) => c.msgs.some((m) => m.who === 'friend'))
      .sort((a, b) => b.at - a.at)
      .slice(0, 12);
    if (!chats.length) return reply('📭 Nobody texted while away mode was on (since the last restart).');

    const block = chats
      .map((c) => {
        const lines = c.msgs.map((m) => `${m.who === 'friend' ? 'Friend' : 'Bot'}: ${m.text}`).join('\n');
        return `### ${c.name || 'Unknown'} (${numberOf(c.jid)})\n${lines}`;
      })
      .join('\n\n');
    const out = await ai.ask({
      system:
        'You summarise WhatsApp chats for their owner. Plain text only, no markdown. For each friend write one line: name, what they wanted, and whether the owner needs to reply ("reply needed" or "no reply needed"). Put urgent ones first. End with one line for the owner saying who to answer first.',
      prompt: `Owner: ${config.OWNER_NAME}. Chats the bot handled while the owner was away:\n\n${block}`,
      maxTokens: 700,
    });
    return reply(out ? `🗒️ *While you were away*\n\n${out}` : '😅 The AI is busy, try again in a minute.');
  },
};

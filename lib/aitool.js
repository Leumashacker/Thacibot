// Small helper that turns "one prompt in, one answer out" into a command plugin.
const ai = require('./ai');
const last = new Map(); // chat -> time of last use (keeps friends from burning the free AI quota)

function makeTool({ name, aliases = [], desc, usage, needsInput = true, system, build, maxTokens }) {
  return {
    name,
    aliases,
    desc,
    async run({ reply, args, config, isOwner, jid }) {
      if (!ai.enabled) return reply('🤖 The AI tools are not set up yet.');
      const input = args.join(' ').trim();
      const prompt = needsInput || input ? build(input, args) : build('', args);
      if ((needsInput && !input) || prompt === null) return reply(`Usage: ${config.PREFIX}${name} ${usage}`);
      if (!isOwner) {
        const wait = 15000 - (Date.now() - (last.get(jid) || 0));
        if (wait > 0) return reply(`⏳ Slow down a little, try again in ${Math.ceil(wait / 1000)}s.`);
        last.set(jid, Date.now());
        if (last.size > 300) last.delete(last.keys().next().value);
      }
      const out = await ai.ask({ system: system || ai.TOOL_SYSTEM, prompt, maxTokens });
      return reply(out || '😅 The AI is busy right now, try again in a minute.');
    },
  };
}

module.exports = { makeTool };

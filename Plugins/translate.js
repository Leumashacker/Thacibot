const { makeTool } = require('../lib/aitool');

module.exports = makeTool({
  name: 'translate',
  aliases: ['tr'],
  desc: 'translate text to any language',
  usage: '<language> <text>   e.g. translate sw how are you',
  build: (input, args) => {
    const text = args.slice(1).join(' ').trim();
    if (!args[0] || !text) return null;
    return `Translate the text below into ${args[0]} (a language name or code; Sheng counts as casual Kenyan Swahili). Reply with ONLY the translation.\n\nText: ${text}`;
  },
});

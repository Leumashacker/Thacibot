const { makeTool } = require('../lib/aitool');

module.exports = makeTool({
  name: 'fact',
  desc: 'a surprising random fact',
  usage: '[topic]',
  needsInput: false,
  build: (input) => `Tell me one surprising, true fun fact${input ? ` about ${input}` : ''} in 2 sentences with an emoji.`,
});

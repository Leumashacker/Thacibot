const { makeTool } = require('../lib/aitool');

module.exports = makeTool({
  name: 'quote',
  desc: 'a fresh motivational quote',
  usage: '[topic]',
  needsInput: false,
  build: (input) => `Write one short original motivational quote${input ? ` about ${input}` : ''} with a fitting emoji. Only the quote.`,
});

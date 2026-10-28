const { makeTool } = require('../lib/aitool');

module.exports = makeTool({
  name: 'define',
  desc: 'meaning of a word',
  usage: '<word>',
  build: (input) => `Define the word or phrase "${input}" in simple English with one short example sentence. If it is Swahili or Sheng, also give the English meaning.`,
});

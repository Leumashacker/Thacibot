const { makeTool } = require('../lib/aitool');

module.exports = makeTool({
  name: 'explain',
  desc: 'explain anything simply',
  usage: '<topic or question>',
  build: (input) => `Explain this in simple words anyone can follow, in 4 sentences or fewer: ${input}`,
});

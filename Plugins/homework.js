const { makeTool } = require('../lib/aitool');

module.exports = makeTool({
  name: 'homework',
  aliases: ['hw'],
  desc: 'step-by-step homework help',
  usage: '<your question>',
  maxTokens: 700,
  build: (input) => `Help a student with this homework question. Teach it step by step in short numbered steps and give the final answer at the end: ${input}`,
});

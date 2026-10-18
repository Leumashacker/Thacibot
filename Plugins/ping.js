module.exports = {
  name: 'ping',
  desc: 'Check that the bot is alive',
  async run({ reply, config }) {
    await reply(`🏓 Pong! ${config.BOT_NAME} is awake.`);
  },
};

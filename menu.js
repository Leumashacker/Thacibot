module.exports = {
  name: 'menu',
  aliases: ['help', 'start'],
  desc: 'Show all commands',
  async run({ reply, config, commands, isOwner }) {
    const lines = commands
      .filter((p) => !p.ownerOnly || isOwner)
      .map((p) => `• ${config.PREFIX}${p.name} - ${p.desc}`);
    await reply(`🤖 *${config.BOT_NAME}*\n\n${lines.join('\n')}`);
  },
};

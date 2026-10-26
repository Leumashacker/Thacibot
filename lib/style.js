// Shared look for the menu and the away-mode welcome message.
const TZ = process.env.TIMEZONE || 'Africa/Nairobi';

function greeting() {
  const hour = Number(
    new Date().toLocaleString('en-GB', { hour: '2-digit', hour12: false, timeZone: TZ })
  );
  if (hour < 5) return 'Hello night owl 🦉';
  if (hour < 12) return 'Good morning ☀️';
  if (hour < 17) return 'Good afternoon 🌤️';
  return 'Good evening 🌙';
}

function box(title, lines) {
  return `╭━━━〔 ${title} 〕━━━╮\n${lines.map((l) => `┃ ${l}`).join('\n')}\n╰━━━━━━━━━━━━━━━━━━╯`;
}

function awayWelcome(config) {
  const p = config.PREFIX;
  return [
    box(`🤖 *${config.BOT_NAME.toUpperCase()}*`, [
      `${greeting()} 👋`,
      `*${config.OWNER_NAME}* is offline right now,`,
      `but I'm here to keep you company! 😎`,
    ]),
    '',
    '🔥 *Try these while you wait:*',
    `🎮 *${p}guess* ➜ guess my number`,
    `❌ *${p}ttt* ➜ tic tac toe`,
    `🤔 *${p}wyr* ➜ would you rather`,
    `📖 *${p}story* ➜ choose your adventure`,
    `🧩 *${p}riddle* ➜ solve a riddle`,
    `🔤 *${p}scramble* ➜ unscramble the word`,
    '',
    `📋 Send *${p}menu* to see everything I can do`,
    `⏳ ${config.OWNER_NAME} will see your message when they are back!`,
  ].join('\n');
}

module.exports = { greeting, box, awayWelcome };

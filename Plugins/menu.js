const { greeting, box } = require('../lib/style');

// Which command goes in which section. Anything not listed shows up under MORE.
const CATEGORIES = [
  ['🎮 GAMES', ['guess', 'ttt', 'hangman', 'scramble', 'trivia', 'riddle', 'rps', 'wyr', 'dice']],
  ['📖 STORIES', ['story']],
  ['🎉 FUN', ['tod', '8ball']],
  ['🛠️ TOOLS', ['ping', 'menu']],
];

const SHORT = {
  guess: 'guess my number',
  ttt: 'tic tac toe',
  hangman: 'guess the word',
  scramble: 'unscramble the word',
  trivia: '5-question quiz',
  riddle: 'solve a riddle',
  rps: 'rock paper scissors',
  wyr: 'would you rather',
  dice: 'roll a dice',
  story: 'choose your adventure',
  tod: 'truth or dare',
  '8ball': 'magic 8-ball and coin flip',
  ping: 'check if I am awake',
  menu: 'show this menu',
  away: 'on | off | msg <text>',
};

const TIPS = [
  'Stuck in a game? Add *stop* after its command to quit.',
  'Try *.wyr* and see what other players chose!',
  'Send *.riddle hint* if a riddle has you stuck.',
  'Beat me at *.ttt* if you can 😏',
  'Games work best one at a time, finish one before starting another.',
];

function uptime() {
  const m = Math.floor(process.uptime() / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${m % 60} min`;
}

module.exports = {
  name: 'menu',
  aliases: ['help', 'start'],
  desc: 'Show all commands',
  async run({ reply, config, commands, isOwner }) {
    const p = config.PREFIX;
    const byName = new Map(commands.map((c) => [c.name, c]));
    const used = new Set();
    const sections = [];

    for (const [title, names] of CATEGORIES) {
      const lines = names
        .filter((n) => byName.has(n) && !byName.get(n).ownerOnly)
        .map((n) => {
          used.add(n);
          return `│ ✦ *${p}${n}* ➜ ${SHORT[n] || byName.get(n).desc}`;
        });
      if (lines.length) sections.push(`╭─❮ ${title} ❯\n${lines.join('\n')}\n╰──────────────`);
    }

    const more = commands
      .filter((c) => !used.has(c.name) && !c.ownerOnly)
      .map((c) => `│ ✦ *${p}${c.name}* ➜ ${SHORT[c.name] || c.desc}`);
    if (more.length) sections.push(`╭─❮ ✨ MORE ❯\n${more.join('\n')}\n╰──────────────`);

    if (isOwner) {
      const owner = commands
        .filter((c) => c.ownerOnly)
        .map((c) => `│ ✦ *${p}${c.name}* ➜ ${SHORT[c.name] || c.desc}`);
      if (owner.length) sections.push(`╭─❮ 👑 OWNER ❯\n${owner.join('\n')}\n╰──────────────`);
    }

    const tip = TIPS[Math.floor(Math.random() * TIPS.length)];
    const head = box(`🤖 *${config.BOT_NAME.toUpperCase()}*`, [
      `${greeting()} 👋`,
      `👤 Owner: *${config.OWNER_NAME}*`,
      `⚡ Prefix: *${p}*   🧩 Commands: *${commands.length}*`,
      `⏱️ Online for: *${uptime()}*`,
    ]);

    await reply([head, '', sections.join('\n\n'), '', `💡 _${tip}_`].join('\n'));
  },
};

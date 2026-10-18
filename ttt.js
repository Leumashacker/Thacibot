const { sessions } = require('../lib/state');

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];
const NUM = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];

const winner = (b) => {
  for (const [a, c, d] of LINES) if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  return b.every(Boolean) ? 'draw' : null;
};

// Bot plays "O" using minimax, but sometimes blunders so the player can win.
function minimax(b, isBot) {
  const w = winner(b);
  if (w === 'O') return 1;
  if (w === 'X') return -1;
  if (w === 'draw') return 0;
  const scores = [];
  b.forEach((cell, i) => {
    if (cell) return;
    b[i] = isBot ? 'O' : 'X';
    scores.push(minimax(b, !isBot));
    b[i] = null;
  });
  return isBot ? Math.max(...scores) : Math.min(...scores);
}

function botMove(b) {
  const free = b.map((c, i) => (c ? null : i)).filter((i) => i !== null);
  if (Math.random() < 0.25) return free[Math.floor(Math.random() * free.length)];
  let best = -2, move = free[0];
  for (const i of free) {
    b[i] = 'O';
    const s = minimax(b, false);
    b[i] = null;
    if (s > best) { best = s; move = i; }
  }
  return move;
}

const render = (b) => {
  const cell = (i) => (b[i] === 'X' ? '❌' : b[i] === 'O' ? '⭕' : NUM[i]);
  return [0, 3, 6].map((r) => `${cell(r)}${cell(r + 1)}${cell(r + 2)}`).join('\n');
};

module.exports = {
  name: 'ttt',
  aliases: ['tictactoe'],
  desc: 'Play tic tac toe against me (ttt stop to quit)',

  async run({ jid, reply, args }) {
    if ((args[0] || '').toLowerCase() === 'stop') {
      if (sessions.get(jid)?.type === 'ttt') {
        sessions.delete(jid);
        return reply('Tic tac toe stopped.');
      }
      return reply('No game is running.');
    }
    const board = Array(9).fill(null);
    sessions.set(jid, { type: 'ttt', board });
    await reply(`⭕❌ *Tic Tac Toe*\nYou are ❌. Send a number 1-9 to place your mark.\n\n${render(board)}`);
  },

  async onMessage({ jid, text, reply }) {
    const s = sessions.get(jid);
    if (!s || s.type !== 'ttt' || !/^[1-9]$/.test(text)) return false;

    const i = parseInt(text, 10) - 1;
    const b = s.board;
    if (b[i]) {
      await reply('That square is taken. Pick another number.');
      return true;
    }

    b[i] = 'X';
    let w = winner(b);
    if (!w) {
      b[botMove(b)] = 'O';
      w = winner(b);
    }

    let end = '';
    if (w === 'X') end = '\n\n🎉 You win!';
    else if (w === 'O') end = '\n\n🤖 I win this time!';
    else if (w === 'draw') end = "\n\n🤝 It's a draw!";
    if (w) sessions.delete(jid);

    await reply(`${render(b)}${end}${w ? '\n\nSend the ttt command to play again.' : ''}`);
    return true;
  },
};

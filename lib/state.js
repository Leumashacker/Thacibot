const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DIR, 'state.json');

// Saved to disk: survives restarts.
const defaults = { away: false, awayMsg: '', greeted: {} };
let saved = { ...defaults };

try {
  saved = { ...defaults, ...JSON.parse(fs.readFileSync(FILE, 'utf8')) };
} catch (_) {
  /* first run */
}

function save() {
  try {
    fs.mkdirSync(DIR, { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(saved, null, 2));
  } catch (e) {
    console.error('Could not save state:', e.message);
  }
}

// Kept in memory only: one active game/story per chat.
const sessions = new Map();

module.exports = { saved, save, sessions };

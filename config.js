require('dotenv').config();

const digits = (v) => String(v || '').replace(/\D/g, '');

module.exports = {
  BOT_NAME: process.env.BOT_NAME || 'Thaci bot',
  PREFIX: process.env.PREFIX || '.',
  OWNER_NAME: process.env.OWNER_NAME || 'the owner',
  OWNER_NUMBER: digits(process.env.OWNER_NUMBER),
  PAIRING_NUMBER: digits(process.env.PAIRING_NUMBER || process.env.OWNER_NUMBER),
  AWAY_COOLDOWN_HOURS: Number(process.env.AWAY_COOLDOWN_HOURS || 6),
};

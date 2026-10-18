# Thaci bot

A WhatsApp bot (built on Baileys) that keeps friends busy with games and a story when they text you while you're offline.

## Set up

1. Install Node.js 18 or newer.
2. In this folder run: `npm install`
3. Copy `.env.example` to `.env` and fill in your name and number (country code, digits only, no `+`).
4. Run: `npm start`
5. A pairing code appears in the terminal. On your phone: WhatsApp > Settings > Linked Devices > Link a device > *Link with phone number instead*, then enter the code.
6. When it says "Thaci bot is online", send `.menu` in any chat.

The login is saved in the `session` folder, so you only pair once.

## Commands (prefix is `.`)

| Command | What it does |
|---|---|
| `.menu` | List all commands |
| `.ping` | Check the bot is alive |
| `.dice [sides]` | Roll a dice |
| `.guess` | Guess the number (1-100, 7 tries) |
| `.ttt` | Tic tac toe against the bot |
| `.story` | Choose-your-own-adventure |
| `.trivia` | 5-question quiz, answer with A, B, C or D |
| `.scramble` | Unscramble the word (`.scramble hint`, `.scramble stop`) |
| `.hangman` | Guess letters one by one (`.hangman <word>` to guess the whole word) |
| `.riddle` | Solve a riddle (`.riddle hint`, `.riddle skip`) |
| `.rps rock` | Rock paper scissors |
| `.tod` | Truth or dare (`.truth`, `.dare` also work) |
| `.8ball <question>` | Magic 8-ball (`.coin` flips a coin) |
| `.away on / off` | Owner only: turn away mode on or off |
| `.away msg <text>` | Owner only: set your own away message |

Away mode: when it's ON and a friend texts you privately, the bot greets them once (again after 6 hours) and invites them to play. Groups are ignored.

## Add your own command

Create a file in `plugins/`, for example `plugins/hello.js`:

```js
module.exports = {
  name: 'hello',
  desc: 'Say hello',
  async run({ reply }) {
    await reply('Hello from Thaci bot!');
  },
};
```

Restart the bot and `.hello` works. It also appears in `.menu` automatically.

## Keep it online

Run it on a VPS, Railway, Koyeb or Replit so it works while your phone is off. Put the values from `.env` in the host's environment variables, and keep the `session` and `data` folders on persistent storage.

## Safety

This uses an unofficial method, so WhatsApp can ban the linked number. A spare number is safer. Don't use it to message people who haven't contacted you first, and don't share the `session` folder: it gives full access to the account.

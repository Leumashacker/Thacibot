const { sessions } = require('../lib/state');

// Each node: text + choices [label, nextNodeId]. No choices = the story ends.
const NODES = {
  start: {
    t: '🌌 *The Lost Signal*\n\nYou wake up on a quiet beach at night. Far away, a small light blinks inside a cave. A torch lies at your feet.',
    c: [['Take the torch and go into the cave', 'cave'], ['Walk along the shoreline', 'shore']],
  },
  cave: {
    t: '🔦 The cave walls shimmer with strange symbols. The tunnel splits: one path hums softly, the other is silent and cold.',
    c: [['Follow the humming', 'hum'], ['Take the silent path', 'silent']],
  },
  shore: {
    t: '🌊 You find a broken radio half buried in the sand. It crackles: "...anyone... the lighthouse... hurry..."',
    c: [['Carry the radio to the cave light', 'cave'], ['Search for the lighthouse', 'lighthouse']],
  },
  hum: {
    t: '🎶 The humming grows into music. You reach a glowing crystal that plays a melody. It seems to want you to repeat it.',
    c: [['Hum the melody back', 'win_crystal'], ['Touch the crystal', 'lose_crystal']],
  },
  silent: {
    t: '❄️ The cold path ends at a locked door with a keypad. Scratched above it: "The year the light first shone."',
    c: [['Type 1999', 'lose_door'], ['Listen for clues first', 'hum']],
  },
  lighthouse: {
    t: '🗼 You reach the lighthouse. Its lamp is dark, but a lever on the wall is glowing faintly.',
    c: [['Pull the lever', 'win_light'], ['Climb the stairs first', 'stairs']],
  },
  stairs: {
    t: '🪜 At the top you find a logbook. The last page says: "The lever only works when the radio is on."',
    c: [['Turn on the radio, then pull the lever', 'win_light'], ['Go back down', 'lighthouse']],
  },
  win_crystal: {
    t: '✨ The crystal blazes and a hidden door opens to a sky full of stars. The signal was a welcome. You made it home!\n\n🏆 *ENDING: Star Singer*',
    c: [],
  },
  lose_crystal: {
    t: '💥 The crystal flashes and you wake up on the beach again. Maybe the music was the key...\n\n💫 *ENDING: Time Loop*',
    c: [],
  },
  lose_door: {
    t: '🚪 The keypad beeps angrily and the cave goes dark. You wait for sunrise to find your way out.\n\n🌅 *ENDING: Wrong Year*',
    c: [],
  },
  win_light: {
    t: '💡 The lighthouse beam sweeps across the sea and a ship answers the signal. Rescue is on the way!\n\n🏆 *ENDING: Lighthouse Hero*',
    c: [],
  },
};

function show(id) {
  const n = NODES[id];
  if (!n.c.length) return `${n.t}\n\nSend the story command to play again.`;
  return `${n.t}\n\n${n.c.map((c, i) => `*${i + 1}.* ${c[0]}`).join('\n')}`;
}

module.exports = {
  name: 'story',
  desc: 'An adventure where you choose what happens (story stop to quit)',

  async run({ jid, reply, args }) {
    if ((args[0] || '').toLowerCase() === 'stop') {
      if (sessions.get(jid)?.type === 'story') {
        sessions.delete(jid);
        return reply('Story stopped.');
      }
      return reply('No story is running.');
    }
    sessions.set(jid, { type: 'story', node: 'start' });
    await reply(show('start'));
  },

  async onMessage({ jid, text, reply }) {
    const s = sessions.get(jid);
    if (!s || s.type !== 'story' || !/^\d$/.test(text)) return false;

    const choice = NODES[s.node].c[parseInt(text, 10) - 1];
    if (!choice) {
      await reply('Pick one of the numbers shown above.');
      return true;
    }
    s.node = choice[1];
    if (!NODES[s.node].c.length) sessions.delete(jid);
    await reply(show(choice[1]));
    return true;
  },
};

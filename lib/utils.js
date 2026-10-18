// Pull plain text out of any WhatsApp message shape.
function getText(m) {
  let msg = m.message;
  if (!msg) return '';
  msg = msg.ephemeralMessage?.message || msg.viewOnceMessage?.message || msg;
  return (
    msg.conversation ||
    msg.extendedTextMessage?.text ||
    msg.imageMessage?.caption ||
    msg.videoMessage?.caption ||
    msg.buttonsResponseMessage?.selectedButtonId ||
    msg.listResponseMessage?.singleSelectReply?.selectedRowId ||
    ''
  ).trim();
}

const numberOf = (jid = '') => jid.split('@')[0].split(':')[0];

module.exports = { getText, numberOf };

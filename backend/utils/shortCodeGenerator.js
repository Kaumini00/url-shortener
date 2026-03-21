const crypto = require('crypto');

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LENGTH = 6;

function randomBase62(length) {
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < bytes.length; i += 1) {
    result += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return result;
}

async function generateUniqueShortCode(existsFn) {
  if (typeof existsFn !== 'function') {
    throw new Error('existsFn is required');
  }

  let code = randomBase62(LENGTH);
  let tries = 0;
  while (await existsFn(code)) {
    tries += 1;
    if (tries > 10) {
      throw new Error('Could not generate a unique short code');
    }
    code = randomBase62(LENGTH);
  }

  return code;
}

module.exports = { randomBase62, generateUniqueShortCode };

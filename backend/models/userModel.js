const db = require('../database/db');

async function createUser(email, passwordHash) {
  const text = `
    INSERT INTO users(email, password)
    VALUES($1, $2)
    RETURNING id, email;
  `;
  const values = [email, passwordHash];
  const { rows } = await db.query(text, values);
  return rows[0];
}

async function findByEmail(email) {
  const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0];
}

module.exports = { createUser, findByEmail };
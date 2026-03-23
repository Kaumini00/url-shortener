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

async function findByGoogleId(googleId) {
  const { rows } = await db.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
  return rows[0];
}

async function createGoogleUser(email, googleId) {
  const { rows } = await db.query(
    'INSERT INTO users(email, google_id) VALUES($1, $2) RETURNING id, email',
    [email, googleId]
  );
  return rows[0];
}

async function linkGoogleId(userId, googleId) {
  const { rows } = await db.query(
    'UPDATE users SET google_id = $1 WHERE id = $2 RETURNING id, email',
    [googleId, userId]
  );
  return rows[0];
}

module.exports = { createUser, findByEmail, findByGoogleId, createGoogleUser, linkGoogleId };

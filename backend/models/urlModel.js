const db = require('../database/db');

async function createUrl(longUrl, shortCode, userId) {
  const text = `
    INSERT INTO urls(long_url, short_code, user_id)
    VALUES($1, $2, $3)
    RETURNING id, long_url, short_code, user_id, clicks, created_at;
  `;
  const values = [longUrl, shortCode, userId];
  const { rows } = await db.query(text, values);
  return rows[0];
}

async function findUrlByShortCode(shortCode) {
  const { rows } = await db.query('SELECT * FROM urls WHERE short_code = $1', [shortCode]);
  return rows[0];
}

async function getUrlsByUserId(userId) {
  const { rows } = await db.query(
    'SELECT id, long_url, short_code, clicks, created_at FROM urls WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return rows;
}

async function incrementClicks(shortCode) {
  const { rows } = await db.query(
    'UPDATE urls SET clicks = clicks + 1 WHERE short_code = $1 RETURNING clicks',
    [shortCode]
  );
  return rows[0];
}

async function existsShortCode(shortCode) {
  const { rows } = await db.query('SELECT 1 FROM urls WHERE short_code = $1 LIMIT 1', [shortCode]);
  return rows.length > 0;
}

module.exports = { createUrl, findUrlByShortCode, getUrlsByUserId, incrementClicks, existsShortCode };
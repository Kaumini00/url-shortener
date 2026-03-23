const db = require('../database/db');

async function createUrl(longUrl, shortCode, userId) {
  const text = `
    INSERT INTO urls(long_url, short_code, user_id)
    VALUES($1, $2, $3)
    RETURNING id, long_url, short_code, user_id, clicks, created_at;
  `;
  const { rows } = await db.query(text, [longUrl, shortCode, userId]);
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

async function recordClick(shortCode, ipAddress, userAgent) {
  await db.query(
    'INSERT INTO url_clicks(short_code, ip_address, user_agent) VALUES($1, $2, $3)',
    [shortCode, ipAddress, userAgent]
  );
}

async function getClickAnalytics(shortCode) {
  const urlResult = await db.query(
    'SELECT clicks FROM urls WHERE short_code = $1',
    [shortCode]
  );
  if (!urlResult.rows[0]) return null;

  const lastAccessedResult = await db.query(
    'SELECT MAX(clicked_at) AS last_accessed FROM url_clicks WHERE short_code = $1',
    [shortCode]
  );

  const dailyResult = await db.query(
    `SELECT DATE(clicked_at) AS date, COUNT(*)::int AS count
     FROM url_clicks
     WHERE short_code = $1
     GROUP BY DATE(clicked_at)
     ORDER BY date DESC
     LIMIT 30`,
    [shortCode]
  );

  return {
    totalClicks: urlResult.rows[0].clicks,
    lastAccessed: lastAccessedResult.rows[0].last_accessed,
    dailyClicks: dailyResult.rows.map((row) => ({
      date: row.date,
      count: row.count,
    })),
  };
}

module.exports = {
  createUrl,
  findUrlByShortCode,
  getUrlsByUserId,
  incrementClicks,
  existsShortCode,
  recordClick,
  getClickAnalytics,
};
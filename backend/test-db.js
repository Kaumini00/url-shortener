const db = require('./database/db');

async function test() {
  try {
    const res = await db.query('SELECT NOW()');
    console.log('PostgreSQL connected, time=', res.rows[0].now);
  } catch (err) {
    console.error('DB connection failed', err);
  } finally {
    db.pool.end();
  }
}
test();
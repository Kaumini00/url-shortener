const app = require('./app');
const { pool } = require('./database/db');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('Connected to PostgreSQL');

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Database connection failed', err);
    process.exit(1);
  }
}

start();
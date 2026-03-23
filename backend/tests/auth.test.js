const request = require('supertest');
const app = require('../app');
const { pool } = require('../database/db');

const TEST_EMAIL = 'testuser@example.com';

describe('Auth API', () => {
  beforeAll(async () => {
    // Clean up test user so the register test is idempotent across runs
    await pool.query('DELETE FROM users WHERE email = $1', [TEST_EMAIL]);
  });

  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE email = $1', [TEST_EMAIL]);
    await pool.end();
  });

  const user = { email: TEST_EMAIL, password: '123456' };

  it('should register a user', async () => {
    const res = await request(app).post('/auth/register').send(user);

    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.email).toBe(TEST_EMAIL);
  });

  it('should reject duplicate email with 409', async () => {
    const res = await request(app).post('/auth/register').send(user);
    expect(res.statusCode).toBe(409);
  });

  it('should login user and return token', async () => {
    const res = await request(app).post('/auth/login').send(user);

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: TEST_EMAIL, password: 'wrongpassword' });

    expect(res.statusCode).toBe(401);
  });

  it('should return 400 when fields are missing', async () => {
    const res = await request(app).post('/auth/register').send({ email: TEST_EMAIL });
    expect(res.statusCode).toBe(400);
  });
});

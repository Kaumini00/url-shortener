const request = require('supertest');
const app = require('../app');
const { pool } = require('../database/db');

let token;
let shortCode;
let longUrlCreated;

describe('URL API', () => {

  beforeAll(async () => {
    // Clean DB before tests
    await pool.query('DELETE FROM urls');
    await pool.query('DELETE FROM users');

    const user = {
      email: `urltest_${Date.now()}@example.com`,
      password: '123456'
    };

    await request(app).post('/auth/register').send(user);

    const loginRes = await request(app)
      .post('/auth/login')
      .send(user);

    token = loginRes.body.token;
  });

  it('should create short URL', async () => {
    const res = await request(app)
      .post('/shorten')
      .set('Authorization', `Bearer ${token}`)
      .send({ longUrl: 'https://example.com' });

    expect(res.statusCode).toBe(201);
    expect(res.body.short_code).toBeDefined();

    // Save values for later tests
    shortCode = res.body.short_code;
    longUrlCreated = res.body.long_url;

    // normalize for trailing slash
    const normalized = longUrlCreated.endsWith('/') 
      ? longUrlCreated.slice(0, -1) 
      : longUrlCreated;

    expect(normalized).toBe('https://example.com');
  });

  it('should get user URLs', async () => {
    const res = await request(app)
      .get('/links')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.urls.length).toBeGreaterThan(0);
    expect(res.body.urls[0].short_code).toBeDefined();
  });

  it('should redirect using short code', async () => {
    const res = await request(app)
      .get(`/${shortCode}`);

    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe(longUrlCreated);
  });

  afterAll(async () => {
    await pool.end();
  });
});
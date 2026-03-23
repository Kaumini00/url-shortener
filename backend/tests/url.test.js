const request = require('supertest');
const app = require('../app');
const { pool } = require('../database/db');

let token;
let shortCode;
let longUrlCreated;

describe('URL API', () => {
  beforeAll(async () => {
    // CASCADE handles url_clicks → urls; delete users last (cascades to urls)
    await pool.query('DELETE FROM urls');
    await pool.query('DELETE FROM users');

    const user = {
      email: `urltest_${Date.now()}@example.com`,
      password: '123456',
    };

    await request(app).post('/auth/register').send(user);

    const loginRes = await request(app).post('/auth/login').send(user);
    token = loginRes.body.token;
  });

  afterAll(async () => {
    await pool.end();
  });

  it('should return 400 when longUrl is missing', async () => {
    const res = await request(app)
      .post('/shorten')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.statusCode).toBe(400);
  });

  it('should return 401 when no token is provided', async () => {
    const res = await request(app)
      .post('/shorten')
      .send({ longUrl: 'https://example.com' });

    expect(res.statusCode).toBe(401);
  });

  it('should create a short URL', async () => {
    const res = await request(app)
      .post('/shorten')
      .set('Authorization', `Bearer ${token}`)
      .send({ longUrl: 'https://example.com' });

    expect(res.statusCode).toBe(201);
    expect(res.body.short_code).toBeDefined();

    shortCode = res.body.short_code;
    longUrlCreated = res.body.long_url;

    const normalized = longUrlCreated.endsWith('/')
      ? longUrlCreated.slice(0, -1)
      : longUrlCreated;

    expect(normalized).toBe('https://example.com');
  });

  it('should create a short URL with a custom alias', async () => {
    const alias = `test-alias-${Date.now()}`;
    const res = await request(app)
      .post('/shorten')
      .set('Authorization', `Bearer ${token}`)
      .send({ longUrl: 'https://example.com', customAlias: alias });

    expect(res.statusCode).toBe(201);
    expect(res.body.short_code).toBe(alias);
  });

  it('should reject a duplicate custom alias with 409', async () => {
    const alias = `dup-alias-${Date.now()}`;

    await request(app)
      .post('/shorten')
      .set('Authorization', `Bearer ${token}`)
      .send({ longUrl: 'https://example.com', customAlias: alias });

    const res = await request(app)
      .post('/shorten')
      .set('Authorization', `Bearer ${token}`)
      .send({ longUrl: 'https://example.com', customAlias: alias });

    expect(res.statusCode).toBe(409);
  });

  it('should reject an invalid custom alias with 400', async () => {
    const res = await request(app)
      .post('/shorten')
      .set('Authorization', `Bearer ${token}`)
      .send({ longUrl: 'https://example.com', customAlias: 'x!' });

    expect(res.statusCode).toBe(400);
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
    const res = await request(app).get(`/${shortCode}`);

    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe(longUrlCreated);
  });

  it('should return 404 for unknown short code', async () => {
    const res = await request(app).get('/this-code-does-not-exist-xyz');
    expect(res.statusCode).toBe(404);
  });

  it('should return analytics for a short code', async () => {
    const res = await request(app)
      .get(`/analytics/${shortCode}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.totalClicks).toBeDefined();
    expect(res.body.dailyClicks).toBeDefined();
    expect(Array.isArray(res.body.dailyClicks)).toBe(true);
  });

  it('should return 404 analytics for unknown short code', async () => {
    const res = await request(app)
      .get('/analytics/no-such-code')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
  });
});

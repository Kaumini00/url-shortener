const request = require('supertest');
const app = require('../app');

describe('Auth API', () => {

  const user = {
    email: 'testuser@example.com',
    password: '123456'
  };

  it('should register a user', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send(user);

    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.email).toBe('testuser@example.com');
  });

  it('should login user and return token', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send(user);

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

});
// ─────────────────────────────────────────────────────────────────
// tests/auth.test.js
// Tests for POST /auth/register and POST /auth/login
//
// Run individually:  npx jest tests/auth.test.js
// ─────────────────────────────────────────────────────────────────
const request = require('supertest');
const app     = require('../src/app');

describe('Auth - Register', () => {

  test('Register a new student', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'New Student', email: 'student@example.com', password: 'password123', role: 'student' });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.role).toBe('student');
  });

  test('Register a new counsellor', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'New Counsellor', email: 'counsellor@example.com', password: 'password123', role: 'counsellor' });

    expect(res.statusCode).toBe(201);
    expect(res.body.role).toBe('counsellor');
  });

  test('Register a new admin', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'New Admin', email: 'admin@example.com', password: 'password123', role: 'admin' });

    expect(res.statusCode).toBe(201);
    expect(res.body.role).toBe('admin');
  });

  test('Reject duplicate email', async () => {
    await request(app)
      .post('/auth/register')
      .send({ name: 'First', email: 'dupe@example.com', password: 'password123', role: 'student' });

    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'Second', email: 'dupe@example.com', password: 'password123', role: 'student' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });

  test('Reject invalid role', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'Bad', email: 'bad@example.com', password: 'password123', role: 'superuser' });

    expect(res.statusCode).toBe(400);
  });

  test('Reject missing fields', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'noname@example.com', password: 'password123' });

    expect(res.statusCode).toBe(400);
  });

});

describe('Auth - Login', () => {

  beforeEach(async () => {
    await request(app)
      .post('/auth/register')
      .send({ name: 'Login User', email: 'login@example.com', password: 'Password123', role: 'student' });
  });

  test('Login returns token and full user object with role', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'login@example.com', password: 'Password123' });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('student');
    expect(res.body.user.email).toBe('login@example.com');
  });

  test('Reject wrong password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'login@example.com', password: 'wrongpassword' });

    expect(res.statusCode).toBe(401);
  });

  test('Reject non-existent email', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'ghost@example.com', password: 'Password123' });

    expect(res.statusCode).toBe(401);
  });

  test('Reject missing password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'login@example.com' });

    expect(res.statusCode).toBe(400);
  });

});
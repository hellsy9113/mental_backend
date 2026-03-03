// tests/student.test.js
// Tests for GET /dashboard/student and PATCH /dashboard/student
// Run individually: npx jest tests/student.test.js
const request = require('supertest');
const app     = require('../src/app');
const { createStudent, createCounsellor, createAdmin } = require('./helpers');

let studentToken;
let counsellorToken;
let adminToken;

beforeEach(async () => {
  ({ token: studentToken }    = await createStudent());
  ({ token: counsellorToken } = await createCounsellor());
  ({ token: adminToken }      = await createAdmin());
});

describe('Student Dashboard - Access Control', () => {

  test('Student can access their own dashboard', async () => {
    const res = await request(app)
      .get('/dashboard/student')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Counsellor cannot access student dashboard - 403', async () => {
    const res = await request(app)
      .get('/dashboard/student')
      .set('Authorization', `Bearer ${counsellorToken}`);
    expect(res.statusCode).toBe(403);
  });

  test('Admin cannot access student dashboard - 403', async () => {
    const res = await request(app)
      .get('/dashboard/student')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(403);
  });

  test('Unauthenticated request is rejected - 401', async () => {
    const res = await request(app).get('/dashboard/student');
    expect(res.statusCode).toBe(401);
  });

});

describe('Student Dashboard - Update', () => {

  test('Student can update their dashboard', async () => {
    const res = await request(app)
      .patch('/dashboard/student')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ mentalStats: { moodScore: 7, stressLevel: 3 } });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Counsellor cannot update student dashboard - 403', async () => {
    const res = await request(app)
      .patch('/dashboard/student')
      .set('Authorization', `Bearer ${counsellorToken}`)
      .send({ mentalStats: { moodScore: 7 } });
    expect(res.statusCode).toBe(403);
  });

});
// tests/counsellor.test.js
// Tests for GET/PATCH /counsellor/profile and GET /counsellor/students/:id
// Run individually: npx jest tests/counsellor.test.js
const request = require('supertest');
const app     = require('../src/app');
const { createStudent, createCounsellor, createAdmin } = require('./helpers');

let counsellorToken;
let studentToken;
let adminToken;
let counsellorUser;
let studentUser;

beforeEach(async () => {
  ({ user: counsellorUser, token: counsellorToken } = await createCounsellor());
  ({ user: studentUser,    token: studentToken }    = await createStudent());
  ({ token: adminToken }                            = await createAdmin());
});

describe('Counsellor Profile - Access Control', () => {

  test('Counsellor can view their own profile', async () => {
    const res = await request(app)
      .get('/counsellor/profile')
      .set('Authorization', `Bearer ${counsellorToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Student cannot access counsellor profile - 403', async () => {
    const res = await request(app)
      .get('/counsellor/profile')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.statusCode).toBe(403);
  });

  test('Admin cannot access counsellor profile - 403', async () => {
    const res = await request(app)
      .get('/counsellor/profile')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(403);
  });

  test('Unauthenticated request is rejected - 401', async () => {
    const res = await request(app).get('/counsellor/profile');
    expect(res.statusCode).toBe(401);
  });

});

describe('Counsellor Profile - Update', () => {

  test('Counsellor can update bio and specialization', async () => {
    const res = await request(app)
      .patch('/counsellor/profile')
      .set('Authorization', `Bearer ${counsellorToken}`)
      .send({ bio: 'I help students.', specialization: 'Anxiety' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Student cannot update counsellor profile - 403', async () => {
    const res = await request(app)
      .patch('/counsellor/profile')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ bio: 'Hacked' });
    expect(res.statusCode).toBe(403);
  });

});

describe('Counsellor - View Assigned Student', () => {

  test('Counsellor cannot view unassigned student dashboard - 403', async () => {
    const res = await request(app)
      .get(`/counsellor/students/${studentUser._id}`)
      .set('Authorization', `Bearer ${counsellorToken}`);
    expect(res.statusCode).toBe(403);
  });

  test('Counsellor can view assigned student dashboard', async () => {
    // Admin assigns the student first
    await request(app)
      .post('/admin/assign')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ counsellorId: counsellorUser._id, studentId: studentUser._id });

    const res = await request(app)
      .get(`/counsellor/students/${studentUser._id}`)
      .set('Authorization', `Bearer ${counsellorToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Student cannot access this endpoint - 403', async () => {
    const res = await request(app)
      .get(`/counsellor/students/${studentUser._id}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.statusCode).toBe(403);
  });

});
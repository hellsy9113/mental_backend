// tests/admin.test.js
// Tests for all /admin/* routes
// Run individually: npx jest tests/admin.test.js
const request = require('supertest');
const app     = require('../src/app');
const { createStudent, createCounsellor, createAdmin } = require('./helpers');

let adminToken;
let studentToken;
let counsellorToken;
let studentUser;
let counsellorUser;

beforeEach(async () => {
  ({ token: adminToken }                            = await createAdmin());
  ({ user: studentUser,    token: studentToken }    = await createStudent());
  ({ user: counsellorUser, token: counsellorToken } = await createCounsellor());
});

describe('Admin - Access Control', () => {

  test('Student cannot access admin routes - 403', async () => {
    const res = await request(app)
      .get('/admin/stats')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.statusCode).toBe(403);
  });

  test('Counsellor cannot access admin routes - 403', async () => {
    const res = await request(app)
      .get('/admin/stats')
      .set('Authorization', `Bearer ${counsellorToken}`);
    expect(res.statusCode).toBe(403);
  });

  test('Unauthenticated request is rejected - 401', async () => {
    const res = await request(app).get('/admin/stats');
    expect(res.statusCode).toBe(401);
  });

});

describe('Admin - Platform Stats', () => {

  test('Admin can get platform stats', async () => {
    const res = await request(app)
      .get('/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('totalUsers');
    expect(res.body.data).toHaveProperty('totalStudents');
    expect(res.body.data).toHaveProperty('totalCounsellors');
    expect(res.body.data).toHaveProperty('totalAdmins');
  });

  test('Stats reflect actual user counts', async () => {
    const res = await request(app)
      .get('/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    // beforeEach creates 1 student, 1 counsellor, 1 admin
    expect(res.body.data.totalStudents).toBe(1);
    expect(res.body.data.totalCounsellors).toBe(1);
    expect(res.body.data.totalAdmins).toBe(1);
    expect(res.body.data.totalUsers).toBe(3);
  });

});

describe('Admin - User Management', () => {

  test('Admin can list all users', async () => {
    const res = await request(app)
      .get('/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(3);
  });

  test('Admin can filter users by role', async () => {
    const res = await request(app)
      .get('/admin/users?role=student')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.every(u => u.role === 'student')).toBe(true);
  });

  test('Admin can get a single user by ID', async () => {
    const res = await request(app)
      .get(`/admin/users/${studentUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data._id).toBe(String(studentUser._id));
  });

  test('Admin can change a user role', async () => {
    const res = await request(app)
      .patch(`/admin/users/${studentUser._id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'counsellor' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Admin can delete a user', async () => {
    const res = await request(app)
      .delete(`/admin/users/${studentUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Deleted user no longer appears in user list', async () => {
    await request(app)
      .delete(`/admin/users/${studentUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const res = await request(app)
      .get('/admin/users?role=student')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.body.data.length).toBe(0);
  });

});

describe('Admin - Assign Student to Counsellor', () => {

  test('Admin can assign a student to a counsellor', async () => {
    const res = await request(app)
      .post('/admin/assign')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ counsellorId: counsellorUser._id, studentId: studentUser._id });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Cannot assign non-existent student', async () => {
    const res = await request(app)
      .post('/admin/assign')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ counsellorId: counsellorUser._id, studentId: '000000000000000000000000' });
    expect(res.statusCode).toBe(404);
  });

  test('Student cannot use assign endpoint - 403', async () => {
    const res = await request(app)
      .post('/admin/assign')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ counsellorId: counsellorUser._id, studentId: studentUser._id });
    expect(res.statusCode).toBe(403);
  });

});
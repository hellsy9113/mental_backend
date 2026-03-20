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

describe('Counsellor - Sessions', () => {

  test('Counsellor cannot create session for unassigned student - 403', async () => {
    const res = await request(app)
      .post('/counsellor/sessions')
      .set('Authorization', `Bearer ${counsellorToken}`)
      .send({
        studentId: studentUser._id,
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      });
    expect(res.statusCode).toBe(403);
  });

  test('Counsellor can create session for assigned student', async () => {
    await request(app)
      .post('/admin/assign')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ counsellorId: counsellorUser._id, studentId: studentUser._id });

    const res = await request(app)
      .post('/counsellor/sessions')
      .set('Authorization', `Bearer ${counsellorToken}`)
      .send({
        studentId: studentUser._id,
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        durationMinutes: 45,
        type: 'video',
        notes: 'Initial meeting'
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('_id');
  });

  test('Counsellor can list sessions', async () => {
    await request(app).post('/admin/assign').set('Authorization', `Bearer ${adminToken}`).send({ counsellorId: counsellorUser._id, studentId: studentUser._id });
    await request(app).post('/counsellor/sessions').set('Authorization', `Bearer ${counsellorToken}`).send({ studentId: studentUser._id, scheduledAt: new Date(Date.now() + 86400000).toISOString() });

    const res = await request(app)
      .get('/counsellor/sessions')
      .set('Authorization', `Bearer ${counsellorToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('Counsellor can update session', async () => {
    await request(app).post('/admin/assign').set('Authorization', `Bearer ${adminToken}`).send({ counsellorId: counsellorUser._id, studentId: studentUser._id });
    const createRes = await request(app).post('/counsellor/sessions').set('Authorization', `Bearer ${counsellorToken}`).send({ studentId: studentUser._id, scheduledAt: new Date(Date.now() + 86400000).toISOString() });
    const sessionId = createRes.body.data._id;

    const res = await request(app)
      .patch(`/counsellor/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${counsellorToken}`)
      .send({ durationMinutes: 60 });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.durationMinutes).toBe(60);
  });

  test('Counsellor can cancel session', async () => {
    await request(app).post('/admin/assign').set('Authorization', `Bearer ${adminToken}`).send({ counsellorId: counsellorUser._id, studentId: studentUser._id });
    const createRes = await request(app).post('/counsellor/sessions').set('Authorization', `Bearer ${counsellorToken}`).send({ studentId: studentUser._id, scheduledAt: new Date(Date.now() + 86400000).toISOString() });
    const sessionId = createRes.body.data._id;

    const res = await request(app)
      .delete(`/counsellor/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${counsellorToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('cancelled');
  });
});

describe('Counsellor - Notes', () => {

  test('Counsellor can create note for assigned student', async () => {
    await request(app).post('/admin/assign').set('Authorization', `Bearer ${adminToken}`).send({ counsellorId: counsellorUser._id, studentId: studentUser._id });

    const res = await request(app)
      .post('/counsellor/notes')
      .set('Authorization', `Bearer ${counsellorToken}`)
      .send({ studentId: studentUser._id, title: 'Session 1 Note', content: 'Student is doing well.' });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('_id');
  });

  test('Counsellor can list notes', async () => {
    await request(app).post('/admin/assign').set('Authorization', `Bearer ${adminToken}`).send({ counsellorId: counsellorUser._id, studentId: studentUser._id });
    await request(app).post('/counsellor/notes').set('Authorization', `Bearer ${counsellorToken}`).send({ studentId: studentUser._id, title: 'Note 1', content: 'Student is doing well.' });

    const res = await request(app)
      .get('/counsellor/notes')
      .set('Authorization', `Bearer ${counsellorToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('Counsellor can update note', async () => {
    await request(app).post('/admin/assign').set('Authorization', `Bearer ${adminToken}`).send({ counsellorId: counsellorUser._id, studentId: studentUser._id });
    const createRes = await request(app).post('/counsellor/notes').set('Authorization', `Bearer ${counsellorToken}`).send({ studentId: studentUser._id, title: 'Note 1', content: 'Student is doing well.' });
    const noteId = createRes.body.data._id;

    const res = await request(app)
      .patch(`/counsellor/notes/${noteId}`)
      .set('Authorization', `Bearer ${counsellorToken}`)
      .send({ title: 'Updated Session 1 Note' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Updated Session 1 Note');
  });

  test('Counsellor can delete note', async () => {
    await request(app).post('/admin/assign').set('Authorization', `Bearer ${adminToken}`).send({ counsellorId: counsellorUser._id, studentId: studentUser._id });
    const createRes = await request(app).post('/counsellor/notes').set('Authorization', `Bearer ${counsellorToken}`).send({ studentId: studentUser._id, title: 'Note 1', content: 'Student is doing well.' });
    const noteId = createRes.body.data._id;

    const res = await request(app)
      .delete(`/counsellor/notes/${noteId}`)
      .set('Authorization', `Bearer ${counsellorToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('Counsellor - Analytics', () => {
  test('Counsellor can get analytics', async () => {
    const res = await request(app)
      .get('/counsellor/analytics')
      .set('Authorization', `Bearer ${counsellorToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('totalStudents');
  });
});
// tests/volunteer.test.js
// Run individually: npx jest tests/volunteer.test.js
const request = require('supertest');
const app     = require('../src/app');
const { createStudent, createAdmin, createCounsellor } = require('./helpers');

let studentToken;
let adminToken;
let counsellorToken;
let studentUser;
let appId; // shared application ID across describe blocks

// Full valid payload matching all 9 form steps
const validPayload = {
  fullName:               'Riya Sharma',
  age:                    21,
  gender:                 'female',
  phone:                  '9876543210',
  email:                  'riya@example.com',
  location:               'Chennai',
  collegeDept:            'PSG College of Technology - CSE',
  degree:                 'B.Tech',
  yearOfStudy:            '3',
  fieldOfStudy:           'Computer Science',
  whyVolunteer:           'I want to make a difference in student mental health.',
  motivation:             'I have personally seen friends struggle and want to help.',
  experienceTypes:        ['Peer support', 'Volunteering'],
  experienceDescription:  'Led a peer support group in 2nd year.',
  qualities:              ['Empathetic', 'Good Listener', 'Patient'],
  hoursPerWeek:           5,
  preferredTime:          ['Evening', 'Morning'],
  attendedWorkshops:      'yes',
  understandsRole:        true,
  willingToEscalate:      true,
  agreesToConfidentiality: true,
  treatsWithRespect:       true,
  understandsGuidelines:   true
};

beforeEach(async () => {
  ({ user: studentUser, token: studentToken } = await createStudent());
  ({ token: adminToken }                      = await createAdmin());
  ({ token: counsellorToken }                 = await createCounsellor());
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Volunteer — Access Control', () => {

  test('Student can submit an application', async () => {
    const res = await request(app)
      .post('/api/volunteer')
      .set('Authorization', `Bearer ${studentToken}`)
      .send(validPayload);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('pending');
    appId = res.body.data._id;
  });

  test('Counsellor cannot submit application — 403', async () => {
    const res = await request(app)
      .post('/api/volunteer')
      .set('Authorization', `Bearer ${counsellorToken}`)
      .send(validPayload);

    expect(res.statusCode).toBe(403);
  });

  test('Admin cannot submit application — 403', async () => {
    const res = await request(app)
      .post('/api/volunteer')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validPayload);

    expect(res.statusCode).toBe(403);
  });

  test('Unauthenticated request is rejected — 401', async () => {
    const res = await request(app)
      .post('/api/volunteer')
      .send(validPayload);

    expect(res.statusCode).toBe(401);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
describe('Volunteer — Student Submit & View', () => {

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/volunteer')
      .set('Authorization', `Bearer ${studentToken}`)
      .send(validPayload);
    appId = res.body.data._id;
  });

  test('Student can view their own application', async () => {
    const res = await request(app)
      .get('/api/volunteer/me')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.fullName).toBe('Riya Sharma');
    expect(res.body.data.status).toBe('pending');
  });

  test('Returns 404 when student has no application', async () => {
    const { token: freshToken } = await createStudent({ email: 'fresh@example.com' });

    const res = await request(app)
      .get('/api/volunteer/me')
      .set('Authorization', `Bearer ${freshToken}`);

    expect(res.statusCode).toBe(404);
  });

  test('Student cannot submit a second pending application — 409', async () => {
    const res = await request(app)
      .post('/api/volunteer')
      .set('Authorization', `Bearer ${studentToken}`)
      .send(validPayload);

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toMatch(/pending/i);
  });

  test('Student can withdraw their pending application', async () => {
    const res = await request(app)
      .delete('/api/volunteer/me')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Withdraw on non-existent application returns 404', async () => {
    // Withdraw first
    await request(app)
      .delete('/api/volunteer/me')
      .set('Authorization', `Bearer ${studentToken}`);

    // Try again
    const res = await request(app)
      .delete('/api/volunteer/me')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(404);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
describe('Volunteer — Validation', () => {

  test('Reject missing required fields', async () => {
    const res = await request(app)
      .post('/api/volunteer')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ fullName: 'Incomplete' }); // missing most required fields

    expect(res.statusCode).toBe(500); // Mongoose validation error
  });

  test('Reject if understandsRole is false', async () => {
    const res = await request(app)
      .post('/api/volunteer')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ ...validPayload, understandsRole: false });

    expect(res.statusCode).toBe(500);
  });

  test('Reject if agreesToConfidentiality is false', async () => {
    const res = await request(app)
      .post('/api/volunteer')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ ...validPayload, agreesToConfidentiality: false });

    expect(res.statusCode).toBe(500);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
describe('Volunteer — Admin Review', () => {

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/volunteer')
      .set('Authorization', `Bearer ${studentToken}`)
      .send(validPayload);
    appId = res.body.data._id;
  });

  test('Admin can list all applications', async () => {
    const res = await request(app)
      .get('/api/volunteer/admin/applications')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.count).toBeGreaterThanOrEqual(1);
  });

  test('Admin can filter applications by status', async () => {
    const res = await request(app)
      .get('/api/volunteer/admin/applications?status=pending')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.every(a => a.status === 'pending')).toBe(true);
  });

  test('Admin can get a single application by ID', async () => {
    const res = await request(app)
      .get(`/api/volunteer/admin/applications/${appId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data._id).toBe(appId);
  });

  test('Admin can approve an application', async () => {
    const res = await request(app)
      .patch(`/api/volunteer/admin/applications/${appId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved', adminNotes: 'Great candidate!' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('approved');
    expect(res.body.data.adminNotes).toBe('Great candidate!');
  });

  test('Admin can reject an application', async () => {
    const res = await request(app)
      .patch(`/api/volunteer/admin/applications/${appId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'rejected', adminNotes: 'Needs more experience.' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('rejected');
  });

  test('Cannot review an already-reviewed application — 409', async () => {
    // First approval
    await request(app)
      .patch(`/api/volunteer/admin/applications/${appId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' });

    // Second attempt
    const res = await request(app)
      .patch(`/api/volunteer/admin/applications/${appId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'rejected' });

    expect(res.statusCode).toBe(409);
  });

  test('Invalid status value returns 400', async () => {
    const res = await request(app)
      .patch(`/api/volunteer/admin/applications/${appId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'maybe' });

    expect(res.statusCode).toBe(400);
  });

  test('Non-existent application ID returns 404', async () => {
    const res = await request(app)
      .get('/api/volunteer/admin/applications/000000000000000000000000')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(404);
  });

  test('Student cannot access admin listing — 403', async () => {
    const res = await request(app)
      .get('/api/volunteer/admin/applications')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(403);
  });

});
// tests/volunteerWorkflow.test.js
const request = require('supertest');
const app = require('../src/app');
const { createStudent, createAdmin, createCounsellor } = require('./helpers');
const VolunteerApplication = require('../models/VolunteerApplication');
const CounsellorProfile = require('../models/CounsellorProfile');

let studentUser, studentToken;
let adminToken;
let counsellorUser, counsellorToken;
let appId;

const validPayload = {
  fullName: 'Test Volunteer',
  age: 22,
  gender: 'other',
  phone: '1234567890',
  email: 'test@volunteer.com',
  location: 'Test City',
  collegeDept: 'Test College',
  degree: 'B.Sc',
  yearOfStudy: '4',
  fieldOfStudy: 'Psychology',
  whyVolunteer: 'I want to help.',
  motivation: 'Personal interest.',
  hoursPerWeek: 10,
  attendedWorkshops: 'no',
  understandsRole: true,
  willingToEscalate: true,
  agreesToConfidentiality: true,
  treatsWithRespect: true,
  understandsGuidelines: true
};

beforeAll(async () => {
  ({ user: studentUser, token: studentToken } = await createStudent({ name: 'Student Vol', email: 'vol@test.com' }));
  ({ token: adminToken } = await createAdmin());
  ({ user: counsellorUser, token: counsellorToken } = await createCounsellor({ name: 'Counsellor Sup', email: 'sup@test.com' }));
});

describe('Volunteer Workflow Cycle', () => {

  test('STEP 1: Student submits application', async () => {
    const res = await request(app)
      .post('/api/volunteer')
      .set('Authorization', `Bearer ${studentToken}`)
      .send(validPayload);

    expect(res.statusCode).toBe(201);
    expect(res.body.data.status).toBe('pending');
    appId = res.body.data._id;
  });

  test('STEP 2: Admin assigns to counsellor', async () => {
    const res = await request(app)
      .patch(`/api/volunteer/admin/assign/${appId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assignedCounsellorId: counsellorUser._id, adminNotes: 'Assigned for final review.' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('assigned');
    expect(res.body.data.assignedCounsellorId.toString()).toBe(counsellorUser._id.toString());
  });

  test('STEP 3: Counsellor approves the application', async () => {
    const res = await request(app)
      .patch(`/api/volunteer/counsellor/review/${appId}`)
      .set('Authorization', `Bearer ${counsellorToken}`)
      .send({ status: 'approved', adminNotes: 'Excellent interview.' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('approved');

    // Verify volunteer is in counsellor's assignedVolunteers
    const profile = await CounsellorProfile.findOne({ userId: counsellorUser._id });
    expect(profile.assignedVolunteers.map(id => id.toString())).toContain(studentUser._id.toString());
  });

  test('STEP 4: Verify chat permission (Counsellor -> Volunteer)', async () => {
    const res = await request(app)
      .post(`/messages/${studentUser._id}`)
      .set('Authorization', `Bearer ${counsellorToken}`)
      .send({ text: 'Hello, welcome to the team!' });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });

  test('STEP 5: Removal by unassigned counsellor should fail', async () => {
    const { token: otherCounsellorToken } = await createCounsellor({ email: 'other@c.com' });
    const res = await request(app)
      .delete(`/api/volunteer/remove/${appId}`)
      .set('Authorization', `Bearer ${otherCounsellorToken}`);

    expect(res.statusCode).toBe(403);
  });

  test('STEP 6: Removal by assigned counsellor should succeed', async () => {
    const res = await request(app)
      .delete(`/api/volunteer/remove/${appId}`)
      .set('Authorization', `Bearer ${counsellorToken}`);

    expect(res.statusCode).toBe(200);
    
    // Verify removal from profile
    const profile = await CounsellorProfile.findOne({ userId: counsellorUser._id });
    expect(profile.assignedVolunteers.map(id => id.toString())).not.toContain(studentUser._id.toString());
    
    // Verify status changed back to rejected/removed
    const application = await VolunteerApplication.findById(appId);
    expect(application.status).toBe('rejected');
  });

});

const request = require('supertest');
const app = require('../src/app');
const { createStudent, createCounsellor } = require('./helpers');
const Message = require('../src/models/Message');
const CounsellorProfile = require('../src/models/CounsellorProfile');

let studentUser, studentToken;
let counsellorUser, counsellorToken;

beforeEach(async () => {
  ({ user: studentUser, token: studentToken } = await createStudent({ name: 'Student 1', email: 's1@test.com' }));
  ({ user: counsellorUser, token: counsellorToken } = await createCounsellor({ name: 'Counsellor 1', email: 'c1@test.com' }));
  await CounsellorProfile.updateOne(
    { userId: counsellorUser._id },
    { $push: { assignedStudents: studentUser._id } }
  );
});

describe('Message Routes', () => {
  beforeEach(async () => {
    await Message.deleteMany({});
  });

  describe('POST /messages/:otherUserId', () => {
    it('should send a message successfully', async () => {
      const res = await request(app)
        .post(`/messages/${counsellorUser._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ text: 'Hello Counselor!' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.text).toBe('Hello Counselor!');
      expect(res.body.data.senderId.toString()).toBe(studentUser._id.toString());
    });
  });

  describe('GET /messages/:otherUserId', () => {
    it('should retrieve conversation history', async () => {
      await request(app)
        .post(`/messages/${counsellorUser._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ text: 'Message 1' });
        
      await request(app)
        .post(`/messages/${studentUser._id}`)
        .set('Authorization', `Bearer ${counsellorToken}`)
        .send({ text: 'Message 2' });

      const res = await request(app)
        .get(`/messages/${counsellorUser._id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].text).toBe('Message 1');
      expect(res.body.data.some(m => m.text === 'Message 1')).toBe(true);
      expect(res.body.data.some(m => m.text === 'Message 2')).toBe(true);
    });
  });

  describe('GET /messages/unread-count', () => {
    it('should return unread count', async () => {
      await request(app)
        .post(`/messages/${studentUser._id}`)
        .set('Authorization', `Bearer ${counsellorToken}`)
        .send({ text: 'Hello Unread' });

      const res = await request(app)
        .get(`/messages/unread-count`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.count).toBe(1);
    });
  });

  describe('PATCH /messages/:otherUserId/read', () => {
    it('should mark conversation as read', async () => {
      await request(app)
        .post(`/messages/${studentUser._id}`)
        .set('Authorization', `Bearer ${counsellorToken}`)
        .send({ text: 'Read me' });

      const patchRes = await request(app)
        .patch(`/messages/${counsellorUser._id}/read`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.success).toBe(true);

      const countRes = await request(app)
        .get(`/messages/unread-count`)
        .set('Authorization', `Bearer ${studentToken}`);
      
      expect(countRes.body.data.count).toBe(0);
    });
  });
});

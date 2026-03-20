const request = require('supertest');
const app = require('../src/app');
const { createStudent, createCounsellor } = require('./helpers');

let studentUser, studentToken;

beforeEach(async () => {
  ({ user: studentUser, token: studentToken } = await createStudent());
});

describe('Profile Routes', () => {
  describe('GET /profile', () => {
    it('should return the user profile without password', async () => {
      const res = await request(app)
        .get('/profile')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(studentUser.name);
      expect(res.body.data.password).toBeUndefined();
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/profile');
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /profile', () => {
    it('should update allowed fields successfully', async () => {
      const res = await request(app)
        .patch('/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: 'Updated Name',
          bio: 'New Bio',
          courseStartYear: 2023
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Name');
      expect(res.body.data.bio).toBe('New Bio');
      expect(res.body.data.courseStartYear).toBe(2023);
    });

    it('should return 400 for short name', async () => {
      const res = await request(app)
        .patch('/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ name: 'A' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Must be at least 2 characters/i);
    });

    it('should return 400 for invalid course start year', async () => {
      const res = await request(app)
        .patch('/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ courseStartYear: 1800 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Invalid course start year/i);
    });
  });
});

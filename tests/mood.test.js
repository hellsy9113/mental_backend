


// const request = require('supertest');
// const app = require('../src/app');
// const User = require('../src/models/User');
// const StudentDashboard = require('../src/models/StudentDashboard');
// const jwt = require('jsonwebtoken');

// const SECRET = process.env.JWT_SECRET || 'super_strong_random_secret_123';

// let studentToken;
// let counsellorToken;
// let studentUser;

// beforeEach(async () => {
//   // Create a student user (role required for isStudent middleware)
//   studentUser = await User.create({
//     name: 'Test Student',
//     email: 'student@example.com',
//     password: 'hashedpassword',
//     role: 'student'
//   });

//   await StudentDashboard.create({ userId: studentUser._id });

//   studentToken = jwt.sign(
//     { id: studentUser._id, role: 'student' },
//     SECRET
//   );

//   // Create a counsellor user
//   const counsellorUser = await User.create({
//     name: 'Test Counsellor',
//     email: 'counsellor@example.com',
//     password: 'hashedpassword',
//     role: 'counsellor'
//   });

//   counsellorToken = jwt.sign(
//     { id: counsellorUser._id, role: 'counsellor' },
//     SECRET
//   );
// });

// describe('Mood API', () => {
//   test('Student can add a mood entry', async () => {
//     const res = await request(app)
//       .post('/api/mood')
//       .set('Authorization', `Bearer ${studentToken}`)
//       .send({ moodScore: 8 });

//     expect(res.statusCode).toBe(201);
//     expect(res.body.success).toBe(true);
//     expect(res.body.data.moodScore).toBe(8);
//   });

//   test('Counsellor can also log mood', async () => {
//     const res = await request(app)
//       .post('/api/mood')
//       .set('Authorization', `Bearer ${counsellorToken}`)
//       .send({ moodScore: 7 });

//     expect(res.statusCode).toBe(201);
//     expect(res.body.success).toBe(true);
//   });

//   test('Should reject mood score outside 1-10 range', async () => {
//     const res = await request(app)
//       .post('/api/mood')
//       .set('Authorization', `Bearer ${studentToken}`)
//       .send({ moodScore: 15 });

//     expect(res.statusCode).toBe(500); // Mongoose validation error
//   });

//   test('Should calculate weekly mood stats correctly', async () => {
//     await request(app)
//       .post('/api/mood')
//       .set('Authorization', `Bearer ${studentToken}`)
//       .send({ moodScore: 6 });

//     await request(app)
//       .post('/api/mood')
//       .set('Authorization', `Bearer ${studentToken}`)
//       .send({ moodScore: 8 });

//     const res = await request(app)
//       .get('/api/mood/stats')
//       .set('Authorization', `Bearer ${studentToken}`);

//     expect(res.statusCode).toBe(200);
//     expect(res.body.success).toBe(true);
//     expect(res.body.data.weekly).toBe(7); // avg(6, 8)
//   });

//   test('Should reject unauthenticated mood request', async () => {
//     const res = await request(app)
//       .post('/api/mood')
//       .send({ moodScore: 5 });

//     expect(res.statusCode).toBe(401);
//   });
// });

// describe('Auth API', () => {
//   test('Register a new student', async () => {
//     const res = await request(app)
//       .post('/auth/register')
//       .send({ name: 'New Student', email: 'new@example.com', password: 'password123', role: 'student' });

//     expect(res.statusCode).toBe(201);
//     expect(res.body.success).toBe(true);
//     expect(res.body.role).toBe('student');
//   });

//   test('Register a new counsellor', async () => {
//     const res = await request(app)
//       .post('/auth/register')
//       .send({ name: 'New Counsellor', email: 'counsellor2@example.com', password: 'password123', role: 'counsellor' });

//     expect(res.statusCode).toBe(201);
//     expect(res.body.role).toBe('counsellor');
//   });

//   test('Should reject duplicate email on register', async () => {
//     const res = await request(app)
//       .post('/auth/register')
//       .send({ name: 'Duplicate', email: 'student@example.com', password: 'password123' });

//     expect(res.statusCode).toBe(400);
//   });

//   test('Should reject invalid role on register', async () => {
//     const res = await request(app)
//       .post('/auth/register')
//       .send({ name: 'Bad Role', email: 'bad@example.com', password: 'password123', role: 'superuser' });

//     expect(res.statusCode).toBe(400);
//   });

//   test('Login returns token with role', async () => {
//     // First register a clean user
//     await request(app)
//       .post('/auth/register')
//       .send({ name: 'Login User', email: 'login@example.com', password: 'password123', role: 'student' });

//     const res = await request(app)
//       .post('/auth/login')
//       .send({ email: 'login@example.com', password: 'password123' });

//     expect(res.statusCode).toBe(200);
//     expect(res.body.token).toBeDefined();
//     expect(res.body.user.role).toBe('student');
//   });
// });

// describe('Student Dashboard API', () => {
//   test('Student can access their dashboard', async () => {
//     const res = await request(app)
//       .get('/dashboard/student')
//       .set('Authorization', `Bearer ${studentToken}`);

//     expect(res.statusCode).toBe(200);
//     expect(res.body.success).toBe(true);
//   });

//   test('Counsellor cannot access student dashboard route', async () => {
//     const res = await request(app)
//       .get('/dashboard/student')
//       .set('Authorization', `Bearer ${counsellorToken}`);

//     expect(res.statusCode).toBe(403);
//   });
// });

// describe('Admin API', () => {
//   let adminToken;

//   beforeEach(async () => {
//     const adminUser = await User.create({
//       name: 'Test Admin',
//       email: 'admin@example.com',
//       password: 'hashedpassword',
//       role: 'admin'
//     });
//     adminToken = jwt.sign({ id: adminUser._id, role: 'admin' }, SECRET);
//   });

//   test('Admin can get platform stats', async () => {
//     const res = await request(app)
//       .get('/admin/stats')
//       .set('Authorization', `Bearer ${adminToken}`);

//     expect(res.statusCode).toBe(200);
//     expect(res.body.data.totalStudents).toBeDefined();
//   });

//   test('Student cannot access admin routes', async () => {
//     const res = await request(app)
//       .get('/admin/stats')
//       .set('Authorization', `Bearer ${studentToken}`);

//     expect(res.statusCode).toBe(403);
//   });

//   test('Admin can list all users', async () => {
//     const res = await request(app)
//       .get('/admin/users')
//       .set('Authorization', `Bearer ${adminToken}`);

//     expect(res.statusCode).toBe(200);
//     expect(Array.isArray(res.body.data)).toBe(true);
//   });
// });



// tests/mood.test.js
// Run individually: npx jest tests/mood.test.js
const request = require('supertest');
const app     = require('../src/app');
const { createStudent, createCounsellor } = require('./helpers');

let studentToken;
let counsellorToken;

beforeEach(async () => {
  ({ token: studentToken }    = await createStudent());
  ({ token: counsellorToken } = await createCounsellor());
});

describe('Mood - Access Control', () => {

  test('Student can log a mood entry', async () => {
    const res = await request(app)
      .post('/api/mood')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ moodScore: 8 });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.moodScore).toBe(8);
  });

  test('Counsellor cannot log mood - 403 forbidden', async () => {
    const res = await request(app)
      .post('/api/mood')
      .set('Authorization', `Bearer ${counsellorToken}`)
      .send({ moodScore: 7 });
    expect(res.statusCode).toBe(403);
  });

  test('Counsellor cannot view mood stats - 403 forbidden', async () => {
    const res = await request(app)
      .get('/api/mood/stats')
      .set('Authorization', `Bearer ${counsellorToken}`);
    expect(res.statusCode).toBe(403);
  });

  test('Unauthenticated request is rejected - 401', async () => {
    const res = await request(app)
      .post('/api/mood')
      .send({ moodScore: 5 });
    expect(res.statusCode).toBe(401);
  });

});

describe('Mood - Validation', () => {

  test('Reject mood score above 10', async () => {
    const res = await request(app)
      .post('/api/mood')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ moodScore: 15 });
    expect(res.statusCode).toBe(500);
  });

  test('Reject mood score below 1', async () => {
    const res = await request(app)
      .post('/api/mood')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ moodScore: 0 });
    expect(res.statusCode).toBe(500);
  });

});

describe('Mood - Stats Aggregation', () => {

  test('Stats return 0 when no mood entries exist', async () => {
    const res = await request(app)
      .get('/api/mood/stats')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.weekly).toBe(0);
    expect(res.body.data.monthly).toBe(0);
    expect(res.body.data.yearly).toBe(0);
  });

  test('Response always contains weekly, monthly and yearly fields', async () => {
    const res = await request(app)
      .get('/api/mood/stats')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.body.data).toHaveProperty('weekly');
    expect(res.body.data).toHaveProperty('monthly');
    expect(res.body.data).toHaveProperty('yearly');
  });

  test('Weekly average is calculated correctly', async () => {
    await request(app).post('/api/mood').set('Authorization', `Bearer ${studentToken}`).send({ moodScore: 6 });
    await request(app).post('/api/mood').set('Authorization', `Bearer ${studentToken}`).send({ moodScore: 8 });
    const res = await request(app).get('/api/mood/stats').set('Authorization', `Bearer ${studentToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.weekly).toBe(7);
  });

  test('Stats are user-isolated - other students moods do not affect yours', async () => {
    const { token: otherToken } = await createStudent({ email: 'other@example.com' });
    await request(app).post('/api/mood').set('Authorization', `Bearer ${otherToken}`).send({ moodScore: 10 });
    await request(app).post('/api/mood').set('Authorization', `Bearer ${studentToken}`).send({ moodScore: 2 });
    const res = await request(app).get('/api/mood/stats').set('Authorization', `Bearer ${studentToken}`);
    expect(res.body.data.weekly).toBe(2);
  });

});

describe('Mood - Daily Check-in Emoji Score Mapping', () => {

  const emojiMap = [
    { emoji: '😔', rating: 1, backendScore: 2,  label: 'Awful'   },
    { emoji: '😕', rating: 2, backendScore: 4,  label: 'Bad'     },
    { emoji: '😐', rating: 3, backendScore: 6,  label: 'Okay'    },
    { emoji: '😊', rating: 4, backendScore: 8,  label: 'Good'    },
    { emoji: '😄', rating: 5, backendScore: 10, label: 'Amazing' },
  ];

  emojiMap.forEach(({ emoji, rating, backendScore, label }) => {
    test(`${emoji} "${label}" (rating ${rating}) saves as score ${backendScore}`, async () => {
      const res = await request(app)
        .post('/api/mood')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ moodScore: backendScore });
      expect(res.statusCode).toBe(201);
      expect(res.body.data.moodScore).toBe(backendScore);
    });
  });

  test('Average of all 5 emoji scores equals 6 (midpoint of scale)', async () => {
    for (const { backendScore } of emojiMap) {
      await request(app).post('/api/mood').set('Authorization', `Bearer ${studentToken}`).send({ moodScore: backendScore });
    }
    const res = await request(app).get('/api/mood/stats').set('Authorization', `Bearer ${studentToken}`);
    expect(res.body.data.weekly).toBe(6);
  });

});
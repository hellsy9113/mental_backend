



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
describe('Mood - Weekly Breakdown', () => {

  test('Returns 7 entries — one per day', async () => {
    const res = await request(app)
      .get('/api/mood/weekly-breakdown')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(7);
  });

  test('Each entry has day, date and score fields', async () => {
    const res = await request(app)
      .get('/api/mood/weekly-breakdown')
      .set('Authorization', `Bearer ${studentToken}`);

    res.body.data.forEach((entry) => {
      expect(entry).toHaveProperty('day');
      expect(entry).toHaveProperty('date');
      expect(entry).toHaveProperty('score');
    });
  });

  test('Days with no entries return score 0', async () => {
    const res = await request(app)
      .get('/api/mood/weekly-breakdown')
      .set('Authorization', `Bearer ${studentToken}`);

    // No moods logged — all scores should be 0
    res.body.data.forEach((entry) => {
      expect(entry.score).toBe(0);
    });
  });

  test("Today's entry reflects a logged mood", async () => {
    await request(app)
      .post('/api/mood')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ moodScore: 8 });

    const res = await request(app)
      .get('/api/mood/weekly-breakdown')
      .set('Authorization', `Bearer ${studentToken}`);

    const today = new Date().toISOString().slice(0, 10);
    const todayEntry = res.body.data.find((d) => d.date === today);

    expect(todayEntry).toBeDefined();
    expect(todayEntry.score).toBe(8);
  });

  test('Multiple entries on same day are averaged', async () => {
    await request(app)
      .post('/api/mood')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ moodScore: 6 });

    await request(app)
      .post('/api/mood')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ moodScore: 8 });

    const res = await request(app)
      .get('/api/mood/weekly-breakdown')
      .set('Authorization', `Bearer ${studentToken}`);

    const today = new Date().toISOString().slice(0, 10);
    const todayEntry = res.body.data.find((d) => d.date === today);

    expect(todayEntry.score).toBe(7); // avg(6,8) = 7
  });

  test('Counsellor cannot access weekly breakdown - 403', async () => {
    const res = await request(app)
      .get('/api/mood/weekly-breakdown')
      .set('Authorization', `Bearer ${counsellorToken}`);

    expect(res.statusCode).toBe(403);
  });

  test('Unauthenticated request is rejected - 401', async () => {
    const res = await request(app)
      .get('/api/mood/weekly-breakdown');

    expect(res.statusCode).toBe(401);
  });

});
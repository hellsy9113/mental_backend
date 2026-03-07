// tests/music.test.js
// Run individually: npx jest tests/music.test.js

const request = require('supertest');
const app = require('../src/app');
const { createStudent, createCounsellor } = require('./helpers');

let studentToken;
let counsellorToken;

beforeEach(async () => {
  ({ token: studentToken } = await createStudent());
  ({ token: counsellorToken } = await createCounsellor());
});

describe('Music - Access Control', () => {

  test('Student can fetch all songs', async () => {
    const res = await request(app)
      .get('/api/music')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('Counsellor cannot access music - 403', async () => {
    const res = await request(app)
      .get('/api/music')
      .set('Authorization', `Bearer ${counsellorToken}`);

    expect(res.statusCode).toBe(403);
  });

  test('Unauthenticated request is rejected - 401', async () => {
    const res = await request(app)
      .get('/api/music');

    expect(res.statusCode).toBe(401);
  });

});

describe('Music - Fetch Songs', () => {

  test('Random song returns a valid song', async () => {

    const res = await request(app)
      .get('/api/music/random')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);

    expect(res.body).toHaveProperty('title');
    expect(res.body).toHaveProperty('artist');
    expect(res.body).toHaveProperty('audioUrl');
  });

  test('Fetch songs by category', async () => {

    const res = await request(app)
      .get('/api/music/category/relax')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);

    res.body.forEach(song => {
      expect(song.category).toBe('relax');
    });

  });

});

describe('Music - Search', () => {

  test('Search songs by keyword', async () => {

    const res = await request(app)
      .get('/api/music/search?q=meditation')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

  });

  test('Search returns empty array if no match found', async () => {

    const res = await request(app)
      .get('/api/music/search?q=unknownsong')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(0);

  });

});

describe('Music - Song By ID', () => {

  test('Fetch single song by ID', async () => {

    const allSongs = await request(app)
      .get('/api/music')
      .set('Authorization', `Bearer ${studentToken}`);

    const songId = allSongs.body[0]._id;

    const res = await request(app)
      .get(`/api/music/${songId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('_id', songId);

  });

  test('Invalid song ID returns error', async () => {

    const res = await request(app)
      .get('/api/music/invalidid')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(500);

  });

});

describe('Music - Category Edge Cases', () => {

  test('Unknown category returns empty array', async () => {

    const res = await request(app)
      .get('/api/music/category/unknown')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(0);

  });

});
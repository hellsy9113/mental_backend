// tests/music.test.js
// Run individually: npx jest tests/music.test.js

const request = require('supertest');
const app = require('../src/app');
const Music = require('../src/models/Music');
const { createStudent, createCounsellor } = require('./helpers');

let studentToken;
let counsellorToken;

// Seed songs before each test — setup.js wipes the DB after every test,
// so music data must be inserted fresh each time.
beforeEach(async () => {
  ({ token: studentToken } = await createStudent());
  ({ token: counsellorToken } = await createCounsellor());

  await Music.create([
    {
      title: 'Ocean Waves',
      artist: 'Nature Sounds',
      category: 'relax',
      tags: ['calm', 'sleep'],
      audioUrl: 'https://example.com/ocean.mp3',
      duration: 180,
      active: true
    },
    {
      title: 'Meditation Flow',
      artist: 'Zen Studio',
      category: 'meditation',
      tags: ['meditation', 'focus'],
      audioUrl: 'https://example.com/meditation.mp3',
      duration: 300,
      active: true
    },
    {
      title: 'Focus Beat',
      artist: 'Study Vibes',
      category: 'focus',
      tags: ['study', 'concentration'],
      audioUrl: 'https://example.com/focus.mp3',
      duration: 240,
      active: true
    }
  ]);
});

describe('Music - Access Control', () => {

  test('Student can fetch all songs', async () => {
    const res = await request(app)
      .get('/api/music')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
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
    expect(res.body.length).toBeGreaterThan(0);
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
      .get('/api/music/search?q=unknownsong12345')
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

    expect(allSongs.body.length).toBeGreaterThan(0);
    const songId = allSongs.body[0]._id;

    const res = await request(app)
      .get(`/api/music/${songId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('_id', songId);
  });

  test('Invalid song ID format returns 400', async () => {
    const res = await request(app)
      .get('/api/music/invalidid')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', 'Invalid song ID');
  });

  test('Valid ObjectId format but non-existent song returns 404', async () => {
    const nonExistentId = '000000000000000000000000';

    const res = await request(app)
      .get(`/api/music/${nonExistentId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error', 'Song not found');
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
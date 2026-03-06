// tests/journal.test.js
// Run: npx jest tests/journal.test.js

const request = require('supertest');
const app     = require('../src/app');
const { createStudent, createCounsellor } = require('./helpers');

let studentToken;
let counsellorToken;
let entryId;

beforeEach(async () => {
  ({ token: studentToken }    = await createStudent());
  ({ token: counsellorToken } = await createCounsellor());
});

describe('Journal — Access Control', () => {

  test('Student can create a journal entry', async () => {
    const res = await request(app)
      .post('/api/journal')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ title: 'My first entry', body: 'Today I felt really hopeful about the future.' });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('My first entry');
    entryId = res.body.data._id;
  });

  test('Counsellor cannot create a journal entry — 403', async () => {
    const res = await request(app)
      .post('/api/journal')
      .set('Authorization', `Bearer ${counsellorToken}`)
      .send({ body: 'Should not work' });

    expect(res.statusCode).toBe(403);
  });

  test('Unauthenticated request is rejected — 401', async () => {
    const res = await request(app)
      .post('/api/journal')
      .send({ body: 'No token' });

    expect(res.statusCode).toBe(401);
  });

});

describe('Journal — CRUD', () => {

  let eid;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/journal')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ title: 'Test Entry', body: 'Some thoughts here for testing purposes.' });
    eid = res.body.data._id;
  });

  test('Student can list their own entries', async () => {
    const res = await request(app)
      .get('/api/journal')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  test('List is user-isolated — other students entries not visible', async () => {
    const { token: otherToken } = await createStudent({ email: 'other2@example.com' });
    await request(app)
      .post('/api/journal')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ body: 'Another student writing' });

    const res = await request(app)
      .get('/api/journal')
      .set('Authorization', `Bearer ${studentToken}`);

    const allBodies = res.body.data.map(e => e.body);
    expect(allBodies).not.toContain('Another student writing');
  });

  test('Student can get a single entry', async () => {
    const res = await request(app)
      .get(`/api/journal/${eid}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data._id).toBe(eid);
  });

  test('Cannot access another student\'s entry — 404', async () => {
    const { token: otherToken } = await createStudent({ email: 'other3@example.com' });
    const res = await request(app)
      .get(`/api/journal/${eid}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.statusCode).toBe(404);
  });

  test('Student can update their entry', async () => {
    const res = await request(app)
      .patch(`/api/journal/${eid}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ title: 'Updated Title', body: 'Updated body content here.' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.title).toBe('Updated Title');
  });

  test('Word count is updated on edit', async () => {
    const res = await request(app)
      .patch(`/api/journal/${eid}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ body: 'One two three four five' });

    expect(res.body.data.wordCount).toBe(5);
  });

  test('Student can delete their entry', async () => {
    const del = await request(app)
      .delete(`/api/journal/${eid}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(del.statusCode).toBe(200);

    const get = await request(app)
      .get(`/api/journal/${eid}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(get.statusCode).toBe(404);
  });

});

describe('Journal — Validation', () => {

  test('Empty body is rejected — 400', async () => {
    const res = await request(app)
      .post('/api/journal')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ title: 'No body' });

    expect(res.statusCode).toBe(400);
  });

  test('Default title is set when not provided', async () => {
    const res = await request(app)
      .post('/api/journal')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ body: 'Writing without a title today.' });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.title).toBe('Untitled Entry');
  });

});

describe('Journal — Calendar', () => {

  test('Calendar returns active days for current month', async () => {
    await request(app)
      .post('/api/journal')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ body: 'Calendar test entry.' });

    const now = new Date();
    const res = await request(app)
      .get(`/api/journal/calendar?year=${now.getFullYear()}&month=${now.getMonth() + 1}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0]).toHaveProperty('date');
    expect(res.body.data[0]).toHaveProperty('count');
    expect(res.body.data[0]).toHaveProperty('entries');
  });

});

describe('Journal — Month filter', () => {

  test('Filtering by month returns only that month\'s entries', async () => {
    const now = new Date();
    const res = await request(app)
      .get(`/api/journal?year=${now.getFullYear()}&month=${now.getMonth() + 1}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

});
const request = require('supertest');
const app = require('../src/app');

// We don't necessarily want to call real Cloudflare API inside tests.
// The controller gracefully falls back to STUN if env vars aren't set.
// It might also throw an error from `fetchCloudflareCredentials`, but we can just
// test the default route behavior.

describe('Turn Routes', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('GET /api/turn/credentials', () => {
    it('should fallback to STUN if CF env vars are missing', async () => {
      delete process.env.CF_TURN_TOKEN_ID;
      delete process.env.CF_TURN_API_TOKEN;

      const res = await request(app).get('/api/turn/credentials');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.iceServers)).toBe(true);
      expect(res.body.iceServers[0].urls).toMatch(/stun/);
    });

    // To test the success path, we'd mock fetchCloudflareCredentials using nock or jest mocking,
    // but the fallback case covers the immediate regression surface.
  });
});

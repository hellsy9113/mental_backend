const request = require('supertest');
const app = require('../src/app');
const ChatLog = require('../src/models/aarivChatModel');

jest.mock('../src/services/aariv.services', () => ({
  generateAarivResponse: jest.fn().mockResolvedValue({
    isHighRisk: false,
    response: 'Mocked Aariv Response'
  })
}));

describe('Aariv Routes', () => {
  beforeEach(async () => {
    await ChatLog.deleteMany({});
  });

  describe('POST /api/aariv/chat', () => {
    it('should post a chat message and save it', async () => {
      const res = await request(app)
        .post('/api/aariv/chat')
        .send({
          userId: 'user123',
          sessionId: 'session123',
          message: 'Hello Aariv'
        });

      expect(res.status).toBe(200);
      expect(res.body.response).toBe('Mocked Aariv Response');
      expect(res.body.isHighRisk).toBe(false);

      const logs = await ChatLog.find({ sessionId: 'session123' });
      expect(logs.length).toBe(1);
      expect(logs[0].userMessage).toBe('Hello Aariv');
    });
  });

  describe('GET /api/aariv/history/:sessionId', () => {
    it('should get chat history for a session', async () => {
      await request(app).post('/api/aariv/chat').send({ userId: 'user123', sessionId: 'sess123', message: 'M1' });
      await request(app).post('/api/aariv/chat').send({ userId: 'user123', sessionId: 'sess123', message: 'M2' });

      const res = await request(app)
        .get('/api/aariv/history/sess123')
        .query({ userId: 'user123' });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
      expect(res.body[0].userMessage).toBe('M1');
      expect(res.body[1].userMessage).toBe('M2');
    });
  });

  describe('GET /api/aariv/sessions', () => {
    it('should get grouped recent sessions', async () => {
      await request(app).post('/api/aariv/chat').send({ userId: 'user123', sessionId: 'sess1', message: 'M1' });
      await request(app).post('/api/aariv/chat').send({ userId: 'user123', sessionId: 'sess2', message: 'M2' });

      const res = await request(app)
        .get('/api/aariv/sessions')
        .query({ userId: 'user123' });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
    });
  });

  describe('DELETE /api/aariv/session/:sessionId', () => {
    it('should delete a chat session', async () => {
      await request(app).post('/api/aariv/chat').send({ userId: 'user123', sessionId: 'sessToDel', message: 'Hello' });

      const delRes = await request(app)
        .delete('/api/aariv/session/sessToDel')
        .query({ userId: 'user123' });
      
      expect(delRes.status).toBe(200);
      expect(delRes.body.message).toBe('Chat session deleted successfully');

      const logs = await ChatLog.find({ sessionId: 'sessToDel' });
      expect(logs.length).toBe(0);
    });
  });
});

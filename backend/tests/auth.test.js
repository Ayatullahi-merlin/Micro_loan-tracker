const request = require('supertest');
const app = require('../src/server');
const db = require('../src/config/db');
const bcrypt = require('bcryptjs');

// Mock the db module
jest.mock('../src/config/db');

describe('Authentication API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new borrower successfully', async () => {
      // Mock: no existing user, then insert succeeds
      db.query
        .mockResolvedValueOnce({ rows: [] }) // duplicate check
        .mockResolvedValueOnce({
          rows: [{
            id: 'mock-uuid-123',
            name: 'Igida Eyefo',
            email: 'igida@example.com',
            role: 'borrower',
            created_at: new Date()
          }]
        });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Igida Eyefo',
          email: 'igida@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('igida@example.com');
      expect(res.body.data.user.role).toBe('borrower');
      expect(res.body.data.token).toBeDefined();
    });

    it('should reject registration if password is too short', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Igida Eyefo',
          email: 'igida@example.com',
          password: '123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/password must be at least 6 characters/i);
    });

    it('should reject registration if email is duplicate', async () => {
      // Mock: user already exists
      db.query.mockResolvedValueOnce({ rows: [{ id: 'existing-id' }] });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Igida Eyefo',
          email: 'igida@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/already exists/i);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const plainPassword = 'password123';
      const salt = await bcrypt.genSalt(1);
      const hash = await bcrypt.hash(plainPassword, salt);

      // Mock: user exists in db
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 'mock-uuid-123',
          name: 'John Doe',
          email: 'igida@example.com',
          password_hash: hash,
          role: 'borrower'
        }]
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'igida@example.com',
          password: plainPassword
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('igida@example.com');
    });

    it('should reject login with incorrect password', async () => {
      const salt = await bcrypt.genSalt(1);
      const hash = await bcrypt.hash('correct_password', salt);

      // Mock: user exists
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 'mock-uuid-123',
          name: 'Igida Eyefo',
          email: 'igida@example.com',
          password_hash: hash,
          role: 'borrower'
        }]
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'igida@example.com',
          password: 'wrong_password'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/invalid email or password/i);
    });
  });
});

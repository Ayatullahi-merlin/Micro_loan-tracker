const request = require('supertest');
const app = require('../src/server');
const db = require('../src/config/db');
const jwt = require('jsonwebtoken');

// Mock the db module
jest.mock('../src/config/db');

const jwtSecret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_me_in_production';

// Helper to sign tokens for tests
const createTestToken = (id, role) => {
  return jwt.sign({ id, email: 'test@example.com', role }, jwtSecret);
};

describe('Loans API Endpoints', () => {
  const borrowerToken = createTestToken('borrower-id-123', 'borrower');
  const adminToken = createTestToken('admin-id-999', 'admin');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/loans', () => {
    it('should allow borrower to apply for a loan', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 'loan-uuid-111',
          borrower_id: 'borrower-id-123',
          requested_amount: 50000,
          purpose: 'New inventory',
          duration_months: 6,
          status: 'PENDING'
        }]
      });

      const res = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send({
          requested_amount: 50000,
          purpose: 'New inventory',
          duration_months: 6
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('PENDING');
      expect(res.body.data.requested_amount).toBe(50000);
    });

    it('should reject loan application with negative amount', async () => {
      const res = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send({
          requested_amount: -500,
          purpose: 'New inventory',
          duration_months: 6
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/must be a positive number/i);
    });
  });

  describe('GET /api/loans', () => {
    it('should filter query by borrower_id for borrowers', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{ id: 'loan-1', borrower_id: 'borrower-id-123', purpose: 'Inventory' }]
      });

      const res = await request(app)
        .get('/api/loans')
        .set('Authorization', `Bearer ${borrowerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      // First arg to query should filter by borrower_id
      expect(db.query.mock.calls[0][1][0]).toBe('borrower-id-123');
    });

    it('should fetch all loans for admin users', async () => {
      db.query.mockResolvedValueOnce({
        rows: [
          { id: 'loan-1', borrower_id: 'borrower-1', borrower_name: 'John' },
          { id: 'loan-2', borrower_id: 'borrower-2', borrower_name: 'Jane' }
        ]
      });

      const res = await request(app)
        .get('/api/loans')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });
  });

  describe('PATCH /api/loans/:id/status', () => {
    it('should reject status changes initiated by borrowers', async () => {
      const res = await request(app)
        .patch('/api/loans/loan-uuid-111/status')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send({ status: 'APPROVED', approved_amount: 50000, due_date: '2026-12-31' });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow admin to approve a pending loan', async () => {
      // Mock 1: current status is PENDING
      db.query
        .mockResolvedValueOnce({ rows: [{ status: 'PENDING', requested_amount: 50000 }] })
        // Mock 2: update query success
        .mockResolvedValueOnce({
          rows: [{
            id: 'loan-uuid-111',
            status: 'APPROVED',
            approved_amount: 50000,
            due_date: '2026-12-31'
          }]
        });

      const res = await request(app)
        .patch('/api/loans/loan-uuid-111/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ 
          status: 'APPROVED', 
          approved_amount: 50000, 
          due_date: '2026-12-31',
          officer_notes: 'Looks good'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('APPROVED');
    });

    it('should prevent invalid transitions like APPROVED back to PENDING', async () => {
      // Mock: current status is APPROVED
      db.query.mockResolvedValueOnce({ rows: [{ status: 'APPROVED' }] });

      const res = await request(app)
        .patch('/api/loans/loan-uuid-111/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'APPROVED' }); // Triggers validation on current status !== PENDING

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/invalid state transition/i);
    });
  });
});

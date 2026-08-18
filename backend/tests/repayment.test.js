const request = require('supertest');
const app = require('../src/server');
const db = require('../src/config/db');
const financialService = require('../src/services/financialService');
const jwt = require('jsonwebtoken');

// Mock db and financialService
jest.mock('../src/config/db');
jest.mock('../src/services/financialService');

const jwtSecret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_me_in_production';

const createTestToken = (id, role) => {
  return jwt.sign({ id, email: 'test@example.com', role }, jwtSecret);
};

describe('Repayments API Endpoints', () => {
  const borrowerToken = createTestToken('borrower-id-123', 'borrower');
  const adminToken = createTestToken('admin-id-999', 'admin');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/loans/:id/repayments', () => {
    it('should reject repayments logged by borrowers', async () => {
      const res = await request(app)
        .post('/api/loans/loan-uuid-111/repayments')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send({ amount: 10000, payment_reference: 'REF-1' });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should reject repayments if loan is not ACTIVE (e.g. is PENDING)', async () => {
      // Mock: Loan status is PENDING
      db.query.mockResolvedValueOnce({ rows: [{ status: 'PENDING' }] });

      const res = await request(app)
        .post('/api/loans/loan-uuid-111/repayments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 10000, payment_reference: 'REF-1' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/only be recorded for ACTIVE loans/i);
    });

    it('should reject repayments that exceed the outstanding balance', async () => {
      // Mock: Loan status is ACTIVE
      db.query
        .mockResolvedValueOnce({ rows: [{ status: 'ACTIVE' }] }) // status check
        .mockResolvedValueOnce({ rows: [] }); // unique reference check

      // Mock: Outstanding balance is 30,000
      financialService.getLoanFinancials.mockResolvedValueOnce({
        id: 'loan-uuid-111',
        status: 'ACTIVE',
        approved_amount: 50000,
        total_repaid: 20000,
        outstanding_balance: 30000
      });

      const res = await request(app)
        .post('/api/loans/loan-uuid-111/repayments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 35000, payment_reference: 'REF-1' }); // 35,000 > 30,000

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/exceeds the outstanding balance/i);
    });

    it('should record repayment and transition status to COMPLETED if fully paid', async () => {
      // Mock: Loan status is ACTIVE
      db.query
        .mockResolvedValueOnce({ rows: [{ status: 'ACTIVE' }] }) // status check
        .mockResolvedValueOnce({ rows: [] }) // unique reference check
        .mockResolvedValueOnce({ rows: [] }) // BEGIN tx
        .mockResolvedValueOnce({ rows: [{ id: 'repayment-uuid-123', amount: 30000 }] }) // INSERT repayment
        .mockResolvedValueOnce({ rows: [] }) // UPDATE status to COMPLETED
        .mockResolvedValueOnce({ rows: [] }); // COMMIT tx

      // Mock: Outstanding balance is 30,000
      financialService.getLoanFinancials.mockResolvedValueOnce({
        id: 'loan-uuid-111',
        status: 'ACTIVE',
        approved_amount: 50000,
        total_repaid: 20000,
        outstanding_balance: 30000
      });

      const res = await request(app)
        .post('/api/loans/loan-uuid-111/repayments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 30000, payment_reference: 'REF-FULL-PAID' });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.loan_status).toBe('COMPLETED');
      expect(res.body.data.remaining_balance).toBe(0);
    });
  });
});

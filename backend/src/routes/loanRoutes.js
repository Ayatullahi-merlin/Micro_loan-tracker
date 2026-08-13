const express = require('express');
const { 
  createLoan, 
  getLoans, 
  getLoanById, 
  updateLoanStatus, 
  createRepayment 
} = require('../controllers/loanController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Borrower apply for loan
router.post('/', authenticateToken, createLoan);

// General list loans (Admin sees all, Borrower sees own)
router.get('/', authenticateToken, getLoans);

// Get single loan details
router.get('/:id', authenticateToken, getLoanById);

// Admin approve/reject/disburse status update
router.patch('/:id/status', authenticateToken, requireRole('admin'), updateLoanStatus);

// Admin record a repayment
router.post('/:id/repayments', authenticateToken, requireRole('admin'), createRepayment);

module.exports = router;

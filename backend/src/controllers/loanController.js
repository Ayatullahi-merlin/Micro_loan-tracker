const db = require('../config/db');
const financialService = require('../services/financialService');

// 1. Submit a loan request (Borrower only)
const createLoan = async (req, res, next) => {
  const { requested_amount, purpose, duration_months } = req.body;
  const borrowerId = req.user.id;

  try {
    // Validation
    if (!requested_amount || !purpose || !duration_months) {
      return res.status(400).json({
        success: false,
        error: { message: 'Requested amount, purpose, and duration are required.' }
      });
    }

    const amountNum = parseFloat(requested_amount);
    const durationNum = parseInt(duration_months, 10);

    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Requested amount must be a positive number.' }
      });
    }

    if (isNaN(durationNum) || durationNum <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Duration must be a positive number of months.' }
      });
    }

    const result = await db.query(
      `INSERT INTO loans (borrower_id, requested_amount, purpose, duration_months, status) 
       VALUES ($1, $2, $3, $4, 'PENDING') 
       RETURNING *`,
      [borrowerId, amountNum, purpose.trim(), durationNum]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    next(error);
  }
};

// 2. List loans with searching & status filtering
const getLoans = async (req, res, next) => {
  const { role, id: userId } = req.user;
  const { status, search } = req.query;

  try {
    let queryText = '';
    let queryParams = [];

    if (role === 'admin') {
      // Admins see all loans, with borrower name and email joined
      queryText = `
        SELECT l.*, u.name as borrower_name, u.email as borrower_email 
        FROM loans l
        JOIN users u ON l.borrower_id = u.id
        WHERE 1=1
      `;
      
      if (status) {
        queryParams.push(status);
        queryText += ` AND l.status = $${queryParams.length}`;
      }
      
      if (search) {
        queryParams.push(`%${search}%`);
        queryText += ` AND (l.purpose ILIKE $${queryParams.length} OR u.name ILIKE $${queryParams.length} OR u.email ILIKE $${queryParams.length})`;
      }

      queryText += ' ORDER BY l.created_at DESC';
    } else {
      // Borrowers see only their own loans
      queryText = `
        SELECT l.*, u.name as borrower_name, u.email as borrower_email
        FROM loans l
        JOIN users u ON l.borrower_id = u.id
        WHERE l.borrower_id = $1
      `;
      queryParams.push(userId);

      if (status) {
        queryParams.push(status);
        queryText += ` AND l.status = $${queryParams.length}`;
      }

      if (search) {
        queryParams.push(`%${search}%`);
        queryText += ` AND l.purpose ILIKE $${queryParams.length}`;
      }

      queryText += ' ORDER BY l.created_at DESC';
    }

    const result = await db.query(queryText, queryParams);
    res.status(200).json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    next(error);
  }
};

// 3. Get single loan details with repayments
const getLoanById = async (req, res, next) => {
  const { id } = req.params;
  const { role, id: userId } = req.user;

  try {
    // Retrieve loan detail
    const loanResult = await db.query(
      `SELECT l.*, u.name as borrower_name, u.email as borrower_email 
       FROM loans l
       JOIN users u ON l.borrower_id = u.id
       WHERE l.id = $1`,
      [id]
    );

    if (loanResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Loan request not found.' }
      });
    }

    const loan = loanResult.rows[0];

    // Auth check: borrower can only view their own loans
    if (role !== 'admin' && loan.borrower_id !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied: You do not own this loan request.' }
      });
    }

    // Retrieve repayments
    const repaymentsResult = await db.query(
      `SELECT r.*, u.name as recorded_by_name 
       FROM repayments r
       JOIN users u ON r.recorded_by_id = u.id
       WHERE r.loan_id = $1
       ORDER BY r.payment_date DESC`,
      [id]
    );

    // Calculate live financial figures
    const financials = await financialService.getLoanFinancials(id);

    res.status(200).json({
      success: true,
      data: {
        ...loan,
        financials,
        repayments: repaymentsResult.rows
      }
    });

  } catch (error) {
    next(error);
  }
};

// 4. Update loan status (Admin only)
const updateLoanStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status, approved_amount, due_date, officer_notes } = req.body;

  try {
    // 1. Fetch current loan details
    const loanResult = await db.query('SELECT status, requested_amount FROM loans WHERE id = $1', [id]);
    if (loanResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Loan request not found.' }
      });
    }

    const currentStatus = loanResult.rows[0].status;

    // 2. Validate state machine transition rules
    // PENDING -> APPROVED / REJECTED
    // APPROVED -> ACTIVE
    if (status === 'APPROVED' || status === 'REJECTED') {
      if (currentStatus !== 'PENDING') {
        return res.status(400).json({
          success: false,
          error: { message: `Invalid state transition: Cannot change status from ${currentStatus} to ${status}.` }
        });
      }
    } else if (status === 'ACTIVE') {
      if (currentStatus !== 'APPROVED') {
        return res.status(400).json({
          success: false,
          error: { message: `Invalid state transition: Cannot change status from ${currentStatus} to ACTIVE. Loan must be APPROVED first.` }
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error: { message: `Invalid status parameter: ${status}` }
      });
    }

    // 3. Process the transition update
    let updatedLoan;
    const now = new Date();

    if (status === 'APPROVED') {
      const amountApproved = parseFloat(approved_amount);
      if (isNaN(amountApproved) || amountApproved <= 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'Approved amount is required and must be a positive number.' }
        });
      }

      if (!due_date) {
        return res.status(400).json({
          success: false,
          error: { message: 'Due date is required when approving a loan.' }
        });
      }

      const result = await db.query(
        `UPDATE loans 
         SET status = 'APPROVED', approved_amount = $1, approved_at = $2, due_date = $3, officer_notes = $4, updated_at = NOW() 
         WHERE id = $5 
         RETURNING *`,
        [amountApproved, now, due_date, officer_notes || '', id]
      );
      updatedLoan = result.rows[0];

    } else if (status === 'REJECTED') {
      const result = await db.query(
        `UPDATE loans 
         SET status = 'REJECTED', officer_notes = $1, updated_at = NOW() 
         WHERE id = $2 
         RETURNING *`,
        [officer_notes || '', id]
      );
      updatedLoan = result.rows[0];

    } else if (status === 'ACTIVE') {
      const result = await db.query(
        `UPDATE loans 
         SET status = 'ACTIVE', updated_at = NOW() 
         WHERE id = $1 
         RETURNING *`,
        [id]
      );
      updatedLoan = result.rows[0];
    }

    res.status(200).json({
      success: true,
      data: updatedLoan
    });

  } catch (error) {
    next(error);
  }
};

// 5. Record a repayment (Admin only)
const createRepayment = async (req, res, next) => {
  const { id: loanId } = req.params;
  const { amount, payment_reference } = req.body;
  const officerId = req.user.id;

  try {
    // 1. Retrieve the loan financials and status
    const loanResult = await db.query('SELECT status FROM loans WHERE id = $1', [loanId]);
    if (loanResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Loan not found.' }
      });
    }

    const { status } = loanResult.rows[0];

    // 2. Validate loan status: can only repay ACTIVE loans
    if (status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: { message: `Repayments can only be recorded for ACTIVE loans. Current loan status is: ${status}` }
      });
    }

    // 3. Validation of input repayment amount
    const repayAmount = parseFloat(amount);
    if (isNaN(repayAmount) || repayAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Repayment amount must be a positive number.' }
      });
    }

    if (!payment_reference || payment_reference.trim() === '') {
      return res.status(400).json({
        success: false,
        error: { message: 'Payment reference/receipt ID is required.' }
      });
    }

    // Check payment_reference uniqueness
    const refResult = await db.query('SELECT id FROM repayments WHERE payment_reference = $1', [payment_reference.trim()]);
    if (refResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: { message: 'A repayment with this payment reference already exists.' }
      });
    }

    const financials = await financialService.getLoanFinancials(loanId);
    if (!financials) {
      return res.status(500).json({
        success: false,
        error: { message: 'Error fetching financial details for loan.' }
      });
    }

    // 4. Overpayment check
    // Outstanding balance must be equal or greater than repayment amount
    if (repayAmount > financials.outstanding_balance) {
      return res.status(400).json({
        success: false,
        error: { 
          message: `Repayment amount (₦${repayAmount.toLocaleString()}) exceeds the outstanding balance (₦${financials.outstanding_balance.toLocaleString()}).` 
        }
      });
    }

    // Start a SQL transaction to log payment and check completion status
    await db.query('BEGIN');

    // 5. Insert repayment
    const repaymentResult = await db.query(
      `INSERT INTO repayments (loan_id, amount, payment_reference, recorded_by_id) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [loanId, repayAmount, payment_reference.trim(), officerId]
    );

    // 6. Check if outstanding balance reaches zero and transition status
    const remainingBalance = financials.outstanding_balance - repayAmount;
    let finalStatus = 'ACTIVE';

    if (remainingBalance === 0) {
      finalStatus = 'COMPLETED';
      await db.query(
        `UPDATE loans SET status = 'COMPLETED', updated_at = NOW() WHERE id = $1`,
        [loanId]
      );
    }

    await db.query('COMMIT');

    res.status(201).json({
      success: true,
      data: {
        repayment: repaymentResult.rows[0],
        remaining_balance: remainingBalance,
        loan_status: finalStatus
      }
    });

  } catch (error) {
    await db.query('ROLLBACK');
    next(error);
  }
};

module.exports = {
  createLoan,
  getLoans,
  getLoanById,
  updateLoanStatus,
  createRepayment
};

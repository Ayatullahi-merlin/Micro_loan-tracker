const db = require('../config/db');
const financialService = require('../services/financialService');

const getDashboardSummary = async (req, res, next) => {
  const { role, id: userId } = req.user;

  try {
    if (role === 'admin') {
      const summary = await financialService.getPortfolioSummary();
      return res.status(200).json({
        success: true,
        data: summary
      });
    }

    // Otherwise, borrower-specific dashboard summary
    const summaryQuery = `
      SELECT 
        COUNT(*)::integer as total_loans,
        COUNT(*) FILTER (WHERE status = 'PENDING')::integer as pending_loans,
        COUNT(*) FILTER (WHERE status = 'ACTIVE' OR status = 'APPROVED')::integer as active_loans,
        COUNT(*) FILTER (WHERE status = 'COMPLETED')::integer as completed_loans,
        COALESCE(SUM(approved_amount) FILTER (WHERE status IN ('APPROVED', 'ACTIVE', 'COMPLETED')), 0)::numeric as total_borrowed,
        (
          COALESCE(SUM(approved_amount) FILTER (WHERE status IN ('APPROVED', 'ACTIVE', 'COMPLETED')), 0) - 
          COALESCE((
            SELECT SUM(r.amount) 
            FROM repayments r 
            JOIN loans l2 ON r.loan_id = l2.id 
            WHERE l2.borrower_id = $1 AND l2.status IN ('APPROVED', 'ACTIVE', 'COMPLETED')
          ), 0)
        )::numeric as outstanding_balance
      FROM loans 
      WHERE borrower_id = $1
    `;

    const result = await db.query(summaryQuery, [userId]);
    const summary = result.rows[0];

    res.status(200).json({
      success: true,
      data: {
        totalLoans: summary.total_loans,
        pendingLoans: summary.pending_loans,
        activeLoans: summary.active_loans,
        completedLoans: summary.completed_loans,
        totalBorrowed: parseFloat(summary.total_borrowed || 0),
        outstandingBalance: parseFloat(summary.outstanding_balance || 0)
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardSummary
};

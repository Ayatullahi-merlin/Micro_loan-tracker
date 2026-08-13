const db = require('../config/db');

/**
 * Calculates financial figures for a specific loan.
 * @param {string} loanId - UUID of the loan
 * @returns {Promise<object>} { id, status, approved_amount, total_repaid, outstanding_balance }
 */
const getLoanFinancials = async (loanId) => {
  const query = `
    SELECT 
      l.id, 
      l.status, 
      COALESCE(l.approved_amount, 0)::numeric as approved_amount, 
      COALESCE(SUM(r.amount), 0)::numeric as total_repaid,
      (COALESCE(l.approved_amount, 0) - COALESCE(SUM(r.amount), 0))::numeric as outstanding_balance
    FROM loans l 
    LEFT JOIN repayments r ON l.id = r.loan_id 
    WHERE l.id = $1 
    GROUP BY l.id
  `;
  const result = await db.query(query, [loanId]);
  
  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    status: row.status,
    approved_amount: parseFloat(row.approved_amount),
    total_repaid: parseFloat(row.total_repaid),
    outstanding_balance: parseFloat(row.outstanding_balance)
  };
};

/**
 * Computes portfolio-level aggregates for the admin dashboard.
 * @returns {Promise<object>}
 */
const getPortfolioSummary = async () => {
  const countsQuery = `
    SELECT 
      COUNT(*) FILTER (WHERE status = 'PENDING') as pending_count,
      COUNT(*) FILTER (WHERE status = 'APPROVED' OR status = 'ACTIVE') as active_count,
      COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_count,
      COUNT(*) as total_count
    FROM loans
  `;
  
  const financialQuery = `
    SELECT 
      COALESCE(SUM(approved_amount), 0)::numeric as total_disbursed,
      COALESCE(
        (SELECT SUM(amount) FROM repayments), 
        0
      )::numeric as total_repaid
    FROM loans
    WHERE status IN ('APPROVED', 'ACTIVE', 'COMPLETED')
  `;

  const countsResult = await db.query(countsQuery);
  const financialResult = await db.query(financialQuery);

  const counts = countsResult.rows[0];
  const financials = financialResult.rows[0];

  const totalDisbursed = parseFloat(financials.total_disbursed);
  const totalRepaid = parseFloat(financials.total_repaid);
  const outstandingAmount = Math.max(0, totalDisbursed - totalRepaid);

  return {
    totalRequests: parseInt(counts.total_count, 10),
    pendingRequests: parseInt(counts.pending_count, 10),
    activeLoans: parseInt(counts.active_count, 10),
    completedLoans: parseInt(counts.completed_count, 10),
    totalDisbursed,
    totalRepaid,
    outstandingAmount
  };
};

module.exports = {
  getLoanFinancials,
  getPortfolioSummary
};

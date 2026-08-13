import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { formatNaira, formatDate, getRemainingDays } from '../utils/formatters';

const LoanDetail = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Staff review states
  const [approvedAmount, setApprovedAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [officerNotes, setOfficerNotes] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Staff repayment states
  const [repayAmount, setRepayAmount] = useState('');
  const [payReference, setPayReference] = useState('');

  const fetchLoanDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.loans.getById(id);
      setLoan(data);
      // Pre-fill approval defaults
      setApprovedAmount(data.requested_amount.toString());
      // Set default due date to duration months from now
      const defaultDue = new Date();
      defaultDue.setMonth(defaultDue.getMonth() + data.duration_months);
      setDueDate(defaultDue.toISOString().split('T')[0]);
    } catch (err) {
      setError(err.message || 'Failed to retrieve loan files.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoanDetails();
  }, [id]);

  const handleStatusUpdate = async (status) => {
    setActionError('');
    setActionLoading(true);
    try {
      const payload = { status, officer_notes: officerNotes };
      
      if (status === 'APPROVED') {
        const parsedAmount = parseFloat(approvedAmount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
          throw new Error('Approved amount must be positive.');
        }
        payload.approved_amount = parsedAmount;
        payload.due_date = dueDate;
      }

      await api.loans.updateStatus(id, payload);
      await fetchLoanDetails(); // Refresh view
      setOfficerNotes('');
    } catch (err) {
      setActionError(err.message || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisbursement = async () => {
    setActionError('');
    setActionLoading(true);
    try {
      await api.loans.updateStatus(id, { status: 'ACTIVE' });
      await fetchLoanDetails();
    } catch (err) {
      setActionError(err.message || 'Disbursement failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordRepayment = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionLoading(true);
    try {
      const parsedRepay = parseFloat(repayAmount);
      if (isNaN(parsedRepay) || parsedRepay <= 0) {
        throw new Error('Repayment amount must be a positive number.');
      }
      if (!payReference || payReference.trim() === '') {
        throw new Error('Payment reference receipt tag is required.');
      }

      await api.loans.recordRepayment(id, parsedRepay, payReference);
      await fetchLoanDetails();
      setRepayAmount('');
      setPayReference('');
    } catch (err) {
      setActionError(err.message || 'Repayment logging failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING': return 'badge badge-pending';
      case 'APPROVED': return 'badge badge-approved';
      case 'ACTIVE': return 'badge badge-active';
      case 'COMPLETED': return 'badge badge-completed';
      case 'REJECTED': return 'badge badge-rejected';
      default: return 'badge';
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div className="card" style={styles.skeletonContainer}>
          <div style={styles.skeletonTitle}></div>
          <div style={styles.skeletonBody}></div>
          <div style={styles.skeletonBody}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <Link to={user.role === 'admin' ? '/admin' : '/borrower'} style={styles.backLink}>
          ← Back to Dashboard
        </Link>
        <div className="card" style={{ marginTop: '16px', borderColor: '#fee2e2', backgroundColor: '#fef2f2' }}>
          <h3 style={{ color: '#991b1b', marginBottom: '8px' }}>Error Loading File</h3>
          <p style={{ color: '#b91c1c' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Link to={user.role === 'admin' ? '/admin' : '/borrower'} style={styles.backLink}>
        ← Back to Dashboard
      </Link>

      <div style={styles.contentGrid}>
        {/* Left Side: Loan Details & Repayment History */}
        <div style={styles.mainContent}>
          <div className="card" style={{ marginBottom: '24px' }}>
            <div style={styles.titleRow}>
              <h2 style={styles.loanTitle}>Loan Details</h2>
              <span className={getStatusBadgeClass(loan.status)} style={{ fontSize: '0.85rem' }}>
                {loan.status}
              </span>
            </div>

            <div style={styles.detailsGrid}>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Borrower Name</span>
                <span style={styles.detailVal}>{loan.borrower_name}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Borrower Email</span>
                <span style={styles.detailVal}>{loan.borrower_email}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Requested Amount</span>
                <span style={styles.detailVal}>{formatNaira(loan.requested_amount)}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Loan Purpose</span>
                <span style={styles.detailVal}>{loan.purpose}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Requested Duration</span>
                <span style={styles.detailVal}>{loan.duration_months} Months</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Requested Date</span>
                <span style={styles.detailVal}>{formatDate(loan.created_at)}</span>
              </div>
            </div>

            {loan.officer_notes && (
              <div style={styles.notesBox}>
                <strong style={{ fontSize: '0.825rem', color: '#475569' }}>Officer / Reviewer Notes:</strong>
                <p style={{ marginTop: '4px', fontSize: '0.875rem', color: '#1e293b' }}>{loan.officer_notes}</p>
              </div>
            )}
          </div>

          {/* Repayments History */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', color: '#03071E' }}>
              Repayment History
            </h3>
            
            {loan.repayments.length === 0 ? (
              <div style={styles.emptyHistory}>
                <span style={{ fontSize: '1.5rem', display: 'block' }}>📄</span>
                No repayments have been recorded for this loan yet.
              </div>
            ) : (
              <div className="table-container" style={{ margin: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Date Paid</th>
                      <th>Reference / Receipt</th>
                      <th>Recorded By</th>
                      <th>Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loan.repayments.map((repay) => (
                      <tr key={repay.id}>
                        <td>{formatDate(repay.payment_date)}</td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{repay.payment_reference}</td>
                        <td>{repay.recorded_by_name}</td>
                        <td style={{ fontWeight: '600', color: '#10b981' }}>
                          {formatNaira(repay.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Financials & Action Modules */}
        <div style={styles.sidebar}>
          {/* Financial summary card */}
          {loan.status !== 'PENDING' && loan.status !== 'REJECTED' && (
            <div className="card" style={styles.financialCard}>
              <h3 style={styles.sideCardTitle}>Financial Summary</h3>
              <div style={styles.finRow}>
                <span>Approved Principle</span>
                <span style={styles.finVal}>{formatNaira(loan.financials.approved_amount)}</span>
              </div>
              <div style={styles.finRow}>
                <span>Total Repaid</span>
                <span style={{ ...styles.finVal, color: '#10b981' }}>{formatNaira(loan.financials.total_repaid)}</span>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '12px 0' }} />
              <div style={styles.finRow}>
                <strong style={{ color: '#F5E0B7' }}>Outstanding Balance</strong>
                <strong style={{ fontSize: '1.2rem', color: '#ffffff' }}>
                  {formatNaira(loan.financials.outstanding_balance)}
                </strong>
              </div>
              {loan.status === 'ACTIVE' && (
                <div style={styles.dueCountdown}>
                  ⏳ Due Schedule: {formatDate(loan.due_date)} ({getRemainingDays(loan.due_date)})
                </div>
              )}
            </div>
          )}

          {/* Action Boxes for Admin Staff */}
          {user.role === 'admin' && (
            <div style={{ marginTop: '20px' }}>
              {actionError && (
                <div style={{ ...styles.errorAlert, padding: '12px', marginBottom: '16px' }}>
                  <strong>Error:</strong> {actionError}
                </div>
              )}

              {/* 1. Pending Actions */}
              {loan.status === 'PENDING' && (
                <div className="card">
                  <h3 style={styles.cardSectionTitle}>Process Loan Request</h3>
                  
                  <div className="form-group">
                    <label htmlFor="approved-amt">Approved Amount (₦)</label>
                    <input
                      id="approved-amt"
                      type="number"
                      className="input-field"
                      value={approvedAmount}
                      onChange={(e) => setApprovedAmount(e.target.value)}
                      disabled={actionLoading}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="due-dt">Due Date</label>
                    <input
                      id="due-dt"
                      type="date"
                      className="input-field"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      disabled={actionLoading}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="notes">Review/Officer Notes</label>
                    <textarea
                      id="notes"
                      className="input-field"
                      placeholder="Add logic reasoning notes here..."
                      rows="3"
                      value={officerNotes}
                      onChange={(e) => setOfficerNotes(e.target.value)}
                      disabled={actionLoading}
                      style={{ resize: 'vertical' }}
                    ></textarea>
                  </div>

                  <div style={styles.btnRow}>
                    <button 
                      onClick={() => handleStatusUpdate('APPROVED')}
                      className="btn btn-primary"
                      disabled={actionLoading}
                      style={{ flex: 1 }}
                    >
                      {actionLoading ? 'Saving...' : 'Approve'}
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate('REJECTED')}
                      className="btn btn-danger"
                      disabled={actionLoading}
                      style={{ flex: 1 }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}

              {/* 2. Approved Actions (Disbursement) */}
              {loan.status === 'APPROVED' && (
                <div className="card" style={{ border: '2px solid #03071E' }}>
                  <h3 style={styles.cardSectionTitle}>Disbursement Queue</h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>
                    This loan request has been approved. The borrower is awaiting capital disbursement.
                  </p>
                  <button 
                    onClick={handleDisbursement}
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Activating...' : 'Confirm Disbursement'}
                  </button>
                </div>
              )}

              {/* 3. Active Actions (Repayment logging) */}
              {loan.status === 'ACTIVE' && (
                <div className="card">
                  <h3 style={styles.cardSectionTitle}>Record Repayment</h3>
                  <form onSubmit={handleRecordRepayment}>
                    <div className="form-group">
                      <label htmlFor="repay-amt">Repayment Amount (₦)</label>
                      <input
                        id="repay-amt"
                        type="number"
                        placeholder="e.g. 20000"
                        className="input-field"
                        value={repayAmount}
                        onChange={(e) => setRepayAmount(e.target.value)}
                        disabled={actionLoading}
                        required
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '20px' }}>
                      <label htmlFor="repay-ref">Payment Reference / Receipt ID</label>
                      <input
                        id="repay-ref"
                        type="text"
                        placeholder="e.g. PAY-REF-999"
                        className="input-field"
                        value={payReference}
                        onChange={(e) => setPayReference(e.target.value)}
                        disabled={actionLoading}
                        required
                      />
                    </div>

                    <button 
                      type="submit"
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Recording...' : 'Submit Repayment Receipt'}
                    </button>
                  </form>
                </div>
              )}

              {/* 4. Rejected Actions */}
              {loan.status === 'REJECTED' && (
                <div className="card" style={{ borderColor: '#fca5a5', backgroundColor: '#fef2f2' }}>
                  <span style={{ fontSize: '1.25rem' }}>❌</span>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#991b1b', marginTop: '6px' }}>
                    Application Rejected
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#b91c1c', marginTop: '4px' }}>
                    No further review actions can be taken against rejected applications.
                  </p>
                </div>
              )}

              {/* 5. Completed Actions */}
              {loan.status === 'COMPLETED' && (
                <div className="card" style={{ borderColor: '#6ee7b7', backgroundColor: '#ecfdf5' }}>
                  <span style={{ fontSize: '1.25rem' }}>🎉</span>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#065f46', marginTop: '6px' }}>
                    Loan Completed
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#047857', marginTop: '4px' }}>
                    This loan has been fully repaid. Excellent account standing.
                  </p>
                </div>
              )}
            </div>
          )}

          {user.role === 'borrower' && loan.status === 'ACTIVE' && (
            <div className="card" style={{ marginTop: '20px', borderStyle: 'dashed' }}>
              <h3 style={{ fontSize: '0.925rem', fontWeight: '700', color: '#03071E', marginBottom: '8px' }}>
                How to Make Payments
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: '1.5' }}>
                Please present cash or transfer receipts to your assigned **Loan Officer** or manager in Nigeria.
              </p>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '8px', lineHeight: '1.5' }}>
                Once verified, the staff officer will log the transaction using their admin terminal, updating your balance immediately.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 24px',
  },
  backLink: {
    display: 'inline-block',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#03071E',
    marginBottom: '20px',
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '7fr 5fr',
    gap: '24px',
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '16px',
  },
  loanTitle: {
    fontSize: '1.35rem',
    fontWeight: '800',
    color: '#03071E',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px 24px',
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  detailLabel: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  detailVal: {
    fontSize: '0.95rem',
    color: '#03071E',
    fontWeight: '500',
  },
  notesBox: {
    marginTop: '24px',
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    borderLeft: '4px solid #F5E0B7',
  },
  financialCard: {
    backgroundColor: '#03071E', // Navy
    color: '#ffffff',
    borderColor: '#03071E',
  },
  sideCardTitle: {
    fontSize: '1.05rem',
    fontWeight: '700',
    color: '#F5E0B7', // Cream
    marginBottom: '16px',
  },
  finRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: '8px 0',
    fontSize: '0.9rem',
    color: '#94a3b8',
  },
  finVal: {
    fontWeight: '600',
    color: '#ffffff',
  },
  dueCountdown: {
    marginTop: '16px',
    backgroundColor: 'rgba(245, 224, 183, 0.12)',
    padding: '8px 12px',
    borderRadius: '6px',
    color: '#F5E0B7',
    fontSize: '0.8rem',
    fontWeight: '600',
    textAlign: 'center',
  },
  cardSectionTitle: {
    fontSize: '1.05rem',
    fontWeight: '750',
    color: '#03071E',
    marginBottom: '16px',
  },
  btnRow: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  },
  errorAlert: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fee2e2',
    color: '#991b1b',
    borderRadius: '8px',
    fontSize: '0.85rem',
  },
  emptyHistory: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#94a3b8',
    fontSize: '0.875rem',
    lineHeight: '1.6',
    border: '1px dashed #e2e8f0',
    borderRadius: '8px',
  },
  // Skeleton indicators
  skeletonContainer: {
    padding: '30px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  skeletonTitle: {
    width: '40%',
    height: '24px',
    backgroundColor: '#f1f5f9',
    borderRadius: '4px',
    animation: 'pulse 1.5s infinite ease-in-out',
  },
  skeletonBody: {
    width: '100%',
    height: '60px',
    backgroundColor: '#f1f5f9',
    borderRadius: '6px',
    animation: 'pulse 1.5s infinite ease-in-out',
  }
};

// CSS media query adjustments handled inside layouts
export default LoanDetail;

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const ApplyLoan = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [duration, setDuration] = useState('3');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    const parsedDuration = parseInt(duration, 10);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid positive loan amount.');
      return;
    }

    if (!purpose || purpose.trim().length < 5) {
      setError('Please provide a clear loan purpose (at least 5 characters).');
      return;
    }

    setLoading(true);

    try {
      await api.loans.create(parsedAmount, purpose, parsedDuration);
      setSuccess(true);
      setTimeout(() => {
        navigate('/borrower');
      }, 2500);
    } catch (err) {
      setError(err.message || 'Failed to submit loan request. Please try again.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={styles.container}>
        <div className="card" style={styles.successCard}>
          <div style={styles.successIcon}>🎉</div>
          <h2 style={styles.successTitle}>Request Submitted Successfully!</h2>
          <p style={styles.successText}>
            Your loan application of <strong>₦{parseFloat(amount).toLocaleString()}</strong> is now pending review.
          </p>
          <p style={styles.redirectText}>Redirecting you to dashboard...</p>
          <Link to="/borrower" className="btn btn-outline" style={{ marginTop: '16px' }}>
            Go to Dashboard Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.formWrapper}>
        <Link to="/borrower" style={styles.backLink}>
          ← Back to Dashboard
        </Link>
        
        <div className="card">
          <h2 style={styles.cardTitle}>Submit a Loan Request</h2>
          <p style={styles.cardSubtitle}>
            Complete the fields below to request capital for your business or personal needs
          </p>

          {error && (
            <div style={styles.errorAlert}>
              <span style={{ fontWeight: 'bold' }}>Error:</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="loan-amount">Requested Amount (₦)</label>
              <input
                id="loan-amount"
                type="number"
                min="1000"
                step="100"
                placeholder="e.g. 50000"
                className="input-field"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={loading}
                required
              />
              <span style={styles.inputHelp}>Enter amount without symbols or commas.</span>
            </div>

            <div className="form-group">
              <label htmlFor="loan-duration">Duration (Months)</label>
              <select
                id="loan-duration"
                className="input-field"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                disabled={loading}
                required
              >
                <option value="1">1 Month</option>
                <option value="3">3 Months (Standard)</option>
                <option value="6">6 Months</option>
                <option value="9">9 Months</option>
                <option value="12">12 Months</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '28px' }}>
              <label htmlFor="loan-purpose">Loan Purpose</label>
              <textarea
                id="loan-purpose"
                className="input-field"
                placeholder="Briefly explain what you will use this capital for..."
                rows="4"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                disabled={loading}
                style={styles.textarea}
                required
              ></textarea>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={styles.submitBtn}
              disabled={loading}
            >
              {loading ? 'Submitting Application...' : 'Submit Request'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: 'calc(100vh - 70px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#faf9f6',
    padding: '40px 20px',
  },
  formWrapper: {
    maxWidth: '560px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  backLink: {
    alignSelf: 'flex-start',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#03071E',
  },
  cardTitle: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: '#03071E',
    marginBottom: '6px',
  },
  cardSubtitle: {
    fontSize: '0.875rem',
    color: '#64748b',
    marginBottom: '24px',
  },
  errorAlert: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fee2e2',
    color: '#991b1b',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '0.875rem',
    marginBottom: '20px',
  },
  inputHelp: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    display: 'block',
    marginTop: '4px',
  },
  textarea: {
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  submitBtn: {
    width: '100%',
    padding: '12px',
    fontSize: '0.95rem',
  },
  successCard: {
    maxWidth: '480px',
    width: '100%',
    textAlign: 'center',
    padding: '40px 24px',
  },
  successIcon: {
    fontSize: '3rem',
    marginBottom: '16px',
  },
  successTitle: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: '#03071E',
    marginBottom: '8px',
  },
  successText: {
    fontSize: '0.95rem',
    color: '#475569',
    marginBottom: '16px',
  },
  redirectText: {
    fontSize: '0.825rem',
    color: '#94a3b8',
    fontStyle: 'italic',
  }
};

export default ApplyLoan;

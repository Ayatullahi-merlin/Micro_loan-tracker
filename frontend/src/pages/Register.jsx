import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const Register = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!name || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const data = await api.auth.register(name, email, password);
      
      // Store in storage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      onLoginSuccess(data.user);
      
      // Registered users are borrowers by default, redirect to borrower area
      navigate('/borrower');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.cardWrapper}>
        <div style={styles.logoHeader}>
          <Link to="/" style={styles.logo}>
            <span style={styles.logoIcon}>₦</span> Micro-Loan Tracker
          </Link>
        </div>

        <div className="card">
          <h2 style={styles.cardTitle}>Create Borrower Account</h2>
          <p style={styles.cardSubtitle}>Submit details below to set up your micro-loan profile</p>

          {error && (
            <div style={styles.errorAlert}>
              <span style={{ fontWeight: 'bold' }}>Error:</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                className="input-field"
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                className="input-field"
                placeholder="name@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label htmlFor="password">Password (min. 6 characters)</label>
              <input
                id="password"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={styles.submitBtn}
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </form>

          <div style={styles.divider}>Or</div>

          <div style={styles.loginLinkContainer}>
            Already have an account?{' '}
            <Link to="/login" style={styles.loginLink}>
              Sign In Here
            </Link>
          </div>
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
  cardWrapper: {
    maxWidth: '440px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  logoHeader: {
    textAlign: 'center',
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: '850',
    color: '#03071E',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  },
  logoIcon: {
    backgroundColor: '#03071E',
    color: '#F5E0B7',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
  },
  cardTitle: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: '#03071E',
    marginBottom: '6px',
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: '0.875rem',
    color: '#64748b',
    marginBottom: '24px',
    textAlign: 'center',
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
  submitBtn: {
    width: '100%',
    padding: '12px',
    fontSize: '0.95rem',
  },
  divider: {
    margin: '20px 0',
    textAlign: 'center',
    fontSize: '0.85rem',
    color: '#94a3b8',
    position: 'relative',
  },
  loginLinkContainer: {
    textAlign: 'center',
    fontSize: '0.875rem',
    color: '#64748b',
  },
  loginLink: {
    color: '#03071E',
    fontWeight: '600',
    borderBottom: '2px solid #F5E0B7',
  }
};

export default Register;

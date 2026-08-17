import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>₦</span> Micro-Loan Tracker
        </div>
        <div style={styles.navLinks}>
          <Link to="/login" style={styles.navLink}>Login</Link>
          <Link to="/register" className="btn btn-secondary">Register as Borrower</Link>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.heroSection}>
          <span style={styles.badge}>CAPSTONE PROJECT</span>
          <h1 style={styles.title}>
            Digitalizing Micro-Loan Tracking in <span style={styles.highlight}>Nigeria</span>
          </h1>
          <p style={styles.subtitle}>
            Replace manual spreadsheets and paper records with a secure, real-time tracking system.
            Designed specifically for micro-finance borrowers and loan officers.
          </p>

          <div style={styles.ctaGroup}>
            <Link to="/login" className="btn btn-primary" style={styles.ctaPrimary}>
              Access Dashboard
            </Link>
            <Link to="/register" className="btn btn-secondary" style={styles.ctaSecondary}>
              Create Borrower Account
            </Link>
          </div>
        </div>

        <div style={styles.featuresSection}>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>📁</div>
            <h3 style={styles.featureTitle}>Digital Loan Files</h3>
            <p style={styles.featureText}>
              Keep loan applications, approval histories, and status logs organized and searchable in one secure vault.
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>🧮</div>
            <h3 style={styles.featureTitle}>Guaranteed Math</h3>
            <p style={styles.featureText}>
              Outstandings, repayments, and completions are calculated directly by the database to prevent manual float errors.
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>🔒</div>
            <h3 style={styles.featureTitle}>Secure Access</h3>
            <p style={styles.featureText}>
              Protects private borrower folders and locks administrative functions (like approvals) to verified staff only.
            </p>
          </div>
        </div>
      </main>

      <footer style={styles.footer}>
        <p>© 2026 Micro-Loan Tracker. All rights reserved.</p>
        {/* <p style={{ marginTop: '4px', fontSize: '0.75rem', color: '#94a3b8' }}>
          Mandatory Project Palette: Primary Navy (#03071E) & Warm Cream (#F5E0B7)
        </p>   */}
      </footer>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#faf9f6', // Warm backdrop
    color: '#03071E',
  },
  header: {
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
    padding: '20px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: '1.25rem',
    fontWeight: '800',
    color: '#03071E',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  logoIcon: {
    backgroundColor: '#03071E',
    color: '#F5E0B7',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  navLink: {
    fontWeight: '600',
    color: '#03071E',
    fontSize: '0.95rem',
  },
  main: {
    flex: 1,
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
    padding: '60px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '80px',
    justifyContent: 'center',
  },
  heroSection: {
    textAlign: 'center',
    maxWidth: '800px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
  },
  badge: {
    fontSize: '0.75rem',
    fontWeight: '700',
    letterSpacing: '0.1em',
    padding: '4px 12px',
    borderRadius: '9999px',
    backgroundColor: 'rgba(3, 7, 30, 0.05)',
    color: '#03071E',
  },
  title: {
    fontSize: '3rem',
    fontWeight: '850',
    lineHeight: 1.15,
    color: '#03071E',
  },
  highlight: {
    color: '#03071E',
    borderBottom: '4px solid #F5E0B7',
  },
  subtitle: {
    fontSize: '1.15rem',
    color: '#475569',
    lineHeight: 1.6,
  },
  ctaGroup: {
    display: 'flex',
    gap: '16px',
    marginTop: '12px',
  },
  ctaPrimary: {
    padding: '12px 28px',
    fontSize: '1rem',
  },
  ctaSecondary: {
    padding: '12px 28px',
    fontSize: '1rem',
  },
  featuresSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '30px',
  },
  featureCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '30px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
    transition: 'transform 0.2s',
  },
  featureIcon: {
    fontSize: '2rem',
    marginBottom: '16px',
  },
  featureTitle: {
    fontSize: '1.2rem',
    fontWeight: '700',
    marginBottom: '8px',
    color: '#03071E',
  },
  featureText: {
    fontSize: '0.925rem',
    color: '#64748b',
    lineHeight: 1.5,
  },
  footer: {
    borderTop: '1px solid #e2e8f0',
    padding: '30px 24px',
    textAlign: 'center',
    fontSize: '0.875rem',
    color: '#64748b',
  },
};

export default Landing;

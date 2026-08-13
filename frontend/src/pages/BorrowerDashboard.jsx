import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formatNaira, formatDate } from '../utils/formatters';
import StatCard from '../components/StatCard';

const BorrowerDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [summaryData, loansData] = await Promise.all([
        api.dashboard.getSummary(),
        api.loans.list({ search, status: statusFilter })
      ]);
      setSummary(summaryData);
      setLoans(loansData);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [statusFilter]); // Reload immediately on status filter change

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDashboardData();
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

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>My Loan Dashboard</h1>
          <p style={styles.subtitle}>Track your loan requests, outstanding balance, and repayment receipts</p>
        </div>
        <Link to="/borrower/apply" className="btn btn-primary" style={styles.applyBtn}>
          + Apply for a Loan
        </Link>
      </div>

      {error && (
        <div style={styles.errorAlert}>
          <div><strong>Error loading dashboard:</strong> {error}</div>
          <button onClick={fetchDashboardData} className="btn btn-outline" style={{ marginTop: '8px', padding: '6px 12px' }}>
            Retry
          </button>
        </div>
      )}

      {/* Stats Cards Section */}
      {loading && !summary ? (
        <div style={styles.statsSkeleton}>
          <div style={styles.skeletonCard}></div>
          <div style={styles.skeletonCard}></div>
          <div style={styles.skeletonCard}></div>
          <div style={styles.skeletonCard}></div>
        </div>
      ) : (
        summary && (
          <div style={styles.statsGrid}>
            <StatCard
              title="Total Borrowed"
              value={formatNaira(summary.totalBorrowed)}
              subtitle="All-time approved principle"
              icon={<span style={{ fontSize: '1.25rem' }}>💰</span>}
            />
            <StatCard
              title="Outstanding Balance"
              value={formatNaira(summary.outstandingBalance)}
              subtitle="Remaining total to pay"
              highlightColor="rgba(239, 68, 68, 0.1)"
              icon={<span style={{ fontSize: '1.25rem', color: '#ef4444' }}>📉</span>}
            />
            <StatCard
              title="Active Loans"
              value={summary.activeLoans}
              subtitle="Loans requiring servicing"
              icon={<span style={{ fontSize: '1.25rem' }}>🔄</span>}
            />
            <StatCard
              title="Completed Loans"
              value={summary.completedLoans}
              subtitle="Fully repaid loan records"
              icon={<span style={{ fontSize: '1.25rem' }}>✅</span>}
            />
          </div>
        )
      )}

      {/* Filter and Search Panel */}
      <div style={styles.filterCard} className="card">
        <form onSubmit={handleSearchSubmit} style={styles.filterForm}>
          <div style={styles.searchGroup}>
            <input
              type="text"
              placeholder="Search by loan purpose..."
              className="input-field"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
            />
            <button type="submit" className="btn btn-outline" style={styles.filterBtn}>
              Search
            </button>
          </div>

          <div style={styles.filterGroup}>
            <label htmlFor="status-select" style={styles.filterLabel}>Status:</label>
            <select
              id="status-select"
              className="input-field"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={styles.statusSelect}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </form>
      </div>

      {/* Data Table */}
      {loading ? (
        <div style={styles.tableSkeleton}>
          <div style={styles.skeletonRow}></div>
          <div style={styles.skeletonRow}></div>
          <div style={styles.skeletonRow}></div>
        </div>
      ) : loans.length === 0 ? (
        <div className="card" style={styles.emptyCard}>
          <div style={styles.emptyIcon}>📂</div>
          <h3 style={styles.emptyTitle}>No Loan Files Found</h3>
          <p style={styles.emptyText}>
            You haven't submitted any loan requests matching the selected filters.
          </p>
          <Link to="/borrower/apply" className="btn btn-primary" style={{ marginTop: '16px' }}>
            Submit Your First Request
          </Link>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Purpose</th>
                <th>Requested Amount</th>
                <th>Approved Amount</th>
                <th>Term</th>
                <th>Status</th>
                <th>Date Requested</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan.id}>
                  <td style={{ fontWeight: '600' }}>{loan.purpose}</td>
                  <td>{formatNaira(loan.requested_amount)}</td>
                  <td>{loan.approved_amount ? formatNaira(loan.approved_amount) : '-'}</td>
                  <td>{loan.duration_months} mo</td>
                  <td>
                    <span className={getStatusBadgeClass(loan.status)}>
                      {loan.status}
                    </span>
                  </td>
                  <td>{formatDate(loan.created_at)}</td>
                  <td>
                    <Link to={`/loans/${loan.id}`} style={styles.viewLink}>
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '800',
    color: '#03071E',
  },
  subtitle: {
    color: '#64748b',
    fontSize: '0.925rem',
    marginTop: '4px',
  },
  applyBtn: {
    padding: '10px 20px',
  },
  errorAlert: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fee2e2',
    color: '#991b1b',
    padding: '16px',
    borderRadius: '12px',
    fontSize: '0.925rem',
    marginBottom: '24px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
    marginBottom: '32px',
  },
  filterCard: {
    padding: '16px 24px',
    marginBottom: '24px',
  },
  filterForm: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  searchGroup: {
    display: 'flex',
    gap: '8px',
    flex: 1,
    maxWidth: '500px',
    width: '100%',
  },
  searchInput: {
    padding: '10px 14px',
  },
  filterBtn: {
    padding: '10px 16px',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  filterLabel: {
    fontWeight: '600',
    fontSize: '0.875rem',
    color: '#64748b',
  },
  statusSelect: {
    width: '160px',
    padding: '10px 14px',
  },
  viewLink: {
    color: '#03071E',
    fontWeight: '600',
    borderBottom: '2px solid #F5E0B7',
    fontSize: '0.875rem',
  },
  emptyCard: {
    textAlign: 'center',
    padding: '60px 20px',
    borderStyle: 'dashed',
    borderWidth: '2px',
  },
  emptyIcon: {
    fontSize: '3rem',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#03071E',
    marginBottom: '4px',
  },
  emptyText: {
    color: '#64748b',
    fontSize: '0.925rem',
  },
  // Skeleton Loaders styles
  statsSkeleton: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
    marginBottom: '32px',
  },
  skeletonCard: {
    height: '110px',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    position: 'relative',
    animation: 'pulse 1.5s infinite ease-in-out',
  },
  tableSkeleton: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  skeletonRow: {
    height: '48px',
    backgroundColor: '#f1f5f9',
    borderRadius: '6px',
    animation: 'pulse 1.5s infinite ease-in-out',
  }
};

export default BorrowerDashboard;

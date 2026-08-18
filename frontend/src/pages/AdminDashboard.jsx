import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formatNaira, formatDate } from '../utils/formatters';
import StatCard from '../components/StatCard';

const AdminDashboard = () => {
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
      setError(err.message || 'Failed to load portfolio metrics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [statusFilter]); // Trigger load on status changes

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
          <h1 style={styles.title}>Loan Portfolio Administration</h1>
          <p style={styles.subtitle}>Monitor risk metrics, process approvals, and record repayments</p>
        </div>
      </div>

      {error && (
        <div style={styles.errorAlert}>
          <div><strong>Error loading dashboard:</strong> {error}</div>
          <button onClick={fetchDashboardData} className="btn btn-outline" style={{ marginTop: '8px', padding: '6px 12px' }}>
            Retry
          </button>
        </div>
      )}

      {/* Metrics Cards */}
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
              title="Total Disbursed"
              value={formatNaira(summary.totalDisbursed)}
              subtitle={`Out of ${summary.totalRequests} total requests`}
              icon={<span style={{ fontSize: '1.25rem' }}>💸</span>}
            />
            <StatCard
              title="Total Repaid"
              value={formatNaira(summary.totalRepaid)}
              subtitle="All principal recovered"
              icon={<span style={{ fontSize: '1.25rem', color: '#10b981' }}>📈</span>}
            />
            <StatCard
              title="Outstanding Portfolio"
              value={formatNaira(summary.outstandingAmount)}
              subtitle="Capital active in the field"
              highlightColor="rgba(3, 7, 30, 0.08)"
              icon={<span style={{ fontSize: '1.25rem' }}>💼</span>}
            />
            <StatCard
              title="Pending Reviews"
              value={summary.pendingRequests}
              subtitle="Requires approval/rejection"
              highlightColor="rgba(245, 158, 11, 0.1)"
              icon={<span style={{ fontSize: '1.25rem', color: '#f59e0b' }}>⏳</span>}
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
              placeholder="Search by borrower name, email, or purpose..."
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
            <label htmlFor="status-select" style={styles.filterLabel}>Status Filter:</label>
            <select
              id="status-select"
              className="input-field"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={styles.statusSelect}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="APPROVED">Approved</option>
              <option value="ACTIVE">Active (Disbursed)</option>
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
          <div style={styles.emptyIcon}>🔍</div>
          <h3 style={styles.emptyTitle}>No Loan Files Found</h3>
          <p style={styles.emptyText}>
            No entries match your search criteria. Try modifying your search term or status filters.
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Borrower</th>
                <th>Purpose</th>
                <th>Requested</th>
                <th>Approved</th>
                <th>Term</th>
                <th>Status</th>
                <th>Date Submitted</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan.id}>
                  <td>
                    <div style={styles.borrowerName}>{loan.borrower_name}</div>
                    <div style={styles.borrowerEmail}>{loan.borrower_email}</div>
                  </td>
                  <td style={{ fontWeight: '500' }}>{loan.purpose}</td>
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
                      Review File
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
    marginBottom: '32px',
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
    maxWidth: '560px',
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
    width: '180px',
    padding: '10px 14px',
  },
  borrowerName: {
    fontWeight: '600',
    color: '#03071E',
    fontSize: '0.9rem',
  },
  borrowerEmail: {
    fontSize: '0.75rem',
    color: '#64748b',
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

export default AdminDashboard;

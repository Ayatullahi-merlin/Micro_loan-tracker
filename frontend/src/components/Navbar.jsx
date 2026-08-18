import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login');
  };

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={styles.nav}>
      <div style={styles.navContainer}>
        <div style={styles.brandContainer}>
          <Link to="/" style={styles.brand}>
            <span style={styles.brandIcon}>₦</span> Micro-Loan Tracker
          </Link>
          <span style={styles.roleBadge}>
            {user.role === 'admin' ? 'Staff / Admin' : 'Borrower'}
          </span>
        </div>

        <div style={styles.linksContainer}>
          {user.role === 'admin' ? (
            <>
              <Link 
                to="/admin" 
                style={isActive('/admin') ? styles.activeLink : styles.link}
              >
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link 
                to="/borrower" 
                style={isActive('/borrower') ? styles.activeLink : styles.link}
              >
                My Dashboard
              </Link>
              <Link 
                to="/borrower/apply" 
                style={isActive('/borrower/apply') ? styles.activeLink : styles.link}
              >
                Apply for Loan
              </Link>
            </>
          )}
        </div>

        <div style={styles.profileContainer}>
          <div style={styles.userInfo}>
            <span style={styles.userName}>{user.name}</span>
            <span style={styles.userEmail}>{user.email}</span>
          </div>
          <button onClick={handleLogoutClick} className="btn btn-outline" style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    backgroundColor: '#03071E', // Mandatory Dark Navy
    color: '#ffffff',
    padding: '0 24px',
    height: '70px',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 4px 6px rgba(3, 7, 30, 0.08)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  navContainer: {
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  brand: {
    fontSize: '1.25rem',
    fontWeight: '800',
    color: '#F5E0B7', // Mandatory Warm Cream
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  brandIcon: {
    backgroundColor: '#F5E0B7',
    color: '#03071E',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '1rem',
  },
  roleBadge: {
    fontSize: '0.7rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    padding: '3px 8px',
    borderRadius: '4px',
    backgroundColor: 'rgba(245, 224, 183, 0.15)',
    color: '#F5E0B7',
    border: '1px solid rgba(245, 224, 183, 0.3)',
  },
  linksContainer: {
    display: 'flex',
    gap: '24px',
  },
  link: {
    color: '#94a3b8',
    fontWeight: '500',
    fontSize: '0.925rem',
    padding: '8px 12px',
    borderRadius: '4px',
    transition: 'all 0.2s',
  },
  activeLink: {
    color: '#F5E0B7',
    backgroundColor: 'rgba(245, 224, 183, 0.08)',
    fontWeight: '600',
    fontSize: '0.925rem',
    padding: '8px 12px',
    borderRadius: '4px',
  },
  profileContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  userName: {
    fontWeight: '600',
    fontSize: '0.875rem',
    color: '#ffffff',
  },
  userEmail: {
    fontSize: '0.75rem',
    color: '#94a3b8',
  },
  logoutBtn: {
    padding: '6px 14px',
    fontSize: '0.8rem',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    color: '#ffffff',
  }
};

export default Navbar;

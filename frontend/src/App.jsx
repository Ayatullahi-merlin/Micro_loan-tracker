import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import api from './services/api';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import BorrowerDashboard from './pages/BorrowerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import LoanDetail from './pages/LoanDetail';
import ApplyLoan from './pages/ApplyLoan';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await api.auth.getMe();
          setUser(userData);
        } catch (err) {
          console.warn('Session verification failed, logging out:', err.message);
          handleLogout();
        }
      }
      setLoading(false);
    };

    verifySession();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.spinner}></div>
        <span style={styles.loadingText}>Initializing Micro-Loan Tracker...</span>
      </div>
    );
  }

  // Helper route guards
  const isAuthenticated = !!user;
  const isBorrower = user?.role === 'borrower';
  const isAdmin = user?.role === 'admin';

  return (
    <div style={styles.appWrapper}>
      {/* Conditionally show Navbar only on pages when authenticated */}
      {isAuthenticated && <Navbar user={user} onLogout={handleLogout} />}

      <main style={styles.mainContent}>
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/" 
            element={isAuthenticated ? (isAdmin ? <Navigate to="/admin" /> : <Navigate to="/borrower" />) : <Landing />} 
          />
          <Route 
            path="/login" 
            element={isAuthenticated ? (isAdmin ? <Navigate to="/admin" /> : <Navigate to="/borrower" />) : <Login onLoginSuccess={setUser} />} 
          />
          <Route 
            path="/register" 
            element={isAuthenticated ? (isAdmin ? <Navigate to="/admin" /> : <Navigate to="/borrower" />) : <Register onLoginSuccess={setUser} />} 
          />

          {/* Borrower Routes */}
          <Route 
            path="/borrower" 
            element={isAuthenticated ? (isBorrower ? <BorrowerDashboard /> : <Navigate to="/admin" />) : <Navigate to="/login" />} 
          />
          <Route 
            path="/borrower/apply" 
            element={isAuthenticated ? (isBorrower ? <ApplyLoan /> : <Navigate to="/admin" />) : <Navigate to="/login" />} 
          />

          {/* Admin Routes */}
          <Route 
            path="/admin" 
            element={isAuthenticated ? (isAdmin ? <AdminDashboard /> : <Navigate to="/borrower" />) : <Navigate to="/login" />} 
          />

          {/* Universal Shared Details Router */}
          <Route 
            path="/loans/:id" 
            element={isAuthenticated ? <LoanDetail user={user} /> : <Navigate to="/login" />} 
          />

          {/* Fallback Catch-all Route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
};

const styles = {
  appWrapper: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  loadingScreen: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#03071E', // Dark Navy
    color: '#F5E0B7', // Warm Cream
    gap: '20px',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '5px solid rgba(245, 224, 183, 0.2)',
    borderTop: '5px solid #F5E0B7',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: '1rem',
    fontWeight: '600',
    letterSpacing: '0.05em',
  }
};

export default App;

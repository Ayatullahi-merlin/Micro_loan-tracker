import React from 'react';

const StatCard = ({ title, value, subtitle, icon, highlightColor }) => {
  return (
    <div style={styles.card}>
      <div style={styles.content}>
        <div style={styles.textContainer}>
          <span style={styles.title}>{title}</span>
          <span style={styles.value}>{value}</span>
          {subtitle && <span style={styles.subtitle}>{subtitle}</span>}
        </div>
        {icon && (
          <div style={{ ...styles.iconContainer, backgroundColor: highlightColor || 'rgba(3, 7, 30, 0.05)' }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(3, 7, 30, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  content: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  title: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  value: {
    fontSize: '1.75rem',
    fontWeight: '800',
    color: '#03071E', // Dark Navy
  },
  subtitle: {
    fontSize: '0.75rem',
    color: '#94a3b8',
  },
  iconContainer: {
    width: '48px',
    height: '48px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#03071E',
  }
};

export default StatCard;

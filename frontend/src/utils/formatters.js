/**
 * Formats a number to Nigerian Naira (NGN) currency format.
 * @param {number|string} amount 
 * @returns {string} e.g. ₦150,000.00
 */
export const formatNaira = (amount) => {
  const num = parseFloat(amount);
  if (isNaN(num)) return '₦0.00';
  
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num).replace('NGN', '₦').trim();
};

/**
 * Formats an ISO date string to a human-readable format.
 * @param {string} dateString 
 * @returns {string} e.g. Aug 11, 2026
 */
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';

  return date.toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Calculates remaining days until a due date.
 * @param {string} dueDateString 
 * @returns {number|string} days remaining or "Overdue"
 */
export const getRemainingDays = (dueDateString) => {
  if (!dueDateString) return '-';
  const due = new Date(dueDateString);
  const now = new Date();
  
  // Set times to midnight to calculate pure days
  due.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const diffTime = due - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''}`;
  } else if (diffDays === 0) {
    return 'Due today';
  }
  
  return `${diffDays} day${diffDays > 1 ? 's' : ''} left`;
};

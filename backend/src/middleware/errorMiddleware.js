const errorHandler = (err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Log the error for internal debugging
  console.error('API Error:', err);

  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      // Only expose stack trace in development
      stack: isProduction ? undefined : err.stack
    }
  });
};

module.exports = {
  errorHandler
};

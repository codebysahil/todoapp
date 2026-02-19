const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  // SQL errors
  if (err.code === 'EREQUEST') {
    return res.status(400).json({
      success: false,
      message: 'Database request error',
      error: err.message
    });
  }

  // Not found errors
  if (err.status === 404) {
    return res.status(404).json({
      success: false,
      message: err.message || 'Resource not found'
    });
  }

  // Default server error
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    // in production we hide the actual error message for security
  });
};

module.exports = errorHandler;
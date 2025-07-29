const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  let error = { ...err };
  error.message = err.message;

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map(error => error.message);
    error = {
      message: 'Validation Error',
      errors: messages
    };
    return res.status(400).json({
      success: false,
      error
    });
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const messages = err.errors.map(error => error.message);
    error = {
      message: 'Duplicate Field Error',
      errors: messages
    };
    return res.status(400).json({
      success: false,
      error
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Server Error'
  });
};

module.exports = errorHandler;
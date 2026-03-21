function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'An unexpected error occurred',
  });
}

module.exports = errorHandler;
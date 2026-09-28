// Global error handling
module.exports = (err, req, res, next) => {
  console.error('💥 Internal Error Stack:', err.stack || err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Prisma unique constraint violation (e.g., duplicate unique field)
  if (err.code === 'P2002') {
    statusCode = 400;
    const targetFields = err.meta?.target ? err.meta.target.join(', ') : 'field';
    message = `A record with this ${targetFields} already exists.`;
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Requested database record was not found.';
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
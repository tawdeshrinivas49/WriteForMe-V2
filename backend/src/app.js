const express = require('express');
const cors = require('cors');
const path = require('path');

// Import Database Singleton
const prisma = require('./config/database');

// Import Middlewares
const errorHandler = require('./middlewares/errorHandler');

// Import Feature Module Routes
const authRoutes = require('./modules/auth/auth.routes');
const ocrRoutes = require('./modules/ocr/ocr.routes');
const requestsRoutes = require('./modules/requests/request.routes');
const matchingRoutes = require('./modules/matching/matching.routes');
const paymentRoutes = require('./modules/payments/payment.routes');
const gamificationRoutes = require('./modules/gamification/gamification.routes');
const reviewRoutes = require('./modules/reviews/review.routes');
const userRoutes = require('./modules/users/user.routes');
const organizationRoutes = require('./modules/organizations/organization.routes');

const app = express();

// Core Middlewares
app.use(cors());
app.use(express.json());

// Serve uploaded profile images as static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'WriteForMe API is running',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
  });
});

// Mount API Modules
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/ocr', ocrRoutes);
app.use('/api/v1/requests', requestsRoutes);
app.use('/api/v1/matching', matchingRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/gamification', gamificationRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/organizations', organizationRoutes);

// Unmatched Route (404) Fallback
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.originalUrl} - Route not found.`,
  });
});

// Centralized Error Handling Middleware (MUST be registered last)
app.use(errorHandler);

// Graceful Database Disconnect on Server Termination
const handleShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Closing Prisma Database connections...`);
  await prisma.$disconnect();
  console.log('Database connections closed. Exiting process.');
  process.exit(0);
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

module.exports = app;
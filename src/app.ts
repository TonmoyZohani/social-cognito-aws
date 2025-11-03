import express from 'express';
import { initializeCognitoClient } from './config/cognitoClient';
import { sessionMiddleware } from './middleware/session';
import authRoutes from './routes/auth';
import pageRoutes from './routes/pages';
import apiRoutes from './routes/api';

// Load environment variables
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Cognito client
initializeCognitoClient().catch(console.error);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);

// Set view engine
app.set('view engine', 'ejs');

// Routes
app.use('/', pageRoutes);
app.use('/login', authRoutes);
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🏠 Home: http://localhost:${PORT}`);
  console.log(`🔐 Login: http://localhost:${PORT}/login`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`❤️ Health: http://localhost:${PORT}/health`);
});

export default app;
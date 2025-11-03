import express from 'express';
import { initializeCognitoClient } from './config/cognitoClient';
import { sessionMiddleware } from './middleware/session';
import authRoutes from './routes/auth';
import pageRoutes from './routes/pages';
import apiRoutes from './routes/api';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

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

// Routes - CORRECT MOUNTING
app.use('/', pageRoutes);        // Handles: /, /login, /dashboard, /logout
app.use('/auth', authRoutes);    // Handles: /auth/google, /auth/login/google, /auth/callback
app.use('/api', apiRoutes);      // Handles: /api/*

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Home: http://localhost:${PORT}`);
  console.log(`Login Page: http://localhost:${PORT}/login`);
  console.log(`Google Login: http://localhost:${PORT}/auth/login/google`);
  console.log(`Logout: http://localhost:${PORT}/logout`);
  console.log(`Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`Health: http://localhost:${PORT}/health`);
});

export default app;
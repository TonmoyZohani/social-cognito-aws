import session from 'express-session';

export const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'cognito-social-demo-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
});
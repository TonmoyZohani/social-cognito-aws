import { Router } from 'express';
import { AuthRequest } from '../types/express';
import { checkAuth, requireAuth } from '../middleware/auth';

const router = Router();

// Home page
router.get('/', checkAuth, (req, res) => {
  const authReq = req as AuthRequest;
  res.render('home', {
    isAuthenticated: authReq.isAuthenticated,
    userInfo: authReq.session.userInfo,
  });
});

// Login page
router.get('/login', (req, res) => {
  res.render('login', { error: req.query.error });
});

// Dashboard (protected)
router.get('/dashboard', requireAuth, checkAuth, (req, res) => {
  const authReq = req as AuthRequest;
  res.render('dashboard', {
    userInfo: authReq.session.userInfo,
  });
});

export default router;
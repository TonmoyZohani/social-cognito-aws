import { Router } from 'express';
import { AuthRequest } from '../types/express';
import { checkAuth, requireAuth } from '../middleware/auth';
import { generators } from 'openid-client';
import { getClient } from '../config/cognitoClient';

const router = Router();

router.get('/', checkAuth, (req, res) => {
  const authReq = req as AuthRequest;
  res.render('home', {
    isAuthenticated: authReq.isAuthenticated,
    userInfo: authReq.session.userInfo,
  });
});

router.get('/login', (req, res) => {
  res.render('login', { error: req.query.error });
});

router.get('/login/google', (req, res) => {
  const authReq = req as AuthRequest;
  const nonce = generators.nonce();
  const state = generators.state();

  authReq.session.nonce = nonce;
  authReq.session.state = state;

  const client = getClient();
  const authUrl = client.authorizationUrl({
    state: state,
    nonce: nonce,
    identity_provider: 'Google',
  });

  console.log('🔗 Google Login URL:', authUrl);
  res.redirect(authUrl);
});

router.get('/dashboard', requireAuth, checkAuth, (req, res) => {
  const authReq = req as AuthRequest;
  res.render('dashboard', {
    userInfo: authReq.session.userInfo,
  });
});

router.get('/logout', (req, res) => {
  const authReq = req as AuthRequest;
  
  authReq.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).send('Logout failed');
    }
    
    const logoutUrl = `https://${process.env.COGNITO_DOMAIN}/logout?client_id=${process.env.COGNITO_CLIENT_ID}&logout_uri=http://localhost:3000`;
    res.redirect(logoutUrl);
  });
});

export default router;
import { Router } from 'express';
import { generators } from 'openid-client';
import { getClient } from '../config/cognitoClient';
import { AuthRequest } from '../types/express';
import { checkAuth } from '../middleware/auth';

const router = Router();

router.get('/user', checkAuth, (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.isAuthenticated) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  res.json({ user: authReq.session.userInfo });
});


router.get('/auth/urls', (req, res) => {
  const authReq = req as AuthRequest;
  const nonce = generators.nonce();
  const state = generators.state();

  authReq.session.nonce = nonce;
  authReq.session.state = state;

  const client = getClient();
  const googleUrl = client.authorizationUrl({
    state: state,
    nonce: nonce,
    identity_provider: 'Google',
  });

  res.json({ google: googleUrl });
});


router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    endpoints: {
      home: 'GET /',
      login: 'GET /login',
      dashboard: 'GET /dashboard',
      api_user: 'GET /api/user',
      api_urls: 'GET /api/auth/urls',
      health: 'GET /health',
    },
  });
});

export default router;
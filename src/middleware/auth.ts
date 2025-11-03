import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types/express';

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authReq = req as AuthRequest;
  if (!authReq.session.userInfo) {
    res.redirect('/login');
    return;
  }
  next();
};

export const checkAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authReq = req as AuthRequest;
  authReq.isAuthenticated = !!authReq.session.userInfo;
  next();
};
import 'express';
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userInfo?: any;
    nonce?: string;
    state?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      isAuthenticated?: boolean;
    }
  }
}

export interface AuthRequest extends Express.Request {
  isAuthenticated: boolean;
  session: Express.Session & {
    userInfo?: any;
    nonce?: string;
    state?: string;
  };
}
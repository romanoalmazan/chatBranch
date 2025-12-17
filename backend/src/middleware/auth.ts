import { Request, Response, NextFunction } from 'express';
import { getAuth } from '../services/firebase-admin';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email?: string;
      };
    }
  }
}

/**
 * Authentication middleware to verify Firebase ID tokens
 * Extracts Bearer token from Authorization header and verifies it with Firebase Admin
 */
export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      res.status(401).json({ error: 'Unauthorized: Missing token' });
      return;
    }

    // Verify token with Firebase Admin
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);

    // Attach user info to request
    req.user = {
      userId: decodedToken.uid,
      email: decodedToken.email,
    };

    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    
    if (error instanceof Error && error.message.includes('token')) {
      res.status(401).json({ error: 'Unauthorized: Invalid token' });
      return;
    }

    res.status(500).json({ error: 'Internal server error during authentication' });
  }
}

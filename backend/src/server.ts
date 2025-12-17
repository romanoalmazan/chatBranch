import express, { Express } from 'express';
import cors from 'cors';
import { healthCheck } from './routes/health';
import { chatHandler } from './routes/chat';
import { createBranchHandler, getBranchesHandler, getBranchMessagesHandler } from './routes/branches';
import { getConversationsHandler, createConversationHandler } from './routes/conversations';
import { authenticateToken } from './middleware/auth';
import { initializeFirebaseAdmin } from './services/firebase-admin';

/**
 * Create and configure Express application
 */
export function createApp(): Express {
  // Initialize Firebase Admin (must be done before routes)
  initializeFirebaseAdmin();

  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Public routes (no authentication required)
  app.get('/health', healthCheck);

  // Protected routes (authentication required)
  app.get('/api/conversations', authenticateToken, getConversationsHandler);
  app.post('/api/conversations', authenticateToken, createConversationHandler);
  app.post('/api/chat', authenticateToken, chatHandler);
  app.post('/api/branches', authenticateToken, createBranchHandler);
  app.get('/api/conversations/:conversationId/branches', authenticateToken, getBranchesHandler);
  app.get('/api/conversations/:conversationId/branches/:branchId/messages', authenticateToken, getBranchMessagesHandler);

  return app;
}



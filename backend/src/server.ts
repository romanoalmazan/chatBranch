import express, { Express } from 'express';
import cors from 'cors';
import { healthCheck } from './routes/health';
import { chatHandler } from './routes/chat';

/**
 * Create and configure Express application
 */
export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Routes
  app.get('/health', healthCheck);
  app.post('/api/chat', chatHandler);

  return app;
}



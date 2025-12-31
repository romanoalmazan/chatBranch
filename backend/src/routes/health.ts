import { Request, Response } from 'express';

/**
 * Health check endpoint
 * GET /health
 */
export function healthCheck(_req: Request, res: Response): void {
  res.json({ status: 'ok' });
}







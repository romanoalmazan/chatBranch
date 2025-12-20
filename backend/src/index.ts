import { createApp } from './server';
import { config } from './config';

/**
 * Entry point for the backend server
 */
function main() {
  const app = createApp();

  // Cloud Run sets PORT env var, fallback to config
  // Parse PORT as integer since process.env.PORT is a string
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : config.server.port;

  // Listen on 0.0.0.0 to accept connections from Cloud Run
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
    console.log(`Health check: http://0.0.0.0:${port}/health`);
  });
}

main();




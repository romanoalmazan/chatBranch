import { createApp } from './server';
import { config } from './config';

/**
 * Entry point for the backend server
 */
function main() {
  const app = createApp();

  const port = config.server.port;

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`Health check: http://localhost:${port}/health`);
  });
}

main();




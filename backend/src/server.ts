import app from './app';

import { startTokenCleanupJob } from './jobs/tokenCleanup.job';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Backend ÑÑŠÑ€Ð²ÑŠÑ€ ÑÑ‚Ð°Ñ€Ñ‚Ð¸Ñ€Ð° Ð½Ð° http://localhost:${PORT}`);
  console.log(`API Health check: http://localhost:${PORT}/api/health`);



  startTokenCleanupJob();
});

server.on('error', (error: any) => {
  console.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ ÑÑ‚Ð°Ñ€Ñ‚Ð¸Ñ€Ð°Ð½Ðµ Ð½Ð° ÑÑŠÑ€Ð²ÑŠÑ€Ð°:', error);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});


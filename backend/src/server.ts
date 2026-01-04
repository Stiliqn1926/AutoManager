import app from './app';
// Импортираме cleanup job функцията
import { startTokenCleanupJob } from './jobs/tokenCleanup.job';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Backend сървър стартира на http://localhost:${PORT}`);
  console.log(`API Health check: http://localhost:${PORT}/api/health`);

  // 🆕 Стартираме автоматичния token cleanup job
  // Ще се изпълнява всеки ден в 03:00 AM
  startTokenCleanupJob();
});

server.on('error', (error: any) => {
  console.error('Грешка при стартиране на сървъра:', error);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

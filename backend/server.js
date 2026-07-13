require('dotenv').config();

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

const app = require('./app');
const connectDB = require('./config/db');
const startOverdueJob = require('./workers/overdueJob');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  
  // Start background workers
  startOverdueJob();

  const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });

  process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! Shutting down...');
    console.error(err.name, err.message);
    server.close(() => process.exit(1));
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => console.log('Process terminated.'));
  });
};

startServer();

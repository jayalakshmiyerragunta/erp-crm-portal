import './config/env'; // Validate env vars on startup
import { app } from './app';
import { config } from './config/env';
import prisma from './config/db';

async function bootstrap() {
  try {
    // Test DB connection
    await prisma.$connect();
    console.log('✅ Database connected');

    app.listen(config.port, () => {
      console.log(`🚀 Server running on http://localhost:${config.port}`);
      console.log(`📋 Environment: ${config.nodeEnv}`);
      console.log(`🔗 API Base: http://localhost:${config.port}/api/v1`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();

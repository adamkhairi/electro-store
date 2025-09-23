import { PrismaClient } from '@prisma/client';
import config from '../config';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: config.database.url,
    },
  },
  log: config.nodeEnv === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Handle graceful shutdown
process.on('beforeExit', async () => {
  console.log('🔌 Disconnecting from database...');
  await prisma.$disconnect();
});

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Graceful shutdown
export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
};

export default prisma;

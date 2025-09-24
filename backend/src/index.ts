import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { authenticateJWT } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { rateLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/auth';
import categoryRoutes from './routes/categories';
import customerRoutes from './routes/customers';
import inventoryRoutes from './routes/inventory';
import locationRoutes from './routes/locations';
import orderRoutes from './routes/orders';
import productRoutes from './routes/products';
import reportRoutes from './routes/reports';
import salesRoutes from './routes/sales';
import supplierRoutes from './routes/suppliers';
import userRoutes from './routes/users';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Request parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// Rate limiting
app.use('/api', rateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateJWT, userRoutes);
app.use('/api/products', authenticateJWT, productRoutes);
app.use('/api/categories', authenticateJWT, categoryRoutes);
app.use('/api/inventory', authenticateJWT, inventoryRoutes);
app.use('/api/locations', authenticateJWT, locationRoutes);
app.use('/api/orders', authenticateJWT, orderRoutes);
app.use('/api/customers', authenticateJWT, customerRoutes);
app.use('/api/suppliers', authenticateJWT, supplierRoutes);
app.use('/api/reports', authenticateJWT, reportRoutes);
app.use('/api/sales', authenticateJWT, salesRoutes);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 ElectroStock Pro Backend Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;

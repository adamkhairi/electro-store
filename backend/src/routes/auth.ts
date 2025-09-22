import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateJWT } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// POST /api/auth/register
router.post('/register', authRateLimiter, AuthController.register);

// POST /api/auth/login
router.post('/login', AuthController.login);

// POST /api/auth/refresh
router.post('/refresh', AuthController.refreshToken);

// POST /api/auth/logout
router.post('/logout', AuthController.logout);

// POST /api/auth/forgot-password
router.post('/forgot-password', authRateLimiter, AuthController.forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', AuthController.resetPassword);

// POST /api/auth/change-password (requires authentication)
router.post('/change-password', authenticateJWT, AuthController.changePassword);

// GET /api/auth/profile (requires authentication)
router.get('/profile', authenticateJWT, AuthController.getProfile);

export default router;

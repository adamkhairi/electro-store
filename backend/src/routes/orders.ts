import { Router } from 'express';

const router = Router();

// TODO: Implement order routes
router.get('/', (req, res) => {
  res
    .status(501)
    .json({ success: false, error: { message: 'Orders endpoint not implemented yet' } });
});

export default router;

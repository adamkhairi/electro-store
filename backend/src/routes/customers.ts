import { Router } from 'express';

const router = Router();

// TODO: Implement customer routes
router.get('/', (req, res) => {
  res
    .status(501)
    .json({ success: false, error: { message: 'Customers endpoint not implemented yet' } });
});

export default router;

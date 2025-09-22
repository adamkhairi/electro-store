import { Router } from 'express';

const router = Router();

// TODO: Implement inventory routes
router.get('/', (req, res) => {
  res
    .status(501)
    .json({ success: false, error: { message: 'Inventory endpoint not implemented yet' } });
});

export default router;

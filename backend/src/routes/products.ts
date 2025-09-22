import { Router } from 'express';

const router = Router();

// TODO: Implement product routes
router.get('/', (req, res) => {
  res
    .status(501)
    .json({ success: false, error: { message: 'Products endpoint not implemented yet' } });
});

export default router;

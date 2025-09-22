import { Router } from 'express';

const router = Router();

// TODO: Implement user routes
router.get('/', (req, res) => {
  res
    .status(501)
    .json({ success: false, error: { message: 'Users endpoint not implemented yet' } });
});

export default router;

import { Router } from 'express';

const router = Router();

// TODO: Implement report routes
router.get('/', (req, res) => {
  res
    .status(501)
    .json({ success: false, error: { message: 'Reports endpoint not implemented yet' } });
});

export default router;

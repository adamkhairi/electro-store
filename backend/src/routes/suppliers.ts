import { Router } from 'express';

const router = Router();

// TODO: Implement supplier routes
router.get('/', (req, res) => {
  res
    .status(501)
    .json({ success: false, error: { message: 'Suppliers endpoint not implemented yet' } });
});

export default router;

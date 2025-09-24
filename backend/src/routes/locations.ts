import { Router } from 'express';
import { LocationController } from '../controllers/locationController';

const router = Router();

// Location CRUD operations
router.get('/', LocationController.getLocations);
router.get('/stats', LocationController.getLocationStats);
router.get('/:id', LocationController.getLocation);
router.post('/', LocationController.createLocation);
router.put('/:id', LocationController.updateLocation);
router.delete('/:id', LocationController.deleteLocation);

// Utility operations
router.patch('/:id/set-default', LocationController.setDefaultLocation);

export default router;

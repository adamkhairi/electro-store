import { Router } from 'express';
import { InventoryController } from '../controllers/inventoryController';

const router = Router();

// Inventory operations
router.get('/', InventoryController.getInventory);
router.get('/alerts', InventoryController.getInventoryAlerts);
router.get('/stats', InventoryController.getInventoryStats);
router.get('/movements', InventoryController.getStockMovements);

// Stock operations
router.post('/adjust', InventoryController.adjustStock);
router.post('/transfer', InventoryController.transferStock);

export default router;

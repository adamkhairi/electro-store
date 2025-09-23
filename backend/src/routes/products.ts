import { Router } from 'express';
import { ProductController } from '../controllers/productController';

const router = Router();

// Product CRUD operations
router.get('/', ProductController.getProducts);
router.get('/stats', ProductController.getProductStats);
router.get('/:id', ProductController.getProduct);
router.post('/', ProductController.createProduct);
router.put('/:id', ProductController.updateProduct);
router.delete('/:id', ProductController.deleteProduct);

// Utility operations
router.post('/generate-sku', ProductController.generateSku);
router.post('/validate-barcode', ProductController.validateBarcode);

// Bulk operations
router.patch('/bulk', ProductController.bulkUpdateProducts);

export default router;

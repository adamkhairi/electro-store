import { Router } from 'express';
import { CategoryController } from '../controllers/categoryController';

const router = Router();

// Category CRUD operations
router.get('/', CategoryController.getCategories);
router.get('/tree', CategoryController.getCategoryTree);
router.get('/:id', CategoryController.getCategory);
router.post('/', CategoryController.createCategory);
router.put('/:id', CategoryController.updateCategory);
router.delete('/:id', CategoryController.deleteCategory);

// Utility operations
router.post('/reorder', CategoryController.reorderCategories);

export default router;

import { Router } from 'express';
import { SalesController } from '../controllers/salesController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

/**
 * @route POST /api/sales
 * @desc Create a new sale transaction
 * @access Private
 * @body {
 *   locationId: string,
 *   customerId?: string,
 *   customerEmail?: string,
 *   customerPhone?: string,
 *   customerName?: string,
 *   items: Array<{
 *     productId: string,
 *     variantId?: string,
 *     quantity: number,
 *     unitPrice: number,
 *     discountAmount?: number,
 *     discountType?: string,
 *     discountReason?: string,
 *     serialNumbers?: string[],
 *     batchNumber?: string
 *   }>,
 *   payments: Array<{
 *     method: string,
 *     amount: number,
 *     processorTransactionId?: string,
 *     authorizationCode?: string,
 *     cardLast4?: string,
 *     cardType?: string,
 *     cardBrand?: string,
 *     checkNumber?: string,
 *     giftCardNumber?: string,
 *     changeGiven?: number,
 *     reference?: string,
 *     notes?: string
 *   }>,
 *   discountAmount?: number,
 *   taxAmount?: number,
 *   terminalId?: string,
 *   notes?: string
 * }
 */
router.post('/', SalesController.createSale);

/**
 * @route GET /api/sales
 * @desc Get sales with pagination and filtering
 * @access Private
 * @query {
 *   locationId?: string,
 *   page?: number,
 *   limit?: number
 * }
 */
router.get('/', SalesController.getSales);

/**
 * @route GET /api/sales/dashboard/summary
 * @desc Get daily sales summary for POS dashboard
 * @access Private
 * @query {
 *   locationId?: string
 * }
 */
router.get('/dashboard/summary', SalesController.getDashboardSummary);

/**
 * @route GET /api/sales/:id
 * @desc Get sale by ID with full details
 * @access Private
 */
router.get('/:id', SalesController.getSale);

/**
 * @route GET /api/sales/:id/receipt
 * @desc Generate receipt for a sale
 * @access Private
 */
router.get('/:id/receipt', SalesController.getReceipt);

/**
 * @route POST /api/sales/:id/void
 * @desc Void a sale (manager/admin only)
 * @access Private (Manager/Admin)
 * @body {
 *   reason: string
 * }
 */
router.post('/:id/void', SalesController.voidSale);

export default router;

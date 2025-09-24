import { Request, Response } from 'express';
import { CreateSaleInput, SaleService } from '../services/saleService';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    email: string;
    role: string;
  };
}

export class SalesController {
  /**
   * Create a new sale
   * POST /api/sales
   */
  static async createSale(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;
      if (!user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Authentication required' },
        });
      }

      const {
        locationId,
        customerId,
        customerEmail,
        customerPhone,
        customerName,
        items,
        payments,
        discountAmount,
        taxAmount,
        terminalId,
        notes,
      } = req.body;

      // Validate required fields
      if (!locationId) {
        return res.status(400).json({
          success: false,
          error: { message: 'Location ID is required' },
        });
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'Sale items are required' },
        });
      }

      if (!payments || !Array.isArray(payments) || payments.length === 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'Payment information is required' },
        });
      }

      // Validate each item
      for (const item of items) {
        if (!item.productId || !item.quantity || !item.unitPrice) {
          return res.status(400).json({
            success: false,
            error: { message: 'Each item must have productId, quantity, and unitPrice' },
          });
        }

        if (item.quantity <= 0 || item.unitPrice <= 0) {
          return res.status(400).json({
            success: false,
            error: { message: 'Quantity and unit price must be greater than 0' },
          });
        }
      }

      // Validate payments
      for (const payment of payments) {
        if (!payment.method || !payment.amount) {
          return res.status(400).json({
            success: false,
            error: { message: 'Each payment must have method and amount' },
          });
        }

        if (payment.amount <= 0) {
          return res.status(400).json({
            success: false,
            error: { message: 'Payment amount must be greater than 0' },
          });
        }
      }

      const saleInput: CreateSaleInput = {
        tenantId: user.tenantId,
        salesPersonId: user.id,
        locationId,
        customerId,
        customerEmail,
        customerPhone,
        customerName,
        items,
        payments,
        discountAmount,
        taxAmount,
        terminalId,
        notes,
      };

      const sale = await SaleService.createSale(saleInput);

      res.status(201).json({
        success: true,
        data: sale,
      });
    } catch (error) {
      console.error('Error creating sale:', error);
      res.status(400).json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to create sale',
        },
      });
    }
  }

  /**
   * Get sale by ID
   * GET /api/sales/:id
   */
  static async getSale(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;
      if (!user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Authentication required' },
        });
      }

      const { id } = req.params;

      const sale = await SaleService.getSaleById(id, user.tenantId);

      res.json({
        success: true,
        data: sale,
      });
    } catch (error) {
      console.error('Error fetching sale:', error);
      if (error instanceof Error && error.message === 'Sale not found') {
        return res.status(404).json({
          success: false,
          error: { message: 'Sale not found' },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch sale',
        },
      });
    }
  }

  /**
   * Get sales with pagination and filtering
   * GET /api/sales
   */
  static async getSales(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;
      if (!user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Authentication required' },
        });
      }

      const { locationId, page = 1, limit = 25 } = req.query;

      const filters = {
        tenantId: user.tenantId,
        ...(locationId && { locationId: locationId as string }),
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      };

      const result = await SaleService.getSales(filters);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Error fetching sales:', error);
      res.status(500).json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch sales',
        },
      });
    }
  }

  /**
   * Generate receipt for a sale
   * GET /api/sales/:id/receipt
   */
  static async getReceipt(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;
      if (!user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Authentication required' },
        });
      }

      const { id } = req.params;

      const receipt = await SaleService.generateReceipt(id, user.tenantId);

      res.json({
        success: true,
        data: receipt,
      });
    } catch (error) {
      console.error('Error generating receipt:', error);
      if (error instanceof Error && error.message === 'Sale not found') {
        return res.status(404).json({
          success: false,
          error: { message: 'Sale not found' },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to generate receipt',
        },
      });
    }
  }

  /**
   * Get daily sales summary for POS dashboard
   * GET /api/sales/dashboard/summary
   */
  static async getDashboardSummary(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;
      if (!user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Authentication required' },
        });
      }

      const { locationId } = req.query;

      // Get today's date range
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const filters = {
        tenantId: user.tenantId,
        ...(locationId && { locationId: locationId as string }),
        page: 1,
        limit: 1000, // Get all today's sales
      };

      const result = await SaleService.getSales(filters);

      // Calculate summary statistics
      const todaySales = result.sales.filter((sale: any) => {
        const saleDate = new Date(sale.saleDate);
        return saleDate >= startOfDay && saleDate < endOfDay;
      });

      const totalSales = todaySales.reduce((sum: number, sale: any) => sum + Number(sale.total), 0);
      const totalTransactions = todaySales.length;
      const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;

      // Payment method breakdown
      const paymentMethods: Record<string, { count: number; amount: number }> = {};
      todaySales.forEach((sale: any) => {
        if (!paymentMethods[sale.paymentMethod]) {
          paymentMethods[sale.paymentMethod] = { count: 0, amount: 0 };
        }
        paymentMethods[sale.paymentMethod].count++;
        paymentMethods[sale.paymentMethod].amount += Number(sale.total);
      });

      // Hourly breakdown
      const hourlyBreakdown = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        transactions: 0,
        sales: 0,
      }));

      todaySales.forEach((sale: any) => {
        const hour = new Date(sale.saleDate).getHours();
        hourlyBreakdown[hour].transactions++;
        hourlyBreakdown[hour].sales += Number(sale.total);
      });

      res.json({
        success: true,
        data: {
          summary: {
            totalSales,
            totalTransactions,
            averageTransaction,
            date: today.toISOString().split('T')[0],
          },
          paymentMethods: Object.entries(paymentMethods).map(([method, data]) => ({
            method,
            count: data.count,
            amount: data.amount,
          })),
          hourlyBreakdown: hourlyBreakdown.filter(h => h.transactions > 0),
          recentSales: todaySales.slice(0, 10).map((sale: any) => ({
            id: sale.id,
            saleNumber: sale.saleNumber,
            total: Number(sale.total),
            paymentMethod: sale.paymentMethod,
            saleDate: sale.saleDate,
            customerName:
              sale.customerName ||
              (sale.customer
                ? `${sale.customer.firstName || ''} ${sale.customer.lastName || ''}`.trim()
                : 'Walk-in'),
          })),
        },
      });
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      res.status(500).json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch dashboard summary',
        },
      });
    }
  }

  /**
   * Void a sale (for manager-level users)
   * POST /api/sales/:id/void
   */
  static async voidSale(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;
      if (!user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Authentication required' },
        });
      }

      // Check if user has permission to void sales
      if (!['admin', 'manager'].includes(user.role)) {
        return res.status(403).json({
          success: false,
          error: { message: 'Insufficient permissions to void sales' },
        });
      }

      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          error: { message: 'Void reason is required' },
        });
      }

      // For now, we'll just mark the sale as void
      // In a full implementation, this would reverse inventory and handle refunds
      const sale = await SaleService.getSaleById(id, user.tenantId);

      if (sale.status === 'void') {
        return res.status(400).json({
          success: false,
          error: { message: 'Sale is already voided' },
        });
      }

      // TODO: Implement proper void logic with inventory reversal
      res.json({
        success: true,
        message: 'Sale void functionality not yet implemented',
        data: { saleId: id, reason },
      });
    } catch (error) {
      console.error('Error voiding sale:', error);
      if (error instanceof Error && error.message === 'Sale not found') {
        return res.status(404).json({
          success: false,
          error: { message: 'Sale not found' },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to void sale',
        },
      });
    }
  }
}

import { PrismaClient } from '@prisma/client';
import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Validation schemas
const stockAdjustmentSchema = z.object({
  inventoryId: z.string(),
  quantity: z.number().int(),
  type: z.enum(['adjustment', 'damaged', 'expired']),
  reason: z.string().min(1, 'Reason is required'),
  notes: z.string().optional(),
});

const stockTransferSchema = z.object({
  fromLocationId: z.string(),
  toLocationId: z.string(),
  items: z
    .array(
      z.object({
        productId: z.string().optional(),
        variantId: z.string().optional(),
        quantity: z.number().int().min(1),
      })
    )
    .min(1, 'At least one item is required'),
  notes: z.string().optional(),
  reference: z.string().optional(),
});

const inventoryQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  search: z.string().optional(),
  locationId: z.string().optional(),
  productId: z.string().optional(),
  categoryId: z.string().optional(),
  lowStock: z
    .string()
    .transform(val => val === 'true')
    .optional(),
  outOfStock: z
    .string()
    .transform(val => val === 'true')
    .optional(),
  sortBy: z.enum(['productName', 'quantity', 'lastUpdate']).default('productName'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

const stockMovementQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  inventoryId: z.string().optional(),
  productId: z.string().optional(),
  locationId: z.string().optional(),
  type: z
    .enum([
      'purchase',
      'sale',
      'adjustment',
      'transfer_in',
      'transfer_out',
      'return',
      'damaged',
      'expired',
    ])
    .optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export class InventoryController {
  /**
   * Get inventory list with pagination and filtering
   */
  static async getInventory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { message: 'Authentication required' },
        });
        return;
      }

      // Validate query parameters
      const query = inventoryQuerySchema.parse(req.query);
      const {
        page,
        limit,
        search,
        locationId,
        productId,
        categoryId,
        lowStock,
        outOfStock,
        sortBy,
        sortOrder,
      } = query;

      // Build where clause
      const where: any = {
        tenantId,
        ...(locationId && { locationId }),
        ...(productId && {
          OR: [{ productId }, { variant: { productId } }],
        }),
        ...(categoryId && {
          OR: [{ product: { categoryId } }, { variant: { product: { categoryId } } }],
        }),
        ...(lowStock && {
          OR: [
            {
              product: {
                lowStockThreshold: { not: null },
                inventory: {
                  some: {
                    quantity: { lte: { product: { lowStockThreshold: true } } },
                  },
                },
              },
            },
          ],
        }),
        ...(outOfStock && { quantity: { lte: 0 } }),
        ...(search && {
          OR: [
            {
              product: {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { sku: { contains: search, mode: 'insensitive' } },
                  { barcode: { contains: search, mode: 'insensitive' } },
                ],
              },
            },
            {
              variant: {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { sku: { contains: search, mode: 'insensitive' } },
                ],
              },
            },
          ],
        }),
      };

      // Build order by clause
      let orderBy: any = {};
      switch (sortBy) {
        case 'productName':
          orderBy = [{ product: { name: sortOrder } }, { variant: { name: sortOrder } }];
          break;
        case 'quantity':
          orderBy = { quantity: sortOrder };
          break;
        case 'lastUpdate':
          orderBy = { updatedAt: sortOrder };
          break;
        default:
          orderBy = { updatedAt: sortOrder };
      }

      // Get total count for pagination
      const total = await prisma.inventory.count({ where });

      // Get inventory items
      const inventory = await prisma.inventory.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              barcode: true,
              brand: true,
              lowStockThreshold: true,
              sellingPrice: true,
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          variant: {
            select: {
              id: true,
              name: true,
              sku: true,
              attributes: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  barcode: true,
                  brand: true,
                },
              },
            },
          },
          location: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: Array.isArray(orderBy) ? orderBy[0] : orderBy,
        skip: (page - 1) * limit,
        take: limit,
      });

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);

      res.status(200).json({
        success: true,
        data: {
          inventory,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
          },
        },
      });
    } catch (error) {
      console.error('Error fetching inventory:', error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid query parameters',
            details: error.errors,
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: { message: 'Failed to fetch inventory' },
      });
    }
  }

  /**
   * Get inventory alerts (low stock, out of stock)
   */
  static async getInventoryAlerts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { message: 'Authentication required' },
        });
        return;
      }

      // Get low stock items - using raw query for complex logic
      const lowStockItems = (await prisma.$queryRaw`
        SELECT i.*, p."lowStockThreshold", p.id as "productId", p.name as "productName", p.sku as "productSku",
               l.id as "locationId", l.name as "locationName"
        FROM inventory i
        LEFT JOIN products p ON i."productId" = p.id
        LEFT JOIN locations l ON i."locationId" = l.id
        WHERE i."tenantId" = ${tenantId}
          AND p."lowStockThreshold" IS NOT NULL
          AND i.quantity <= p."lowStockThreshold"
      `) as any[];

      // Get out of stock items
      const outOfStockItems = await prisma.inventory.findMany({
        where: {
          tenantId,
          quantity: 0,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              lowStockThreshold: true,
            },
          },
          variant: {
            select: {
              id: true,
              name: true,
              sku: true,
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          location: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      const alerts = [
        ...lowStockItems.map(item => ({
          id: item.id,
          type: 'low_stock' as const,
          productId: item.product?.id || item.variant?.product.id || '',
          productName: item.product?.name || item.variant?.product.name || '',
          sku: item.product?.sku || item.variant?.sku || '',
          locationId: item.locationId,
          locationName: item.location.name,
          currentQuantity: item.quantity,
          threshold: item.product?.lowStockThreshold || undefined,
          priority: item.quantity === 0 ? ('high' as const) : ('medium' as const),
          createdAt: item.updatedAt,
        })),
        ...outOfStockItems.map(item => ({
          id: item.id,
          type: 'out_of_stock' as const,
          productId: item.product?.id || item.variant?.product.id || '',
          productName: item.product?.name || item.variant?.product.name || '',
          sku: item.product?.sku || item.variant?.sku || '',
          locationId: item.locationId,
          locationName: item.location.name,
          currentQuantity: item.quantity,
          priority: 'high' as const,
          createdAt: item.updatedAt,
        })),
      ];

      res.status(200).json({
        success: true,
        data: alerts,
      });
    } catch (error) {
      console.error('Error fetching inventory alerts:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to fetch inventory alerts' },
      });
    }
  }

  /**
   * Adjust stock levels
   */
  static async adjustStock(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        res.status(401).json({
          success: false,
          error: { message: 'Authentication required' },
        });
        return;
      }

      // Validate request body
      const validatedData = stockAdjustmentSchema.parse(req.body);
      const { inventoryId, quantity, type, reason, notes } = validatedData;

      // Get inventory item
      const inventory = await prisma.inventory.findFirst({
        where: {
          id: inventoryId,
          tenantId,
        },
      });

      if (!inventory) {
        res.status(404).json({
          success: false,
          error: { message: 'Inventory item not found' },
        });
        return;
      }

      const beforeQuantity = inventory.quantity;
      const afterQuantity = quantity;
      const actualQuantity = afterQuantity - beforeQuantity;

      // Update inventory and create stock movement in a transaction
      const result = await prisma.$transaction(async tx => {
        // Update inventory
        const updatedInventory = await tx.inventory.update({
          where: { id: inventoryId },
          data: {
            quantity: afterQuantity,
            availableQuantity: Math.max(0, afterQuantity - inventory.reservedQuantity),
          },
        });

        // Create stock movement
        const stockMovement = await tx.stockMovement.create({
          data: {
            type,
            quantity: actualQuantity,
            reason,
            notes,
            inventoryId,
            userId,
          },
        });

        return { updatedInventory, stockMovement };
      });

      res.status(200).json({
        success: true,
        data: result.updatedInventory,
        message: 'Stock adjusted successfully',
      });
    } catch (error) {
      console.error('Error adjusting stock:', error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation error',
            details: error.errors,
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: { message: 'Failed to adjust stock' },
      });
    }
  }

  /**
   * Transfer stock between locations
   */
  static async transferStock(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        res.status(401).json({
          success: false,
          error: { message: 'Authentication required' },
        });
        return;
      }

      // Validate request body
      const validatedData = stockTransferSchema.parse(req.body);
      const { fromLocationId, toLocationId, items, notes, reference } = validatedData;

      if (fromLocationId === toLocationId) {
        res.status(400).json({
          success: false,
          error: { message: 'Source and destination locations cannot be the same' },
        });
        return;
      }

      // Validate locations exist and belong to tenant
      const [fromLocation, toLocation] = await Promise.all([
        prisma.location.findFirst({
          where: { id: fromLocationId, tenantId, isActive: true },
        }),
        prisma.location.findFirst({
          where: { id: toLocationId, tenantId, isActive: true },
        }),
      ]);

      if (!fromLocation || !toLocation) {
        res.status(400).json({
          success: false,
          error: { message: 'Invalid source or destination location' },
        });
        return;
      }

      // Process transfer in a transaction
      const result = await prisma.$transaction(async tx => {
        const transfers = [];

        for (const item of items) {
          if (!item.productId && !item.variantId) {
            throw new Error('Either productId or variantId is required');
          }

          // Find source inventory
          const sourceInventory = await tx.inventory.findFirst({
            where: {
              tenantId,
              locationId: fromLocationId,
              ...(item.productId && { productId: item.productId }),
              ...(item.variantId && { variantId: item.variantId }),
            },
          });

          if (!sourceInventory) {
            throw new Error(`Inventory not found for item in source location`);
          }

          if (sourceInventory.availableQuantity < item.quantity) {
            throw new Error(
              `Insufficient stock for item. Available: ${sourceInventory.availableQuantity}, Requested: ${item.quantity}`
            );
          }

          // Update source inventory
          const updatedSourceInventory = await tx.inventory.update({
            where: { id: sourceInventory.id },
            data: {
              quantity: sourceInventory.quantity - item.quantity,
              availableQuantity: sourceInventory.availableQuantity - item.quantity,
            },
          });

          // Create outbound stock movement
          await tx.stockMovement.create({
            data: {
              type: 'transfer_out',
              quantity: -item.quantity,
              reason: `Transfer to ${toLocation.name}`,
              reference,
              notes,
              inventoryId: sourceInventory.id,
              userId,
            },
          });

          // Find or create destination inventory
          let destInventory = await tx.inventory.findFirst({
            where: {
              tenantId,
              locationId: toLocationId,
              ...(item.productId && { productId: item.productId }),
              ...(item.variantId && { variantId: item.variantId }),
            },
          });

          if (!destInventory) {
            // Create new inventory record
            destInventory = await tx.inventory.create({
              data: {
                tenantId,
                locationId: toLocationId,
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                availableQuantity: item.quantity,
                reservedQuantity: 0,
              },
            });
          } else {
            // Update existing inventory
            destInventory = await tx.inventory.update({
              where: { id: destInventory.id },
              data: {
                quantity: destInventory.quantity + item.quantity,
                availableQuantity: destInventory.availableQuantity + item.quantity,
              },
            });
          }

          // Create inbound stock movement
          await tx.stockMovement.create({
            data: {
              type: 'transfer_in',
              quantity: item.quantity,
              reason: `Transfer from ${fromLocation.name}`,
              reference,
              notes,
              inventoryId: destInventory.id,
              userId,
            },
          });

          transfers.push({
            sourceInventory: updatedSourceInventory,
            destInventory,
            quantity: item.quantity,
          });
        }

        return transfers;
      });

      res.status(200).json({
        success: true,
        data: result,
        message: 'Stock transferred successfully',
      });
    } catch (error) {
      console.error('Error transferring stock:', error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation error',
            details: error.errors,
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to transfer stock',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  /**
   * Get stock movements with pagination and filtering
   */
  static async getStockMovements(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { message: 'Authentication required' },
        });
        return;
      }

      // Validate query parameters
      const query = stockMovementQuerySchema.parse(req.query);
      const { page, limit, inventoryId, productId, locationId, type, dateFrom, dateTo } = query;

      // Build where clause
      const where: any = {
        inventory: { tenantId },
        ...(inventoryId && { inventoryId }),
        ...(locationId && { inventory: { locationId } }),
        ...(productId && {
          inventory: {
            OR: [{ productId }, { variant: { productId } }],
          },
        }),
        ...(type && { type }),
        ...(dateFrom || dateTo
          ? {
              createdAt: {
                ...(dateFrom && { gte: new Date(dateFrom) }),
                ...(dateTo && { lte: new Date(dateTo) }),
              },
            }
          : {}),
      };

      // Get total count for pagination
      const total = await prisma.stockMovement.count({ where });

      // Get stock movements
      const movements = await prisma.stockMovement.findMany({
        where,
        include: {
          inventory: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                },
              },
              variant: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  product: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
              location: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);

      res.status(200).json({
        success: true,
        data: {
          movements,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
          },
        },
      });
    } catch (error) {
      console.error('Error fetching stock movements:', error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid query parameters',
            details: error.errors,
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: { message: 'Failed to fetch stock movements' },
      });
    }
  }

  /**
   * Get inventory dashboard statistics
   */
  static async getInventoryStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { message: 'Authentication required' },
        });
        return;
      }

      const [
        totalProducts,
        totalLocations,
        lowStockItems,
        outOfStockItems,
        totalValue,
        recentMovements,
      ] = await Promise.all([
        // Total products with inventory
        prisma.inventory.count({
          where: { tenantId },
        }),

        // Total active locations
        prisma.location.count({
          where: { tenantId, isActive: true },
        }),

        // Low stock items count
        prisma.$queryRaw`
          SELECT COUNT(*)::int as count
          FROM inventory i
          LEFT JOIN products p ON i."productId" = p.id
          WHERE i."tenantId" = ${tenantId}
            AND p."lowStockThreshold" IS NOT NULL
            AND i.quantity <= p."lowStockThreshold"
        `.then((result: any) => result[0]?.count || 0),

        // Out of stock items count
        prisma.inventory.count({
          where: {
            tenantId,
            quantity: 0,
          },
        }),

        // Total inventory value
        prisma.$queryRaw`
          SELECT COALESCE(SUM(i.quantity * COALESCE(p."costPrice", 0)), 0)::float as total
          FROM inventory i
          LEFT JOIN products p ON i."productId" = p.id
          LEFT JOIN product_variants pv ON i."variantId" = pv.id
          LEFT JOIN products p2 ON pv."productId" = p2.id
          WHERE i."tenantId" = ${tenantId}
        `.then((result: any) => result[0]?.total || 0),

        // Recent stock movements
        prisma.stockMovement.findMany({
          where: {
            inventory: { tenantId },
          },
          include: {
            inventory: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    sku: true,
                  },
                },
                location: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          totalProducts,
          totalLocations,
          lowStockItems,
          outOfStockItems,
          totalValue,
          recentMovements,
        },
      });
    } catch (error) {
      console.error('Error fetching inventory stats:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to fetch inventory statistics' },
      });
    }
  }
}

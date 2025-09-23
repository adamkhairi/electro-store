import { PrismaClient } from '@prisma/client';
import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth';
import { generateSku, validateBarcode } from '../utils/barcodeUtils';

const prisma = new PrismaClient();

// Validation schemas
const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
  sku: z.string().min(1, 'SKU is required').max(100).optional(),
  barcode: z.string().max(50).optional(),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  specifications: z.record(z.any()).optional(),
  warranty: z.string().max(255).optional(),
  costPrice: z.number().min(0, 'Cost price must be non-negative'),
  sellingPrice: z.number().min(0, 'Selling price must be non-negative'),
  msrp: z.number().min(0).optional(),
  weight: z.number().min(0).optional(),
  dimensions: z.record(z.any()).optional(),
  trackInventory: z.boolean().default(true),
  lowStockThreshold: z.number().int().min(0).optional(),
  images: z.array(z.string()).default([]),
  documents: z.array(z.string()).default([]),
  slug: z.string().max(255).optional(),
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().max(500).optional(),
  tags: z.array(z.string()).default([]),
  categoryId: z.string().optional(),
  status: z.enum(['active', 'inactive', 'discontinued']).default('active'),
});

const updateProductSchema = createProductSchema.partial();

const productQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  search: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  status: z.enum(['active', 'inactive', 'discontinued']).optional(),
  minPrice: z
    .string()
    .regex(/^\d+(\.\d+)?$/)
    .transform(Number)
    .optional(),
  maxPrice: z
    .string()
    .regex(/^\d+(\.\d+)?$/)
    .transform(Number)
    .optional(),
  sortBy: z.enum(['name', 'price', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export class ProductController {
  /**
   * Get all products with pagination and filtering
   */
  static async getProducts(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const query = productQuerySchema.parse(req.query);
      const {
        page,
        limit,
        search,
        sku,
        barcode,
        category,
        brand,
        status,
        minPrice,
        maxPrice,
        sortBy,
        sortOrder,
      } = query;

      // Build where clause
      const where: any = {
        tenantId,
        ...(status && { status }),
        ...(category && { categoryId: category }),
        ...(brand && { brand: { contains: brand, mode: 'insensitive' } }),
        ...(sku && { sku: { contains: sku, mode: 'insensitive' } }),
        ...(barcode && { barcode: { contains: barcode, mode: 'insensitive' } }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
            { barcode: { contains: search, mode: 'insensitive' } },
            { brand: { contains: search, mode: 'insensitive' } },
            { model: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(minPrice !== undefined || maxPrice !== undefined
          ? {
              sellingPrice: {
                ...(minPrice !== undefined && { gte: minPrice }),
                ...(maxPrice !== undefined && { lte: maxPrice }),
              },
            }
          : {}),
      };

      // Build order by clause
      const orderBy: any = {};
      if (sortBy === 'price') {
        orderBy.sellingPrice = sortOrder;
      } else {
        orderBy[sortBy] = sortOrder;
      }

      // Get total count for pagination
      const total = await prisma.product.count({ where });

      // Get products
      const products = await prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          inventory: {
            select: {
              quantity: true,
              availableQuantity: true,
              location: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          variants: {
            select: {
              id: true,
              name: true,
              sku: true,
              attributes: true,
              priceAdjustment: true,
              isActive: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      });

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      res.status(200).json({
        success: true,
        data: {
          products,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage,
            hasPreviousPage,
          },
        },
      });
    } catch (error) {
      console.error('Error fetching products:', error);

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
        error: { message: 'Failed to fetch products' },
      });
    }
  }

  /**
   * Get single product by ID
   */
  static async getProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { message: 'Authentication required' },
        });
        return;
      }

      const product = await prisma.product.findFirst({
        where: {
          id,
          tenantId,
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          inventory: {
            select: {
              id: true,
              quantity: true,
              availableQuantity: true,
              reservedQuantity: true,
              reorderPoint: true,
              reorderQuantity: true,
              serialNumbers: true,
              location: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          variants: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              sku: true,
              attributes: true,
              priceAdjustment: true,
              costAdjustment: true,
              image: true,
              inventory: {
                select: {
                  quantity: true,
                  availableQuantity: true,
                  location: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!product) {
        res.status(404).json({
          success: false,
          error: { message: 'Product not found' },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to fetch product' },
      });
    }
  }

  /**
   * Create new product
   */
  static async createProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { message: 'Authentication required' },
        });
        return;
      }

      // Validate request body
      const validatedData = createProductSchema.parse(req.body);

      // Generate unique SKU if not provided
      let sku = validatedData.sku;
      if (!sku) {
        const skuPrefix = validatedData.brand
          ? validatedData.brand.slice(0, 3).toUpperCase()
          : validatedData.name.slice(0, 3).toUpperCase();
        const timestamp = Date.now().toString().slice(-6);
        sku = `${skuPrefix}-${timestamp}`;
      }

      // Check if SKU already exists
      const existingSku = await prisma.product.findUnique({
        where: { sku },
      });

      if (existingSku) {
        res.status(400).json({
          success: false,
          error: { message: 'SKU already exists' },
        });
        return;
      }

      // Check if barcode already exists (if provided)
      // TODO: Re-enable when Prisma client is updated
      // if (validatedData.barcode) {
      //   const existingBarcode = await prisma.product.findFirst({
      //     where: { barcode: validatedData.barcode },
      //   });

      //   if (existingBarcode) {
      //     res.status(400).json({
      //       success: false,
      //       error: { message: 'Barcode already exists' },
      //     });
      //     return;
      //   }
      // }

      // Validate category if provided
      if (validatedData.categoryId) {
        const category = await prisma.category.findFirst({
          where: {
            id: validatedData.categoryId,
            tenantId,
            isActive: true,
          },
        });

        if (!category) {
          res.status(400).json({
            success: false,
            error: { message: 'Invalid category' },
          });
          return;
        }
      }

      // Generate slug if not provided
      if (!validatedData.slug) {
        validatedData.slug = validatedData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }

      // Create product
      const product = await prisma.product.create({
        data: {
          ...validatedData,
          sku,
          tenantId,
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: product,
        message: 'Product created successfully',
      });
    } catch (error) {
      console.error('Error creating product:', error);

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
        error: { message: 'Failed to create product' },
      });
    }
  }

  /**
   * Update product
   */
  static async updateProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { message: 'Authentication required' },
        });
        return;
      }

      // Validate request body
      const validatedData = updateProductSchema.parse(req.body);

      // Check if product exists and belongs to tenant
      const existingProduct = await prisma.product.findFirst({
        where: {
          id,
          tenantId,
        },
      });

      if (!existingProduct) {
        res.status(404).json({
          success: false,
          error: { message: 'Product not found' },
        });
        return;
      }

      // Validate category if provided
      if (validatedData.categoryId) {
        const category = await prisma.category.findFirst({
          where: {
            id: validatedData.categoryId,
            tenantId,
            isActive: true,
          },
        });

        if (!category) {
          res.status(400).json({
            success: false,
            error: { message: 'Invalid category' },
          });
          return;
        }
      }

      // Update slug if name changed and slug not provided
      if (validatedData.name && !validatedData.slug) {
        validatedData.slug = validatedData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }

      // Update product
      const product = await prisma.product.update({
        where: { id },
        data: validatedData,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        data: product,
        message: 'Product updated successfully',
      });
    } catch (error) {
      console.error('Error updating product:', error);

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
        error: { message: 'Failed to update product' },
      });
    }
  }

  /**
   * Delete product
   */
  static async deleteProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { message: 'Authentication required' },
        });
        return;
      }

      // Check if product exists and belongs to tenant
      const existingProduct = await prisma.product.findFirst({
        where: {
          id,
          tenantId,
        },
        include: {
          orderItems: {
            take: 1,
          },
          inventory: {
            take: 1,
          },
        },
      });

      if (!existingProduct) {
        res.status(404).json({
          success: false,
          error: { message: 'Product not found' },
        });
        return;
      }

      // Check if product has orders or inventory
      if (existingProduct.orderItems.length > 0) {
        res.status(400).json({
          success: false,
          error: {
            message:
              'Cannot delete product with existing orders. Consider marking it as discontinued instead.',
          },
        });
        return;
      }

      if (existingProduct.inventory.length > 0) {
        // Check if any inventory has quantity > 0
        const inventoryWithStock = await prisma.inventory.findFirst({
          where: {
            productId: id,
            quantity: { gt: 0 },
          },
        });

        if (inventoryWithStock) {
          res.status(400).json({
            success: false,
            error: {
              message:
                'Cannot delete product with existing inventory. Consider marking it as discontinued instead.',
            },
          });
          return;
        }
      }

      // Delete product (this will cascade to related records due to database constraints)
      await prisma.product.delete({
        where: { id },
      });

      res.status(200).json({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to delete product' },
      });
    }
  }

  /**
   * Bulk operations
   */
  static async bulkUpdateProducts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { message: 'Authentication required' },
        });
        return;
      }

      const { productIds, updates } = req.body;

      if (!Array.isArray(productIds) || productIds.length === 0) {
        res.status(400).json({
          success: false,
          error: { message: 'Product IDs array is required' },
        });
        return;
      }

      // Validate updates
      const validatedUpdates = updateProductSchema.parse(updates);

      // Update products
      const result = await prisma.product.updateMany({
        where: {
          id: { in: productIds },
          tenantId,
        },
        data: validatedUpdates,
      });

      res.status(200).json({
        success: true,
        data: { updatedCount: result.count },
        message: `${result.count} products updated successfully`,
      });
    } catch (error) {
      console.error('Error bulk updating products:', error);

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
        error: { message: 'Failed to update products' },
      });
    }
  }

  /**
   * Get product statistics
   */
  static async getProductStats(req: AuthenticatedRequest, res: Response): Promise<void> {
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
        activeProducts,
        lowStockProducts,
        outOfStockProducts,
        categoryStats,
        brandStats,
      ] = await Promise.all([
        // Total products
        prisma.product.count({
          where: { tenantId },
        }),

        // Active products
        prisma.product.count({
          where: {
            tenantId,
            status: 'active',
          },
        }),

        // Low stock products - need a more complex query
        prisma.$queryRaw`
          SELECT COUNT(DISTINCT p.id)::int as count
          FROM products p
          INNER JOIN inventory i ON p.id = i."productId"
          WHERE p."tenantId" = ${tenantId}
            AND p.status = 'active'
            AND i.quantity <= COALESCE(p."lowStockThreshold", 10)
        `.then((result: any) => result[0]?.count || 0),

        // Out of stock products
        prisma.product.count({
          where: {
            tenantId,
            status: 'active',
            inventory: {
              some: {
                quantity: 0,
              },
            },
          },
        }),

        // Products by category
        prisma.product.groupBy({
          by: ['categoryId'],
          where: { tenantId },
          _count: true,
        }),

        // Products by brand
        prisma.product.groupBy({
          by: ['brand'],
          where: {
            tenantId,
            brand: { not: null },
          },
          _count: true,
        }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          total: totalProducts,
          active: activeProducts,
          lowStock: lowStockProducts,
          outOfStock: outOfStockProducts,
          byCategory: categoryStats,
          byBrand: brandStats,
        },
      });
    } catch (error) {
      console.error('Error fetching product stats:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to fetch product statistics' },
      });
    }
  }

  /**
   * Generate SKU for product
   */
  static async generateSku(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { message: 'Authentication required' },
        });
        return;
      }

      const { productName, brand, categoryId, customPrefix } = req.body;

      if (!productName) {
        res.status(400).json({
          success: false,
          error: { message: 'Product name is required' },
        });
        return;
      }

      // Get category name if categoryId is provided
      let categoryName;
      if (categoryId) {
        const category = await prisma.category.findFirst({
          where: { id: categoryId, tenantId },
        });
        categoryName = category?.name;
      }

      // Generate SKU
      const sku = generateSku({
        productName,
        brand,
        categoryName,
        customPrefix,
      });

      // Check if generated SKU already exists
      const existingSku = await prisma.product.findUnique({
        where: { sku },
      });

      if (existingSku) {
        // Generate another one if collision occurs
        const fallbackSku = generateSku({
          productName: productName + Math.random().toString(36).substring(2, 5),
          brand,
          categoryName,
          customPrefix,
        });

        res.status(200).json({
          success: true,
          data: {
            sku: fallbackSku,
            pattern: 'Generated with random suffix due to collision',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          sku,
          pattern: `${customPrefix || brand || categoryName || productName.slice(0, 3).toUpperCase()}-{timestamp}{random}`,
        },
      });
    } catch (error) {
      console.error('Error generating SKU:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to generate SKU' },
      });
    }
  }

  /**
   * Validate barcode
   */
  static async validateBarcode(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { barcode, type } = req.body;

      if (!barcode) {
        res.status(400).json({
          success: false,
          error: { message: 'Barcode is required' },
        });
        return;
      }

      const validation = validateBarcode(barcode);

      res.status(200).json({
        success: true,
        data: validation,
      });
    } catch (error) {
      console.error('Error validating barcode:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to validate barcode' },
      });
    }
  }
}

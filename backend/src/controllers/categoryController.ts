import { PrismaClient } from '@prisma/client';
import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Validation schemas
const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(255),
  description: z.string().max(1000).optional(),
  parentId: z.string().nullable().optional(),
  image: z
    .string()
    .optional()
    .transform(val => (val === '' ? undefined : val))
    .pipe(z.string().url().optional()),
  sortOrder: z.number().int().min(0).default(0),
});

const updateCategorySchema = createCategorySchema.partial();

const categoryQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('50'),
  search: z.string().optional(),
  parentId: z.string().optional(),
  includeInactive: z
    .string()
    .transform(val => val === 'true')
    .default('false'),
  sortBy: z.enum(['name', 'sortOrder', 'createdAt']).default('sortOrder'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export class CategoryController {
  /**
   * Get all categories with pagination and filtering
   */
  static async getCategories(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const query = categoryQuerySchema.parse(req.query);
      const { page, limit, search, parentId, includeInactive, sortBy, sortOrder } = query;

      // Build where clause
      const where: any = {
        tenantId,
        ...(parentId !== undefined && { parentId }),
        ...(!includeInactive && { isActive: true }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
      };

      // Build order by clause
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      // Get total count for pagination
      const total = await prisma.category.count({ where });

      // Get categories
      const categories = await prisma.category.findMany({
        where,
        include: {
          parent: {
            select: {
              id: true,
              name: true,
            },
          },
          children: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              description: true,
              sortOrder: true,
              _count: {
                select: {
                  products: true,
                },
              },
            },
            orderBy: { sortOrder: 'asc' },
          },
          _count: {
            select: {
              products: true,
              children: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      });

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);

      res.status(200).json({
        success: true,
        data: {
          categories,
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
      console.error('Error fetching categories:', error);

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
        error: { message: 'Failed to fetch categories' },
      });
    }
  }

  /**
   * Get category tree (hierarchical structure)
   */
  static async getCategoryTree(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { message: 'Authentication required' },
        });
        return;
      }

      // Get all active categories
      const categories = await prisma.category.findMany({
        where: {
          tenantId,
          isActive: true,
        },
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
        orderBy: { sortOrder: 'asc' },
      });

      // Build tree structure
      const categoryMap = new Map();
      const tree: any[] = [];

      // First pass: create all category nodes
      categories.forEach(category => {
        categoryMap.set(category.id, {
          ...category,
          children: [],
          productCount: category._count.products,
        });
      });

      // Second pass: build parent-child relationships
      categories.forEach(category => {
        const node = categoryMap.get(category.id);
        if (category.parentId) {
          const parent = categoryMap.get(category.parentId);
          if (parent) {
            parent.children.push(node);
          }
        } else {
          tree.push(node);
        }
      });

      res.status(200).json({
        success: true,
        data: tree,
      });
    } catch (error) {
      console.error('Error fetching category tree:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to fetch category tree' },
      });
    }
  }

  /**
   * Get single category by ID
   */
  static async getCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const category = await prisma.category.findFirst({
        where: {
          id,
          tenantId,
        },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
            },
          },
          children: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              description: true,
              sortOrder: true,
              _count: {
                select: {
                  products: true,
                },
              },
            },
            orderBy: { sortOrder: 'asc' },
          },
          _count: {
            select: {
              products: true,
              children: true,
            },
          },
        },
      });

      if (!category) {
        res.status(404).json({
          success: false,
          error: { message: 'Category not found' },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error) {
      console.error('Error fetching category:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to fetch category' },
      });
    }
  }

  /**
   * Create new category
   */
  static async createCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const validatedData = createCategorySchema.parse(req.body);

      // Validate parent category if provided
      if (validatedData.parentId) {
        const parent = await prisma.category.findFirst({
          where: {
            id: validatedData.parentId,
            tenantId,
            isActive: true,
          },
        });

        if (!parent) {
          res.status(400).json({
            success: false,
            error: { message: 'Invalid parent category' },
          });
          return;
        }

        // Check for circular reference
        let currentParent = parent;
        while (currentParent?.parentId) {
          if (currentParent.parentId === validatedData.parentId) {
            res.status(400).json({
              success: false,
              error: { message: 'Circular reference detected in category hierarchy' },
            });
            return;
          }
          const nextParent = await prisma.category.findFirst({
            where: { id: currentParent.parentId },
          });
          if (!nextParent) break;
          currentParent = nextParent;
        }
      }

      // Check for duplicate name at the same level
      const existingCategory = await prisma.category.findFirst({
        where: {
          tenantId,
          name: validatedData.name,
          parentId: validatedData.parentId || null,
          isActive: true,
        },
      });

      if (existingCategory) {
        res.status(400).json({
          success: false,
          error: { message: 'Category with this name already exists at this level' },
        });
        return;
      }

      // Create category
      const category = await prisma.category.create({
        data: {
          ...validatedData,
          tenantId,
        },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              products: true,
              children: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: category,
        message: 'Category created successfully',
      });
    } catch (error) {
      console.error('Error creating category:', error);

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
        error: { message: 'Failed to create category' },
      });
    }
  }

  /**
   * Update category
   */
  static async updateCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const validatedData = updateCategorySchema.parse(req.body);

      // Check if category exists and belongs to tenant
      const existingCategory = await prisma.category.findFirst({
        where: {
          id,
          tenantId,
        },
      });

      if (!existingCategory) {
        res.status(404).json({
          success: false,
          error: { message: 'Category not found' },
        });
        return;
      }

      // Validate parent category if provided
      if (validatedData.parentId) {
        if (validatedData.parentId === id) {
          res.status(400).json({
            success: false,
            error: { message: 'Category cannot be its own parent' },
          });
          return;
        }

        const parent = await prisma.category.findFirst({
          where: {
            id: validatedData.parentId,
            tenantId,
            isActive: true,
          },
        });

        if (!parent) {
          res.status(400).json({
            success: false,
            error: { message: 'Invalid parent category' },
          });
          return;
        }

        // Check for circular reference
        let currentParent = parent;
        while (currentParent?.parentId) {
          if (currentParent.parentId === id) {
            res.status(400).json({
              success: false,
              error: { message: 'This would create a circular reference' },
            });
            return;
          }
          const nextParent = await prisma.category.findFirst({
            where: { id: currentParent.parentId },
          });
          if (!nextParent) break;
          currentParent = nextParent;
        }
      }

      // Check for duplicate name at the same level (if name is being changed)
      if (validatedData.name && validatedData.name !== existingCategory.name) {
        const duplicateCategory = await prisma.category.findFirst({
          where: {
            tenantId,
            name: validatedData.name,
            parentId: validatedData.parentId || existingCategory.parentId,
            id: { not: id },
            isActive: true,
          },
        });

        if (duplicateCategory) {
          res.status(400).json({
            success: false,
            error: { message: 'Category with this name already exists at this level' },
          });
          return;
        }
      }

      // Update category
      const category = await prisma.category.update({
        where: { id },
        data: validatedData,
        include: {
          parent: {
            select: {
              id: true,
              name: true,
            },
          },
          children: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              description: true,
              sortOrder: true,
            },
            orderBy: { sortOrder: 'asc' },
          },
          _count: {
            select: {
              products: true,
              children: true,
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        data: category,
        message: 'Category updated successfully',
      });
    } catch (error) {
      console.error('Error updating category:', error);

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
        error: { message: 'Failed to update category' },
      });
    }
  }

  /**
   * Delete category (soft delete by setting isActive to false)
   */
  static async deleteCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      // Check if category exists and belongs to tenant
      const existingCategory = await prisma.category.findFirst({
        where: {
          id,
          tenantId,
        },
        include: {
          products: {
            where: { isActive: true },
            take: 1,
          },
          children: {
            where: { isActive: true },
            take: 1,
          },
        },
      });

      if (!existingCategory) {
        res.status(404).json({
          success: false,
          error: { message: 'Category not found' },
        });
        return;
      }

      // Check if category has active products
      if (existingCategory.products.length > 0) {
        res.status(400).json({
          success: false,
          error: {
            message:
              'Cannot delete category with active products. Move products to another category first.',
          },
        });
        return;
      }

      // Check if category has active children
      if (existingCategory.children.length > 0) {
        res.status(400).json({
          success: false,
          error: {
            message:
              'Cannot delete category with active subcategories. Delete or move subcategories first.',
          },
        });
        return;
      }

      // Soft delete category
      await prisma.category.update({
        where: { id },
        data: { isActive: false },
      });

      res.status(200).json({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to delete category' },
      });
    }
  }

  /**
   * Reorder categories
   */
  static async reorderCategories(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { message: 'Authentication required' },
        });
        return;
      }

      const { categoryOrders } = req.body;

      if (!Array.isArray(categoryOrders)) {
        res.status(400).json({
          success: false,
          error: { message: 'categoryOrders must be an array' },
        });
        return;
      }

      // Validate that all categories belong to the tenant
      const categoryIds = categoryOrders.map((item: any) => item.id);
      const categories = await prisma.category.findMany({
        where: {
          id: { in: categoryIds },
          tenantId,
        },
      });

      if (categories.length !== categoryIds.length) {
        res.status(400).json({
          success: false,
          error: { message: 'One or more categories not found or access denied' },
        });
        return;
      }

      // Update sort orders
      const updatePromises = categoryOrders.map((item: any) =>
        prisma.category.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      );

      await Promise.all(updatePromises);

      res.status(200).json({
        success: true,
        message: 'Categories reordered successfully',
      });
    } catch (error) {
      console.error('Error reordering categories:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to reorder categories' },
      });
    }
  }
}

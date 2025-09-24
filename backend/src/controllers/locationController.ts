import { PrismaClient } from '@prisma/client';
import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Validation schemas
const createLocationSchema = z.object({
  name: z.string().min(1, 'Location name is required').max(255),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  zipCode: z.string().max(20).optional(),
  country: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  isDefault: z.boolean().default(false),
});

const updateLocationSchema = createLocationSchema.partial();

const locationQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('50'),
  search: z.string().optional(),
  isActive: z
    .string()
    .transform(val => val === 'true')
    .optional(),
  sortBy: z.enum(['name', 'city', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export class LocationController {
  /**
   * Get all locations with pagination and filtering
   */
  static async getLocations(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const query = locationQuerySchema.parse(req.query);
      const { page, limit, search, isActive, sortBy, sortOrder } = query;

      // Build where clause
      const where: any = {
        tenantId,
        ...(isActive !== undefined && { isActive }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { city: { contains: search, mode: 'insensitive' } },
            { address: { contains: search, mode: 'insensitive' } },
          ],
        }),
      };

      // Build order by clause
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get total count
      const total = await prisma.location.count({ where });

      // Get locations
      const locations = await prisma.location.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              inventory: true,
            },
          },
        },
      });

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      res.status(200).json({
        success: true,
        data: {
          locations,
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
      console.error('Error fetching locations:', error);

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
        error: { message: 'Failed to fetch locations' },
      });
    }
  }

  /**
   * Get single location by ID
   */
  static async getLocation(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const location = await prisma.location.findFirst({
        where: {
          id,
          tenantId,
        },
        include: {
          _count: {
            select: {
              inventory: true,
            },
          },
        },
      });

      if (!location) {
        res.status(404).json({
          success: false,
          error: { message: 'Location not found' },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: location,
      });
    } catch (error) {
      console.error('Error fetching location:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to fetch location' },
      });
    }
  }

  /**
   * Create new location
   */
  static async createLocation(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const validatedData = createLocationSchema.parse(req.body);

      // Check if location name already exists for this tenant
      const existingLocation = await prisma.location.findFirst({
        where: {
          tenantId,
          name: validatedData.name,
        },
      });

      if (existingLocation) {
        res.status(400).json({
          success: false,
          error: { message: 'Location with this name already exists' },
        });
        return;
      }

      // If this is set as default, unset other default locations
      if (validatedData.isDefault) {
        await prisma.location.updateMany({
          where: {
            tenantId,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }

      // Create location
      const location = await prisma.location.create({
        data: {
          ...validatedData,
          tenantId,
        },
        include: {
          _count: {
            select: {
              inventory: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: location,
        message: 'Location created successfully',
      });
    } catch (error) {
      console.error('Error creating location:', error);

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
        error: { message: 'Failed to create location' },
      });
    }
  }

  /**
   * Update location
   */
  static async updateLocation(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const validatedData = updateLocationSchema.parse(req.body);

      // Check if location exists and belongs to tenant
      const existingLocation = await prisma.location.findFirst({
        where: {
          id,
          tenantId,
        },
      });

      if (!existingLocation) {
        res.status(404).json({
          success: false,
          error: { message: 'Location not found' },
        });
        return;
      }

      // Check if name already exists for this tenant (if name is being updated)
      if (validatedData.name && validatedData.name !== existingLocation.name) {
        const nameExists = await prisma.location.findFirst({
          where: {
            tenantId,
            name: validatedData.name,
            id: { not: id },
          },
        });

        if (nameExists) {
          res.status(400).json({
            success: false,
            error: { message: 'Location with this name already exists' },
          });
          return;
        }
      }

      // If this is set as default, unset other default locations
      if (validatedData.isDefault && !existingLocation.isDefault) {
        await prisma.location.updateMany({
          where: {
            tenantId,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }

      // Update location
      const location = await prisma.location.update({
        where: { id },
        data: validatedData,
        include: {
          _count: {
            select: {
              inventory: true,
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        data: location,
        message: 'Location updated successfully',
      });
    } catch (error) {
      console.error('Error updating location:', error);

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
        error: { message: 'Failed to update location' },
      });
    }
  }

  /**
   * Delete location
   */
  static async deleteLocation(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      // Check if location exists and belongs to tenant
      const existingLocation = await prisma.location.findFirst({
        where: {
          id,
          tenantId,
        },
        include: {
          inventory: {
            take: 1,
          },
        },
      });

      if (!existingLocation) {
        res.status(404).json({
          success: false,
          error: { message: 'Location not found' },
        });
        return;
      }

      // Check if location has inventory
      if (existingLocation.inventory.length > 0) {
        res.status(400).json({
          success: false,
          error: {
            message:
              'Cannot delete location with existing inventory. Transfer inventory to another location first.',
          },
        });
        return;
      }

      // Don't allow deletion of the last active location
      const activeLocationCount = await prisma.location.count({
        where: {
          tenantId,
          isActive: true,
        },
      });

      if (activeLocationCount <= 1 && existingLocation.isActive) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Cannot delete the last active location. Create another location first.',
          },
        });
        return;
      }

      // If this is the default location, set another location as default
      if (existingLocation.isDefault) {
        const nextLocation = await prisma.location.findFirst({
          where: {
            tenantId,
            isActive: true,
            id: { not: id },
          },
        });

        if (nextLocation) {
          await prisma.location.update({
            where: { id: nextLocation.id },
            data: { isDefault: true },
          });
        }
      }

      // Soft delete by setting isActive to false
      await prisma.location.update({
        where: { id },
        data: { isActive: false },
      });

      res.status(200).json({
        success: true,
        message: 'Location deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting location:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to delete location' },
      });
    }
  }

  /**
   * Set location as default
   */
  static async setDefaultLocation(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      // Check if location exists and belongs to tenant
      const existingLocation = await prisma.location.findFirst({
        where: {
          id,
          tenantId,
          isActive: true,
        },
      });

      if (!existingLocation) {
        res.status(404).json({
          success: false,
          error: { message: 'Location not found or inactive' },
        });
        return;
      }

      // Unset other default locations and set this one as default
      await prisma.$transaction([
        prisma.location.updateMany({
          where: {
            tenantId,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        }),
        prisma.location.update({
          where: { id },
          data: { isDefault: true },
        }),
      ]);

      res.status(200).json({
        success: true,
        message: 'Default location updated successfully',
      });
    } catch (error) {
      console.error('Error setting default location:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to set default location' },
      });
    }
  }

  /**
   * Get location statistics
   */
  static async getLocationStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { message: 'Authentication required' },
        });
        return;
      }

      const [totalLocations, activeLocations, defaultLocation, locationsWithInventory] =
        await Promise.all([
          // Total locations
          prisma.location.count({
            where: { tenantId },
          }),

          // Active locations
          prisma.location.count({
            where: {
              tenantId,
              isActive: true,
            },
          }),

          // Default location
          prisma.location.findFirst({
            where: {
              tenantId,
              isDefault: true,
            },
            select: {
              id: true,
              name: true,
            },
          }),

          // Locations with inventory
          prisma.location.count({
            where: {
              tenantId,
              inventory: {
                some: {},
              },
            },
          }),
        ]);

      res.status(200).json({
        success: true,
        data: {
          totalLocations,
          activeLocations,
          inactiveLocations: totalLocations - activeLocations,
          defaultLocation,
          locationsWithInventory,
        },
      });
    } catch (error) {
      console.error('Error fetching location stats:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to fetch location statistics' },
      });
    }
  }
}

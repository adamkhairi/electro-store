import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create a default tenant
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: 'demo' },
    update: {},
    create: {
      name: 'Demo Electronics Store',
      subdomain: 'demo',
      plan: 'pro',
      status: 'active',
      settings: {
        currency: 'USD',
        timezone: 'America/New_York',
        taxRate: 0.08,
        features: {
          multiLocation: true,
          loyaltyProgram: true,
          advancedReporting: true,
        },
      },
    },
  });

  console.log(`✅ Created tenant: ${tenant.name}`);

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@demo.electrostock.com' },
    update: {},
    create: {
      email: 'admin@demo.electrostock.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      tenantId: tenant.id,
    },
  });

  console.log(`✅ Created admin user: ${adminUser.email}`);

  // Create default location
  const existingLocation = await prisma.location.findFirst({
    where: {
      tenantId: tenant.id,
      name: 'Main Store',
    },
  });

  const location =
    existingLocation ||
    (await prisma.location.create({
      data: {
        name: 'Main Store',
        address: '123 Electronics Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
        phone: '+1-555-0123',
        email: 'store@demo.electrostock.com',
        isActive: true,
        isDefault: true,
        tenantId: tenant.id,
      },
    }));

  console.log(`✅ Created location: ${location.name}`);

  // Create product categories
  const categories = [
    {
      name: 'Smartphones',
      description: 'Mobile phones and smartphones',
    },
    {
      name: 'Laptops',
      description: 'Laptop computers and notebooks',
    },
    {
      name: 'Tablets',
      description: 'Tablet computers and e-readers',
    },
    {
      name: 'Accessories',
      description: 'Electronic accessories and peripherals',
    },
  ];

  const createdCategories = [];
  for (const categoryData of categories) {
    const existingCategory = await prisma.category.findFirst({
      where: {
        tenantId: tenant.id,
        name: categoryData.name,
      },
    });

    const category =
      existingCategory ||
      (await prisma.category.create({
        data: {
          ...categoryData,
          tenantId: tenant.id,
          isActive: true,
        },
      }));
    createdCategories.push(category);
    console.log(`✅ Created category: ${category.name}`);
  }

  // Create sample products
  const smartphoneCategory = createdCategories.find(c => c.name === 'Smartphones');
  const laptopCategory = createdCategories.find(c => c.name === 'Laptops');

  const products = [
    {
      sku: 'IPHONE15-128-BLK',
      name: 'iPhone 15 128GB Black',
      description: 'Latest iPhone with advanced camera system and A17 chip',
      brand: 'Apple',
      model: 'iPhone 15',
      specifications: {
        storage: '128GB',
        color: 'Black',
        display: '6.1-inch Super Retina XDR',
        processor: 'A17 Bionic',
        camera: '48MP Main + 12MP Ultra Wide',
        battery: 'Up to 20 hours video playback',
      },
      warranty: '1 year limited warranty',
      costPrice: 699.0,
      sellingPrice: 799.0,
      msrp: 799.0,
      categoryId: smartphoneCategory?.id,
      tenantId: tenant.id,
      lowStockThreshold: 5,
      status: 'active',
    },
    {
      sku: 'MBA-M2-256-SLV',
      name: 'MacBook Air M2 256GB Silver',
      description: 'Ultra-thin laptop with M2 chip and all-day battery life',
      brand: 'Apple',
      model: 'MacBook Air M2',
      specifications: {
        processor: 'Apple M2 chip',
        memory: '8GB unified memory',
        storage: '256GB SSD',
        display: '13.6-inch Liquid Retina',
        graphics: '8-core GPU',
        battery: 'Up to 18 hours',
      },
      warranty: '1 year limited warranty',
      costPrice: 999.0,
      sellingPrice: 1199.0,
      msrp: 1199.0,
      categoryId: laptopCategory?.id,
      tenantId: tenant.id,
      lowStockThreshold: 3,
      status: 'active',
    },
  ];

  for (const productData of products) {
    const product = await prisma.product.upsert({
      where: { sku: productData.sku },
      update: {},
      create: productData,
    });

    // Create initial inventory
    const existingInventory = await prisma.inventory.findFirst({
      where: {
        productId: product.id,
        variantId: null,
        locationId: location.id,
      },
    });

    if (!existingInventory) {
      await prisma.inventory.create({
        data: {
          productId: product.id,
          locationId: location.id,
          tenantId: tenant.id,
          quantity: 25,
          reservedQuantity: 0,
          availableQuantity: 25,
          reorderPoint: product.lowStockThreshold,
          reorderQuantity: 50,
        },
      });
    }

    console.log(`✅ Created product: ${product.name} with inventory`);
  }

  // Create sample customer
  const existingCustomer = await prisma.customer.findFirst({
    where: {
      tenantId: tenant.id,
      customerNumber: 'CUST-001',
    },
  });

  const customer =
    existingCustomer ||
    (await prisma.customer.create({
      data: {
        customerNumber: 'CUST-001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-0199',
        address: '456 Customer Lane',
        city: 'New York',
        state: 'NY',
        zipCode: '10002',
        country: 'USA',
        loyaltyPoints: 100,
        loyaltyTier: 'silver',
        tenantId: tenant.id,
      },
    }));

  console.log(`✅ Created customer: ${customer.firstName} ${customer.lastName}`);

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch(e => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

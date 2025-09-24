import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SaleItemInput {
  productId?: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  discountType?: string;
  discountReason?: string;
  serialNumbers?: string[];
  batchNumber?: string;
}

export interface SalePaymentInput {
  method: string;
  amount: number;
  processorTransactionId?: string;
  authorizationCode?: string;
  cardLast4?: string;
  cardType?: string;
  cardBrand?: string;
  checkNumber?: string;
  giftCardNumber?: string;
  changeGiven?: number;
  reference?: string;
  notes?: string;
}

export interface CreateSaleInput {
  tenantId: string;
  salesPersonId: string;
  locationId: string;
  customerId?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
  items: SaleItemInput[];
  payments: SalePaymentInput[];
  discountAmount?: number;
  taxAmount?: number;
  terminalId?: string;
  notes?: string;
}

export class SaleService {
  /**
   * Create a new sale transaction
   */
  static async createSale(input: CreateSaleInput) {
    return await prisma.$transaction(async (tx: any) => {
      try {
        // Generate sale number
        const saleNumber = await this.generateSaleNumber(input.tenantId, tx);

        // Calculate totals
        const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

        const totalDiscounts =
          input.items.reduce((sum, item) => sum + (item.discountAmount || 0), 0) +
          (input.discountAmount || 0);

        const taxAmount = input.taxAmount || 0;
        const total = subtotal - totalDiscounts + taxAmount;

        // Validate payment amounts
        const totalPayments = input.payments.reduce((sum, payment) => sum + payment.amount, 0);

        if (Math.abs(totalPayments - total) > 0.01) {
          throw new Error('Payment amount does not match sale total');
        }

        // Create the sale
        const sale = await tx.sale.create({
          data: {
            saleNumber,
            tenantId: input.tenantId,
            salesPersonId: input.salesPersonId,
            locationId: input.locationId,
            customerId: input.customerId,
            customerEmail: input.customerEmail,
            customerPhone: input.customerPhone,
            customerName: input.customerName,
            subtotal,
            discountAmount: totalDiscounts,
            taxAmount,
            total,
            tenderedAmount: totalPayments,
            changeAmount: Math.max(0, totalPayments - total),
            paymentMethod: input.payments.length === 1 ? input.payments[0].method : 'split',
            terminalId: input.terminalId,
            notes: input.notes,
            completedAt: new Date(),
          },
        });

        // Process sale items and update inventory
        const saleItems = [];
        for (const itemInput of input.items) {
          // Get product details
          const product = await tx.product.findUnique({
            where: { id: itemInput.productId },
            include: { category: true },
          });

          if (!product) {
            throw new Error(`Product not found: ${itemInput.productId}`);
          }

          // Get inventory
          const inventory = await tx.inventory.findFirst({
            where: {
              productId: itemInput.productId,
              variantId: itemInput.variantId,
              locationId: input.locationId,
              tenantId: input.tenantId,
            },
          });

          if (!inventory) {
            throw new Error(`Product not available at this location: ${product.name}`);
          }

          if (inventory.availableQuantity < itemInput.quantity) {
            throw new Error(
              `Insufficient stock for ${product.name}. Available: ${inventory.availableQuantity}, Requested: ${itemInput.quantity}`
            );
          }

          const unitCost = inventory.locationCostPrice || product.costPrice;
          const totalPrice =
            itemInput.quantity * itemInput.unitPrice - (itemInput.discountAmount || 0);
          const totalCost = Number(unitCost) * itemInput.quantity;

          // Create sale item
          const saleItem = await tx.saleItem.create({
            data: {
              saleId: sale.id,
              productId: itemInput.productId,
              variantId: itemInput.variantId,
              quantity: itemInput.quantity,
              unitPrice: itemInput.unitPrice,
              originalPrice: itemInput.unitPrice,
              discountAmount: itemInput.discountAmount || 0,
              discountType: itemInput.discountType,
              discountReason: itemInput.discountReason,
              totalPrice,
              unitCost: Number(unitCost),
              totalCost,
              productSku: product.sku,
              productName: product.name,
              serialNumbers: itemInput.serialNumbers || [],
              batchNumber: itemInput.batchNumber,
              taxRate: 0,
              taxAmount: 0,
            },
          });

          saleItems.push(saleItem);

          // Update inventory
          await tx.inventory.update({
            where: { id: inventory.id },
            data: {
              quantity: inventory.quantity - itemInput.quantity,
              availableQuantity: inventory.availableQuantity - itemInput.quantity,
            },
          });

          // Create stock movement record
          await tx.stockMovement.create({
            data: {
              inventoryId: inventory.id,
              type: 'sale',
              quantity: -itemInput.quantity,
              beforeQuantity: inventory.quantity,
              afterQuantity: inventory.quantity - itemInput.quantity,
              reference: saleNumber,
              notes: `Sale to ${input.customerName || input.customerEmail || 'Walk-in customer'}`,
            },
          });
        }

        // Create payment records
        const salePayments = [];
        for (const paymentInput of input.payments) {
          const salePayment = await tx.salePayment.create({
            data: {
              saleId: sale.id,
              amount: paymentInput.amount,
              method: paymentInput.method,
              processorTransactionId: paymentInput.processorTransactionId,
              authorizationCode: paymentInput.authorizationCode,
              cardLast4: paymentInput.cardLast4,
              cardType: paymentInput.cardType,
              cardBrand: paymentInput.cardBrand,
              checkNumber: paymentInput.checkNumber,
              giftCardNumber: paymentInput.giftCardNumber,
              changeGiven: paymentInput.changeGiven || null,
              reference: paymentInput.reference,
              notes: paymentInput.notes,
            },
          });
          salePayments.push(salePayment);
        }

        // Return complete sale with items and payments
        return {
          ...sale,
          items: saleItems,
          payments: salePayments,
        };
      } catch (error) {
        console.error('Error creating sale:', error);
        throw error;
      }
    });
  }

  /**
   * Get sale by ID with full details
   */
  static async getSaleById(saleId: string, tenantId: string) {
    const sale = await prisma.sale.findFirst({
      where: {
        id: saleId,
        tenantId,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                barcode: true,
                brand: true,
                model: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
                sku: true,
                attributes: true,
              },
            },
          },
        },
        payments: true,
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            customerNumber: true,
          },
        },
        salesPerson: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
          },
        },
      },
    });

    if (!sale) {
      throw new Error('Sale not found');
    }

    return sale;
  }

  /**
   * Get sales with basic filtering
   */
  static async getSales(filters: {
    tenantId: string;
    locationId?: string;
    page?: number;
    limit?: number;
  }) {
    const { tenantId, locationId, page = 1, limit = 25 } = filters;

    const where: any = {
      tenantId,
      ...(locationId && { locationId }),
    };

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              customerNumber: true,
            },
          },
          salesPerson: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          location: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              items: true,
              payments: true,
            },
          },
        },
        orderBy: { saleDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.sale.count({ where }),
    ]);

    return {
      sales,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Generate unique sale number
   */
  private static async generateSaleNumber(
    tenantId: string,
    tx: any,
    prefix: string = 'SALE'
  ): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    // Get last sale number for today
    const lastSale = await tx.sale.findFirst({
      where: {
        tenantId,
        saleNumber: {
          startsWith: `${prefix}-${dateStr}`,
        },
      },
      orderBy: {
        saleNumber: 'desc',
      },
    });

    let sequence = 1;
    if (lastSale) {
      const lastSequence = parseInt(lastSale.saleNumber.split('-').pop() || '0');
      sequence = lastSequence + 1;
    }

    return `${prefix}-${dateStr}-${sequence.toString().padStart(4, '0')}`;
  }

  /**
   * Generate receipt data
   */
  static async generateReceipt(saleId: string, tenantId: string) {
    const sale = await this.getSaleById(saleId, tenantId);

    const receipt = {
      saleNumber: sale.saleNumber,
      saleDate: sale.saleDate,
      location: sale.location,
      salesPerson: `${sale.salesPerson.firstName} ${sale.salesPerson.lastName}`,
      customer: sale.customer
        ? {
            name: `${sale.customer.firstName || ''} ${sale.customer.lastName || ''}`.trim(),
            email: sale.customer.email,
            phone: sale.customer.phone,
            customerNumber: sale.customer.customerNumber,
          }
        : {
            name: sale.customerName,
            email: sale.customerEmail,
            phone: sale.customerPhone,
          },
      items: sale.items.map((item: any) => ({
        name: item.productName,
        sku: item.productSku,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        discountAmount: Number(item.discountAmount),
        totalPrice: Number(item.totalPrice),
      })),
      subtotal: Number(sale.subtotal),
      discountAmount: Number(sale.discountAmount),
      taxAmount: Number(sale.taxAmount),
      total: Number(sale.total),
      payments: sale.payments.map((payment: any) => ({
        method: payment.method,
        amount: Number(payment.amount),
        cardLast4: payment.cardLast4,
        changeGiven: payment.changeGiven ? Number(payment.changeGiven) : undefined,
      })),
      tenderedAmount: sale.tenderedAmount ? Number(sale.tenderedAmount) : undefined,
      changeAmount: sale.changeAmount ? Number(sale.changeAmount) : undefined,
    };

    return receipt;
  }
}

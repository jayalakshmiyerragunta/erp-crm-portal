import prisma from '../../config/db';
import { AppError } from '../../middleware/errorHandler';
import { parsePagination, paginate } from '../../utils/helpers';
import { CreateChallanInput } from './challans.schema';
import { ChallanStatus } from '@prisma/client';

interface ListQuery extends Record<string, unknown> {
  status?: ChallanStatus;
  customerId?: string;
  search?: string;
  page?: string;
  limit?: string;
}

/** Generate next challan number: CH-YYYYMMDD-XXXX */
async function generateChallanNumber(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `CH-${dateStr}-`;

  const last = await prisma.challan.findFirst({
    where: { challanNumber: { startsWith: prefix } },
    orderBy: { challanNumber: 'desc' },
  });

  let seq = 1;
  if (last) {
    const lastSeq = parseInt(last.challanNumber.slice(-4), 10);
    seq = lastSeq + 1;
  }

  return `${prefix}${String(seq).padStart(4, '0')}`;
}

export async function getAll(query: ListQuery) {
  const { page, limit, skip } = parsePagination(query);

  const where = {
    AND: [
      query.status ? { status: query.status } : {},
      query.customerId ? { customerId: query.customerId } : {},
      query.search
        ? {
            OR: [
              { challanNumber: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {},
    ],
  };

  const [challans, total] = await prisma.$transaction([
    prisma.challan.findMany({
      where,
      include: {
        customer: { select: { name: true, mobile: true, businessName: true } },
        creator: { select: { name: true } },
        items: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.challan.count({ where }),
  ]);

  return { challans, pagination: paginate(total, page, limit) };
}

export async function getById(id: string) {
  const challan = await prisma.challan.findUnique({
    where: { id },
    include: {
      customer: true,
      creator: { select: { name: true, role: true } },
      items: {
        include: { product: { select: { name: true, sku: true, currentStock: true } } },
      },
    },
  });
  if (!challan) throw new AppError(404, 'Challan not found');
  return challan;
}

export async function create(input: CreateChallanInput, userId: string) {
  // 1. Validate customer exists
  const customer = await prisma.customer.findUnique({ where: { id: input.customerId } });
  if (!customer) throw new AppError(404, 'Customer not found');

  // 2. Validate products exist and check stock if confirming
  const productIds = input.items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });

  if (products.length !== productIds.length) {
    throw new AppError(404, 'One or more products not found');
  }

  // Check for inactive products
  const inactive = products.filter((p) => !p.isActive);
  if (inactive.length > 0) {
    throw new AppError(400, `Products are inactive: ${inactive.map((p) => p.name).join(', ')}`);
  }

  // If confirming, check stock
  if (input.status === 'CONFIRMED') {
    const insufficientStock: string[] = [];
    for (const item of input.items) {
      const product = products.find((p) => p.id === item.productId)!;
      if (product.currentStock < item.quantity) {
        insufficientStock.push(
          `"${product.name}" (available: ${product.currentStock}, requested: ${item.quantity})`
        );
      }
    }
    if (insufficientStock.length > 0) {
      throw new AppError(
        422,
        `Insufficient stock for: ${insufficientStock.join('; ')}`
      );
    }
  }

  // 3. Calculate totals
  const productMap = new Map(products.map((p) => [p.id, p]));
  let totalQty = 0;
  let totalAmount = 0;

  const itemsData = input.items.map((item) => {
    const product = productMap.get(item.productId)!;
    const itemTotal = Number(product.unitPrice) * item.quantity;
    totalQty += item.quantity;
    totalAmount += itemTotal;

    return {
      productId: item.productId,
      productSnapshot: {
        name: product.name,
        sku: product.sku,
        category: product.category,
        warehouseLocation: product.warehouseLocation,
      },
      quantity: item.quantity,
      unitPrice: product.unitPrice,
      totalPrice: itemTotal,
    };
  });

  // 4. Generate challan number
  const challanNumber = await generateChallanNumber();

  // 5. Create challan + items in transaction
  const challan = await prisma.$transaction(async (tx) => {
    const newChallan = await tx.challan.create({
      data: {
        challanNumber,
        customerId: input.customerId,
        customerSnapshot: {
          name: customer.name,
          mobile: customer.mobile,
          email: customer.email,
          businessName: customer.businessName,
          gstNumber: customer.gstNumber,
        },
        status: input.status as ChallanStatus,
        totalQty,
        totalAmount,
        createdBy: userId,
        items: { create: itemsData },
      },
      include: { items: true, customer: { select: { name: true } }, creator: { select: { name: true } } },
    });

    // 6. Deduct stock if CONFIRMED
    if (input.status === 'CONFIRMED') {
      for (const item of input.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { decrement: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            movementType: 'OUT',
            reason: `Challan #${challanNumber}`,
            createdBy: userId,
          },
        });
      }
    }

    return newChallan;
  });

  return challan;
}

export async function confirm(id: string, userId: string) {
  const challan = await prisma.challan.findUnique({ where: { id }, include: { items: true } });
  if (!challan) throw new AppError(404, 'Challan not found');
  if (challan.status !== 'DRAFT') {
    throw new AppError(400, `Cannot confirm a challan with status: ${challan.status}`);
  }

  // Check stock for all items
  const productIds = challan.items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const insufficientStock: string[] = [];
  for (const item of challan.items) {
    const product = productMap.get(item.productId)!;
    if (product.currentStock < item.quantity) {
      insufficientStock.push(
        `"${product.name}" (available: ${product.currentStock}, requested: ${item.quantity})`
      );
    }
  }
  if (insufficientStock.length > 0) {
    throw new AppError(422, `Insufficient stock for: ${insufficientStock.join('; ')}`);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.challan.update({
      where: { id },
      data: { status: 'CONFIRMED' },
    });

    for (const item of challan.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { currentStock: { decrement: item.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          movementType: 'OUT',
          reason: `Challan #${challan.challanNumber}`,
          createdBy: userId,
        },
      });
    }

    return updated;
  });
}

export async function cancel(id: string, userId: string) {
  const challan = await prisma.challan.findUnique({ where: { id }, include: { items: true } });
  if (!challan) throw new AppError(404, 'Challan not found');
  if (challan.status === 'CANCELLED') {
    throw new AppError(400, 'Challan is already cancelled');
  }

  const wasConfirmed = challan.status === 'CONFIRMED';

  return prisma.$transaction(async (tx) => {
    const updated = await tx.challan.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    // Restore stock only if challan was CONFIRMED
    if (wasConfirmed) {
      for (const item of challan.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { increment: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            movementType: 'IN',
            reason: `Cancelled Challan #${challan.challanNumber}`,
            createdBy: userId,
          },
        });
      }
    }

    return updated;
  });
}

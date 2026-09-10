import prisma from '../../config/db';
import { AppError } from '../../middleware/errorHandler';
import { parsePagination, paginate } from '../../utils/helpers';
import {
  CreateProductInput,
  UpdateProductInput,
  StockAdjustmentInput,
} from './products.schema';

interface ListQuery extends Record<string, unknown> {
  search?: string;
  category?: string;
  lowStock?: string;
  page?: string;
  limit?: string;
}

export async function getAll(query: ListQuery) {
  const { page, limit, skip } = parsePagination(query);

  const where = {
    AND: [
      query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' as const } },
              { sku: { contains: query.search, mode: 'insensitive' as const } },
              { category: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {},
      query.category
        ? { category: { equals: query.category, mode: 'insensitive' as const } }
        : {},
      // lowStock filter: currentStock <= minStockQty
      query.lowStock === 'true'
        ? { currentStock: { lte: prisma.product.fields.minStockQty } }
        : {},
    ],
  };

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where }),
  ]);

  // Annotate with low stock flag
  const annotated = products.map((p) => ({
    ...p,
    isLowStock: p.currentStock <= p.minStockQty,
  }));

  return { products: annotated, pagination: paginate(total, page, limit) };
}

export async function getById(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new AppError(404, 'Product not found');
  return { ...product, isLowStock: product.currentStock <= product.minStockQty };
}

export async function create(input: CreateProductInput) {
  return prisma.product.create({ data: input });
}

export async function update(id: string, input: UpdateProductInput) {
  await getById(id);
  return prisma.product.update({ where: { id }, data: input });
}

export async function addStockIn(
  productId: string,
  userId: string,
  input: StockAdjustmentInput
) {
  const product = await getById(productId);

  const [updated] = await prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data: { currentStock: { increment: input.quantity } },
    }),
    prisma.stockMovement.create({
      data: {
        productId,
        quantity: input.quantity,
        movementType: 'IN',
        reason: input.reason,
        createdBy: userId,
      },
    }),
  ]);

  return updated;
}

export async function getMovements(productId: string, query: Record<string, string>) {
  await getById(productId);
  const { page, limit, skip } = parsePagination(query);

  const [movements, total] = await prisma.$transaction([
    prisma.stockMovement.findMany({
      where: { productId },
      include: { user: { select: { name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.stockMovement.count({ where: { productId } }),
  ]);

  return { movements, pagination: paginate(total, page, limit) };
}

export async function getCategories() {
  const categories = await prisma.product.findMany({
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  });
  return categories.map((c) => c.category);
}

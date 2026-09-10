import prisma from '../../config/db';
import { AppError } from '../../middleware/errorHandler';
import { parsePagination, paginate } from '../../utils/helpers';
import {
  CreateCustomerInput,
  UpdateCustomerInput,
  AddFollowupInput,
} from './customers.schema';
import { CustomerStatus, CustomerType } from '@prisma/client';

interface ListQuery extends Record<string, unknown> {
  search?: string;
  status?: CustomerStatus;
  customerType?: CustomerType;
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
              { mobile: { contains: query.search } },
              { businessName: { contains: query.search, mode: 'insensitive' as const } },
              { email: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {},
      query.status ? { status: query.status } : {},
      query.customerType ? { customerType: query.customerType } : {},
    ],
  };

  const [customers, total] = await prisma.$transaction([
    prisma.customer.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.customer.count({ where }),
  ]);

  return { customers, pagination: paginate(total, page, limit) };
}

export async function getById(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      followups: {
        include: { user: { select: { name: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { challans: true } },
    },
  });
  if (!customer) throw new AppError(404, 'Customer not found');
  return customer;
}

export async function create(input: CreateCustomerInput) {
  return prisma.customer.create({
    data: {
      ...input,
      email: input.email || null,
      gstNumber: input.gstNumber || null,
      followUpDate: input.followUpDate ? new Date(input.followUpDate) : null,
    },
  });
}

export async function update(id: string, input: UpdateCustomerInput) {
  await getById(id);
  return prisma.customer.update({
    where: { id },
    data: {
      ...input,
      email: input.email !== undefined ? (input.email || null) : undefined,
      gstNumber: input.gstNumber !== undefined ? (input.gstNumber || null) : undefined,
      followUpDate:
        input.followUpDate !== undefined
          ? input.followUpDate
            ? new Date(input.followUpDate)
            : null
          : undefined,
    },
  });
}

export async function addFollowup(customerId: string, userId: string, input: AddFollowupInput) {
  // ensure customer exists
  const exists = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!exists) throw new AppError(404, 'Customer not found');

  return prisma.customerFollowup.create({
    data: { customerId, note: input.note, createdBy: userId },
    include: { user: { select: { name: true, role: true } } },
  });
}

export async function getFollowups(customerId: string) {
  const exists = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!exists) throw new AppError(404, 'Customer not found');

  return prisma.customerFollowup.findMany({
    where: { customerId },
    include: { user: { select: { name: true, role: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

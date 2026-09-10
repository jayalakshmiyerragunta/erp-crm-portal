import bcrypt from 'bcryptjs';
import prisma from '../../config/db';
import { AppError } from '../../middleware/errorHandler';
import { CreateUserInput, UpdateUserInput } from './users.schema';

const safeUser = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

export async function getAll() {
  return prisma.user.findMany({
    select: safeUser,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getById(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: safeUser });
  if (!user) throw new AppError(404, 'User not found');
  return user;
}

export async function create(input: CreateUserInput) {
  const passwordHash = await bcrypt.hash(input.password, 10);
  return prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash, role: input.role },
    select: safeUser,
  });
}

export async function update(id: string, input: UpdateUserInput) {
  await getById(id); // ensure exists
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.role !== undefined) data.role = input.role;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.password !== undefined) data.passwordHash = await bcrypt.hash(input.password, 10);

  return prisma.user.update({ where: { id }, data, select: safeUser });
}

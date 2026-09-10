import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../config/db';
import { config } from '../../config/env';
import { AppError } from '../../middleware/errorHandler';
import { LoginInput } from './auth.schema';

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user || !user.isActive) {
    throw new AppError(401, 'Invalid email or password');
  }

  const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
  if (!isValidPassword) {
    throw new AppError(401, 'Invalid email or password');
  }

  const payload = { userId: user.id, email: user.email, role: user.role };
  const token = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

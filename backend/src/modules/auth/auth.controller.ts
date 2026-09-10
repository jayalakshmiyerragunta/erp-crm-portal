import { Request, Response } from 'express';
import { loginSchema } from './auth.schema';
import * as authService from './auth.service';
import { successResponse } from '../../utils/helpers';

export async function login(req: Request, res: Response): Promise<void> {
  const input = loginSchema.parse(req.body);
  const result = await authService.login(input);
  res.status(200).json(successResponse(result, 'Login successful'));
}

export async function me(req: Request, res: Response): Promise<void> {
  res.status(200).json(successResponse(req.user, 'Current user'));
}

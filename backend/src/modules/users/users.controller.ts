import { Request, Response } from 'express';
import * as usersService from './users.service';
import { createUserSchema, updateUserSchema } from './users.schema';
import { successResponse } from '../../utils/helpers';

export async function getAll(req: Request, res: Response): Promise<void> {
  const users = await usersService.getAll();
  res.json(successResponse(users));
}

export async function getById(req: Request, res: Response): Promise<void> {
  const user = await usersService.getById(req.params.id);
  res.json(successResponse(user));
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = createUserSchema.parse(req.body);
  const user = await usersService.create(input);
  res.status(201).json(successResponse(user, 'User created successfully'));
}

export async function update(req: Request, res: Response): Promise<void> {
  const input = updateUserSchema.parse(req.body);
  const user = await usersService.update(req.params.id, input);
  res.json(successResponse(user, 'User updated successfully'));
}

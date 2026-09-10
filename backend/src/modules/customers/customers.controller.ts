import { Request, Response } from 'express';
import * as customersService from './customers.service';
import {
  createCustomerSchema,
  updateCustomerSchema,
  addFollowupSchema,
} from './customers.schema';
import { successResponse } from '../../utils/helpers';

export async function getAll(req: Request, res: Response): Promise<void> {
  const result = await customersService.getAll(req.query as Record<string, string>);
  res.json(successResponse(result));
}

export async function getById(req: Request, res: Response): Promise<void> {
  const customer = await customersService.getById(req.params.id);
  res.json(successResponse(customer));
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = createCustomerSchema.parse(req.body);
  const customer = await customersService.create(input);
  res.status(201).json(successResponse(customer, 'Customer created successfully'));
}

export async function update(req: Request, res: Response): Promise<void> {
  const input = updateCustomerSchema.parse(req.body);
  const customer = await customersService.update(req.params.id, input);
  res.json(successResponse(customer, 'Customer updated successfully'));
}

export async function addFollowup(req: Request, res: Response): Promise<void> {
  const input = addFollowupSchema.parse(req.body);
  const followup = await customersService.addFollowup(
    req.params.id,
    req.user!.userId,
    input
  );
  res.status(201).json(successResponse(followup, 'Follow-up added successfully'));
}

export async function getFollowups(req: Request, res: Response): Promise<void> {
  const followups = await customersService.getFollowups(req.params.id);
  res.json(successResponse(followups));
}

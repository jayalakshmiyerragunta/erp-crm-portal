import { Request, Response } from 'express';
import * as challansService from './challans.service';
import { createChallanSchema } from './challans.schema';
import { successResponse } from '../../utils/helpers';

export async function getAll(req: Request, res: Response): Promise<void> {
  const result = await challansService.getAll(req.query as Record<string, string>);
  res.json(successResponse(result));
}

export async function getById(req: Request, res: Response): Promise<void> {
  const challan = await challansService.getById(req.params.id);
  res.json(successResponse(challan));
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = createChallanSchema.parse(req.body);
  const challan = await challansService.create(input, req.user!.userId);
  res.status(201).json(successResponse(challan, 'Challan created successfully'));
}

export async function confirm(req: Request, res: Response): Promise<void> {
  const challan = await challansService.confirm(req.params.id, req.user!.userId);
  res.json(successResponse(challan, 'Challan confirmed and stock deducted'));
}

export async function cancel(req: Request, res: Response): Promise<void> {
  const challan = await challansService.cancel(req.params.id, req.user!.userId);
  res.json(successResponse(challan, 'Challan cancelled'));
}

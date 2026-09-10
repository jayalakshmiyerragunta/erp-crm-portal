import { Request, Response } from 'express';
import * as productsService from './products.service';
import {
  createProductSchema,
  updateProductSchema,
  stockAdjustmentSchema,
} from './products.schema';
import { successResponse } from '../../utils/helpers';

export async function getAll(req: Request, res: Response): Promise<void> {
  const result = await productsService.getAll(req.query as Record<string, string>);
  res.json(successResponse(result));
}

export async function getById(req: Request, res: Response): Promise<void> {
  const product = await productsService.getById(req.params.id);
  res.json(successResponse(product));
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = createProductSchema.parse(req.body);
  const product = await productsService.create(input);
  res.status(201).json(successResponse(product, 'Product created successfully'));
}

export async function update(req: Request, res: Response): Promise<void> {
  const input = updateProductSchema.parse(req.body);
  const product = await productsService.update(req.params.id, input);
  res.json(successResponse(product, 'Product updated successfully'));
}

export async function addStockIn(req: Request, res: Response): Promise<void> {
  const input = stockAdjustmentSchema.parse(req.body);
  const product = await productsService.addStockIn(req.params.id, req.user!.userId, input);
  res.json(successResponse(product, 'Stock updated successfully'));
}

export async function getMovements(req: Request, res: Response): Promise<void> {
  const result = await productsService.getMovements(
    req.params.id,
    req.query as Record<string, string>
  );
  res.json(successResponse(result));
}

export async function getCategories(req: Request, res: Response): Promise<void> {
  const categories = await productsService.getCategories();
  res.json(successResponse(categories));
}

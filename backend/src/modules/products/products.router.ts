import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import * as productsController from './products.controller';

const router = Router();

router.use(authenticate);

router.get('/categories', productsController.getCategories);
router.get('/', productsController.getAll);
router.get('/:id', productsController.getById);
router.post('/', authorize('ADMIN', 'WAREHOUSE'), productsController.create);
router.patch('/:id', authorize('ADMIN', 'WAREHOUSE'), productsController.update);
router.post('/:id/stock', authorize('ADMIN', 'WAREHOUSE'), productsController.addStockIn);
router.get('/:id/movements', productsController.getMovements);

export default router;

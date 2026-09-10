import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import * as challansController from './challans.controller';

const router = Router();

router.use(authenticate);

router.get('/', challansController.getAll);
router.get('/:id', challansController.getById);
router.post('/', authorize('ADMIN', 'SALES'), challansController.create);
router.patch('/:id/confirm', authorize('ADMIN', 'SALES'), challansController.confirm);
router.patch('/:id/cancel', authorize('ADMIN', 'SALES'), challansController.cancel);

export default router;

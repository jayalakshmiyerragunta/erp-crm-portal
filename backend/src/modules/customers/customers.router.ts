import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import * as customersController from './customers.controller';

const router = Router();

router.use(authenticate);

router.get('/', customersController.getAll);
router.get('/:id', customersController.getById);
router.post('/', authorize('ADMIN', 'SALES'), customersController.create);
router.patch('/:id', authorize('ADMIN', 'SALES'), customersController.update);
router.get('/:id/followups', customersController.getFollowups);
router.post('/:id/followups', authorize('ADMIN', 'SALES'), customersController.addFollowup);

export default router;

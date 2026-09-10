import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import * as usersController from './users.controller';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/', usersController.getAll);
router.get('/:id', usersController.getById);
router.post('/', usersController.create);
router.patch('/:id', usersController.update);

export default router;

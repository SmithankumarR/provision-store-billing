import { Router } from 'express';
import * as categoryController from '../controllers/categoryController';
import {
  createCategoryRules,
  updateCategoryRules,
  categoryIdRule,
  listCategoryRules,
} from '../validators/categoryValidator';
import { protect, authorize } from '../middlewares/authMiddleware';
import { UserRole } from '../models/User';

const router = Router();

// Protect all category routes with JWT authentication
router.use(protect);

// Accessible by both OWNER and BILLER
router.get('/', listCategoryRules, categoryController.getCategories);
router.get('/:id', categoryIdRule, categoryController.getCategoryById);

// OWNER ONLY Routes
router.post(
  '/',
  authorize(UserRole.OWNER),
  createCategoryRules,
  categoryController.createCategory
);

router.put(
  '/:id',
  authorize(UserRole.OWNER),
  updateCategoryRules,
  categoryController.updateCategory
);

router.patch(
  '/:id/status',
  authorize(UserRole.OWNER),
  categoryIdRule,
  categoryController.toggleCategoryStatus
);

router.delete(
  '/:id',
  authorize(UserRole.OWNER),
  categoryIdRule,
  categoryController.deleteCategory
);

export default router;

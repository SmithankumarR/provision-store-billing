import { Router } from 'express';
import * as billController from '../controllers/billController';
import {
  createBillRules,
  billIdRule,
  listBillRules,
} from '../validators/billValidator';
import { protect, authorize } from '../middlewares/authMiddleware';
import { UserRole } from '../models/User';

const router = Router();

// Protect all routes with JWT authentication
router.use(protect);

router.post('/', createBillRules, billController.createBill);
router.get('/', listBillRules, billController.getBills);
router.get('/today', billController.getTodayBillsSummary);
router.get('/:id', billIdRule, billController.getBillById);

// OWNER ONLY Routes
router.post(
  '/:id/cancel',
  authorize(UserRole.OWNER),
  billIdRule,
  billController.cancelBill
);

export default router;

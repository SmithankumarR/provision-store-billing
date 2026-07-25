import { Router } from 'express';
import * as reportController from '../controllers/reportController';
import { protect, authorize } from '../middlewares/authMiddleware';
import { UserRole } from '../models/User';

const router = Router();

// Restrict all dashboard & report endpoints to OWNER
router.use(protect, authorize(UserRole.OWNER));

// Dashboard KPI Cards & Charts
router.get('/dashboard/summary', reportController.getDashboardSummary);
router.get('/dashboard/charts', reportController.getDashboardCharts);

// Sales & Item Performance Reports
router.get('/reports/sales', reportController.getSalesReport);
router.get('/reports/items-performance', reportController.getTopAndLowSellingItems);

export default router;

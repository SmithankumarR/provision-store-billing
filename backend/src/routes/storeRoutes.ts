import { Router } from 'express';
import * as storeController from '../controllers/storeController';
import { protect, authorize } from '../middlewares/authMiddleware';
import { UserRole } from '../models/User';

const router = Router();

// Protect all routes with JWT
router.use(protect);

// Store Profile Endpoints
router.get('/store', storeController.getStoreProfile);
router.put('/store', authorize(UserRole.OWNER), storeController.updateStoreProfile);

// App Settings Endpoints
router.get('/settings', storeController.getAppSettings);
router.put('/settings', storeController.updateAppSettings);

export default router;

import { Router } from 'express';
import * as storeController from '../controllers/storeController';
import { protect, authorize } from '../middlewares/authMiddleware';
import { UserRole } from '../models/User';

const router = Router();

router.use(protect);

// Store Profile
router.get('/profile', storeController.getStoreProfile);
router.put('/profile', authorize(UserRole.OWNER), storeController.updateStoreProfile);

// App Preferences
router.get('/settings', storeController.getAppSettings);
router.put('/settings', storeController.updateAppSettings);

export default router;

import { Router } from 'express';
import * as authController from '../controllers/authController';
import {
  registerStoreRules,
  registerBillerRules,
  loginRules,
  refreshTokenRules,
  changePasswordRules,
} from '../validators/authValidator';
import { protect, authorize } from '../middlewares/authMiddleware';
import { UserRole } from '../models/User';

const router = Router();

// Public Routes
router.post('/register-store', registerStoreRules, authController.registerStore);
router.post('/login', loginRules, authController.login);
router.post('/refresh-token', refreshTokenRules, authController.refreshToken);

// Protected Routes (Requires valid JWT)
router.use(protect);

router.get('/me', authController.getMe);
router.post('/logout', authController.logout);
router.put('/change-password', changePasswordRules, authController.changePassword);

// Owner Only Routes
router.post(
  '/register-biller',
  authorize(UserRole.OWNER),
  registerBillerRules,
  authController.registerBiller
);

export default router;

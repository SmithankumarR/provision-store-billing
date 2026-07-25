import { Router } from 'express';
import * as customerController from '../controllers/customerController';
import {
  createCustomerRules,
  updateCustomerRules,
  customerIdRule,
  listCustomerRules,
} from '../validators/customerValidator';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

// Protect all routes with JWT authentication
router.use(protect);

router.post('/', createCustomerRules, customerController.createCustomer);
router.get('/', listCustomerRules, customerController.getCustomers);
router.get('/phone/:phone', customerController.getCustomerByPhone);
router.get('/:id', customerIdRule, customerController.getCustomerById);
router.put('/:id', updateCustomerRules, customerController.updateCustomer);

export default router;

import { Router } from 'express';
import multer from 'multer';
import * as itemController from '../controllers/itemController';
import {
  createItemRules,
  updateItemRules,
  itemIdRule,
  listItemRules,
  inventoryAdjustRules,
} from '../validators/itemValidator';
import { protect, authorize } from '../middlewares/authMiddleware';
import { UserRole } from '../models/User';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = Router();

router.use(protect);

// Item Lookup & Listing
router.get('/', listItemRules, itemController.getItems);
router.get('/low-stock', itemController.getLowStockItems);
router.get('/barcode/:barcode', itemController.getItemByBarcode);
router.get('/sku/:sku', itemController.getItemBySku);
router.get('/export/csv', authorize(UserRole.OWNER), itemController.exportCsvItems);
router.get('/:id', itemIdRule, itemController.getItemById);

// Item Mutations
router.post(
  '/',
  authorize(UserRole.OWNER),
  createItemRules,
  itemController.createItem
);

router.put(
  '/:id',
  authorize(UserRole.OWNER),
  updateItemRules,
  itemController.updateItem
);

router.patch(
  '/:id/status',
  authorize(UserRole.OWNER),
  itemIdRule,
  itemController.toggleItemStatus
);

router.delete(
  '/:id',
  authorize(UserRole.OWNER),
  itemIdRule,
  itemController.deleteItem
);

router.post(
  '/import-csv',
  authorize(UserRole.OWNER),
  upload.single('file'),
  itemController.importCsvItems
);

// Inventory Stock Adjustments & Audit Logs
router.post(
  '/inventory/adjust',
  authorize(UserRole.OWNER),
  inventoryAdjustRules,
  itemController.adjustInventory
);

router.get(
  '/inventory/logs',
  authorize(UserRole.OWNER),
  itemController.getInventoryLogs
);

export default router;

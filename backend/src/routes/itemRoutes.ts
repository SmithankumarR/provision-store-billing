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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const router = Router();

// Protect all routes with JWT authentication
router.use(protect);

// Item Lookup & Listing (Accessible by OWNER and BILLER)
router.get('/items', listItemRules, itemController.getItems);
router.get('/items/low-stock', itemController.getLowStockItems);
router.get('/items/barcode/:barcode', itemController.getItemByBarcode);
router.get('/items/sku/:sku', itemController.getItemBySku);
router.get('/items/:id', itemIdRule, itemController.getItemById);

// CSV Export (OWNER only)
router.get('/items/export/csv', authorize(UserRole.OWNER), itemController.exportCsvItems);

// Item Mutations (OWNER only)
router.post(
  '/items',
  authorize(UserRole.OWNER),
  createItemRules,
  itemController.createItem
);

router.put(
  '/items/:id',
  authorize(UserRole.OWNER),
  updateItemRules,
  itemController.updateItem
);

router.patch(
  '/items/:id/status',
  authorize(UserRole.OWNER),
  itemIdRule,
  itemController.toggleItemStatus
);

router.delete(
  '/items/:id',
  authorize(UserRole.OWNER),
  itemIdRule,
  itemController.deleteItem
);

router.post(
  '/items/import-csv',
  authorize(UserRole.OWNER),
  upload.single('file'),
  itemController.importCsvItems
);

// Inventory Operations
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

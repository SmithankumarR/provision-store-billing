import mongoose from 'mongoose';
import Item, { IItem, ItemStatus } from '../models/Item';
import Category from '../models/Category';
import InventoryLog, { InventoryLogType, IInventoryLog } from '../models/InventoryLog';
import { ApiError } from '../middlewares/errorHandler';

export interface ItemQueryFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: 'all' | 'active' | 'inactive';
  lowStock?: boolean;
  sortBy?: 'name' | 'sellingPrice' | 'currentStock' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export const createItem = async (
  storeId: string,
  userId: string,
  data: Partial<IItem>
): Promise<IItem> => {
  // Default Category handling: If categoryId not provided or invalid, fallback to default "General" category
  let categoryId = data.categoryId;
  if (categoryId) {
    const category = await Category.findOne({ _id: categoryId, storeId });
    if (!category) {
      categoryId = undefined as any;
    }
  }

  if (!categoryId) {
    let generalCat = await Category.findOne({ storeId, name: 'General' });
    if (!generalCat) {
      generalCat = await Category.create({ name: 'General', storeId, isActive: true });
    }
    categoryId = generalCat._id as any;
  }

  // Auto-generate SKU if omitted
  let sku = data.sku ? data.sku.trim().toUpperCase() : '';
  if (!sku) {
    sku = `SKU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  // Check unique SKU per store
  const existingSku = await Item.findOne({ storeId, sku });
  if (existingSku) {
    sku = `SKU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  // Check unique barcode if provided
  if (data.barcode && data.barcode.trim()) {
    const existingBarcode = await Item.findOne({ storeId, barcode: data.barcode.trim() });
    if (existingBarcode) {
      throw new ApiError(`An item with barcode '${data.barcode.trim()}' already exists in your store.`, 400);
    }
  }

  const sellingPrice = data.sellingPrice || 0;
  const costPrice = data.costPrice !== undefined ? data.costPrice : sellingPrice;
  const mrp = data.mrp !== undefined ? data.mrp : sellingPrice;
  const currentStock = data.currentStock !== undefined ? data.currentStock : 100;

  const item = new Item({
    name: data.name!.trim(),
    categoryId,
    sku,
    barcode: data.barcode ? data.barcode.trim() : '',
    sellingPrice,
    costPrice,
    mrp,
    discountPercentage: data.discountPercentage || 0,
    gstPercentage: data.gstPercentage || 0,
    currentStock,
    minimumStock: data.minimumStock !== undefined ? data.minimumStock : 5,
    imageUrl: data.imageUrl || '',
    status: ItemStatus.ACTIVE,
    storeId,
  });

  await item.save();

  // Audit log initial stock if > 0
  if (item.currentStock > 0) {
    await InventoryLog.create({
      storeId,
      itemId: item._id,
      type: InventoryLogType.STOCK_IN,
      quantity: item.currentStock,
      previousStock: 0,
      newStock: item.currentStock,
      reason: 'Initial Stock on Item Creation',
      createdBy: userId,
    });
  }

  return item;
};

export const getItems = async (storeId: string, filters: ItemQueryFilters) => {
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 10;
  const skip = (page - 1) * limit;

  const query: any = { storeId };

  // Status Filter
  if (filters.status === 'active') {
    query.status = ItemStatus.ACTIVE;
  } else if (filters.status === 'inactive') {
    query.status = ItemStatus.INACTIVE;
  }

  // Category Filter
  if (filters.category) {
    query.categoryId = filters.category;
  }

  // Low Stock Filter
  if (filters.lowStock) {
    query.$expr = { $lte: ['$currentStock', '$minimumStock'] };
  }

  // Search Filter (name, SKU, or barcode)
  if (filters.search) {
    const searchRegex = new RegExp(filters.search.trim(), 'i');
    query.$or = [{ name: searchRegex }, { sku: searchRegex }, { barcode: searchRegex }];
  }

  // Sorting
  const sortBy = filters.sortBy || 'createdAt';
  const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
  const sortOptions: any = { [sortBy]: sortOrder };

  const total = await Item.countDocuments(query);
  const items = await Item.find(query)
    .populate('categoryId', 'name')
    .sort(sortOptions)
    .skip(skip)
    .limit(limit);

  return {
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getItemById = async (storeId: string, itemId: string): Promise<IItem> => {
  const item = await Item.findOne({ _id: itemId, storeId }).populate('categoryId', 'name');
  if (!item) {
    throw new ApiError('Item not found.', 404);
  }
  return item;
};

export const getItemByBarcode = async (storeId: string, barcode: string): Promise<IItem> => {
  const item = await Item.findOne({ storeId, barcode: barcode.trim(), status: ItemStatus.ACTIVE }).populate('categoryId', 'name');
  if (!item) {
    throw new ApiError(`Item with barcode '${barcode}' not found.`, 404);
  }
  return item;
};

export const getItemBySku = async (storeId: string, sku: string): Promise<IItem> => {
  const item = await Item.findOne({ storeId, sku: sku.trim().toUpperCase(), status: ItemStatus.ACTIVE }).populate('categoryId', 'name');
  if (!item) {
    throw new ApiError(`Item with SKU '${sku}' not found.`, 404);
  }
  return item;
};

export const updateItem = async (
  storeId: string,
  itemId: string,
  data: Partial<IItem>
): Promise<IItem> => {
  const item = await Item.findOne({ _id: itemId, storeId });
  if (!item) {
    throw new ApiError('Item not found.', 404);
  }

  if (data.categoryId) {
    const category = await Category.findOne({ _id: data.categoryId, storeId });
    if (!category) {
      throw new ApiError('Invalid Category ID. Category does not exist in your store.', 400);
    }
    item.categoryId = data.categoryId;
  }

  if (data.sku && data.sku.trim().toUpperCase() !== item.sku) {
    const existingSku = await Item.findOne({
      storeId,
      _id: { $ne: itemId },
      sku: data.sku.trim().toUpperCase(),
    });
    if (existingSku) {
      throw new ApiError(`Another item with SKU '${data.sku.trim().toUpperCase()}' already exists.`, 400);
    }
    item.sku = data.sku.trim().toUpperCase();
  }

  if (data.barcode !== undefined && data.barcode.trim() !== item.barcode) {
    if (data.barcode.trim()) {
      const existingBarcode = await Item.findOne({
        storeId,
        _id: { $ne: itemId },
        barcode: data.barcode.trim(),
      });
      if (existingBarcode) {
        throw new ApiError(`Another item with barcode '${data.barcode.trim()}' already exists.`, 400);
      }
    }
    item.barcode = data.barcode.trim();
  }

  if (data.name) item.name = data.name.trim();
  if (data.sellingPrice !== undefined) item.sellingPrice = data.sellingPrice;
  if (data.costPrice !== undefined) item.costPrice = data.costPrice;
  if (data.mrp !== undefined) item.mrp = data.mrp;
  if (data.discountPercentage !== undefined) item.discountPercentage = data.discountPercentage;
  if (data.gstPercentage !== undefined) item.gstPercentage = data.gstPercentage;
  if (data.minimumStock !== undefined) item.minimumStock = data.minimumStock;
  if (data.imageUrl !== undefined) item.imageUrl = data.imageUrl;

  return await item.save();
};

export const toggleItemStatus = async (storeId: string, itemId: string): Promise<IItem> => {
  const item = await Item.findOne({ _id: itemId, storeId });
  if (!item) {
    throw new ApiError('Item not found.', 404);
  }
  item.status = item.status === ItemStatus.ACTIVE ? ItemStatus.INACTIVE : ItemStatus.ACTIVE;
  return await item.save();
};

export const deleteItem = async (storeId: string, itemId: string): Promise<void> => {
  const item = await Item.findOne({ _id: itemId, storeId });
  if (!item) {
    throw new ApiError('Item not found.', 404);
  }
  await item.deleteOne();
};

export const adjustInventory = async (
  storeId: string,
  userId: string,
  data: { itemId: string; type: InventoryLogType; quantity: number; reason?: string }
): Promise<{ item: IItem; log: IInventoryLog }> => {
  const item = await Item.findOne({ _id: data.itemId, storeId });
  if (!item) {
    throw new ApiError('Item not found.', 404);
  }

  const previousStock = item.currentStock;
  let newStock = previousStock;

  if (data.type === InventoryLogType.STOCK_IN) {
    if (data.quantity <= 0) throw new ApiError('Stock In quantity must be greater than 0.', 400);
    newStock = previousStock + data.quantity;
  } else if (data.type === InventoryLogType.STOCK_OUT) {
    if (data.quantity <= 0) throw new ApiError('Stock Out quantity must be greater than 0.', 400);
    if (previousStock < data.quantity) {
      throw new ApiError(`Insufficient stock. Current stock is ${previousStock}, cannot remove ${data.quantity}.`, 400);
    }
    newStock = previousStock - data.quantity;
  } else if (data.type === InventoryLogType.ADJUSTMENT) {
    if (data.quantity < 0) throw new ApiError('Adjustment stock level cannot be negative.', 400);
    newStock = data.quantity;
  }

  item.currentStock = newStock;
  await item.save();

  const log = await InventoryLog.create({
    storeId,
    itemId: item._id,
    type: data.type,
    quantity: Math.abs(newStock - previousStock),
    previousStock,
    newStock,
    reason: data.reason || `Stock Adjustment (${data.type})`,
    createdBy: userId,
  });

  return { item, log };
};

export const getInventoryLogs = async (storeId: string, itemId?: string) => {
  const query: any = { storeId };
  if (itemId) query.itemId = itemId;

  const logs = await InventoryLog.find(query)
    .populate('itemId', 'name sku barcode')
    .populate('createdBy', 'name role')
    .sort({ createdAt: -1 })
    .limit(100);

  return logs;
};

export const getLowStockItems = async (storeId: string) => {
  const items = await Item.find({
    storeId,
    status: ItemStatus.ACTIVE,
    $expr: { $lte: ['$currentStock', '$minimumStock'] },
  }).populate('categoryId', 'name');

  return items;
};

export const importCsvItems = async (
  storeId: string,
  userId: string,
  csvContent: string
): Promise<{ created: number; updated: number; errors: string[] }> => {
  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    throw new ApiError('CSV file must contain a header row and at least one data row.', 400);
  }

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map((cell) => cell.trim());
    if (row.length < header.length) continue;

    const rowData: any = {};
    header.forEach((key, index) => {
      rowData[key] = row[index];
    });

    try {
      const name = rowData.name || rowData.itemname;
      if (!name) {
        errors.push(`Row ${i + 1}: Missing item name.`);
        continue;
      }

      let categoryId = rowData.categoryid;
      if (!categoryId && rowData.category) {
        let category = await Category.findOne({
          storeId,
          name: { $regex: new RegExp(`^${rowData.category.trim()}$`, 'i') },
        });
        if (!category) {
          category = await Category.create({
            name: rowData.category.trim(),
            storeId,
            isActive: true,
          });
        }
        categoryId = category._id.toString();
      }

      if (!categoryId) {
        let defaultCategory = await Category.findOne({ storeId });
        if (!defaultCategory) {
          defaultCategory = await Category.create({
            name: 'General',
            storeId,
            isActive: true,
          });
        }
        categoryId = defaultCategory._id.toString();
      }

      const sku = rowData.sku ? rowData.sku.toUpperCase() : `SKU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const barcode = rowData.barcode || '';
      const sellingPrice = parseFloat(rowData.sellingprice || rowData.price || '0');
      const costPrice = parseFloat(rowData.costprice || rowData.cost || '0');
      const mrp = parseFloat(rowData.mrp || String(sellingPrice));
      const currentStock = parseInt(rowData.currentstock || rowData.stock || '0', 10);
      const minimumStock = parseInt(rowData.minimumstock || '5', 10);
      const gstPercentage = parseFloat(rowData.gstpercentage || rowData.gst || '0');

      let existingItem = await Item.findOne({ storeId, sku });
      if (!existingItem && barcode) {
        existingItem = await Item.findOne({ storeId, barcode });
      }

      if (existingItem) {
        existingItem.name = name;
        existingItem.sellingPrice = sellingPrice;
        existingItem.costPrice = costPrice;
        existingItem.mrp = mrp;
        existingItem.currentStock = currentStock;
        existingItem.minimumStock = minimumStock;
        existingItem.gstPercentage = gstPercentage;
        await existingItem.save();
        updated++;
      } else {
        await createItem(storeId, userId, {
          name,
          categoryId: new mongoose.Types.ObjectId(categoryId) as any,
          sku,
          barcode,
          sellingPrice,
          costPrice,
          mrp,
          currentStock,
          minimumStock,
          gstPercentage,
        });
        created++;
      }
    } catch (err: any) {
      errors.push(`Row ${i + 1}: ${err.message}`);
    }
  }

  return { created, updated, errors };
};

export const exportCsvItems = async (storeId: string): Promise<string> => {
  const items = await Item.find({ storeId }).populate('categoryId', 'name');

  const headers = [
    'Name',
    'Category',
    'SKU',
    'Barcode',
    'SellingPrice',
    'CostPrice',
    'MRP',
    'DiscountPercentage',
    'GSTPercentage',
    'CurrentStock',
    'MinimumStock',
    'Status',
  ];

  const rows = items.map((item: any) => [
    `"${item.name.replace(/"/g, '""')}"`,
    `"${item.categoryId ? item.categoryId.name : 'Uncategorized'}"`,
    `"${item.sku}"`,
    `"${item.barcode || ''}"`,
    item.sellingPrice,
    item.costPrice,
    item.mrp,
    item.discountPercentage,
    item.gstPercentage,
    item.currentStock,
    item.minimumStock,
    item.status,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
};

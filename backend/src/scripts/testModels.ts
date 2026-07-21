import mongoose from 'mongoose';
import {
  Store,
  User,
  UserRole,
  Category,
  Item,
  Customer,
  Bill,
  PaymentMethod,
  InventoryLog,
  InventoryLogType,
  Settings,
} from '../models';

const testModelInstantiation = () => {
  const mockStoreId = new mongoose.Types.ObjectId();
  const mockUserId = new mongoose.Types.ObjectId();
  const mockCategoryId = new mongoose.Types.ObjectId();
  const mockItemId = new mongoose.Types.ObjectId();

  const store = new Store({
    name: 'Sample Grocery Store',
    address: '123 Main St, Bangalore',
    phone: '9876543210',
    gstNumber: '29ABCDE1234F1Z5',
  });

  const user = new User({
    name: 'Admin Owner',
    email: 'owner@store.com',
    phone: '9876543210',
    password: 'securepassword123',
    role: UserRole.OWNER,
    storeId: mockStoreId,
  });

  const category = new Category({
    name: 'Provisions',
    description: 'Rice, Dal, Flour, Oil',
    storeId: mockStoreId,
  });

  const item = new Item({
    name: 'Basmati Rice 5kg',
    categoryId: mockCategoryId,
    sku: 'RICE-BAS-5KG',
    sellingPrice: 450,
    costPrice: 380,
    mrp: 500,
    currentStock: 25,
    minimumStock: 5,
    storeId: mockStoreId,
  });

  const bill = new Bill({
    invoiceNumber: 'INV-20260721-0001',
    storeId: mockStoreId,
    cashierId: mockUserId,
    items: [
      {
        itemId: mockItemId,
        itemName: 'Basmati Rice 5kg',
        sku: 'RICE-BAS-5KG',
        sellingPrice: 450,
        quantity: 1,
        discountPercentage: 0,
        discountAmount: 0,
        gstPercentage: 5,
        taxAmount: 22.5,
        totalAmount: 472.5,
      },
    ],
    subtotal: 450,
    taxTotal: 22.5,
    grandTotal: 472.5,
    paymentMethod: PaymentMethod.CASH,
  });

  console.log('Successfully validated model instantiations!');
  console.log(`Store: ${store.name}, User: ${user.name}, Bill Invoice: ${bill.invoiceNumber}`);
};

testModelInstantiation();

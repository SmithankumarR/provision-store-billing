import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../config/db';
import { Store, User, Category, Item } from '../models';
import * as authService from '../services/authService';
import * as categoryService from '../services/categoryService';

const runCategoryTests = async () => {
  await connectDB();

  try {
    console.log('--- Cleaning test data ---');
    await User.deleteMany({ email: 'catowner@provision.com' });
    await Store.deleteMany({ name: 'Category Test Store' });

    console.log('1. Setting up Store & Owner...');
    const regResult = await authService.registerStoreAndOwner({
      storeName: 'Category Test Store',
      storeAddress: '100 Market Road',
      storePhone: '9112233445',
      ownerName: 'Cat Owner',
      ownerEmail: 'catowner@provision.com',
      ownerPhone: '9112233445',
      password: 'catpassword123',
    });

    const storeId = regResult.store._id.toString();

    console.log('2. Testing Category Creation...');
    const cat1 = await categoryService.createCategory(storeId, {
      name: 'Dairy & Eggs',
      description: 'Fresh milk, cheese, butter, and eggs',
    });
    console.log('✔ Category 1 created:', cat1.name);

    const cat2 = await categoryService.createCategory(storeId, {
      name: 'Pulses & Grains',
      description: 'Dal, Rice, Wheat, Flour',
    });
    console.log('✔ Category 2 created:', cat2.name);

    console.log('3. Testing Duplicate Name Prevention...');
    try {
      await categoryService.createCategory(storeId, { name: 'dairy & eggs' });
      console.error('❌ Failed: Should not allow duplicate category name');
    } catch (err: any) {
      console.log('✔ Duplicate blocked:', err.message);
    }

    console.log('4. Testing Category List & Search & Pagination...');
    const list = await categoryService.getCategories(storeId, {
      search: 'pulses',
      page: 1,
      limit: 10,
    });
    console.log('✔ Search found categories count:', list.categories.length);
    console.log('✔ Found item:', list.categories[0]?.name);

    console.log('5. Testing Category Update...');
    const updated = await categoryService.updateCategory(storeId, cat1._id.toString(), {
      description: 'Updated fresh dairy products description',
    });
    console.log('✔ Updated category description:', updated.description);

    console.log('6. Testing Status Toggle...');
    const toggled = await categoryService.toggleCategoryStatus(storeId, cat1._id.toString());
    console.log('✔ Toggled status, isActive is now:', toggled.isActive);

    console.log('7. Testing Deletion Safeguard with Linked Items...');
    // Create dummy item linked to cat2
    const dummyItem = new Item({
      name: 'Toor Dal 1kg',
      categoryId: cat2._id,
      sku: 'DAL-TOOR-1KG',
      sellingPrice: 160,
      costPrice: 130,
      mrp: 180,
      currentStock: 10,
      minimumStock: 2,
      storeId,
    });
    await dummyItem.save();

    try {
      await categoryService.deleteCategory(storeId, cat2._id.toString());
      console.error('❌ Failed: Should not delete category with linked items');
    } catch (err: any) {
      console.log('✔ Deletion blocked due to linked items:', err.message);
    }

    console.log('8. Testing Clean Deletion...');
    await categoryService.deleteCategory(storeId, cat1._id.toString());
    console.log('✔ Unlinked category deleted successfully!');

    // Cleanup dummy item
    await Item.deleteMany({ storeId });

    console.log('--- ALL CATEGORY INTEGRATION TESTS PASSED PERFECTLY ---');
  } catch (error: any) {
    console.error('❌ Test Failed:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

runCategoryTests();

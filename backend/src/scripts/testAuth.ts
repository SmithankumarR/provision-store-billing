import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../config/db';
import { Store, User } from '../models';
import * as authService from '../services/authService';

const runAuthTests = async () => {
  await connectDB();

  try {
    console.log('--- Cleaning test data ---');
    await User.deleteMany({ email: { $in: ['testowner@provision.com', 'testbiller@provision.com'] } });
    await Store.deleteMany({ name: 'Test Supermarket' });

    console.log('1. Testing Store & Owner Registration...');
    const regResult = await authService.registerStoreAndOwner({
      storeName: 'Test Supermarket',
      storeAddress: '456 MG Road, Bangalore',
      storePhone: '9988776655',
      ownerName: 'Test Owner',
      ownerEmail: 'testowner@provision.com',
      ownerPhone: '9988776655',
      password: 'password123',
    });

    console.log('✔ Store & Owner Registered! Store ID:', regResult.store._id.toString());
    console.log('✔ Access Token generated length:', regResult.tokens.accessToken.length);

    console.log('2. Testing Owner Login...');
    const loginResult = await authService.login('testowner@provision.com', 'password123');
    console.log('✔ Owner Login Successful! User role:', loginResult.user.role);

    console.log('3. Testing Biller Registration by Owner...');
    const biller = await authService.registerBiller(regResult.store._id.toString(), {
      name: 'Test Biller',
      email: 'testbiller@provision.com',
      phone: '8877665544',
      password: 'billerpassword123',
    });
    console.log('✔ Biller Account Created! Biller ID:', biller.id.toString());

    console.log('4. Testing Biller Login...');
    const billerLogin = await authService.login('testbiller@provision.com', 'billerpassword123');
    console.log('✔ Biller Login Successful! Role:', billerLogin.user.role);

    console.log('5. Testing Token Refresh...');
    const refreshedTokens = await authService.refreshTokens(billerLogin.tokens.refreshToken);
    console.log('✔ Refreshed Tokens successfully! New Access Token length:', refreshedTokens.accessToken.length);

    console.log('--- ALL AUTH INTEGRATION TESTS PASSED PERFECTLY ---');
  } catch (error: any) {
    console.error('❌ Test Failed:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

runAuthTests();

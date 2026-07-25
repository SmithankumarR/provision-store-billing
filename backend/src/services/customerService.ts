import Customer, { ICustomer } from '../models/Customer';
import { ApiError } from '../middlewares/errorHandler';

export const createCustomer = async (
  storeId: string,
  data: { name: string; phone: string; gstNumber?: string; address?: string }
): Promise<ICustomer> => {
  const phone = data.phone.trim();
  const existingCustomer = await Customer.findOne({ storeId, phone });
  if (existingCustomer) {
    throw new ApiError(`A customer with phone number '${phone}' already exists in your store.`, 400);
  }

  const customer = new Customer({
    name: data.name.trim(),
    phone,
    gstNumber: data.gstNumber ? data.gstNumber.trim() : '',
    address: data.address ? data.address.trim() : '',
    loyaltyPoints: 0,
    totalSpent: 0,
    storeId,
  });

  return await customer.save();
};

export const getCustomers = async (
  storeId: string,
  filters: { page?: number; limit?: number; search?: string }
) => {
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 10;
  const skip = (page - 1) * limit;

  const query: any = { storeId };

  if (filters.search) {
    const searchRegex = new RegExp(filters.search.trim(), 'i');
    query.$or = [{ name: searchRegex }, { phone: searchRegex }];
  }

  const total = await Customer.countDocuments(query);
  const customers = await Customer.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    customers,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getCustomerByPhone = async (
  storeId: string,
  phone: string
): Promise<ICustomer> => {
  const customer = await Customer.findOne({ storeId, phone: phone.trim() });
  if (!customer) {
    throw new ApiError(`Customer with phone '${phone}' not found.`, 404);
  }
  return customer;
};

export const getCustomerById = async (
  storeId: string,
  customerId: string
): Promise<ICustomer> => {
  const customer = await Customer.findOne({ _id: customerId, storeId });
  if (!customer) {
    throw new ApiError('Customer not found.', 404);
  }
  return customer;
};

export const updateCustomer = async (
  storeId: string,
  customerId: string,
  data: Partial<ICustomer>
): Promise<ICustomer> => {
  const customer = await Customer.findOne({ _id: customerId, storeId });
  if (!customer) {
    throw new ApiError('Customer not found.', 404);
  }

  if (data.phone && data.phone.trim() !== customer.phone) {
    const existingPhone = await Customer.findOne({
      storeId,
      _id: { $ne: customerId },
      phone: data.phone.trim(),
    });
    if (existingPhone) {
      throw new ApiError(`Another customer with phone '${data.phone.trim()}' already exists.`, 400);
    }
    customer.phone = data.phone.trim();
  }

  if (data.name) customer.name = data.name.trim();
  if (data.gstNumber !== undefined) customer.gstNumber = data.gstNumber.trim();
  if (data.address !== undefined) customer.address = data.address.trim();

  return await customer.save();
};

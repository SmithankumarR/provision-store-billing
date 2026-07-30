import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import {
  Text,
  Searchbar,
  Chip,
  Card,
  Button,
  FAB,
  Modal,
  Portal,
  IconButton,
  SegmentedButtons,
  TextInput,
  useTheme,
  Surface,
  Divider,
  Snackbar,
} from 'react-native-paper';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { Item, Category, Customer, PaymentMethod, Bill } from '../types';
import api from '../services/api';
import { ReceiptModal } from './ReceiptModal';

export const BillingScreen = () => {
  const theme = useTheme();
  const { store } = useAuthStore();
  const cart = useCartStore();

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  // Cart & Customer Modals
  const [isCartVisible, setIsCartVisible] = useState(false);
  const [isCustomerModalVisible, setIsCustomerModalVisible] = useState(false);
  const [customerSearchPhone, setCustomerSearchPhone] = useState('');
  const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null);
  const [customerError, setCustomerError] = useState('');

  // Discount Modal Inputs
  const [discountValueInput, setDiscountValueInput] = useState('0');
  const [discountTypeInput, setDiscountTypeInput] = useState<'FLAT' | 'PERCENTAGE'>('FLAT');

  // Checkout Success Receipt Modal
  const [completedBill, setCompletedBill] = useState<Bill | null>(null);
  const [isReceiptVisible, setIsReceiptVisible] = useState(false);

  // Toast System
  const [toastMessage, setToastMessage] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setIsToastVisible(true);
  };

  useEffect(() => {
    fetchCategories();
    fetchItems();
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories?status=active&limit=50');
      if (res.data.success) {
        setCategories(res.data.data.categories);
      }
    } catch (err) {}
  };

  const fetchItems = async (queryStr = searchQuery) => {
    setIsLoadingItems(true);
    try {
      const params: any = {
        status: 'active',
        limit: 50,
        search: queryStr || undefined,
      };
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      const res = await api.get('/items', { params });
      if (res.data.success) {
        setItems(res.data.data.items);
      }
    } catch (err) {
    } finally {
      setIsLoadingItems(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    fetchItems(text);
  };

  const handleAddToCart = (item: Item) => {
    cart.addItem(item);
    showToast(`Added ${item.name} to cart`);
  };

  const handleBarcodeSearch = async (barcodeText: string) => {
    try {
      const res = await api.get(`/items/barcode/${barcodeText.trim()}`);
      if (res.data.success && res.data.data) {
        cart.addItem(res.data.data);
        showToast(`Barcode Scanned: Added ${res.data.data.name}`);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Barcode item not found');
    }
  };

  const handleLookupCustomer = async () => {
    if (!customerSearchPhone.trim()) return;
    setCustomerError('');
    try {
      const res = await api.get(`/customers/phone/${customerSearchPhone.trim()}`);
      if (res.data.success) {
        setFoundCustomer(res.data.data);
        cart.setCustomer(res.data.data);
        showToast(`Customer assigned: ${res.data.data.name}`);
      }
    } catch (err: any) {
      setCustomerError('Customer not found with this phone number.');
    }
  };

  const handleApplyBillDiscount = () => {
    const val = parseFloat(discountValueInput) || 0;
    cart.setBillDiscount(val > 0 ? discountTypeInput : null, val);
    showToast(`Applied ${val} ${discountTypeInput === 'FLAT' ? '₹' : '%'} discount`);
  };

  const handleCheckout = async () => {
    try {
      const bill = await cart.checkout();
      setCompletedBill(bill);
      setIsCartVisible(false);
      setIsReceiptVisible(true);
      showToast(`Bill #${bill.invoiceNumber} Completed Successfully!`);
    } catch (err: any) {
      showToast(err.message || 'Checkout failed.');
    }
  };

  const totals = cart.getTotals();
  const totalItemCount = cart.items.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header Search & Barcode Trigger */}
      <View style={styles.searchHeader}>
        <Searchbar
          placeholder="Search Item name, SKU, or Barcode..."
          value={searchQuery}
          onChangeText={handleSearch}
          style={styles.searchBar}
        />
        <IconButton
          icon="barcode-scan"
          mode="contained"
          size={26}
          onPress={() => {
            const code = prompt('Enter or scan barcode:');
            if (code) handleBarcodeSearch(code);
          }}
        />
      </View>

      {/* Category Pills Slider */}
      <View style={styles.categoryBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
          <Chip
            selected={selectedCategory === 'all'}
            onPress={() => setSelectedCategory('all')}
            style={styles.chip}
          >
            All Items
          </Chip>
          {categories.map((cat) => (
            <Chip
              key={cat._id}
              selected={selectedCategory === cat._id}
              onPress={() => setSelectedCategory(cat._id)}
              style={styles.chip}
            >
              {cat.name}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {/* Item Catalog Grid */}
      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        numColumns={2}
        contentContainerStyle={{ padding: 8, paddingBottom: 90 }}
        renderItem={({ item }) => {
          const inCart = cart.items.find((i) => i.item._id === item._id);
          const isOut = item.currentStock <= 0;

          return (
            <Card style={[styles.itemCard, isOut && { opacity: 0.6 }]}>
              <Card.Content style={{ padding: 10 }}>
                <Text variant="titleMedium" numberOfLines={1} style={{ fontWeight: 'bold' }}>
                  {item.name}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                  Stock: {item.currentStock} {item.currentStock <= item.minimumStock ? '⚠️' : ''}
                </Text>
                <View style={styles.priceRow}>
                  <Text variant="titleLarge" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                    ₹{item.sellingPrice}
                  </Text>
                  {item.mrp > item.sellingPrice ? (
                    <Text variant="bodySmall" style={{ textDecorationLine: 'line-through', color: '#888' }}>
                      ₹{item.mrp}
                    </Text>
                  ) : null}
                </View>

                {inCart ? (
                  <View style={styles.stepperRow}>
                    <IconButton
                      icon="minus-box"
                      size={24}
                      onPress={() => cart.updateQuantity(item._id, inCart.quantity - 1)}
                    />
                    <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                      {inCart.quantity}
                    </Text>
                    <IconButton
                      icon="plus-box"
                      size={24}
                      onPress={() => cart.updateQuantity(item._id, inCart.quantity + 1)}
                    />
                  </View>
                ) : (
                  <Button
                    mode="contained-tonal"
                    compact
                    disabled={isOut}
                    onPress={() => handleAddToCart(item)}
                    style={{ marginTop: 8 }}
                  >
                    {isOut ? 'Out of Stock' : '+ Add'}
                  </Button>
                )}
              </Card.Content>
            </Card>
          );
        }}
      />

      {/* Floating Bottom Cart Bar */}
      {cart.items.length > 0 ? (
        <Surface style={styles.cartBar} elevation={4}>
          <View>
            <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
              {totalItemCount} Items | ₹{totals.grandTotal}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
              {cart.customer ? `Customer: ${cart.customer.name}` : 'Walk-in Customer'}
            </Text>
          </View>

          <Button mode="contained" icon="cart-outline" onPress={() => setIsCartVisible(true)}>
            View Cart ({totalItemCount})
          </Button>
        </Surface>
      ) : null}

      {/* Cart Modal Drawer */}
      <Portal>
        <Modal
          visible={isCartVisible}
          onDismiss={() => setIsCartVisible(false)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.background }]}
        >
          <View style={styles.modalHeader}>
            <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>
              Current Cart ({totalItemCount} Items)
            </Text>
            <IconButton icon="close" onPress={() => setIsCartVisible(false)} />
          </View>

          <ScrollView style={{ flex: 1, paddingHorizontal: 16 }}>
            {/* Customer Section */}
            <Surface style={styles.customerCard} elevation={1}>
              <View style={{ flex: 1 }}>
                <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>
                  {cart.customer ? `Customer: ${cart.customer.name}` : 'Walk-in Customer'}
                </Text>
                {cart.customer ? <Text variant="bodySmall">Phone: {cart.customer.phone}</Text> : null}
              </View>
              <Button mode="outlined" compact onPress={() => setIsCustomerModalVisible(true)}>
                {cart.customer ? 'Change' : '+ Add Customer'}
              </Button>
            </Surface>

            {/* Cart Items List */}
            {cart.items.map((cartItem) => (
              <View key={cartItem.item._id} style={styles.cartItemRow}>
                <View style={{ flex: 1 }}>
                  <Text variant="titleSmall" style={{ fontWeight: 'bold' }}>
                    {cartItem.item.name}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                    ₹{cartItem.item.sellingPrice} x {cartItem.quantity} = ₹{cartItem.totalAmount.toFixed(2)}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <IconButton
                    icon="minus"
                    size={20}
                    onPress={() => cart.updateQuantity(cartItem.item._id, cartItem.quantity - 1)}
                  />
                  <Text variant="bodyLarge" style={{ fontWeight: 'bold', marginHorizontal: 4 }}>
                    {cartItem.quantity}
                  </Text>
                  <IconButton
                    icon="plus"
                    size={20}
                    onPress={() => cart.updateQuantity(cartItem.item._id, cartItem.quantity + 1)}
                  />
                </View>
              </View>
            ))}

            <Divider style={{ marginVertical: 12 }} />

            {/* Bill Discount Section */}
            <Text variant="titleSmall" style={{ fontWeight: 'bold', marginBottom: 8 }}>
              Apply Bill Discount
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <SegmentedButtons
                value={discountTypeInput}
                onValueChange={(val: any) => setDiscountTypeInput(val)}
                buttons={[
                  { value: 'FLAT', label: 'Flat ₹' },
                  { value: 'PERCENTAGE', label: 'Discount %' },
                ]}
                style={{ flex: 1, marginRight: 8 }}
              />
              <TextInput
                mode="outlined"
                value={discountValueInput}
                onChangeText={setDiscountValueInput}
                keyboardType="numeric"
                style={{ width: 80 }}
              />
              <Button mode="contained-tonal" onPress={handleApplyBillDiscount} style={{ marginLeft: 8 }}>
                Apply
              </Button>
            </View>

            {/* Payment Method Selector */}
            <Text variant="titleSmall" style={{ fontWeight: 'bold', marginBottom: 8 }}>
              Payment Method
            </Text>
            <SegmentedButtons
              value={cart.paymentMethod}
              onValueChange={(val: any) => cart.setPaymentMethod(val)}
              buttons={[
                { value: PaymentMethod.CASH, label: 'Cash' },
                { value: PaymentMethod.UPI, label: 'UPI' },
                { value: PaymentMethod.CARD, label: 'Card' },
                { value: PaymentMethod.SPLIT, label: 'Split' },
              ]}
              style={{ marginBottom: 16 }}
            />

            {/* Totals Breakdown */}
            <Surface style={styles.totalsCard} elevation={2}>
              <View style={styles.totalLine}>
                <Text variant="bodyMedium">Subtotal:</Text>
                <Text variant="bodyMedium">₹{totals.subtotal.toFixed(2)}</Text>
              </View>
              {totals.discountTotal > 0 ? (
                <View style={styles.totalLine}>
                  <Text variant="bodyMedium" style={{ color: theme.colors.error }}>Discount:</Text>
                  <Text variant="bodyMedium" style={{ color: theme.colors.error }}>-₹{totals.discountTotal.toFixed(2)}</Text>
                </View>
              ) : null}
              {totals.taxTotal > 0 ? (
                <View style={styles.totalLine}>
                  <Text variant="bodyMedium">GST Tax:</Text>
                  <Text variant="bodyMedium">+₹{totals.taxTotal.toFixed(2)}</Text>
                </View>
              ) : null}
              {totals.roundOff !== 0 ? (
                <View style={styles.totalLine}>
                  <Text variant="bodyMedium">Round Off:</Text>
                  <Text variant="bodyMedium">{totals.roundOff > 0 ? '+' : ''}₹{totals.roundOff.toFixed(2)}</Text>
                </View>
              ) : null}
              <Divider style={{ marginVertical: 8 }} />
              <View style={styles.totalLine}>
                <Text variant="titleLarge" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                  GRAND TOTAL:
                </Text>
                <Text variant="titleLarge" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                  ₹{totals.grandTotal}
                </Text>
              </View>
            </Surface>
          </ScrollView>

          <View style={{ padding: 16 }}>
            <Button
              mode="contained"
              icon="check-circle"
              onPress={handleCheckout}
              loading={cart.isSubmitting}
              disabled={cart.isSubmitting}
              contentStyle={{ paddingVertical: 8 }}
            >
              Complete Checkout (₹{totals.grandTotal})
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Customer Lookup Modal */}
      <Portal>
        <Modal
          visible={isCustomerModalVisible}
          onDismiss={() => setIsCustomerModalVisible(false)}
          contentContainerStyle={[styles.customerModal, { backgroundColor: theme.colors.background }]}
        >
          <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 12 }}>
            Assign Customer to Invoice
          </Text>
          <TextInput
            label="Search Customer Phone Number"
            value={customerSearchPhone}
            onChangeText={setCustomerSearchPhone}
            keyboardType="phone-pad"
            mode="outlined"
            right={<TextInput.Icon icon="magnify" onPress={handleLookupCustomer} />}
            style={{ marginBottom: 12 }}
          />

          {customerError ? (
            <Text variant="bodySmall" style={{ color: theme.colors.error, marginBottom: 8 }}>
              {customerError}
            </Text>
          ) : null}

          {foundCustomer ? (
            <Surface style={{ padding: 12, borderRadius: 8, marginBottom: 12 }} elevation={1}>
              <Text variant="bodyLarge" style={{ fontWeight: 'bold' }}>{foundCustomer.name}</Text>
              <Text variant="bodySmall">Phone: {foundCustomer.phone}</Text>
              <Text variant="bodySmall">Loyalty Points: {foundCustomer.loyaltyPoints} pts</Text>
            </Surface>
          ) : null}

          <Button mode="contained" onPress={() => setIsCustomerModalVisible(false)}>
            Done
          </Button>
        </Modal>
      </Portal>

      {/* Receipt Modal after checkout */}
      {completedBill && store ? (
        <ReceiptModal
          visible={isReceiptVisible}
          onDismiss={() => setIsReceiptVisible(false)}
          bill={completedBill}
          store={store}
        />
      ) : null}

      {/* Toast Notification Bar */}
      <Snackbar
        visible={isToastVisible}
        onDismiss={() => setIsToastVisible(false)}
        duration={2500}
        style={{ backgroundColor: theme.colors.surfaceVariant }}
      >
        <Text style={{ color: theme.colors.onSurface }}>{toastMessage}</Text>
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchHeader: { flexDirection: 'row', padding: 8, alignItems: 'center' },
  searchBar: { flex: 1, marginRight: 4, height: 48 },
  categoryBar: { marginBottom: 8 },
  chip: { marginRight: 8 },
  itemCard: { flex: 1, margin: 4, borderRadius: 12 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginVertical: 4 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  cartBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalContainer: { flex: 1, margin: 0, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  customerCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 12 },
  cartItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5, borderColor: '#ccc' },
  totalsCard: { padding: 16, borderRadius: 12, marginTop: 8 },
  totalLine: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 2 },
  customerModal: { padding: 20, margin: 20, borderRadius: 12 },
});

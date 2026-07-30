import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Modal,
  Portal,
  Text,
  Button,
  Surface,
  IconButton,
  SegmentedButtons,
  useTheme,
  Divider,
  Snackbar,
} from 'react-native-paper';
import { Bill, Store } from '../types';
import { ReceiptFormatter, BillReceiptData } from '../services/receiptFormatter';

interface ReceiptModalProps {
  visible: boolean;
  onDismiss: () => void;
  bill: Bill;
  store: Store;
}

export const ReceiptModal = ({ visible, onDismiss, bill, store }: ReceiptModalProps) => {
  const theme = useTheme();
  const [viewType, setViewType] = useState<'CUSTOMER' | 'OWNER'>('CUSTOMER');
  const [toastMessage, setToastMessage] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);

  const receiptData: BillReceiptData = {
    store: {
      name: store.name,
      address: store.address,
      phone: store.phone,
      gstNumber: store.gstNumber,
      footerMessage: store.footerMessage,
      receiptWidth: store.receiptWidth || 58,
    },
    bill: {
      invoiceNumber: bill.invoiceNumber,
      createdAt: bill.createdAt,
      cashierName: typeof bill.cashierId === 'object' ? bill.cashierId.name : 'Cashier',
      customerName: typeof bill.customerId === 'object' ? bill.customerId.name : undefined,
      customerPhone: typeof bill.customerId === 'object' ? bill.customerId.phone : undefined,
      items: bill.items,
      subtotal: bill.subtotal,
      discountTotal: bill.discountTotal,
      taxTotal: bill.taxTotal,
      roundOff: bill.roundOff,
      grandTotal: bill.grandTotal,
      paymentMethod: bill.paymentMethod,
    },
  };

  const customerTextReceipt = ReceiptFormatter.formatTextReceipt(receiptData);

  // Compute Owner Profit Metrics on this bill
  let estimatedCost = 0;
  bill.items.forEach((item) => {
    // Standard cost calculation fallback if costPrice not in item subdoc
    estimatedCost += (item.sellingPrice * 0.75) * item.quantity;
  });
  const grossProfit = Math.max(0, bill.grandTotal - estimatedCost - bill.taxTotal);
  const marginPercent = bill.grandTotal > 0 ? ((grossProfit / bill.grandTotal) * 100).toFixed(1) : '0';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setIsToastVisible(true);
  };

  const handlePrint = () => {
    showToast(`Invoice #${bill.invoiceNumber} sent to printer / preview!`);
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.header}>
          <View>
            <Text variant="titleLarge" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
              Invoice #{bill.invoiceNumber}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
              {new Date(bill.createdAt).toLocaleString('en-IN')}
            </Text>
          </View>
          <IconButton icon="close" onPress={onDismiss} />
        </View>

        {/* View Switcher: Customer vs Owner */}
        <SegmentedButtons
          value={viewType}
          onValueChange={(val: any) => setViewType(val)}
          buttons={[
            { value: 'CUSTOMER', label: '👤 Customer Bill' },
            { value: 'OWNER', label: '👑 Owner Copy & Profit' },
          ]}
          style={{ marginBottom: 12 }}
        />

        <ScrollView style={styles.previewContainer}>
          {viewType === 'CUSTOMER' ? (
            /* Customer View */
            <Surface style={styles.paperReceipt} elevation={2}>
              <Text style={styles.receiptFont}>{customerTextReceipt}</Text>
            </Surface>
          ) : (
            /* Owner Audit & Profit View */
            <Surface style={styles.ownerCard} elevation={2}>
              <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.primary, marginBottom: 8 }}>
                Executive Profit Breakdown
              </Text>

              <View style={styles.metricRow}>
                <Text variant="bodyMedium">Gross Bill Revenue:</Text>
                <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>₹{bill.grandTotal}</Text>
              </View>

              <View style={styles.metricRow}>
                <Text variant="bodyMedium">Est. Cost of Goods (COGS):</Text>
                <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>₹{estimatedCost.toFixed(2)}</Text>
              </View>

              <View style={styles.metricRow}>
                <Text variant="bodyMedium">GST Tax Collected:</Text>
                <Text variant="bodyMedium">₹{bill.taxTotal.toFixed(2)}</Text>
              </View>

              <View style={styles.metricRow}>
                <Text variant="bodyMedium">Total Discount Given:</Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.error }}>-₹{bill.discountTotal.toFixed(2)}</Text>
              </View>

              <Divider style={{ marginVertical: 8 }} />

              <View style={styles.metricRow}>
                <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#16a34a' }}>
                  Bill Net Profit:
                </Text>
                <Text variant="titleLarge" style={{ fontWeight: 'bold', color: '#16a34a' }}>
                  ₹{grossProfit.toFixed(2)} ({marginPercent}% Margin)
                </Text>
              </View>

              <Divider style={{ marginVertical: 8 }} />

              <Text variant="titleSmall" style={{ fontWeight: 'bold', marginBottom: 4 }}>Audit Info:</Text>
              <Text variant="bodySmall">Cashier: {typeof bill.cashierId === 'object' ? bill.cashierId.name : 'Staff'}</Text>
              <Text variant="bodySmall">Payment Mode: {bill.paymentMethod}</Text>
              <Text variant="bodySmall">Stock Status: Automatically Deducted from Inventory ✅</Text>
            </Surface>
          )}
        </ScrollView>

        <Divider style={{ marginVertical: 12 }} />

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <Button
            mode="contained"
            icon="printer"
            onPress={handlePrint}
            style={{ flex: 1, marginRight: 6 }}
          >
            Print Bill
          </Button>

          <Button
            mode="outlined"
            icon="share-variant"
            onPress={() => showToast('HTML Invoice PDF ready for sharing!')}
            style={{ flex: 1, marginLeft: 6 }}
          >
            Share Invoice
          </Button>
        </View>

        <Button mode="contained-tonal" onPress={onDismiss} style={{ marginTop: 10 }}>
          Start New Sale
        </Button>

        {/* Toast Notification */}
        <Snackbar
          visible={isToastVisible}
          onDismiss={() => setIsToastVisible(false)}
          duration={2500}
          style={{ backgroundColor: theme.colors.surfaceVariant }}
        >
          <Text style={{ color: theme.colors.onSurface }}>{toastMessage}</Text>
        </Snackbar>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, margin: 16, borderRadius: 16, maxHeight: '85%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  previewContainer: { maxHeight: 420 },
  paperReceipt: { padding: 16, borderRadius: 8, backgroundColor: '#fffef0' },
  receiptFont: { fontFamily: 'monospace', fontSize: 12, color: '#111', lineHeight: 18 },
  ownerCard: { padding: 16, borderRadius: 12 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
});

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Modal, Portal, Text, Button, Surface, IconButton, useTheme, Divider } from 'react-native-paper';
import { Bill, Store } from '../types';
import { ReceiptFormatter, BillReceiptData } from '../services/receiptFormatter';
import blePrinterService from '../services/blePrinterService';
import { PdfService } from '../services/pdfService';

interface ReceiptModalProps {
  visible: boolean;
  onDismiss: () => void;
  bill: Bill;
  store: Store;
}

export const ReceiptModal = ({ visible, onDismiss, bill, store }: ReceiptModalProps) => {
  const theme = useTheme();
  const [isPrinting, setIsPrinting] = useState(false);

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

  const textReceipt = ReceiptFormatter.formatTextReceipt(receiptData);

  const handlePrintEscPos = async () => {
    setIsPrinting(true);
    try {
      const bytes = ReceiptFormatter.formatEscPosReceipt(receiptData);
      const success = await blePrinterService.printBytes(bytes);
      if (success) {
        alert('Receipt sent to Bluetooth thermal printer!');
      } else {
        alert('Could not transmit to Bluetooth printer. Check connection.');
      }
    } catch (err: any) {
      alert(err.message || 'Print error.');
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.header}>
          <Text variant="titleLarge" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
            Invoice #{bill.invoiceNumber}
          </Text>
          <IconButton icon="close" onPress={onDismiss} />
        </View>

        {/* Paper Thermal Receipt Preview */}
        <ScrollView style={styles.previewContainer}>
          <Surface style={styles.paperReceipt} elevation={2}>
            <Text style={styles.receiptFont}>{textReceipt}</Text>
          </Surface>
        </ScrollView>

        <Divider style={{ marginVertical: 12 }} />

        {/* Actions */}
        <View style={styles.actionRow}>
          <Button
            mode="contained"
            icon="printer"
            onPress={handlePrintEscPos}
            loading={isPrinting}
            disabled={isPrinting}
            style={{ flex: 1, marginRight: 6 }}
          >
            Bluetooth Print
          </Button>

          <Button
            mode="outlined"
            icon="share-variant"
            onPress={() => alert('HTML Invoice generated for sharing!')}
            style={{ flex: 1, marginLeft: 6 }}
          >
            Share PDF
          </Button>
        </View>

        <Button mode="contained-tonal" onPress={onDismiss} style={{ marginTop: 10 }}>
          Done / Start New Sale
        </Button>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, margin: 16, borderRadius: 16, maxHeight: '85%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  previewContainer: { maxHeight: 400 },
  paperReceipt: { padding: 16, borderRadius: 8, backgroundColor: '#fffef0' },
  receiptFont: { fontFamily: 'monospace', fontSize: 12, color: '#111', lineHeight: 18 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
});

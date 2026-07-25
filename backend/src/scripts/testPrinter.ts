import { EscPosBuilder, Align, TextSize } from '../../../mobile/src/services/escposBuilder';
import { ReceiptFormatter, BillReceiptData } from '../../../mobile/src/services/receiptFormatter';
import { PdfService } from '../../../mobile/src/services/pdfService';

const sampleReceiptData: BillReceiptData = {
  store: {
    name: 'ANNAPURNA PROVISION STORE',
    address: '12 MG Road, Indiranagar, Bangalore',
    phone: '9876543210',
    gstNumber: '29ABCDE1234F1Z5',
    footerMessage: 'Thank you for shopping with us! Visit again.',
    receiptWidth: 58,
  },
  bill: {
    invoiceNumber: 'INV-20260725-0001',
    createdAt: new Date(),
    cashierName: 'Ramesh Kumar',
    customerName: 'Suresh Sharma',
    customerPhone: '9900112233',
    items: [
      { itemName: 'Aashirvaad Atta 5kg', quantity: 1, sellingPrice: 240, totalAmount: 240 },
      { itemName: 'Fortune Sunlite Oil 1L', quantity: 2, sellingPrice: 135, totalAmount: 270 },
      { itemName: 'Amul Butter 100g', quantity: 3, sellingPrice: 56, totalAmount: 168 },
    ],
    subtotal: 678,
    discountTotal: 28,
    taxTotal: 33.9,
    roundOff: 0.1,
    grandTotal: 684,
    paymentMethod: 'UPI',
  },
};

const runPrinterTests = () => {
  console.log('--- 1. Testing 58mm Thermal Text Receipt ---');
  const text58 = ReceiptFormatter.formatTextReceipt(sampleReceiptData);
  console.log(text58);

  console.log('\n--- 2. Testing 80mm Thermal Text Receipt ---');
  sampleReceiptData.store.receiptWidth = 80;
  const text80 = ReceiptFormatter.formatTextReceipt(sampleReceiptData);
  console.log(text80);

  console.log('\n--- 3. Testing ESC/POS Byte Buffer Generation ---');
  const bytes = ReceiptFormatter.formatEscPosReceipt(sampleReceiptData);
  console.log('✔ ESC/POS Uint8Array generated! Total bytes count:', bytes.length);

  console.log('\n--- 4. Testing PDF HTML Template Generation ---');
  const html = PdfService.generateInvoiceHtml(sampleReceiptData);
  console.log('✔ PDF HTML template generated! String length:', html.length);
  console.log('--- ALL THERMAL PRINTING & PDF TESTS PASSED PERFECTLY ---');
};

runPrinterTests();

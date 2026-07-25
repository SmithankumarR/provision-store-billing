import { EscPosBuilder, Align, TextSize } from './escposBuilder';

export interface BillReceiptData {
  store: {
    name: string;
    address: string;
    phone: string;
    gstNumber?: string;
    footerMessage?: string;
    receiptWidth?: 58 | 80;
  };
  bill: {
    invoiceNumber: string;
    createdAt: string | Date;
    cashierName?: string;
    customerName?: string;
    customerPhone?: string;
    items: Array<{
      itemName: string;
      quantity: number;
      sellingPrice: number;
      totalAmount: number;
    }>;
    subtotal: number;
    discountTotal: number;
    taxTotal: number;
    roundOff: number;
    grandTotal: number;
    paymentMethod: string;
  };
}

export class ReceiptFormatter {
  /**
   * Format two columns (left aligned, right aligned) within line width limit
   */
  private static formatTwoColumns(left: string, right: string, width: number): string {
    const space = width - left.length - right.length;
    if (space <= 0) {
      const truncatedLeft = left.substring(0, width - right.length - 1);
      return truncatedLeft + ' ' + right;
    }
    return left + ' '.repeat(space) + right;
  }

  /**
   * Format item row for receipt
   */
  private static formatItemRow(
    name: string,
    qty: number,
    rate: number,
    total: number,
    width: number
  ): string {
    if (width === 32) {
      // 58mm Receipt Format:
      // Line 1: Item Name
      // Line 2:   2 x 45.00              90.00
      const detailStr = `  ${qty} x ${rate.toFixed(2)}`;
      const totalStr = total.toFixed(2);
      const line2 = this.formatTwoColumns(detailStr, totalStr, 32);
      return `${name}\n${line2}`;
    } else {
      // 80mm Receipt Format (48 columns):
      // Item Name                 Qty    Rate     Total
      const colQty = String(qty).padStart(4, ' ');
      const colRate = rate.toFixed(2).padStart(8, ' ');
      const colTotal = total.toFixed(2).padStart(9, ' ');
      const nameWidth = 48 - 4 - 8 - 9 - 3; // 24 chars for name
      const truncatedName = name.length > nameWidth ? name.substring(0, nameWidth) : name.padEnd(nameWidth, ' ');
      return `${truncatedName} ${colQty} ${colRate} ${colTotal}`;
    }
  }

  /**
   * Format plain text receipt string representation
   */
  public static formatTextReceipt(data: BillReceiptData): string {
    const width = data.store.receiptWidth === 80 ? 48 : 32;
    const divider = '-'.repeat(width);
    const lines: string[] = [];

    // Header
    lines.push(data.store.name.toUpperCase());
    lines.push(data.store.address);
    lines.push(`Ph: ${data.store.phone}`);
    if (data.store.gstNumber) {
      lines.push(`GSTIN: ${data.store.gstNumber}`);
    }
    lines.push(divider);

    // Meta Details
    const dateStr = new Date(data.bill.createdAt).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    lines.push(this.formatTwoColumns(`Inv: ${data.bill.invoiceNumber}`, dateStr, width));
    if (data.bill.cashierName) {
      lines.push(`Cashier: ${data.bill.cashierName}`);
    }
    if (data.bill.customerName) {
      lines.push(`Customer: ${data.bill.customerName} (${data.bill.customerPhone || ''})`);
    }
    lines.push(divider);

    // Item Table Header
    if (width === 48) {
      lines.push(this.formatTwoColumns('Item Description          Qty     Rate     Total', '', width));
    } else {
      lines.push(this.formatTwoColumns('Item Description', 'Total', width));
    }
    lines.push(divider);

    // Items List
    data.bill.items.forEach((item) => {
      lines.push(
        this.formatItemRow(item.itemName, item.quantity, item.sellingPrice, item.totalAmount, width)
      );
    });
    lines.push(divider);

    // Summary Totals
    lines.push(this.formatTwoColumns('Subtotal:', `₹${data.bill.subtotal.toFixed(2)}`, width));
    if (data.bill.discountTotal > 0) {
      lines.push(this.formatTwoColumns('Discount:', `-₹${data.bill.discountTotal.toFixed(2)}`, width));
    }
    if (data.bill.taxTotal > 0) {
      lines.push(this.formatTwoColumns('GST Tax:', `+₹${data.bill.taxTotal.toFixed(2)}`, width));
    }
    if (data.bill.roundOff !== 0) {
      lines.push(this.formatTwoColumns('Round Off:', `${data.bill.roundOff > 0 ? '+' : ''}₹${data.bill.roundOff.toFixed(2)}`, width));
    }
    lines.push(divider);

    lines.push(this.formatTwoColumns('GRAND TOTAL:', `₹${data.bill.grandTotal.toFixed(2)}`, width));
    lines.push(this.formatTwoColumns('Payment Mode:', data.bill.paymentMethod, width));
    lines.push(divider);

    // Footer
    lines.push(data.store.footerMessage || 'Thank you for shopping with us!');

    return lines.join('\n');
  }

  /**
   * Format ESC/POS Uint8Array command buffer for bluetooth thermal printers
   */
  public static formatEscPosReceipt(data: BillReceiptData): Uint8Array {
    const width = data.store.receiptWidth === 80 ? 48 : 32;
    const builder = new EscPosBuilder();

    // Store Name Header (Centered & Bold & Double Size)
    builder
      .setAlign(Align.CENTER)
      .setBold(true)
      .setTextSize(TextSize.DOUBLE_BOTH)
      .textLine(data.store.name)
      .setTextSize(TextSize.NORMAL)
      .setBold(false);

    // Store Address & GST
    builder.textLine(data.store.address);
    builder.textLine(`Tel: ${data.store.phone}`);
    if (data.store.gstNumber) {
      builder.textLine(`GSTIN: ${data.store.gstNumber}`);
    }

    builder.divider(width);

    // Invoice Meta
    builder.setAlign(Align.LEFT);
    const dateStr = new Date(data.bill.createdAt).toLocaleDateString('en-IN') + ' ' + new Date(data.bill.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    builder.textLine(this.formatTwoColumns(`Invoice: ${data.bill.invoiceNumber}`, dateStr, width));
    if (data.bill.cashierName) {
      builder.textLine(`Cashier: ${data.bill.cashierName}`);
    }
    if (data.bill.customerName) {
      builder.textLine(`Customer: ${data.bill.customerName}`);
    }

    builder.divider(width);

    // Items
    data.bill.items.forEach((item) => {
      builder.textLine(
        this.formatItemRow(item.itemName, item.quantity, item.sellingPrice, item.totalAmount, width)
      );
    });

    builder.divider(width);

    // Totals
    builder.textLine(this.formatTwoColumns('Subtotal:', `Rs.${data.bill.subtotal.toFixed(2)}`, width));
    if (data.bill.discountTotal > 0) {
      builder.textLine(this.formatTwoColumns('Discount:', `-Rs.${data.bill.discountTotal.toFixed(2)}`, width));
    }
    if (data.bill.taxTotal > 0) {
      builder.textLine(this.formatTwoColumns('GST Tax:', `+Rs.${data.bill.taxTotal.toFixed(2)}`, width));
    }

    builder.setBold(true);
    builder.textLine(this.formatTwoColumns('GRAND TOTAL:', `Rs.${data.bill.grandTotal.toFixed(2)}`, width));
    builder.setBold(false);
    builder.textLine(this.formatTwoColumns('Payment Mode:', data.bill.paymentMethod, width));

    builder.divider(width);

    // Footer
    builder
      .setAlign(Align.CENTER)
      .textLine(data.store.footerMessage || 'Thank you! Visit again.')
      .newLine(3)
      .cut();

    return builder.build();
  }
}

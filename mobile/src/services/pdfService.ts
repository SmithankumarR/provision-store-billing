import { BillReceiptData } from './receiptFormatter';

export class PdfService {
  /**
   * Generates clean HTML template for invoice PDF rendering
   */
  public static generateInvoiceHtml(data: BillReceiptData): string {
    const dateStr = new Date(data.bill.createdAt).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const itemRowsHtml = data.bill.items
      .map(
        (item, index) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${index + 1}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: 500;">${item.itemName}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${item.sellingPrice.toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">₹${item.totalAmount.toFixed(2)}</td>
      </tr>
    `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Invoice #${data.bill.invoiceNumber}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 0; padding: 20px; font-size: 14px; }
          .header { text-align: center; border-bottom: 2px solid #2e7d32; padding-bottom: 15px; margin-bottom: 20px; }
          .store-title { font-size: 24px; font-weight: bold; color: #2e7d32; margin: 0 0 5px 0; }
          .store-sub { font-size: 13px; color: #666; margin: 2px 0; }
          .invoice-details { display: flex; justify-content: space-between; margin-bottom: 20px; background: #f9f9f9; padding: 15px; border-radius: 6px; }
          .details-col { flex: 1; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background: #2e7d32; color: #ffffff; padding: 10px; text-align: left; font-weight: 600; }
          th:first-child { border-top-left-radius: 4px; }
          th:last-child { border-top-right-radius: 4px; }
          .totals-table { width: 300px; margin-left: auto; margin-bottom: 20px; }
          .totals-table td { padding: 6px 10px; }
          .grand-total { font-size: 18px; font-weight: bold; color: #2e7d32; border-top: 2px solid #2e7d32; }
          .footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px dashed #ccc; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="store-title">${data.store.name}</h1>
          <p class="store-sub">${data.store.address}</p>
          <p class="store-sub">Phone: ${data.store.phone} ${data.store.gstNumber ? '| GSTIN: ' + data.store.gstNumber : ''}</p>
        </div>

        <div class="invoice-details">
          <div class="details-col">
            <strong>INVOICE TO:</strong><br />
            Name: ${data.bill.customerName || 'Walk-in Customer'}<br />
            ${data.bill.customerPhone ? 'Phone: ' + data.bill.customerPhone : ''}
          </div>
          <div class="details-col" style="text-align: right;">
            <strong>INVOICE INFO:</strong><br />
            Invoice No: <b>${data.bill.invoiceNumber}</b><br />
            Date: ${dateStr}<br />
            Cashier: ${data.bill.cashierName || 'Staff'}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="text-align: center; width: 40px;">#</th>
              <th>Item Description</th>
              <th style="text-align: center; width: 60px;">Qty</th>
              <th style="text-align: right; width: 100px;">Rate</th>
              <th style="text-align: right; width: 110px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemRowsHtml}
          </tbody>
        </table>

        <table class="totals-table">
          <tr>
            <td>Subtotal:</td>
            <td style="text-align: right;">₹${data.bill.subtotal.toFixed(2)}</td>
          </tr>
          ${
            data.bill.discountTotal > 0
              ? `<tr><td>Discount:</td><td style="text-align: right; color: #c62828;">-₹${data.bill.discountTotal.toFixed(2)}</td></tr>`
              : ''
          }
          ${
            data.bill.taxTotal > 0
              ? `<tr><td>GST Tax:</td><td style="text-align: right;">+₹${data.bill.taxTotal.toFixed(2)}</td></tr>`
              : ''
          }
          ${
            data.bill.roundOff !== 0
              ? `<tr><td>Round Off:</td><td style="text-align: right;">${data.bill.roundOff > 0 ? '+' : ''}₹${data.bill.roundOff.toFixed(2)}</td></tr>`
              : ''
          }
          <tr class="grand-total">
            <td>GRAND TOTAL:</td>
            <td style="text-align: right;">₹${data.bill.grandTotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="font-size: 12px; color: #666;">Payment Mode:</td>
            <td style="text-align: right; font-weight: bold;">${data.bill.paymentMethod}</td>
          </tr>
        </table>

        <div class="footer">
          <p>${data.store.footerMessage || 'Thank you for shopping with us! Visit again.'}</p>
        </div>
      </body>
      </html>
    `;
  }
}

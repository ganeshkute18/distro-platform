import { jsPDF } from 'jspdf';
import type { AppSettings, Order } from '../types';

export function downloadInvoicePdf(order: Order, settings?: AppSettings) {
  const doc = new jsPDF();
  const companyName = settings?.companyName || 'Nath Sales';
  let y = 14;

  doc.setFontSize(16);
  doc.text(companyName, 14, y);
  y += 8;
  doc.setFontSize(11);
  doc.text(`Invoice - ${order.orderNumber}`, 14, y);
  y += 6;
  doc.text(`Order Date: ${new Date(order.createdAt).toLocaleString()}`, 14, y);
  y += 8;

  doc.setFontSize(10);
  doc.text(`Customer: ${order.customer?.name || '-'}`, 14, y);
  y += 5;
  doc.text(`Phone: ${order.customer?.phone || '-'}`, 14, y);
  y += 5;
  doc.text(`Address: ${order.deliveryAddress || '-'}`, 14, y);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('Item', 14, y);
  doc.text('Qty', 120, y);
  doc.text('Unit', 140, y);
  doc.text('Subtotal', 170, y, { align: 'right' });
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.line(14, y, 196, y);
  y += 6;

  for (const item of order.items || []) {
    doc.text(item.product.name.slice(0, 48), 14, y);
    doc.text(String(item.quantity), 120, y);
    doc.text(`Rs ${(item.unitPrice / 100).toFixed(2)}`, 140, y);
    doc.text(`Rs ${(item.subtotal / 100).toFixed(2)}`, 170, y, { align: 'right' });
    y += 6;
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
  }

  y += 6;
  doc.line(120, y, 196, y);
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text(`Total: Rs ${(order.totalAmount / 100).toFixed(2)}`, 196, y, { align: 'right' });
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Payment: ${order.paymentMethod === 'QR' ? 'QR Payment' : 'Cash on Delivery'}`, 14, y);
  y += 5;
  doc.text(`Status: ${order.paymentStatus || 'PENDING'}`, 14, y);
  y += 8;
  doc.text('Thank you for your business.', 14, y);

  doc.save(`invoice-${order.orderNumber}.pdf`);
}


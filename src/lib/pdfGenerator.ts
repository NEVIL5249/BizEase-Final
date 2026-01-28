import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SalesInvoice, CompanyProfile } from './db';
import { format } from 'date-fns';

// Convert number to words
function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if (num === 0) return 'Zero';
  
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  
  const convertGroup = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' And ' + convertGroup(n % 100) : '');
  };
  
  const convertToIndian = (n: number): string => {
    if (n < 1000) return convertGroup(n);
    if (n < 100000) return convertGroup(Math.floor(n / 1000)) + ' Thousand ' + (n % 1000 ? convertGroup(n % 1000) : '');
    if (n < 10000000) return convertGroup(Math.floor(n / 100000)) + ' Lakh ' + (n % 100000 ? convertToIndian(n % 100000) : '');
    return convertGroup(Math.floor(n / 10000000)) + ' Crore ' + (n % 10000000 ? convertToIndian(n % 10000000) : '');
  };
  
  let result = convertToIndian(rupees) + ' Rupees';
  if (paise > 0) {
    result += ' And ' + convertGroup(paise) + ' Paise';
  }
  return result + ' Only';
}

export function generateInvoicePDF(invoice: SalesInvoice, company: CompanyProfile): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 15;

  // Company Name Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(company.name.toUpperCase(), pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  // Company Address
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${company.address}, ${company.city}-${company.pincode}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;
  doc.text(`Phone: ${company.phone} | Email: ${company.email}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  // Tax Invoice Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Draw border box for invoice details
  doc.rect(14, yPos, pageWidth - 28, 30);
  
  // Invoice details left side
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('M/s.:', 18, yPos + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.customerName, 32, yPos + 7);
  doc.text(invoice.customerAddress, 18, yPos + 13);
  doc.text(`Place of Supply: ${invoice.placeOfSupply}`, 18, yPos + 19);
  if (invoice.customerGstin) {
    doc.text(`GSTIN: ${invoice.customerGstin}`, 18, yPos + 25);
  }

  // Invoice details right side
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice No.:', pageWidth - 70, yPos + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.invoiceNumber, pageWidth - 40, yPos + 7);
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', pageWidth - 70, yPos + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(format(new Date(invoice.invoiceDate), 'dd/MM/yyyy'), pageWidth - 40, yPos + 13);
  doc.setFont('helvetica', 'bold');
  doc.text('Due Date:', pageWidth - 70, yPos + 19);
  doc.setFont('helvetica', 'normal');
  doc.text(format(new Date(invoice.dueDate), 'dd/MM/yyyy'), pageWidth - 40, yPos + 19);

  yPos += 35;

  // Items Table
  const tableData = invoice.items.map((item, index) => [
    (index + 1).toString(),
    item.name,
    item.hsn,
    item.quantity.toFixed(2),
    `₹${item.rate.toFixed(2)}`,
    `${item.gstRate}%`,
    `₹${item.taxableAmount.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Product Name', 'HSN/SAC', 'Qty', 'Rate', 'GST %', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [51, 51, 51],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 60 },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 20, halign: 'center' },
      6: { cellWidth: 25, halign: 'right' },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Totals section
  const totalsStartX = pageWidth - 80;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  doc.text('Sub Total:', totalsStartX, yPos);
  doc.text(`₹${invoice.subtotal.toFixed(2)}`, pageWidth - 18, yPos, { align: 'right' });
  yPos += 6;

  doc.text('CGST:', totalsStartX, yPos);
  doc.text(`₹${invoice.totalCgst.toFixed(2)}`, pageWidth - 18, yPos, { align: 'right' });
  yPos += 6;

  doc.text('SGST:', totalsStartX, yPos);
  doc.text(`₹${invoice.totalSgst.toFixed(2)}`, pageWidth - 18, yPos, { align: 'right' });
  yPos += 6;

  if (invoice.totalIgst > 0) {
    doc.text('IGST:', totalsStartX, yPos);
    doc.text(`₹${invoice.totalIgst.toFixed(2)}`, pageWidth - 18, yPos, { align: 'right' });
    yPos += 6;
  }

  doc.text('Round Off:', totalsStartX, yPos);
  doc.text(`₹${invoice.roundOff.toFixed(2)}`, pageWidth - 18, yPos, { align: 'right' });
  yPos += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Grand Total:', totalsStartX, yPos);
  doc.text(`₹${invoice.grandTotal.toFixed(2)}`, pageWidth - 18, yPos, { align: 'right' });
  yPos += 10;

  // Amount in words
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Amount in Words: ${numberToWords(invoice.grandTotal)}`, 14, yPos);
  yPos += 12;

  // Company bank details
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Bank Details:', 14, yPos);
  doc.setFont('helvetica', 'normal');
  yPos += 5;
  doc.text(`Bank: ${company.bankName || 'N/A'}`, 14, yPos);
  doc.text(`A/C: ${company.bankAccount || 'N/A'}`, 70, yPos);
  doc.text(`IFSC: ${company.ifscCode || 'N/A'}`, 130, yPos);
  yPos += 5;
  doc.text(`GSTIN: ${company.gstin}`, 14, yPos);
  yPos += 15;

  // Terms
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Terms & Conditions:', 14, yPos);
  doc.setFont('helvetica', 'normal');
  yPos += 4;
  const terms = [
    '1. Goods once sold will not be taken back.',
    '2. Interest @18% p.a. will be charged if payment is not made within due date.',
    '3. Our risk and responsibility ceases as soon as the goods leave our premises.',
    `4. Subject to '${company.city}' Jurisdiction only. E.&O.E`,
  ];
  terms.forEach(term => {
    doc.text(term, 14, yPos);
    yPos += 4;
  });

  // Signature section
  doc.setFont('helvetica', 'bold');
  doc.text(`For, ${company.name.toUpperCase()}`, pageWidth - 60, yPos + 10);
  doc.setFont('helvetica', 'normal');
  doc.text('(Authorised Signatory)', pageWidth - 55, yPos + 25);

  // Save the PDF
  doc.save(`Invoice_${invoice.invoiceNumber.replace(/\//g, '_')}.pdf`);
}

export function generateReportPDF(
  title: string,
  headers: string[],
  data: (string | number)[][],
  summary?: { label: string; value: string }[],
  company?: CompanyProfile
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 15;

  // Company name if available
  if (company) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(company.name.toUpperCase(), pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
  }

  // Report Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;

  // Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${format(new Date(), 'dd MMM yyyy, HH:mm')}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Table
  autoTable(doc, {
    startY: yPos,
    head: [headers],
    body: data,
    theme: 'grid',
    headStyles: {
      fillColor: [51, 51, 51],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Summary section
  if (summary && summary.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, yPos);
    yPos += 8;

    doc.setFontSize(10);
    summary.forEach(item => {
      doc.setFont('helvetica', 'bold');
      doc.text(item.label + ':', 14, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(item.value, 60, yPos);
      yPos += 6;
    });
  }

  // Save
  doc.save(`${title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
}

import { SalesInvoice } from '@/lib/db';
import { useApp } from '@/context/AppContext';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download, X } from 'lucide-react';
import { format } from 'date-fns';
import { generateInvoicePDF } from '@/lib/pdfGenerator';

interface InvoicePreviewProps {
  invoice: SalesInvoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

export function InvoicePreview({ invoice, open, onOpenChange }: InvoicePreviewProps) {
  const { company } = useApp();

  const handlePrint = () => {
    window.print();
  };

  if (!company) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0">
        {/* Action Bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-card border-b no-print">
          <h3 className="font-semibold">Invoice Preview</h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={() => generateInvoicePDF(invoice, company)}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Invoice Content - matching the bill reference */}
        <div className="p-8 bg-white text-black print:p-0">
          {/* Header */}
          <div className="border-2 border-black">
            {/* Company Name */}
            <div className="text-center py-3 border-b-2 border-black">
              <h1 className="text-2xl font-bold tracking-wide">{company.name.toUpperCase()}</h1>
            </div>
            
            {/* Company Address */}
            <div className="text-center py-2 border-b border-black text-sm">
              <p>{company.address},</p>
              <p>{company.city}-{company.pincode}</p>
            </div>

            {/* Invoice Type Row */}
            <div className="grid grid-cols-3 border-b border-black text-sm">
              <div className="p-2 border-r border-black">
                <span className="font-semibold">Debit Memo</span>
              </div>
              <div className="p-2 text-center border-r border-black">
                <span className="font-bold text-lg">TAX INVOICE</span>
              </div>
              <div className="p-2 text-right">
                <span className="font-semibold">Original</span>
              </div>
            </div>

            {/* Customer & Invoice Details */}
            <div className="grid grid-cols-2 border-b border-black text-sm">
              <div className="p-2 border-r border-black">
                <p><span className="font-semibold">M/s.:</span> {invoice.customerName}</p>
              </div>
              <div className="p-2">
                <div className="grid grid-cols-2">
                  <p><span className="font-semibold">Invoice No.</span></p>
                  <p>: {invoice.invoiceNumber}</p>
                </div>
                <div className="grid grid-cols-2">
                  <p><span className="font-semibold">Date</span></p>
                  <p>: {format(new Date(invoice.invoiceDate), 'dd/MM/yyyy')}</p>
                </div>
              </div>
            </div>

            {/* Address & Place of Supply */}
            <div className="p-2 border-b border-black text-sm">
              <p className="font-semibold ml-4">{invoice.customerAddress.split(',')[1]?.trim() || invoice.customerAddress}</p>
              <p><span className="font-semibold">Place of Supply:</span> {invoice.placeOfSupply}</p>
            </div>

            {/* Items Table */}
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-black bg-gray-50">
                  <th className="border-r border-black p-2 text-left w-12">SrNo</th>
                  <th className="border-r border-black p-2 text-left">Product Name</th>
                  <th className="border-r border-black p-2 text-center w-24">HSN/SAC</th>
                  <th className="border-r border-black p-2 text-center w-16">Size</th>
                  <th className="border-r border-black p-2 text-center w-16">Qty</th>
                  <th className="border-r border-black p-2 text-right w-20">Rate</th>
                  <th className="border-r border-black p-2 text-center w-16">GST %</th>
                  <th className="p-2 text-right w-24">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index} className="border-b border-black">
                    <td className="border-r border-black p-2 text-center">{index + 1}</td>
                    <td className="border-r border-black p-2">{item.name}</td>
                    <td className="border-r border-black p-2 text-center">{item.hsn}</td>
                    <td className="border-r border-black p-2 text-center">-</td>
                    <td className="border-r border-black p-2 text-center">{item.quantity.toFixed(3)}</td>
                    <td className="border-r border-black p-2 text-right">{item.rate.toFixed(2)}</td>
                    <td className="border-r border-black p-2 text-center">{item.gstRate.toFixed(2)}</td>
                    <td className="p-2 text-right">{item.taxableAmount.toFixed(2)}</td>
                  </tr>
                ))}
                {/* Empty rows for styling */}
                {Array.from({ length: Math.max(0, 8 - invoice.items.length) }).map((_, i) => (
                  <tr key={`empty-${i}`} className="border-b border-black h-8">
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Footer Section */}
            <div className="grid grid-cols-2 border-t-2 border-black text-sm">
              {/* Left Side - Company Details */}
              <div className="border-r border-black">
                <div className="p-2 border-b border-black">
                  <p><span className="font-semibold">GSTIN No.:</span> {company.gstin}</p>
                </div>
                <div className="p-2 border-b border-black">
                  <p><span className="font-semibold">Bank Name</span> : {company.bankName}</p>
                  <p><span className="font-semibold">Bank A/c. No.</span> : {company.bankAccount}</p>
                  <p><span className="font-semibold">RTGS/IFSC Code</span> : {company.ifscCode}</p>
                </div>
                <div className="p-2 border-b border-black">
                  <p><span className="font-semibold">Total GST:</span> {numberToWords(invoice.totalCgst + invoice.totalSgst)}</p>
                </div>
                <div className="p-2 border-b border-black">
                  <p><span className="font-semibold">Bill Amount:</span> {numberToWords(invoice.grandTotal)}</p>
                </div>
                <div className="p-2">
                  <p><span className="font-semibold">Note:</span> {invoice.notes || '-'}</p>
                </div>
              </div>

              {/* Right Side - Totals */}
              <div>
                <div className="grid grid-cols-2 border-b border-black">
                  <div className="p-2 border-r border-black font-semibold">Sub Total</div>
                  <div className="p-2 text-right">{invoice.subtotal.toFixed(2)}</div>
                </div>
                <div className="border-b border-black">
                  <div className="grid grid-cols-3 p-2">
                    <div className="font-semibold">Taxable Amount</div>
                    <div></div>
                    <div className="text-right">{invoice.subtotal.toFixed(2)}</div>
                  </div>
                  <div className="grid grid-cols-3 px-2 py-1">
                    <div>Central Tax</div>
                    <div className="text-center">{((invoice.totalCgst / invoice.subtotal) * 100 || 0).toFixed(2)}%</div>
                    <div className="text-right">{invoice.totalCgst.toFixed(2)}</div>
                  </div>
                  <div className="grid grid-cols-3 px-2 py-1">
                    <div>State/UT Tax</div>
                    <div className="text-center">{((invoice.totalSgst / invoice.subtotal) * 100 || 0).toFixed(2)}%</div>
                    <div className="text-right">{invoice.totalSgst.toFixed(2)}</div>
                  </div>
                  <div className="grid grid-cols-3 px-2 pb-2">
                    <div>Round Off</div>
                    <div></div>
                    <div className="text-right">{invoice.roundOff.toFixed(2)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 border-b border-black font-bold">
                  <div className="p-2 border-r border-black">Grand Total</div>
                  <div className="p-2 text-right">{invoice.grandTotal.toFixed(2)}</div>
                </div>
                <div className="p-2 text-right">
                  <p className="font-semibold">For, {company.name.toUpperCase()}</p>
                </div>
              </div>
            </div>

            {/* Terms & Signature */}
            <div className="grid grid-cols-2 border-t border-black text-xs">
              <div className="p-2 border-r border-black">
                <p className="font-semibold mb-1">Terms & Condition:</p>
                <ol className="list-decimal ml-4 space-y-0.5">
                  <li>Goods once sold will not be taken back.</li>
                  <li>Interest @18% p.a. will be charged if payment is not made within due date.</li>
                  <li>Our risk and responsibility ceases as soon as the goods leave our premises.</li>
                  <li>"Subject to '{company.city}' Jurisdiction only. E.&O.E"</li>
                </ol>
              </div>
              <div className="p-2 flex flex-col justify-end items-end">
                <div className="h-16"></div>
                <p className="text-sm">(Authorised Signatory)</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

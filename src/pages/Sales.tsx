import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Plus, Search, FileText, Download, Eye, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CreateInvoiceDialog } from '@/components/sales/CreateInvoiceDialog';
import { InvoicePreview } from '@/components/sales/InvoicePreview';
import { RecordPaymentDialog } from '@/components/sales/RecordPaymentDialog';
import { SalesInvoice } from '@/lib/db';
import { generateInvoicePDF } from '@/lib/pdfGenerator';

const statusStyles = {
  paid: 'badge-success',
  pending: 'badge-warning',
  partial: 'badge-info',
  overdue: 'badge-danger',
  draft: 'bg-muted text-muted-foreground',
};

export function Sales() {
  const { sales, isLoading, recordPayment, company } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<SalesInvoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<SalesInvoice | null>(null);

  const filteredSales = sales.filter(sale => {
    const matchesSearch = 
      sale.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sale.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalAmount = filteredSales.reduce((sum, s) => sum + s.grandTotal, 0);
  const paidAmount = filteredSales.reduce((sum, s) => sum + s.amountPaid, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sales</h1>
          <p className="text-muted-foreground mt-1">Manage your sales invoices</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="btn-gradient gap-2">
          <Plus className="w-4 h-4" />
          Create Invoice
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-elevated p-4">
          <p className="text-sm text-muted-foreground">Total Invoices</p>
          <p className="text-2xl font-bold text-foreground mt-1">{filteredSales.length}</p>
        </div>
        <div className="card-elevated p-4">
          <p className="text-sm text-muted-foreground">Total Amount</p>
          <p className="text-2xl font-bold text-foreground mt-1">₹{totalAmount.toLocaleString('en-IN')}</p>
        </div>
        <div className="card-elevated p-4">
          <p className="text-sm text-muted-foreground">Collected</p>
          <p className="text-2xl font-bold text-success mt-1">₹{paidAmount.toLocaleString('en-IN')}</p>
        </div>
        <div className="card-elevated p-4">
          <p className="text-sm text-muted-foreground">Outstanding</p>
          <p className="text-2xl font-bold text-warning mt-1">₹{(totalAmount - paidAmount).toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card-elevated p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by invoice number or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="card-elevated overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSales.map((sale) => (
              <TableRow key={sale.id} className="table-row-hover">
                <TableCell className="font-medium">{sale.invoiceNumber}</TableCell>
                <TableCell>{format(new Date(sale.invoiceDate), 'dd MMM yyyy')}</TableCell>
                <TableCell>{sale.customerName}</TableCell>
                <TableCell>{format(new Date(sale.dueDate), 'dd MMM yyyy')}</TableCell>
                <TableCell className="text-right font-medium">
                  ₹{sale.grandTotal.toLocaleString('en-IN')}
                </TableCell>
                <TableCell className="text-right text-success">
                  ₹{sale.amountPaid.toLocaleString('en-IN')}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn('capitalize', statusStyles[sale.status])}>
                    {sale.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => setPreviewInvoice(sale)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => company && generateInvoicePDF(sale, company)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    {sale.status !== 'paid' && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-success"
                        onClick={() => setPaymentInvoice(sale)}
                      >
                        <CreditCard className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {filteredSales.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No invoices found</p>
          </div>
        )}
      </div>

      <CreateInvoiceDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      
      {previewInvoice && (
        <InvoicePreview 
          invoice={previewInvoice} 
          open={!!previewInvoice} 
          onOpenChange={() => setPreviewInvoice(null)} 
        />
      )}

      {paymentInvoice && (
        <RecordPaymentDialog
          invoice={paymentInvoice}
          open={!!paymentInvoice}
          onOpenChange={() => setPaymentInvoice(null)}
          onPaymentRecorded={async (id, amount) => {
            await recordPayment(id, amount);
          }}
        />
      )}
    </div>
  );
}

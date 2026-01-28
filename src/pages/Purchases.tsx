import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Plus, Search, Package, CreditCard } from 'lucide-react';
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
import { RecordPurchasePaymentDialog } from '@/components/purchases/RecordPurchasePaymentDialog';
import { CreatePurchaseBillDialog } from '@/components/purchases/CreatePurchaseBillDialog';
import { PurchaseBill } from '@/lib/db';

const statusStyles = {
  paid: 'badge-success',
  pending: 'badge-warning',
  partial: 'badge-info',
  overdue: 'badge-danger',
  draft: 'bg-muted text-muted-foreground',
};

export function Purchases() {
  const { purchases, isLoading, recordPurchasePayment } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBill, setSelectedBill] = useState<PurchaseBill | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleRecordPayment = (bill: PurchaseBill) => {
    setSelectedBill(bill);
    setShowPaymentDialog(true);
  };

  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch = 
      purchase.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || purchase.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalAmount = filteredPurchases.reduce((sum, p) => sum + p.grandTotal, 0);
  const paidAmount = filteredPurchases.reduce((sum, p) => sum + p.amountPaid, 0);

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
          <h1 className="text-2xl font-bold text-foreground">Purchases</h1>
          <p className="text-muted-foreground mt-1">Manage your purchase bills</p>
        </div>
        <Button className="btn-gradient gap-2" onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4" />
          Create Bill
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-elevated p-4">
          <p className="text-sm text-muted-foreground">Total Bills</p>
          <p className="text-2xl font-bold text-foreground mt-1">{filteredPurchases.length}</p>
        </div>
        <div className="card-elevated p-4">
          <p className="text-sm text-muted-foreground">Total Amount</p>
          <p className="text-2xl font-bold text-foreground mt-1">₹{totalAmount.toLocaleString('en-IN')}</p>
        </div>
        <div className="card-elevated p-4">
          <p className="text-sm text-muted-foreground">Paid</p>
          <p className="text-2xl font-bold text-success mt-1">₹{paidAmount.toLocaleString('en-IN')}</p>
        </div>
        <div className="card-elevated p-4">
          <p className="text-sm text-muted-foreground">Payable</p>
          <p className="text-2xl font-bold text-warning mt-1">₹{(totalAmount - paidAmount).toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card-elevated p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by bill number or supplier..."
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
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="card-elevated overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bill #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPurchases.map((purchase) => (
              <TableRow key={purchase.id} className="table-row-hover">
                <TableCell className="font-medium">{purchase.billNumber}</TableCell>
                <TableCell>{format(new Date(purchase.billDate), 'dd MMM yyyy')}</TableCell>
                <TableCell>{purchase.supplierName}</TableCell>
                <TableCell>{format(new Date(purchase.dueDate), 'dd MMM yyyy')}</TableCell>
                <TableCell className="text-right font-medium">
                  ₹{purchase.grandTotal.toLocaleString('en-IN')}
                </TableCell>
                <TableCell className="text-right text-success">
                  ₹{purchase.amountPaid.toLocaleString('en-IN')}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn('capitalize', statusStyles[purchase.status])}>
                    {purchase.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {purchase.status !== 'paid' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRecordPayment(purchase)}
                      className="text-primary hover:text-primary/80"
                    >
                      <CreditCard className="w-4 h-4 mr-1" />
                      Pay
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {filteredPurchases.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No purchase bills found</p>
          </div>
        )}
      </div>

      {selectedBill && (
        <RecordPurchasePaymentDialog
          bill={selectedBill}
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          onPaymentRecorded={recordPurchasePayment}
        />
      )}

      <CreatePurchaseBillDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}

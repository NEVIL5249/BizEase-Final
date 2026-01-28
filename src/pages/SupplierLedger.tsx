import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Users, ArrowUpRight, ArrowDownLeft, Search, CreditCard } from 'lucide-react';
import { Input } from '@/components/ui/input';
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
import { generateReportPDF } from '@/lib/pdfGenerator';
import { PurchaseBill } from '@/lib/db';
import { RecordPurchasePaymentDialog } from '@/components/purchases/RecordPurchasePaymentDialog';

export function SupplierLedger() {
  const { suppliers, purchases, company, isLoading, recordPurchasePayment } = useApp();
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBill, setSelectedBill] = useState<PurchaseBill | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const handleRecordPayment = (bill: PurchaseBill) => {
    setSelectedBill(bill);
    setShowPaymentDialog(true);
  };

  // Calculate supplier-wise balances
  const supplierBalances = useMemo(() => {
    return suppliers.map(supplier => {
      const supplierPurchases = purchases.filter(p => p.supplierId === supplier.id);
      const totalPurchased = supplierPurchases.reduce((sum, p) => sum + p.grandTotal, 0);
      const totalPaid = supplierPurchases.reduce((sum, p) => sum + p.amountPaid, 0);
      const outstanding = totalPurchased - totalPaid;
      const billCount = supplierPurchases.length;
      
      return {
        ...supplier,
        totalPurchased,
        totalPaid,
        outstanding,
        billCount,
      };
    }).sort((a, b) => b.outstanding - a.outstanding);
  }, [suppliers, purchases]);

  // Generate ledger entries for selected supplier
  const ledgerEntries = useMemo(() => {
    let filteredPurchases = purchases;
    
    if (selectedSupplier !== 'all') {
      filteredPurchases = purchases.filter(p => p.supplierId === selectedSupplier);
    }
    
    if (searchQuery) {
      filteredPurchases = filteredPurchases.filter(p => 
        p.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.supplierName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Create entries: Purchase entries (credit - we owe more) and Payment entries (debit - we paid)
    const entries: {
      id: string;
      date: Date;
      type: 'purchase' | 'payment';
      reference: string;
      supplierName: string;
      supplierId: string;
      description: string;
      debit: number;
      credit: number;
      status?: string;
    }[] = [];

    filteredPurchases.forEach(purchase => {
      // Purchase entry
      entries.push({
        id: `pur-${purchase.id}`,
        date: new Date(purchase.billDate),
        type: 'purchase',
        reference: purchase.billNumber,
        supplierName: purchase.supplierName,
        supplierId: purchase.supplierId,
        description: `Purchase Bill - ${purchase.supplierBillNumber || purchase.billNumber}`,
        debit: 0,
        credit: purchase.grandTotal,
        status: purchase.status,
      });

      // Payment entry if any payment made
      if (purchase.amountPaid > 0) {
        entries.push({
          id: `pay-${purchase.id}`,
          date: new Date(purchase.updatedAt || purchase.billDate),
          type: 'payment',
          reference: purchase.billNumber,
          supplierName: purchase.supplierName,
          supplierId: purchase.supplierId,
          description: `Payment Against ${purchase.billNumber}`,
          debit: purchase.amountPaid,
          credit: 0,
        });
      }
    });

    return entries.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [purchases, selectedSupplier, searchQuery]);

  // Calculate running balance
  const entriesWithBalance = useMemo(() => {
    let runningBalance = 0;
    const sorted = [...ledgerEntries].sort((a, b) => a.date.getTime() - b.date.getTime());
    
    return sorted.map(entry => {
      runningBalance += entry.credit - entry.debit; // Credit increases payable, debit decreases
      return { ...entry, balance: runningBalance };
    }).reverse();
  }, [ledgerEntries]);

  const totals = useMemo(() => {
    const totalCredit = ledgerEntries.reduce((sum, e) => sum + e.credit, 0);
    const totalDebit = ledgerEntries.reduce((sum, e) => sum + e.debit, 0);
    const netPayable = totalCredit - totalDebit;
    
    return { totalCredit, totalDebit, netPayable };
  }, [ledgerEntries]);

  const handleExportPDF = () => {
    const headers = ['Date', 'Reference', 'Supplier', 'Description', 'Debit', 'Credit', 'Balance'];
    const data = entriesWithBalance.map(e => [
      format(e.date, 'dd MMM yyyy'),
      e.reference,
      e.supplierName,
      e.description,
      e.debit > 0 ? `₹${e.debit.toLocaleString('en-IN')}` : '-',
      e.credit > 0 ? `₹${e.credit.toLocaleString('en-IN')}` : '-',
      `₹${e.balance.toLocaleString('en-IN')}`,
    ]);

    const summary = [
      { label: 'Total Purchases', value: `₹${totals.totalCredit.toLocaleString('en-IN')}` },
      { label: 'Total Payments', value: `₹${totals.totalDebit.toLocaleString('en-IN')}` },
      { label: 'Net Payable', value: `₹${totals.netPayable.toLocaleString('en-IN')}` },
    ];

    generateReportPDF('Supplier Ledger', headers, data, summary, company || undefined);
  };

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
          <h1 className="text-2xl font-bold text-foreground">Supplier Ledger</h1>
          <p className="text-muted-foreground mt-1">Track payments and outstanding balances with suppliers</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleExportPDF}>
          <Download className="w-4 h-4" />
          Export PDF
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-elevated p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="w-4 h-4" />
            <span className="text-sm">Total Suppliers</span>
          </div>
          <p className="text-2xl font-bold">{suppliers.length}</p>
        </Card>
        <Card className="card-elevated p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <ArrowDownLeft className="w-4 h-4" />
            <span className="text-sm">Total Purchases</span>
          </div>
          <p className="text-2xl font-bold">₹{(totals.totalCredit / 100000).toFixed(2)}L</p>
        </Card>
        <Card className="card-elevated p-4">
          <div className="flex items-center gap-2 text-success mb-1">
            <ArrowUpRight className="w-4 h-4" />
            <span className="text-sm">Total Paid</span>
          </div>
          <p className="text-2xl font-bold text-success">₹{(totals.totalDebit / 100000).toFixed(2)}L</p>
        </Card>
        <Card className={cn("card-elevated p-4", totals.netPayable > 0 && "border-warning/30 bg-warning/5")}>
          <div className={cn("flex items-center gap-2 mb-1", totals.netPayable > 0 ? "text-warning" : "text-success")}>
            <CreditCard className="w-4 h-4" />
            <span className="text-sm">Net Payable</span>
          </div>
          <p className={cn("text-2xl font-bold", totals.netPayable > 0 ? "text-warning" : "text-success")}>
            ₹{(totals.netPayable / 100000).toFixed(2)}L
          </p>
        </Card>
      </div>

      {/* Supplier Balances */}
      <Card className="card-elevated">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Supplier-wise Outstanding</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {supplierBalances.slice(0, 6).map(supplier => (
            <div 
              key={supplier.id}
              className={cn(
                "p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50",
                selectedSupplier === supplier.id && "border-primary bg-primary/5"
              )}
              onClick={() => setSelectedSupplier(supplier.id === selectedSupplier ? 'all' : supplier.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{supplier.name}</span>
                <Badge variant="outline" className="text-xs">
                  {supplier.billCount} bills
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Purchased</p>
                  <p className="font-medium">₹{supplier.totalPurchased.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Paid</p>
                  <p className="font-medium text-success">₹{supplier.totalPaid.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Due</p>
                  <p className={cn("font-medium", supplier.outstanding > 0 ? "text-warning" : "text-success")}>
                    ₹{supplier.outstanding.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Filters */}
      <Card className="card-elevated p-4">
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
          <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by supplier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Suppliers</SelectItem>
              {suppliers.map(supplier => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Ledger Table */}
      <Card className="card-elevated overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold">
            Transaction History
            {selectedSupplier !== 'all' && (
              <span className="text-muted-foreground font-normal ml-2">
                - {suppliers.find(s => s.id === selectedSupplier)?.name}
              </span>
            )}
          </h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Debit (Paid)</TableHead>
              <TableHead className="text-right">Credit (Payable)</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entriesWithBalance.map((entry) => {
              const purchase = purchases.find(p => p.billNumber === entry.reference);
              return (
                <TableRow key={entry.id} className="table-row-hover">
                  <TableCell>{format(entry.date, 'dd MMM yyyy')}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs capitalize",
                        entry.type === 'purchase' && "bg-info/10 text-info border-info/20",
                        entry.type === 'payment' && "bg-success/10 text-success border-success/20"
                      )}
                    >
                      {entry.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{entry.reference}</TableCell>
                  <TableCell>{entry.supplierName}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{entry.description}</TableCell>
                  <TableCell className="text-right text-success font-medium">
                    {entry.debit > 0 ? `₹${entry.debit.toLocaleString('en-IN')}` : '-'}
                  </TableCell>
                  <TableCell className="text-right text-destructive font-medium">
                    {entry.credit > 0 ? `₹${entry.credit.toLocaleString('en-IN')}` : '-'}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-semibold",
                    entry.balance > 0 ? "text-warning" : "text-success"
                  )}>
                    ₹{Math.abs(entry.balance).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-right">
                    {entry.type === 'purchase' && purchase && purchase.status !== 'paid' && (
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
              );
            })}
          </TableBody>
        </Table>
        
        {entriesWithBalance.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No transactions found</p>
          </div>
        )}
      </Card>

      {selectedBill && (
        <RecordPurchasePaymentDialog
          bill={selectedBill}
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          onPaymentRecorded={recordPurchasePayment}
        />
      )}
    </div>
  );
}

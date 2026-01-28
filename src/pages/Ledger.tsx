import { useApp } from '@/context/AppContext';
import { BookOpen, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function Ledger() {
  const { sales, purchases, expenses, customers, isLoading } = useApp();

  // Generate ledger entries from sales and purchases
  const ledgerEntries = [
    ...sales.map(sale => ({
      id: sale.id,
      date: new Date(sale.invoiceDate),
      type: 'sale' as const,
      reference: sale.invoiceNumber,
      party: sale.customerName,
      description: `Sales Invoice - ${sale.customerName}`,
      debit: sale.grandTotal,
      credit: 0,
    })),
    ...purchases.map(purchase => ({
      id: purchase.id,
      date: new Date(purchase.billDate),
      type: 'purchase' as const,
      reference: purchase.billNumber,
      party: purchase.supplierName,
      description: `Purchase Bill - ${purchase.supplierName}`,
      debit: 0,
      credit: purchase.grandTotal,
    })),
    ...expenses.map(expense => ({
      id: expense.id,
      date: new Date(expense.date),
      type: 'expense' as const,
      reference: '-',
      party: expense.category,
      description: expense.description,
      debit: 0,
      credit: expense.amount,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  // Calculate running balance
  let runningBalance = 0;
  const entriesWithBalance = ledgerEntries.map(entry => {
    runningBalance += entry.debit - entry.credit;
    return { ...entry, balance: runningBalance };
  }).reverse();

  const totalDebit = ledgerEntries.reduce((sum, e) => sum + e.debit, 0);
  const totalCredit = ledgerEntries.reduce((sum, e) => sum + e.credit, 0);

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
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ledger</h1>
        <p className="text-muted-foreground mt-1">View all financial transactions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-elevated p-4">
          <p className="text-sm text-muted-foreground">Total Entries</p>
          <p className="text-2xl font-bold text-foreground mt-1">{ledgerEntries.length}</p>
        </div>
        <div className="card-elevated p-4">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-success" />
            <p className="text-sm text-muted-foreground">Total Debit</p>
          </div>
          <p className="text-2xl font-bold text-success mt-1">₹{totalDebit.toLocaleString('en-IN')}</p>
        </div>
        <div className="card-elevated p-4">
          <div className="flex items-center gap-2">
            <ArrowDownLeft className="w-4 h-4 text-destructive" />
            <p className="text-sm text-muted-foreground">Total Credit</p>
          </div>
          <p className="text-2xl font-bold text-destructive mt-1">₹{totalCredit.toLocaleString('en-IN')}</p>
        </div>
        <div className="card-elevated p-4">
          <p className="text-sm text-muted-foreground">Net Balance</p>
          <p className={cn(
            'text-2xl font-bold mt-1',
            totalDebit - totalCredit >= 0 ? 'text-success' : 'text-destructive'
          )}>
            ₹{Math.abs(totalDebit - totalCredit).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="card-elevated overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Party</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Debit</TableHead>
              <TableHead className="text-right">Credit</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entriesWithBalance.reverse().map((entry) => (
              <TableRow key={entry.id} className="table-row-hover">
                <TableCell>{format(entry.date, 'dd MMM yyyy')}</TableCell>
                <TableCell>
                  <span className={cn(
                    'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full capitalize',
                    entry.type === 'sale' && 'bg-success/10 text-success',
                    entry.type === 'purchase' && 'bg-info/10 text-info',
                    entry.type === 'expense' && 'bg-warning/10 text-warning'
                  )}>
                    {entry.type}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-sm">{entry.reference}</TableCell>
                <TableCell>{entry.party}</TableCell>
                <TableCell className="max-w-[200px] truncate">{entry.description}</TableCell>
                <TableCell className="text-right text-success font-medium">
                  {entry.debit > 0 ? `₹${entry.debit.toLocaleString('en-IN')}` : '-'}
                </TableCell>
                <TableCell className="text-right text-destructive font-medium">
                  {entry.credit > 0 ? `₹${entry.credit.toLocaleString('en-IN')}` : '-'}
                </TableCell>
                <TableCell className={cn(
                  'text-right font-semibold',
                  entry.balance >= 0 ? 'text-success' : 'text-destructive'
                )}>
                  ₹{Math.abs(entry.balance).toLocaleString('en-IN')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {ledgerEntries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No transactions yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

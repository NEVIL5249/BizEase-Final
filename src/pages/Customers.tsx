import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Plus, Search, Users as UsersIcon, CreditCard } from 'lucide-react';
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
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AddCustomerDialog } from '@/components/customers/AddCustomerDialog';

export function Customers() {
  const { customers, sales, isLoading } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery) ||
    (customer.gstin && customer.gstin.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Calculate customer stats
  const customerStats = filteredCustomers.map(customer => {
    const customerSales = sales.filter(s => s.customerId === customer.id);
    const totalSales = customerSales.reduce((sum, s) => sum + s.grandTotal, 0);
    const invoiceCount = customerSales.length;
    return { ...customer, totalSales, invoiceCount };
  });

  const totalOutstanding = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);

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
          <h1 className="text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground mt-1">Manage your customer relationships</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="btn-gradient gap-2">
          <Plus className="w-4 h-4" />
          Add Customer
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-elevated p-4">
          <p className="text-sm text-muted-foreground">Total Customers</p>
          <p className="text-2xl font-bold text-foreground mt-1">{customers.length}</p>
        </div>
        <div className="card-elevated p-4">
          <p className="text-sm text-muted-foreground">With GSTIN</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {customers.filter(c => c.gstin).length}
          </p>
        </div>
        <div className={cn('card-elevated p-4', totalOutstanding > 0 && 'bg-warning/10')}>
          <p className="text-sm text-muted-foreground">Total Outstanding</p>
          <p className={cn('text-2xl font-bold mt-1', totalOutstanding > 0 ? 'text-warning' : 'text-foreground')}>
            ₹{totalOutstanding.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="card-elevated p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone or GSTIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card-elevated overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>GSTIN</TableHead>
              <TableHead className="text-right">Invoices</TableHead>
              <TableHead className="text-right">Total Sales</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
              <TableHead>Credit Limit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customerStats.map((customer) => (
              <TableRow key={customer.id} className="table-row-hover">
                <TableCell>
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-xs text-muted-foreground">{customer.city}, {customer.state}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p>{customer.phone}</p>
                    {customer.email && <p className="text-xs text-muted-foreground">{customer.email}</p>}
                  </div>
                </TableCell>
                <TableCell>
                  {customer.gstin ? (
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{customer.gstin}</code>
                  ) : (
                    <span className="text-xs text-muted-foreground">Not registered</span>
                  )}
                </TableCell>
                <TableCell className="text-right">{customer.invoiceCount}</TableCell>
                <TableCell className="text-right font-medium">
                  ₹{customer.totalSales.toLocaleString('en-IN')}
                </TableCell>
                <TableCell className="text-right">
                  <span className={cn(
                    'font-medium',
                    customer.outstandingBalance > 0 ? 'text-warning' : 'text-success'
                  )}>
                    ₹{customer.outstandingBalance.toLocaleString('en-IN')}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">₹{customer.creditLimit.toLocaleString('en-IN')}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {filteredCustomers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <UsersIcon className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No customers found</p>
          </div>
        )}
      </div>

      <AddCustomerDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
    </div>
  );
}

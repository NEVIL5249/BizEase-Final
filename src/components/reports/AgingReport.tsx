import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { differenceInDays, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { generateReportPDF } from '@/lib/pdfGenerator';

interface AgingBucket {
  range: string;
  count: number;
  amount: number;
  invoices: {
    invoiceNumber: string;
    customerName: string;
    dueDate: Date;
    daysOverdue: number;
    outstanding: number;
  }[];
}

export function AgingReport() {
  const { sales, company } = useApp();

  const agingData = useMemo(() => {
    const today = new Date();
    const unpaidInvoices = sales.filter(s => s.status !== 'paid' && s.amountPaid < s.grandTotal);

    const buckets: AgingBucket[] = [
      { range: 'Current (Not Due)', count: 0, amount: 0, invoices: [] },
      { range: '0-30 Days', count: 0, amount: 0, invoices: [] },
      { range: '30-60 Days', count: 0, amount: 0, invoices: [] },
      { range: '60-90 Days', count: 0, amount: 0, invoices: [] },
      { range: '90+ Days', count: 0, amount: 0, invoices: [] },
    ];

    unpaidInvoices.forEach(invoice => {
      const dueDate = new Date(invoice.dueDate);
      const daysOverdue = differenceInDays(today, dueDate);
      const outstanding = invoice.grandTotal - invoice.amountPaid;

      const invoiceData = {
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName,
        dueDate,
        daysOverdue,
        outstanding,
      };

      if (daysOverdue < 0) {
        buckets[0].count++;
        buckets[0].amount += outstanding;
        buckets[0].invoices.push(invoiceData);
      } else if (daysOverdue <= 30) {
        buckets[1].count++;
        buckets[1].amount += outstanding;
        buckets[1].invoices.push(invoiceData);
      } else if (daysOverdue <= 60) {
        buckets[2].count++;
        buckets[2].amount += outstanding;
        buckets[2].invoices.push(invoiceData);
      } else if (daysOverdue <= 90) {
        buckets[3].count++;
        buckets[3].amount += outstanding;
        buckets[3].invoices.push(invoiceData);
      } else {
        buckets[4].count++;
        buckets[4].amount += outstanding;
        buckets[4].invoices.push(invoiceData);
      }
    });

    return buckets;
  }, [sales]);

  const totalOutstanding = agingData.reduce((sum, bucket) => sum + bucket.amount, 0);
  const totalInvoices = agingData.reduce((sum, bucket) => sum + bucket.count, 0);

  const handleExportPDF = () => {
    const headers = ['Invoice #', 'Customer', 'Due Date', 'Days Overdue', 'Outstanding'];
    const data: (string | number)[][] = [];

    agingData.forEach(bucket => {
      if (bucket.invoices.length > 0) {
        data.push([bucket.range, '', '', '', '']);
        bucket.invoices.forEach(inv => {
          data.push([
            inv.invoiceNumber,
            inv.customerName,
            format(inv.dueDate, 'dd MMM yyyy'),
            inv.daysOverdue < 0 ? 'Not Due' : `${inv.daysOverdue} days`,
            `₹${inv.outstanding.toLocaleString('en-IN')}`,
          ]);
        });
      }
    });

    const summary = [
      { label: 'Total Invoices', value: totalInvoices.toString() },
      { label: 'Total Outstanding', value: `₹${totalOutstanding.toLocaleString('en-IN')}` },
    ];

    generateReportPDF('Accounts Receivable Aging Report', headers, data, summary, company || undefined);
  };

  const getBucketColor = (index: number) => {
    const colors = [
      'bg-success/10 text-success border-success/20',
      'bg-info/10 text-info border-info/20',
      'bg-warning/10 text-warning border-warning/20',
      'bg-orange-500/10 text-orange-600 border-orange-500/20',
      'bg-destructive/10 text-destructive border-destructive/20',
    ];
    return colors[index];
  };

  const getBucketIcon = (index: number) => {
    if (index === 0) return <CheckCircle className="w-5 h-5" />;
    if (index < 3) return <Clock className="w-5 h-5" />;
    return <AlertTriangle className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Accounts Receivable Aging</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Track overdue invoices and outstanding payments
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleExportPDF}>
          <Download className="w-4 h-4" />
          Export PDF
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {agingData.map((bucket, index) => (
          <Card 
            key={bucket.range} 
            className={cn('p-4 border', getBucketColor(index))}
          >
            <div className="flex items-center gap-2 mb-2">
              {getBucketIcon(index)}
              <span className="text-xs font-medium">{bucket.range}</span>
            </div>
            <p className="text-2xl font-bold">₹{(bucket.amount / 1000).toFixed(1)}K</p>
            <p className="text-xs opacity-80">{bucket.count} invoice(s)</p>
          </Card>
        ))}
      </div>

      {/* Total Summary */}
      <Card className="p-4 bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Outstanding Receivables</p>
            <p className="text-3xl font-bold text-foreground">
              ₹{totalOutstanding.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Unpaid Invoices</p>
            <p className="text-3xl font-bold text-foreground">{totalInvoices}</p>
          </div>
        </div>
      </Card>

      {/* Detailed Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Overdue Invoice Details</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Days Overdue</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agingData.flatMap((bucket, bucketIndex) => 
              bucket.invoices
                .sort((a, b) => b.daysOverdue - a.daysOverdue)
                .map((invoice) => (
                  <TableRow key={invoice.invoiceNumber}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.customerName}</TableCell>
                    <TableCell>{format(invoice.dueDate, 'dd MMM yyyy')}</TableCell>
                    <TableCell>
                      {invoice.daysOverdue < 0 ? (
                        <span className="text-success">Due in {Math.abs(invoice.daysOverdue)} days</span>
                      ) : (
                        <span className={cn(
                          invoice.daysOverdue > 60 ? 'text-destructive' : 
                          invoice.daysOverdue > 30 ? 'text-warning' : 'text-muted-foreground'
                        )}>
                          {invoice.daysOverdue} days
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{invoice.outstanding.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={cn('text-xs', getBucketColor(bucketIndex))}
                      >
                        {bucket.range}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
            )}
            {totalInvoices === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-success" />
                  <p>All invoices are paid! No outstanding receivables.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

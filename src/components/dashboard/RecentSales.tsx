import { format } from 'date-fns';
import { SalesInvoice } from '@/lib/db';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface RecentSalesProps {
  sales: SalesInvoice[];
}

const statusStyles = {
  paid: 'badge-success',
  pending: 'badge-warning',
  partial: 'badge-info',
  overdue: 'badge-danger',
  draft: 'bg-muted text-muted-foreground',
};

export function RecentSales({ sales }: RecentSalesProps) {
  const recentSales = sales.slice(0, 5);

  return (
    <div className="card-elevated p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Recent Sales</h3>
        <span className="text-xs font-medium text-muted-foreground">Last 5 invoices</span>
      </div>
      
      <div className="space-y-3">
        {recentSales.map((sale) => (
          <div
            key={sale.id}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{sale.customerName}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">{sale.invoiceNumber}</span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(sale.invoiceDate), 'dd MMM')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-foreground">
                ₹{sale.grandTotal.toLocaleString('en-IN')}
              </span>
              <Badge variant="outline" className={cn('text-xs capitalize', statusStyles[sale.status])}>
                {sale.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

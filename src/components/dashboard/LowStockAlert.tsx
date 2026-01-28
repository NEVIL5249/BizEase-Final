import { Package, AlertTriangle } from 'lucide-react';
import { InventoryItem } from '@/lib/db';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface LowStockAlertProps {
  items: InventoryItem[];
}

export function LowStockAlert({ items }: LowStockAlertProps) {
  if (items.length === 0) {
    return (
      <div className="card-elevated p-5">
        <h3 className="font-semibold text-foreground mb-4">Stock Status</h3>
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center mb-2">
            <Package className="w-5 h-5 text-success" />
          </div>
          <p className="text-sm text-muted-foreground">All items well stocked</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-elevated p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Low Stock Items</h3>
        <span className="flex items-center gap-1 text-xs font-medium text-warning">
          <AlertTriangle className="w-3.5 h-3.5" />
          {items.length} items
        </span>
      </div>
      
      <div className="space-y-3">
        {items.slice(0, 4).map((item) => {
          const stockPercentage = (item.quantity / item.lowStockThreshold) * 100;
          const isCritical = item.quantity < item.lowStockThreshold * 0.5;
          
          return (
            <div key={item.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground truncate flex-1">{item.name}</span>
                <span className={cn(
                  'text-xs font-medium ml-2',
                  isCritical ? 'text-destructive' : 'text-warning'
                )}>
                  {item.quantity} {item.unit}
                </span>
              </div>
              <Progress 
                value={Math.min(stockPercentage, 100)} 
                className={cn(
                  'h-1.5',
                  isCritical ? '[&>div]:bg-destructive' : '[&>div]:bg-warning'
                )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { AlertTriangle, AlertCircle, Info, Package, CreditCard, TrendingDown, FileText } from 'lucide-react';
import { Alert } from '@/lib/db';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AlertsPanelProps {
  alerts: Alert[];
  onMarkRead: (id: string) => void;
}

const alertIcons = {
  low_stock: Package,
  overdue_payment: CreditCard,
  high_expense: TrendingDown,
  sales_drop: TrendingDown,
  gst_reminder: FileText,
};

const severityStyles = {
  info: {
    bg: 'bg-info/10',
    border: 'border-info/20',
    icon: 'text-info',
  },
  warning: {
    bg: 'bg-warning/10',
    border: 'border-warning/20',
    icon: 'text-warning',
  },
  critical: {
    bg: 'bg-destructive/10',
    border: 'border-destructive/20',
    icon: 'text-destructive',
  },
};

export function AlertsPanel({ alerts, onMarkRead }: AlertsPanelProps) {
  const unreadAlerts = alerts.filter(a => !a.isRead).slice(0, 4);

  if (unreadAlerts.length === 0) {
    return (
      <div className="card-elevated p-5">
        <h3 className="font-semibold text-foreground mb-4">Alerts</h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-3">
            <Info className="w-6 h-6 text-success" />
          </div>
          <p className="text-sm text-muted-foreground">All caught up!</p>
          <p className="text-xs text-muted-foreground mt-1">No pending alerts</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-elevated p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Alerts</h3>
        <span className="text-xs font-medium text-muted-foreground">{unreadAlerts.length} pending</span>
      </div>
      
      <div className="space-y-3">
        {unreadAlerts.map((alert) => {
          const Icon = alertIcons[alert.type] || AlertCircle;
          const styles = severityStyles[alert.severity];
          
          return (
            <div
              key={alert.id}
              className={cn(
                'p-3 rounded-lg border transition-all duration-200 hover:shadow-sm cursor-pointer',
                styles.bg,
                styles.border
              )}
              onClick={() => onMarkRead(alert.id)}
            >
              <div className="flex items-start gap-3">
                <div className={cn('mt-0.5', styles.icon)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{alert.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{alert.message}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {alerts.filter(a => !a.isRead).length > 4 && (
        <Button variant="ghost" size="sm" className="w-full mt-3 text-primary">
          View all alerts
        </Button>
      )}
    </div>
  );
}

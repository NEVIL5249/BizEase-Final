import { useApp } from '@/context/AppContext';
import { StatCard } from '@/components/dashboard/StatCard';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { RecentSales } from '@/components/dashboard/RecentSales';
import { LowStockAlert } from '@/components/dashboard/LowStockAlert';
import {
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  DollarSign,
  Receipt,
} from 'lucide-react';

export function Dashboard() {
  const { dashboardStats, sales, alerts, markAlertRead, isLoading } = useApp();

  if (isLoading || !dashboardStats) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's your business overview.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Sales"
          value={formatCurrency(dashboardStats.totalSales)}
          subtitle="Last 30 days"
          icon={TrendingUp}
          variant="primary"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Total Purchases"
          value={formatCurrency(dashboardStats.totalPurchases)}
          subtitle="Last 30 days"
          icon={TrendingDown}
        />
        <StatCard
          title="Receivables"
          value={formatCurrency(dashboardStats.outstandingReceivables)}
          subtitle={`${dashboardStats.overdueInvoices} overdue`}
          icon={CreditCard}
          variant={dashboardStats.overdueInvoices > 0 ? 'warning' : 'default'}
        />
        <StatCard
          title="Payables"
          value={formatCurrency(dashboardStats.outstandingPayables)}
          subtitle="Due to suppliers"
          icon={Wallet}
        />
        <StatCard
          title="Net Profit"
          value={formatCurrency(dashboardStats.netProfit)}
          subtitle="After expenses"
          icon={DollarSign}
          variant={dashboardStats.netProfit > 0 ? 'success' : 'danger'}
        />
        <StatCard
          title="Expenses"
          value={formatCurrency(dashboardStats.totalExpenses)}
          subtitle="Last 30 days"
          icon={Receipt}
        />
      </div>

      {/* Charts & Widgets Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart - Spans 2 columns */}
        <div className="lg:col-span-2">
          <SalesChart data={dashboardStats.salesByDay} />
        </div>

        {/* Alerts Panel */}
        <div>
          <AlertsPanel alerts={alerts} onMarkRead={markAlertRead} />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentSales sales={sales} />
        <LowStockAlert items={dashboardStats.lowStockItems} />
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, TrendingUp, TrendingDown, IndianRupee, Percent, ArrowUpRight, ArrowDownRight, PiggyBank, CreditCard } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import { generateReportPDF } from '@/lib/pdfGenerator';

export function ProfitLossReport() {
  const { sales, purchases, expenses, inventory, company } = useApp();
  const [period, setPeriod] = useState('thisMonth');

  const filterByPeriod = (date: Date) => {
    const today = new Date();
    let startDate: Date;
    let endDate: Date = today;
    
    switch (period) {
      case '30':
        startDate = subDays(today, 30);
        break;
      case '90':
        startDate = subDays(today, 90);
        break;
      case 'thisMonth':
        startDate = startOfMonth(today);
        break;
      case 'lastMonth':
        startDate = startOfMonth(subMonths(today, 1));
        endDate = endOfMonth(subMonths(today, 1));
        break;
      case 'thisQuarter':
        const quarter = Math.floor(today.getMonth() / 3);
        startDate = new Date(today.getFullYear(), quarter * 3, 1);
        break;
      case 'thisYear':
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        startDate = startOfMonth(today);
    }

    return isWithinInterval(date, { start: startDate, end: endDate });
  };

  const filteredData = useMemo(() => {
    const filteredSales = sales.filter(s => filterByPeriod(new Date(s.invoiceDate)));
    const filteredPurchases = purchases.filter(p => filterByPeriod(new Date(p.billDate)));
    const filteredExpenses = expenses.filter(e => filterByPeriod(new Date(e.date)));

    return { sales: filteredSales, purchases: filteredPurchases, expenses: filteredExpenses };
  }, [sales, purchases, expenses, period]);

  const stats = useMemo(() => {
    const totalRevenue = filteredData.sales.reduce((sum, s) => sum + s.subtotal, 0);
    const totalTax = filteredData.sales.reduce((sum, s) => sum + s.totalCgst + s.totalSgst + s.totalIgst, 0);
    
    // Calculate Cost of Goods Sold
    let costOfGoodsSold = 0;
    filteredData.sales.forEach(sale => {
      sale.items.forEach(item => {
        const invItem = inventory.find(i => i.id === item.itemId);
        if (invItem) {
          costOfGoodsSold += invItem.purchasePrice * item.quantity;
        }
      });
    });
    
    const grossProfit = totalRevenue - costOfGoodsSold;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    
    const totalExpenses = filteredData.expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = grossProfit - totalExpenses;
    const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const invoiceCount = filteredData.sales.length;
    const avgInvoice = invoiceCount > 0 ? totalRevenue / invoiceCount : 0;

    return { 
      totalRevenue, 
      totalTax,
      costOfGoodsSold, 
      grossProfit, 
      grossMargin,
      totalExpenses, 
      netProfit, 
      netMargin,
      invoiceCount,
      avgInvoice
    };
  }, [filteredData, inventory]);

  const monthlyData = useMemo(() => {
    const months: { [key: string]: { revenue: number; cogs: number; expenses: number; profit: number } } = {};
    
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const key = format(date, 'MMM');
      months[key] = { revenue: 0, cogs: 0, expenses: 0, profit: 0 };
    }

    sales.forEach(s => {
      const key = format(new Date(s.invoiceDate), 'MMM');
      if (months[key]) {
        months[key].revenue += s.subtotal;
        // Calculate COGS for this sale
        s.items.forEach(item => {
          const invItem = inventory.find(i => i.id === item.itemId);
          if (invItem) months[key].cogs += invItem.purchasePrice * item.quantity;
        });
      }
    });

    expenses.forEach(e => {
      const key = format(new Date(e.date), 'MMM');
      if (months[key]) {
        months[key].expenses += e.amount;
      }
    });

    return Object.entries(months).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      cogs: data.cogs,
      expenses: data.expenses,
      grossProfit: data.revenue - data.cogs,
      netProfit: data.revenue - data.cogs - data.expenses,
    }));
  }, [sales, expenses, inventory]);

  const expenseBreakdown = useMemo(() => {
    const grouped: { [key: string]: number } = {};
    
    filteredData.expenses.forEach(e => {
      grouped[e.category] = (grouped[e.category] || 0) + e.amount;
    });

    return Object.entries(grouped)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredData]);

  const expensePieData = useMemo(() => {
    const colors = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--info))', 'hsl(var(--destructive))', 'hsl(var(--secondary))'];
    return expenseBreakdown.slice(0, 6).map((item, index) => ({
      ...item,
      color: colors[index % colors.length],
    }));
  }, [expenseBreakdown]);

  const handleExportPDF = () => {
    const headers = ['Particulars', 'Amount (₹)'];
    const data: (string | number)[][] = [
      ['REVENUE', ''],
      ['Sales Revenue', stats.totalRevenue.toLocaleString('en-IN')],
      ['GST Collected (Liability)', stats.totalTax.toLocaleString('en-IN')],
      ['', ''],
      ['COST OF GOODS SOLD', ''],
      ['Cost of Items Sold', stats.costOfGoodsSold.toLocaleString('en-IN')],
      ['', ''],
      ['GROSS PROFIT', stats.grossProfit.toLocaleString('en-IN')],
      [`Gross Margin: ${stats.grossMargin.toFixed(1)}%`, ''],
      ['', ''],
      ['OPERATING EXPENSES', ''],
      ...expenseBreakdown.map(e => [e.category, e.amount.toLocaleString('en-IN')]),
      ['Total Operating Expenses', stats.totalExpenses.toLocaleString('en-IN')],
      ['', ''],
      ['NET PROFIT / (LOSS)', stats.netProfit.toLocaleString('en-IN')],
      [`Net Margin: ${stats.netMargin.toFixed(1)}%`, ''],
    ];

    const summary = [
      { label: 'Report Period', value: period === 'thisMonth' ? format(new Date(), 'MMMM yyyy') : period },
      { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString('en-IN')}` },
      { label: 'Gross Profit', value: `₹${stats.grossProfit.toLocaleString('en-IN')}` },
      { label: 'Gross Margin', value: `${stats.grossMargin.toFixed(1)}%` },
      { label: 'Net Profit', value: `₹${stats.netProfit.toLocaleString('en-IN')}` },
      { label: 'Net Margin', value: `${stats.netMargin.toFixed(1)}%` },
    ];

    generateReportPDF('Profit & Loss Statement', headers, data, summary, company || undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Profit & Loss Statement</h2>
          <p className="text-muted-foreground text-sm mt-1">Comprehensive income statement with margin analysis</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="thisQuarter">This Quarter</SelectItem>
              <SelectItem value="thisYear">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2" onClick={handleExportPDF}>
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Revenue</p>
              <p className="text-2xl font-bold mt-1">₹{(stats.totalRevenue / 100000).toFixed(2)}L</p>
            </div>
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-2">{stats.invoiceCount} invoices</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Gross Profit</p>
              <p className={cn("text-2xl font-bold mt-1", stats.grossProfit >= 0 ? "text-success" : "text-destructive")}>
                ₹{(stats.grossProfit / 100000).toFixed(2)}L
              </p>
            </div>
            <div className={cn("p-2 rounded-lg", stats.grossProfit >= 0 ? "bg-success/10" : "bg-destructive/10")}>
              <ArrowUpRight className={cn("w-5 h-5", stats.grossProfit >= 0 ? "text-success" : "text-destructive")} />
            </div>
          </div>
          <div className={cn("text-xs mt-2", stats.grossMargin >= 20 ? "text-success" : stats.grossMargin >= 10 ? "text-warning" : "text-destructive")}>
            {stats.grossMargin.toFixed(1)}% margin
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Expenses</p>
              <p className="text-2xl font-bold text-destructive mt-1">₹{(stats.totalExpenses / 1000).toFixed(0)}K</p>
            </div>
            <div className="p-2 rounded-lg bg-destructive/10">
              <ArrowDownRight className="w-5 h-5 text-destructive" />
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-2">{expenseBreakdown.length} categories</div>
        </Card>
        <Card className={cn("p-4", stats.netProfit >= 0 ? "bg-success/5 border-success/20" : "bg-destructive/5 border-destructive/20")}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Net Profit</p>
              <p className={cn("text-2xl font-bold mt-1", stats.netProfit >= 0 ? "text-success" : "text-destructive")}>
                ₹{(stats.netProfit / 100000).toFixed(2)}L
              </p>
            </div>
            <div className={cn("p-2 rounded-lg", stats.netProfit >= 0 ? "bg-success/10" : "bg-destructive/10")}>
              <PiggyBank className={cn("w-5 h-5", stats.netProfit >= 0 ? "text-success" : "text-destructive")} />
            </div>
          </div>
          <div className={cn("text-xs mt-2", stats.netMargin >= 10 ? "text-success" : stats.netMargin >= 5 ? "text-warning" : "text-destructive")}>
            {stats.netMargin.toFixed(1)}% net margin
          </div>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <CreditCard className="w-4 h-4" />
            <span className="text-xs">Cost of Goods Sold</span>
          </div>
          <p className="text-xl font-bold">₹{(stats.costOfGoodsSold / 100000).toFixed(2)}L</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <IndianRupee className="w-4 h-4" />
            <span className="text-xs">GST Collected</span>
          </div>
          <p className="text-xl font-bold">₹{stats.totalTax.toLocaleString('en-IN')}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Percent className="w-4 h-4" />
            <span className="text-xs">Gross Margin</span>
          </div>
          <p className={cn("text-xl font-bold", stats.grossMargin >= 20 ? "text-success" : stats.grossMargin >= 10 ? "text-warning" : "text-destructive")}>
            {stats.grossMargin.toFixed(1)}%
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Percent className="w-4 h-4" />
            <span className="text-xs">Net Margin</span>
          </div>
          <p className={cn("text-xl font-bold", stats.netMargin >= 10 ? "text-success" : stats.netMargin >= 5 ? "text-warning" : "text-destructive")}>
            {stats.netMargin.toFixed(1)}%
          </p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-semibold mb-4">Revenue & Profit Trend (6 Months)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="profitGradientArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v/100000).toFixed(1)}L`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number, name: string) => [`₹${value.toLocaleString('en-IN')}`, name]}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  name="Revenue"
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1}
                  fill="url(#revenueGradient)"
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="grossProfit" 
                  name="Gross Profit"
                  stroke="hsl(var(--info))" 
                  fillOpacity={0}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
                <Area 
                  type="monotone" 
                  dataKey="netProfit" 
                  name="Net Profit"
                  stroke="hsl(var(--success))" 
                  fillOpacity={1}
                  fill="url(#profitGradientArea)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-4">Expense Distribution</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expensePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="amount"
                >
                  {expensePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {expensePieData.map((item) => (
              <div key={item.category} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.category}</span>
                </div>
                <span className="font-medium">₹{item.amount.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* P&L Statement Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b bg-muted/30">
          <h3 className="font-semibold">Profit & Loss Statement</h3>
          <p className="text-sm text-muted-foreground mt-1">For the period: {period === 'thisMonth' ? format(new Date(), 'MMMM yyyy') : period}</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-2/3">Particulars</TableHead>
              <TableHead className="text-right">Amount (₹)</TableHead>
              <TableHead className="text-right">% of Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="bg-primary/5 font-semibold">
              <TableCell colSpan={3}>REVENUE</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="pl-8">Sales Revenue</TableCell>
              <TableCell className="text-right font-medium">₹{stats.totalRevenue.toLocaleString('en-IN')}</TableCell>
              <TableCell className="text-right text-muted-foreground">100%</TableCell>
            </TableRow>
            <TableRow className="bg-muted/30 font-semibold">
              <TableCell>Total Revenue</TableCell>
              <TableCell className="text-right font-bold">₹{stats.totalRevenue.toLocaleString('en-IN')}</TableCell>
              <TableCell className="text-right">100%</TableCell>
            </TableRow>

            <TableRow className="bg-info/5 font-semibold">
              <TableCell colSpan={3}>COST OF GOODS SOLD</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="pl-8">Cost of Items Sold</TableCell>
              <TableCell className="text-right text-destructive">₹{stats.costOfGoodsSold.toLocaleString('en-IN')}</TableCell>
              <TableCell className="text-right text-muted-foreground">{((stats.costOfGoodsSold / stats.totalRevenue) * 100 || 0).toFixed(1)}%</TableCell>
            </TableRow>

            <TableRow className={cn("font-bold", stats.grossProfit >= 0 ? "bg-success/10" : "bg-destructive/10")}>
              <TableCell>GROSS PROFIT</TableCell>
              <TableCell className={cn("text-right", stats.grossProfit >= 0 ? "text-success" : "text-destructive")}>
                ₹{stats.grossProfit.toLocaleString('en-IN')}
              </TableCell>
              <TableCell className={cn("text-right", stats.grossMargin >= 20 ? "text-success" : stats.grossMargin >= 10 ? "text-warning" : "text-destructive")}>
                {stats.grossMargin.toFixed(1)}%
              </TableCell>
            </TableRow>

            <TableRow className="bg-warning/5 font-semibold">
              <TableCell colSpan={3}>OPERATING EXPENSES</TableCell>
            </TableRow>
            {expenseBreakdown.map(expense => (
              <TableRow key={expense.category}>
                <TableCell className="pl-8">{expense.category}</TableCell>
                <TableCell className="text-right text-destructive">₹{expense.amount.toLocaleString('en-IN')}</TableCell>
                <TableCell className="text-right text-muted-foreground">{((expense.amount / stats.totalRevenue) * 100 || 0).toFixed(1)}%</TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-muted/50 font-semibold">
              <TableCell>Total Operating Expenses</TableCell>
              <TableCell className="text-right font-bold text-destructive">₹{stats.totalExpenses.toLocaleString('en-IN')}</TableCell>
              <TableCell className="text-right">{((stats.totalExpenses / stats.totalRevenue) * 100 || 0).toFixed(1)}%</TableCell>
            </TableRow>

            <TableRow className={cn("font-bold text-lg", stats.netProfit >= 0 ? "bg-success/10" : "bg-destructive/10")}>
              <TableCell className="font-bold text-lg">NET PROFIT / (LOSS)</TableCell>
              <TableCell className={cn("text-right font-bold text-lg", stats.netProfit >= 0 ? "text-success" : "text-destructive")}>
                ₹{stats.netProfit.toLocaleString('en-IN')}
              </TableCell>
              <TableCell className={cn("text-right font-bold", stats.netMargin >= 10 ? "text-success" : stats.netMargin >= 5 ? "text-warning" : "text-destructive")}>
                {stats.netMargin.toFixed(1)}%
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

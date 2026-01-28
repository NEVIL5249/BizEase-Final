import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, TrendingUp, IndianRupee, FileText, Users, Calendar, ArrowUpRight, ArrowDownRight, Percent } from 'lucide-react';
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
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, subMonths, isWithinInterval, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { generateReportPDF } from '@/lib/pdfGenerator';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--info))', 'hsl(var(--destructive))'];

export function SalesReport() {
  const { sales, company, inventory } = useApp();
  const [period, setPeriod] = useState('30');

  const filteredSales = useMemo(() => {
    const today = new Date();
    let startDate: Date;
    
    switch (period) {
      case '7':
        startDate = subDays(today, 7);
        break;
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
        return sales.filter(s => 
          isWithinInterval(new Date(s.invoiceDate), {
            start: startDate,
            end: endOfMonth(subMonths(today, 1))
          })
        );
      default:
        startDate = subDays(today, 30);
    }

    return sales.filter(s => new Date(s.invoiceDate) >= startDate);
  }, [sales, period]);

  const stats = useMemo(() => {
    const totalSales = filteredSales.reduce((sum, s) => sum + s.grandTotal, 0);
    const totalTax = filteredSales.reduce((sum, s) => sum + s.totalCgst + s.totalSgst + s.totalIgst, 0);
    const collected = filteredSales.reduce((sum, s) => sum + s.amountPaid, 0);
    const pending = totalSales - collected;
    const avgInvoice = filteredSales.length > 0 ? totalSales / filteredSales.length : 0;
    
    // Calculate profit
    let totalCost = 0;
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const invItem = inventory.find(i => i.id === item.itemId);
        if (invItem) {
          totalCost += invItem.purchasePrice * item.quantity;
        }
      });
    });
    const grossProfit = filteredSales.reduce((sum, s) => sum + s.subtotal, 0) - totalCost;
    const profitMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;
    
    const paidCount = filteredSales.filter(s => s.status === 'paid').length;
    const pendingCount = filteredSales.filter(s => s.status === 'pending' || s.status === 'partial').length;
    const overdueCount = filteredSales.filter(s => s.status === 'overdue').length;

    return { totalSales, totalTax, collected, pending, avgInvoice, grossProfit, profitMargin, count: filteredSales.length, paidCount, pendingCount, overdueCount };
  }, [filteredSales, inventory]);

  const dailyData = useMemo(() => {
    const grouped: { [key: string]: { sales: number; profit: number } } = {};
    filteredSales.forEach(sale => {
      const date = format(new Date(sale.invoiceDate), 'dd MMM');
      if (!grouped[date]) grouped[date] = { sales: 0, profit: 0 };
      grouped[date].sales += sale.grandTotal;
      
      // Calculate profit for this sale
      let cost = 0;
      sale.items.forEach(item => {
        const invItem = inventory.find(i => i.id === item.itemId);
        if (invItem) cost += invItem.purchasePrice * item.quantity;
      });
      grouped[date].profit += sale.subtotal - cost;
    });
    return Object.entries(grouped)
      .map(([date, data]) => ({ date, ...data }))
      .slice(-15);
  }, [filteredSales, inventory]);

  const customerData = useMemo(() => {
    const grouped: { [key: string]: { amount: number; count: number; profit: number } } = {};
    filteredSales.forEach(sale => {
      if (!grouped[sale.customerName]) {
        grouped[sale.customerName] = { amount: 0, count: 0, profit: 0 };
      }
      grouped[sale.customerName].amount += sale.grandTotal;
      grouped[sale.customerName].count++;
      
      // Calculate profit
      let cost = 0;
      sale.items.forEach(item => {
        const invItem = inventory.find(i => i.id === item.itemId);
        if (invItem) cost += invItem.purchasePrice * item.quantity;
      });
      grouped[sale.customerName].profit += sale.subtotal - cost;
    });
    return Object.entries(grouped)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);
  }, [filteredSales, inventory]);

  const statusData = useMemo(() => [
    { name: 'Paid', value: stats.paidCount, color: 'hsl(var(--success))' },
    { name: 'Pending', value: stats.pendingCount, color: 'hsl(var(--warning))' },
    { name: 'Overdue', value: stats.overdueCount, color: 'hsl(var(--destructive))' },
  ].filter(d => d.value > 0), [stats]);

  const handleExportPDF = () => {
    const headers = ['Invoice #', 'Date', 'Customer', 'Taxable', 'CGST', 'SGST', 'Total', 'Paid', 'Balance', 'Status'];
    const data = filteredSales.map(s => [
      s.invoiceNumber,
      format(new Date(s.invoiceDate), 'dd/MM/yyyy'),
      s.customerName,
      `₹${s.subtotal.toLocaleString('en-IN')}`,
      `₹${s.totalCgst.toLocaleString('en-IN')}`,
      `₹${s.totalSgst.toLocaleString('en-IN')}`,
      `₹${s.grandTotal.toLocaleString('en-IN')}`,
      `₹${s.amountPaid.toLocaleString('en-IN')}`,
      `₹${(s.grandTotal - s.amountPaid).toLocaleString('en-IN')}`,
      s.status.toUpperCase(),
    ]);

    const summary = [
      { label: 'Report Period', value: period === 'thisMonth' ? format(new Date(), 'MMMM yyyy') : `Last ${period} days` },
      { label: 'Total Invoices', value: stats.count.toString() },
      { label: 'Total Sales', value: `₹${stats.totalSales.toLocaleString('en-IN')}` },
      { label: 'Total GST Collected', value: `₹${stats.totalTax.toLocaleString('en-IN')}` },
      { label: 'Amount Received', value: `₹${stats.collected.toLocaleString('en-IN')}` },
      { label: 'Amount Pending', value: `₹${stats.pending.toLocaleString('en-IN')}` },
      { label: 'Gross Profit', value: `₹${stats.grossProfit.toLocaleString('en-IN')}` },
      { label: 'Profit Margin', value: `${stats.profitMargin.toFixed(1)}%` },
    ];

    generateReportPDF('Sales Report', headers, data, summary, company || undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Sales Report</h2>
          <p className="text-muted-foreground text-sm mt-1">Comprehensive sales analysis with profitability metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2" onClick={handleExportPDF}>
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Stats Cards - Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Sales</p>
              <p className="text-2xl font-bold mt-1">₹{(stats.totalSales / 100000).toFixed(2)}L</p>
            </div>
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs">
            <span className="text-muted-foreground">{stats.count} invoices</span>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Collected</p>
              <p className="text-2xl font-bold text-success mt-1">₹{(stats.collected / 100000).toFixed(2)}L</p>
            </div>
            <div className="p-2 rounded-lg bg-success/10">
              <ArrowUpRight className="w-5 h-5 text-success" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs text-success">
            <span>{((stats.collected / stats.totalSales) * 100 || 0).toFixed(0)}% collected</span>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-warning mt-1">₹{(stats.pending / 100000).toFixed(2)}L</p>
            </div>
            <div className="p-2 rounded-lg bg-warning/10">
              <ArrowDownRight className="w-5 h-5 text-warning" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <span>{stats.pendingCount + stats.overdueCount} invoices pending</span>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Profit Margin</p>
              <p className={cn("text-2xl font-bold mt-1", stats.profitMargin >= 15 ? "text-success" : stats.profitMargin >= 10 ? "text-warning" : "text-destructive")}>
                {stats.profitMargin.toFixed(1)}%
              </p>
            </div>
            <div className="p-2 rounded-lg bg-info/10">
              <Percent className="w-5 h-5 text-info" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs">
            <span className="text-muted-foreground">Gross: ₹{(stats.grossProfit / 1000).toFixed(0)}K</span>
          </div>
        </Card>
      </div>

      {/* Stats Cards - Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <IndianRupee className="w-4 h-4" />
            <span className="text-xs">GST Collected</span>
          </div>
          <p className="text-xl font-bold">₹{stats.totalTax.toLocaleString('en-IN')}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <FileText className="w-4 h-4" />
            <span className="text-xs">Avg. Invoice Value</span>
          </div>
          <p className="text-xl font-bold">₹{stats.avgInvoice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </Card>
        <Card className="p-4 bg-success/5 border-success/20">
          <div className="flex items-center gap-2 text-success mb-1">
            <span className="text-xs">Paid Invoices</span>
          </div>
          <p className="text-xl font-bold text-success">{stats.paidCount}</p>
        </Card>
        <Card className={cn("p-4", stats.overdueCount > 0 && "bg-destructive/5 border-destructive/20")}>
          <div className={cn("flex items-center gap-2 mb-1", stats.overdueCount > 0 ? "text-destructive" : "text-muted-foreground")}>
            <span className="text-xs">Overdue Invoices</span>
          </div>
          <p className={cn("text-xl font-bold", stats.overdueCount > 0 && "text-destructive")}>{stats.overdueCount}</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-semibold mb-4">Sales & Profit Trend</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number, name: string) => [`₹${value.toLocaleString('en-IN')}`, name === 'sales' ? 'Sales' : 'Profit']}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  name="Sales"
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1}
                  fill="url(#salesGradient)"
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="profit" 
                  name="Profit"
                  stroke="hsl(var(--success))" 
                  fillOpacity={1}
                  fill="url(#profitGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-4">Invoice Status</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-muted-foreground">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top Customers */}
      <Card className="p-5">
        <h3 className="font-semibold mb-4">Top Customers by Revenue</h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={customerData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis 
                type="number"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                type="category"
                dataKey="name" 
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                width={120}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number, name: string) => [`₹${value.toLocaleString('en-IN')}`, name === 'amount' ? 'Revenue' : 'Profit']}
              />
              <Legend />
              <Bar dataKey="amount" name="Revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              <Bar dataKey="profit" name="Profit" fill="hsl(var(--success))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Invoice Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">Invoice Details</h3>
          <Badge variant="outline">{filteredSales.length} invoices</Badge>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Taxable</TableHead>
                <TableHead className="text-right">GST</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.slice(0, 15).map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-mono text-sm">{sale.invoiceNumber}</TableCell>
                  <TableCell>{format(new Date(sale.invoiceDate), 'dd MMM yyyy')}</TableCell>
                  <TableCell className="font-medium">{sale.customerName}</TableCell>
                  <TableCell className="text-right">₹{sale.subtotal.toLocaleString('en-IN')}</TableCell>
                  <TableCell className="text-right text-muted-foreground">₹{(sale.totalCgst + sale.totalSgst).toLocaleString('en-IN')}</TableCell>
                  <TableCell className="text-right font-medium">₹{sale.grandTotal.toLocaleString('en-IN')}</TableCell>
                  <TableCell className="text-right text-success">₹{sale.amountPaid.toLocaleString('en-IN')}</TableCell>
                  <TableCell className={cn("text-right", (sale.grandTotal - sale.amountPaid) > 0 && "text-warning font-medium")}>
                    ₹{(sale.grandTotal - sale.amountPaid).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline"
                      className={cn(
                        "capitalize text-xs",
                        sale.status === 'paid' && "bg-success/10 text-success border-success/20",
                        sale.status === 'pending' && "bg-warning/10 text-warning border-warning/20",
                        sale.status === 'partial' && "bg-info/10 text-info border-info/20",
                        sale.status === 'overdue' && "bg-destructive/10 text-destructive border-destructive/20"
                      )}
                    >
                      {sale.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {filteredSales.length > 15 && (
          <div className="p-3 border-t bg-muted/30 text-center text-sm text-muted-foreground">
            Showing 15 of {filteredSales.length} invoices. Export PDF for complete list.
          </div>
        )}
      </Card>
    </div>
  );
}

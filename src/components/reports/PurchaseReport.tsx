import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, TrendingDown, IndianRupee, FileText, Truck, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';
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
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import { generateReportPDF } from '@/lib/pdfGenerator';

export function PurchaseReport() {
  const { purchases, company, suppliers } = useApp();
  const [period, setPeriod] = useState('30');

  const filteredPurchases = useMemo(() => {
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
        return purchases.filter(p => 
          isWithinInterval(new Date(p.billDate), {
            start: startDate,
            end: endOfMonth(subMonths(today, 1))
          })
        );
      default:
        startDate = subDays(today, 30);
    }

    return purchases.filter(p => new Date(p.billDate) >= startDate);
  }, [purchases, period]);

  const stats = useMemo(() => {
    const totalPurchases = filteredPurchases.reduce((sum, p) => sum + p.grandTotal, 0);
    const totalTax = filteredPurchases.reduce((sum, p) => sum + p.totalCgst + p.totalSgst + p.totalIgst, 0);
    const paid = filteredPurchases.reduce((sum, p) => sum + p.amountPaid, 0);
    const pending = totalPurchases - paid;
    const avgBill = filteredPurchases.length > 0 ? totalPurchases / filteredPurchases.length : 0;
    
    const paidCount = filteredPurchases.filter(p => p.status === 'paid').length;
    const pendingCount = filteredPurchases.filter(p => p.status === 'pending' || p.status === 'partial').length;
    const overdueCount = filteredPurchases.filter(p => p.status === 'overdue').length;

    return { totalPurchases, totalTax, paid, pending, avgBill, count: filteredPurchases.length, paidCount, pendingCount, overdueCount };
  }, [filteredPurchases]);

  const dailyData = useMemo(() => {
    const grouped: { [key: string]: number } = {};
    filteredPurchases.forEach(purchase => {
      const date = format(new Date(purchase.billDate), 'dd MMM');
      grouped[date] = (grouped[date] || 0) + purchase.grandTotal;
    });
    return Object.entries(grouped)
      .map(([date, amount]) => ({ date, amount }))
      .slice(-15);
  }, [filteredPurchases]);

  const supplierData = useMemo(() => {
    const grouped: { [key: string]: { amount: number; count: number; itc: number } } = {};
    filteredPurchases.forEach(purchase => {
      if (!grouped[purchase.supplierName]) {
        grouped[purchase.supplierName] = { amount: 0, count: 0, itc: 0 };
      }
      grouped[purchase.supplierName].amount += purchase.grandTotal;
      grouped[purchase.supplierName].count++;
      grouped[purchase.supplierName].itc += purchase.totalCgst + purchase.totalSgst + purchase.totalIgst;
    });
    return Object.entries(grouped)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);
  }, [filteredPurchases]);

  const statusData = useMemo(() => [
    { name: 'Paid', value: stats.paidCount, color: 'hsl(var(--success))' },
    { name: 'Pending', value: stats.pendingCount, color: 'hsl(var(--warning))' },
    { name: 'Overdue', value: stats.overdueCount, color: 'hsl(var(--destructive))' },
  ].filter(d => d.value > 0), [stats]);

  const handleExportPDF = () => {
    const headers = ['Bill #', 'Supplier Bill', 'Date', 'Supplier', 'Taxable', 'CGST', 'SGST', 'Total', 'Paid', 'Balance', 'Status'];
    const data = filteredPurchases.map(p => [
      p.billNumber,
      p.supplierBillNumber || '-',
      format(new Date(p.billDate), 'dd/MM/yyyy'),
      p.supplierName,
      `₹${p.subtotal.toLocaleString('en-IN')}`,
      `₹${p.totalCgst.toLocaleString('en-IN')}`,
      `₹${p.totalSgst.toLocaleString('en-IN')}`,
      `₹${p.grandTotal.toLocaleString('en-IN')}`,
      `₹${p.amountPaid.toLocaleString('en-IN')}`,
      `₹${(p.grandTotal - p.amountPaid).toLocaleString('en-IN')}`,
      p.status.toUpperCase(),
    ]);

    const summary = [
      { label: 'Report Period', value: period === 'thisMonth' ? format(new Date(), 'MMMM yyyy') : `Last ${period} days` },
      { label: 'Total Bills', value: stats.count.toString() },
      { label: 'Total Purchases', value: `₹${stats.totalPurchases.toLocaleString('en-IN')}` },
      { label: 'Input Tax Credit (ITC)', value: `₹${stats.totalTax.toLocaleString('en-IN')}` },
      { label: 'Amount Paid', value: `₹${stats.paid.toLocaleString('en-IN')}` },
      { label: 'Amount Payable', value: `₹${stats.pending.toLocaleString('en-IN')}` },
    ];

    generateReportPDF('Purchase Report', headers, data, summary, company || undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Purchase Report</h2>
          <p className="text-muted-foreground text-sm mt-1">Detailed purchase analysis with ITC tracking</p>
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
              <p className="text-xs text-muted-foreground">Total Purchases</p>
              <p className="text-2xl font-bold mt-1">₹{(stats.totalPurchases / 100000).toFixed(2)}L</p>
            </div>
            <div className="p-2 rounded-lg bg-secondary/10">
              <TrendingDown className="w-5 h-5 text-secondary-foreground" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs">
            <span className="text-muted-foreground">{stats.count} bills</span>
          </div>
        </Card>
        <Card className="p-4 bg-success/5 border-success/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Input Tax Credit</p>
              <p className="text-2xl font-bold text-success mt-1">₹{stats.totalTax.toLocaleString('en-IN')}</p>
            </div>
            <div className="p-2 rounded-lg bg-success/10">
              <IndianRupee className="w-5 h-5 text-success" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs text-success">
            <span>Available for set-off</span>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Amount Paid</p>
              <p className="text-2xl font-bold text-success mt-1">₹{(stats.paid / 100000).toFixed(2)}L</p>
            </div>
            <div className="p-2 rounded-lg bg-success/10">
              <ArrowUpRight className="w-5 h-5 text-success" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs">
            <span className="text-muted-foreground">{((stats.paid / stats.totalPurchases) * 100 || 0).toFixed(0)}% settled</span>
          </div>
        </Card>
        <Card className={cn("p-4", stats.pending > 0 && "bg-warning/5 border-warning/20")}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Amount Payable</p>
              <p className={cn("text-2xl font-bold mt-1", stats.pending > 0 ? "text-warning" : "text-success")}>
                ₹{(stats.pending / 100000).toFixed(2)}L
              </p>
            </div>
            <div className={cn("p-2 rounded-lg", stats.pending > 0 ? "bg-warning/10" : "bg-success/10")}>
              <ArrowDownRight className={cn("w-5 h-5", stats.pending > 0 ? "text-warning" : "text-success")} />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <span>{stats.pendingCount + stats.overdueCount} bills pending</span>
          </div>
        </Card>
      </div>

      {/* Stats Cards - Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <FileText className="w-4 h-4" />
            <span className="text-xs">Avg. Bill Value</span>
          </div>
          <p className="text-xl font-bold">₹{stats.avgBill.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Truck className="w-4 h-4" />
            <span className="text-xs">Suppliers</span>
          </div>
          <p className="text-xl font-bold">{new Set(filteredPurchases.map(p => p.supplierId)).size}</p>
        </Card>
        <Card className="p-4 bg-success/5 border-success/20">
          <div className="flex items-center gap-2 text-success mb-1">
            <span className="text-xs">Paid Bills</span>
          </div>
          <p className="text-xl font-bold text-success">{stats.paidCount}</p>
        </Card>
        <Card className={cn("p-4", stats.overdueCount > 0 && "bg-destructive/5 border-destructive/20")}>
          <div className={cn("flex items-center gap-2 mb-1", stats.overdueCount > 0 ? "text-destructive" : "text-muted-foreground")}>
            <span className="text-xs">Overdue Bills</span>
          </div>
          <p className={cn("text-xl font-bold", stats.overdueCount > 0 && "text-destructive")}>{stats.overdueCount}</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-semibold mb-4">Purchase Trend</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="purchaseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--info))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--info))" stopOpacity={0}/>
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
                  formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Purchases']}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="hsl(var(--info))" 
                  fillOpacity={1}
                  fill="url(#purchaseGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-4">Bill Status</h3>
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

      {/* Top Suppliers */}
      <Card className="p-5">
        <h3 className="font-semibold mb-4">Top Suppliers by Purchase Value</h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={supplierData} layout="vertical">
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
                formatter={(value: number, name: string) => [`₹${value.toLocaleString('en-IN')}`, name === 'amount' ? 'Purchases' : 'ITC']}
              />
              <Legend />
              <Bar dataKey="amount" name="Purchases" fill="hsl(var(--info))" radius={[0, 4, 4, 0]} />
              <Bar dataKey="itc" name="ITC" fill="hsl(var(--success))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Bill Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">Purchase Bill Details</h3>
          <Badge variant="outline">{filteredPurchases.length} bills</Badge>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Taxable</TableHead>
                <TableHead className="text-right">ITC</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPurchases.slice(0, 15).map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell className="font-mono text-sm">{purchase.billNumber}</TableCell>
                  <TableCell>{format(new Date(purchase.billDate), 'dd MMM yyyy')}</TableCell>
                  <TableCell className="font-medium">{purchase.supplierName}</TableCell>
                  <TableCell className="text-right">₹{purchase.subtotal.toLocaleString('en-IN')}</TableCell>
                  <TableCell className="text-right text-success">₹{(purchase.totalCgst + purchase.totalSgst).toLocaleString('en-IN')}</TableCell>
                  <TableCell className="text-right font-medium">₹{purchase.grandTotal.toLocaleString('en-IN')}</TableCell>
                  <TableCell className="text-right text-success">₹{purchase.amountPaid.toLocaleString('en-IN')}</TableCell>
                  <TableCell className={cn("text-right", (purchase.grandTotal - purchase.amountPaid) > 0 && "text-warning font-medium")}>
                    ₹{(purchase.grandTotal - purchase.amountPaid).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline"
                      className={cn(
                        "capitalize text-xs",
                        purchase.status === 'paid' && "bg-success/10 text-success border-success/20",
                        purchase.status === 'pending' && "bg-warning/10 text-warning border-warning/20",
                        purchase.status === 'partial' && "bg-info/10 text-info border-info/20",
                        purchase.status === 'overdue' && "bg-destructive/10 text-destructive border-destructive/20"
                      )}
                    >
                      {purchase.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {filteredPurchases.length > 15 && (
          <div className="p-3 border-t bg-muted/30 text-center text-sm text-muted-foreground">
            Showing 15 of {filteredPurchases.length} bills. Export PDF for complete list.
          </div>
        )}
      </Card>
    </div>
  );
}

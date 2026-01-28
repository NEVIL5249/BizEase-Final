import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Package, AlertTriangle, TrendingUp, TrendingDown, IndianRupee, BarChart3, Layers } from 'lucide-react';
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
  PieChart,
  Pie,
  Cell,
  Legend,
  ComposedChart,
  Line,
} from 'recharts';
import { cn } from '@/lib/utils';
import { generateReportPDF } from '@/lib/pdfGenerator';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--info))', 'hsl(var(--destructive))', 'hsl(var(--secondary))'];

export function InventoryReport() {
  const { inventory, sales, purchases, company } = useApp();

  const stats = useMemo(() => {
    const totalItems = inventory.length;
    const totalValue = inventory.reduce((sum, i) => sum + (i.quantity * i.purchasePrice), 0);
    const sellableValue = inventory.reduce((sum, i) => sum + (i.quantity * i.sellingPrice), 0);
    const potentialProfit = sellableValue - totalValue;
    const lowStock = inventory.filter(i => i.quantity <= i.lowStockThreshold && i.quantity > 0).length;
    const outOfStock = inventory.filter(i => i.quantity === 0).length;
    const healthyStock = inventory.filter(i => i.quantity > i.lowStockThreshold).length;
    const totalQty = inventory.reduce((sum, i) => sum + i.quantity, 0);
    const avgMargin = inventory.length > 0 
      ? inventory.reduce((sum, i) => sum + ((i.sellingPrice - i.purchasePrice) / i.purchasePrice * 100), 0) / inventory.length
      : 0;

    return { totalItems, totalValue, sellableValue, potentialProfit, lowStock, outOfStock, healthyStock, totalQty, avgMargin };
  }, [inventory]);

  const categoryData = useMemo(() => {
    const grouped: { [key: string]: { count: number; value: number; sellValue: number; qty: number } } = {};
    inventory.forEach(item => {
      if (!grouped[item.category]) {
        grouped[item.category] = { count: 0, value: 0, sellValue: 0, qty: 0 };
      }
      grouped[item.category].count++;
      grouped[item.category].value += item.quantity * item.purchasePrice;
      grouped[item.category].sellValue += item.quantity * item.sellingPrice;
      grouped[item.category].qty += item.quantity;
    });
    return Object.entries(grouped)
      .map(([name, data]) => ({ name, ...data, margin: data.sellValue - data.value }))
      .sort((a, b) => b.value - a.value);
  }, [inventory]);

  const movementData = useMemo(() => {
    return inventory.map(item => {
      const salesQty = sales.reduce((sum, sale) => {
        const saleItem = sale.items.find(i => i.itemId === item.id);
        return sum + (saleItem?.quantity || 0);
      }, 0);
      
      const purchaseQty = purchases.reduce((sum, purchase) => {
        const purItem = purchase.items.find(i => i.itemId === item.id);
        return sum + (purItem?.quantity || 0);
      }, 0);
      
      const margin = ((item.sellingPrice - item.purchasePrice) / item.purchasePrice) * 100;
      const stockValue = item.quantity * item.purchasePrice;
      const sellValue = item.quantity * item.sellingPrice;
      
      let movement: 'fast' | 'medium' | 'slow' | 'dead' = 'dead';
      if (salesQty > 15) movement = 'fast';
      else if (salesQty > 5) movement = 'medium';
      else if (salesQty > 0) movement = 'slow';
      
      let stockStatus: 'healthy' | 'low' | 'out' = 'healthy';
      if (item.quantity === 0) stockStatus = 'out';
      else if (item.quantity <= item.lowStockThreshold) stockStatus = 'low';
      
      return {
        ...item,
        salesQty,
        purchaseQty,
        margin,
        stockValue,
        sellValue,
        movement,
        stockStatus,
        reorderQty: Math.max(0, item.lowStockThreshold * 3 - item.quantity),
      };
    }).sort((a, b) => b.salesQty - a.salesQty);
  }, [inventory, sales, purchases]);

  const stockHealthData = useMemo(() => [
    { name: 'Healthy Stock', value: stats.healthyStock, color: 'hsl(var(--success))' },
    { name: 'Low Stock', value: stats.lowStock, color: 'hsl(var(--warning))' },
    { name: 'Out of Stock', value: stats.outOfStock, color: 'hsl(var(--destructive))' },
  ].filter(d => d.value > 0), [stats]);

  const movementSummary = useMemo(() => {
    const fast = movementData.filter(i => i.movement === 'fast').length;
    const medium = movementData.filter(i => i.movement === 'medium').length;
    const slow = movementData.filter(i => i.movement === 'slow').length;
    const dead = movementData.filter(i => i.movement === 'dead').length;
    return [
      { name: 'Fast Moving', value: fast, color: 'hsl(var(--success))' },
      { name: 'Medium Moving', value: medium, color: 'hsl(var(--info))' },
      { name: 'Slow Moving', value: slow, color: 'hsl(var(--warning))' },
      { name: 'Dead Stock', value: dead, color: 'hsl(var(--destructive))' },
    ].filter(d => d.value > 0);
  }, [movementData]);

  const handleExportPDF = () => {
    const headers = ['SKU', 'Item Name', 'HSN', 'Category', 'Qty', 'Unit', 'Cost Price', 'Sell Price', 'Stock Value', 'Margin %', 'Status'];
    const data = movementData.map(i => [
      i.sku,
      i.name,
      i.hsn,
      i.category,
      i.quantity.toString(),
      i.unit,
      `₹${i.purchasePrice.toLocaleString('en-IN')}`,
      `₹${i.sellingPrice.toLocaleString('en-IN')}`,
      `₹${i.stockValue.toLocaleString('en-IN')}`,
      `${i.margin.toFixed(1)}%`,
      i.stockStatus === 'out' ? 'OUT OF STOCK' : i.stockStatus === 'low' ? 'LOW STOCK' : 'IN STOCK',
    ]);

    const summary = [
      { label: 'Total SKUs', value: stats.totalItems.toString() },
      { label: 'Total Stock Quantity', value: stats.totalQty.toString() },
      { label: 'Total Stock Value (Cost)', value: `₹${stats.totalValue.toLocaleString('en-IN')}` },
      { label: 'Total Sellable Value', value: `₹${stats.sellableValue.toLocaleString('en-IN')}` },
      { label: 'Potential Profit', value: `₹${stats.potentialProfit.toLocaleString('en-IN')}` },
      { label: 'Average Margin', value: `${stats.avgMargin.toFixed(1)}%` },
      { label: 'Low Stock Items', value: stats.lowStock.toString() },
      { label: 'Out of Stock Items', value: stats.outOfStock.toString() },
    ];

    generateReportPDF('Inventory Valuation Report', headers, data, summary, company || undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Inventory Report</h2>
          <p className="text-muted-foreground text-sm mt-1">Stock valuation, movement analysis & reorder suggestions</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleExportPDF}>
          <Download className="w-4 h-4" />
          Export PDF
        </Button>
      </div>

      {/* Stats Cards - Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total SKUs</p>
              <p className="text-2xl font-bold mt-1">{stats.totalItems}</p>
            </div>
            <div className="p-2 rounded-lg bg-primary/10">
              <Package className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-2">{stats.totalQty} units in stock</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Stock Value</p>
              <p className="text-2xl font-bold mt-1">₹{(stats.totalValue / 100000).toFixed(2)}L</p>
            </div>
            <div className="p-2 rounded-lg bg-info/10">
              <IndianRupee className="w-5 h-5 text-info" />
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-2">At cost price</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Sellable Value</p>
              <p className="text-2xl font-bold text-primary mt-1">₹{(stats.sellableValue / 100000).toFixed(2)}L</p>
            </div>
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-2">At selling price</div>
        </Card>
        <Card className="p-4 bg-success/5 border-success/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Potential Profit</p>
              <p className="text-2xl font-bold text-success mt-1">₹{(stats.potentialProfit / 100000).toFixed(2)}L</p>
            </div>
            <div className="p-2 rounded-lg bg-success/10">
              <BarChart3 className="w-5 h-5 text-success" />
            </div>
          </div>
          <div className="text-xs text-success mt-2">{stats.avgMargin.toFixed(1)}% avg margin</div>
        </Card>
      </div>

      {/* Stats Cards - Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-success/5 border-success/20">
          <div className="flex items-center gap-2 text-success mb-1">
            <span className="text-xs">Healthy Stock</span>
          </div>
          <p className="text-xl font-bold text-success">{stats.healthyStock}</p>
          <p className="text-xs text-muted-foreground mt-1">items above threshold</p>
        </Card>
        <Card className={cn("p-4", stats.lowStock > 0 && "bg-warning/5 border-warning/20")}>
          <div className={cn("flex items-center gap-2 mb-1", stats.lowStock > 0 ? "text-warning" : "text-muted-foreground")}>
            <AlertTriangle className="w-3 h-3" />
            <span className="text-xs">Low Stock</span>
          </div>
          <p className={cn("text-xl font-bold", stats.lowStock > 0 && "text-warning")}>{stats.lowStock}</p>
          <p className="text-xs text-muted-foreground mt-1">items need reorder</p>
        </Card>
        <Card className={cn("p-4", stats.outOfStock > 0 && "bg-destructive/5 border-destructive/20")}>
          <div className={cn("flex items-center gap-2 mb-1", stats.outOfStock > 0 ? "text-destructive" : "text-muted-foreground")}>
            <AlertTriangle className="w-3 h-3" />
            <span className="text-xs">Out of Stock</span>
          </div>
          <p className={cn("text-xl font-bold", stats.outOfStock > 0 && "text-destructive")}>{stats.outOfStock}</p>
          <p className="text-xs text-muted-foreground mt-1">items unavailable</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Layers className="w-3 h-3" />
            <span className="text-xs">Categories</span>
          </div>
          <p className="text-xl font-bold">{categoryData.length}</p>
          <p className="text-xs text-muted-foreground mt-1">product categories</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-semibold mb-4">Stock Value by Category</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number, name: string) => [
                    name === 'count' ? value : `₹${value.toLocaleString('en-IN')}`,
                    name === 'value' ? 'Cost Value' : name === 'sellValue' ? 'Sell Value' : 'Items'
                  ]}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="value" name="Cost Value" fill="hsl(var(--info))" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="sellValue" name="Sell Value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="count" name="Items" stroke="hsl(var(--warning))" strokeWidth={2} dot={{ fill: 'hsl(var(--warning))' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Stock Health</h3>
            <div className="h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockHealthData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={55}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {stockHealthData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {stockHealthData.map((item) => (
                <div key={item.name} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold mb-4">Stock Movement</h3>
            <div className="h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={movementSummary}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={55}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {movementSummary.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {movementSummary.map((item) => (
                <div key={item.name} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Inventory Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">Stock Details & Movement Analysis</h3>
          <Badge variant="outline">{inventory.length} items</Badge>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Sold</TableHead>
                <TableHead className="text-right">Cost Price</TableHead>
                <TableHead className="text-right">Sell Price</TableHead>
                <TableHead className="text-right">Stock Value</TableHead>
                <TableHead className="text-right">Margin</TableHead>
                <TableHead>Movement</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movementData.slice(0, 20).map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell className={cn(
                    "text-right font-medium",
                    item.stockStatus === 'out' && "text-destructive",
                    item.stockStatus === 'low' && "text-warning"
                  )}>
                    {item.quantity} {item.unit}
                  </TableCell>
                  <TableCell className="text-right">{item.salesQty}</TableCell>
                  <TableCell className="text-right">₹{item.purchasePrice.toLocaleString('en-IN')}</TableCell>
                  <TableCell className="text-right">₹{item.sellingPrice.toLocaleString('en-IN')}</TableCell>
                  <TableCell className="text-right font-medium">₹{item.stockValue.toLocaleString('en-IN')}</TableCell>
                  <TableCell className={cn(
                    "text-right font-medium",
                    item.margin >= 20 ? "text-success" : item.margin >= 10 ? "text-warning" : "text-destructive"
                  )}>
                    {item.margin.toFixed(1)}%
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs capitalize",
                        item.movement === 'fast' && "bg-success/10 text-success border-success/20",
                        item.movement === 'medium' && "bg-info/10 text-info border-info/20",
                        item.movement === 'slow' && "bg-warning/10 text-warning border-warning/20",
                        item.movement === 'dead' && "bg-destructive/10 text-destructive border-destructive/20"
                      )}
                    >
                      {item.movement}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs",
                        item.stockStatus === 'healthy' && "bg-success/10 text-success border-success/20",
                        item.stockStatus === 'low' && "bg-warning/10 text-warning border-warning/20",
                        item.stockStatus === 'out' && "bg-destructive/10 text-destructive border-destructive/20"
                      )}
                    >
                      {item.stockStatus === 'out' ? 'Out' : item.stockStatus === 'low' ? 'Low' : 'OK'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {inventory.length > 20 && (
          <div className="p-3 border-t bg-muted/30 text-center text-sm text-muted-foreground">
            Showing 20 of {inventory.length} items. Export PDF for complete list.
          </div>
        )}
      </Card>
    </div>
  );
}

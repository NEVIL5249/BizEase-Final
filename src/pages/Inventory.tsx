import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Plus, Search, Package, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { AddItemDialog } from '@/components/inventory/AddItemDialog';

export function Inventory() {
  const { inventory, isLoading } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const categories = [...new Set(inventory.map(i => i.category))];

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.hsn.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStock = 
      stockFilter === 'all' ||
      (stockFilter === 'low' && item.quantity <= item.lowStockThreshold) ||
      (stockFilter === 'normal' && item.quantity > item.lowStockThreshold);
    return matchesSearch && matchesCategory && matchesStock;
  });

  const totalValue = filteredInventory.reduce((sum, i) => sum + (i.quantity * i.purchasePrice), 0);
  const lowStockCount = inventory.filter(i => i.quantity <= i.lowStockThreshold).length;

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
          <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground mt-1">Manage your stock and items</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="btn-gradient gap-2">
          <Plus className="w-4 h-4" />
          Add Item
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-elevated p-4">
          <p className="text-sm text-muted-foreground">Total Items</p>
          <p className="text-2xl font-bold text-foreground mt-1">{inventory.length}</p>
        </div>
        <div className="card-elevated p-4">
          <p className="text-sm text-muted-foreground">Stock Value</p>
          <p className="text-2xl font-bold text-foreground mt-1">₹{totalValue.toLocaleString('en-IN')}</p>
        </div>
        <div className="card-elevated p-4">
          <p className="text-sm text-muted-foreground">Categories</p>
          <p className="text-2xl font-bold text-foreground mt-1">{categories.length}</p>
        </div>
        <div className={cn('card-elevated p-4', lowStockCount > 0 && 'bg-warning/10')}>
          <p className="text-sm text-muted-foreground">Low Stock Items</p>
          <p className={cn('text-2xl font-bold mt-1', lowStockCount > 0 ? 'text-warning' : 'text-foreground')}>
            {lowStockCount}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card-elevated p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, SKU or HSN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stock</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="card-elevated overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>SKU / HSN</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Purchase Price</TableHead>
              <TableHead className="text-right">Selling Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInventory.map((item) => {
              const isLowStock = item.quantity <= item.lowStockThreshold;
              const margin = ((item.sellingPrice - item.purchasePrice) / item.purchasePrice) * 100;
              
              return (
                <TableRow key={item.id} className="table-row-hover">
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.unit}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{item.sku}</p>
                      <p className="text-xs text-muted-foreground">{item.hsn}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">{item.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right">₹{item.purchasePrice.toLocaleString('en-IN')}</TableCell>
                  <TableCell className="text-right">
                    <div>
                      <p>₹{item.sellingPrice.toLocaleString('en-IN')}</p>
                      <p className={cn(
                        'text-xs flex items-center justify-end gap-0.5',
                        margin > 20 ? 'text-success' : margin > 10 ? 'text-warning' : 'text-destructive'
                      )}>
                        {margin > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {margin.toFixed(1)}%
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {item.quantity} {item.unit}
                  </TableCell>
                  <TableCell>
                    {isLowStock ? (
                      <Badge className="badge-danger gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Low Stock
                      </Badge>
                    ) : (
                      <Badge className="badge-success">In Stock</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ₹{(item.quantity * item.purchasePrice).toLocaleString('en-IN')}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        
        {filteredInventory.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No items found</p>
          </div>
        )}
      </div>

      <AddItemDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
    </div>
  );
}

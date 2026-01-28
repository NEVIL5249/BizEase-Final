import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateBillNumber, InvoiceItem } from '@/lib/db';
import { format } from 'date-fns';

interface CreatePurchaseBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePurchaseBillDialog({ open, onOpenChange }: CreatePurchaseBillDialogProps) {
  const { suppliers, inventory, addPurchaseBill } = useApp();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [supplierId, setSupplierId] = useState('');
  const [supplierBillNumber, setSupplierBillNumber] = useState('');
  const [billDate, setBillDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState(format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  
  const [items, setItems] = useState<{
    itemId: string;
    quantity: number;
    rate: number;
  }[]>([{ itemId: '', quantity: 1, rate: 0 }]);

  const selectedSupplier = suppliers.find(s => s.id === supplierId);

  const addItem = () => {
    setItems([...items, { itemId: '', quantity: 1, rate: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: 'itemId' | 'quantity' | 'rate', value: string | number) => {
    const newItems = [...items];
    if (field === 'itemId') {
      const invItem = inventory.find(i => i.id === value);
      newItems[index] = { 
        ...newItems[index], 
        itemId: value as string,
        rate: invItem?.purchasePrice || 0
      };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setItems(newItems);
  };

  // Calculate totals
  const billItems: InvoiceItem[] = items
    .filter(item => item.itemId && item.quantity > 0)
    .map(item => {
      const invItem = inventory.find(i => i.id === item.itemId)!;
      const taxableAmount = item.rate * item.quantity;
      const gstAmount = (taxableAmount * invItem.gstRate) / 100;
      
      return {
        itemId: item.itemId,
        name: invItem.name,
        hsn: invItem.hsn,
        quantity: item.quantity,
        rate: item.rate,
        gstRate: invItem.gstRate,
        taxableAmount,
        cgst: gstAmount / 2,
        sgst: gstAmount / 2,
        igst: 0,
        totalAmount: taxableAmount + gstAmount,
      };
    });

  const subtotal = billItems.reduce((sum, i) => sum + i.taxableAmount, 0);
  const totalCgst = billItems.reduce((sum, i) => sum + i.cgst, 0);
  const totalSgst = billItems.reduce((sum, i) => sum + i.sgst, 0);
  const grandTotal = Math.round(subtotal + totalCgst + totalSgst);
  const roundOff = grandTotal - (subtotal + totalCgst + totalSgst);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!supplierId) {
      toast({ title: 'Error', description: 'Please select a supplier', variant: 'destructive' });
      return;
    }
    
    if (billItems.length === 0) {
      toast({ title: 'Error', description: 'Please add at least one item', variant: 'destructive' });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const billNumber = await generateBillNumber();
      
      await addPurchaseBill({
        billNumber,
        supplierBillNumber,
        billDate: new Date(billDate),
        dueDate: new Date(dueDate),
        supplierId,
        supplierName: selectedSupplier!.name,
        supplierGstin: selectedSupplier?.gstin,
        supplierAddress: `${selectedSupplier!.address}, ${selectedSupplier!.city}, ${selectedSupplier!.state} - ${selectedSupplier!.pincode}`,
        items: billItems,
        subtotal,
        totalCgst,
        totalSgst,
        totalIgst: 0,
        roundOff,
        grandTotal,
        amountPaid: 0,
        status: 'pending',
        notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      toast({
        title: 'Purchase bill created',
        description: `Bill ${billNumber} has been created successfully.`,
      });
      
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create purchase bill. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSupplierId('');
    setSupplierBillNumber('');
    setItems([{ itemId: '', quantity: 1, rate: 0 }]);
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Purchase Bill</DialogTitle>
          <DialogDescription>Record a new purchase from supplier</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Supplier & Date */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Supplier *</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Supplier Bill No.</Label>
              <Input
                value={supplierBillNumber}
                onChange={(e) => setSupplierBillNumber(e.target.value)}
                placeholder="Vendor invoice #"
              />
            </div>
            
            <div>
              <Label>Bill Date</Label>
              <Input
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
              />
            </div>
            
            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Bill Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-1" /> Add Item
              </Button>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2 font-medium">Item</th>
                    <th className="text-center p-2 font-medium w-20">Qty</th>
                    <th className="text-right p-2 font-medium w-28">Rate</th>
                    <th className="text-right p-2 font-medium w-20">GST %</th>
                    <th className="text-right p-2 font-medium w-28">Amount</th>
                    <th className="p-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const invItem = inventory.find(i => i.id === item.itemId);
                    const taxableAmount = item.rate * item.quantity;
                    const gstAmount = invItem ? (taxableAmount * invItem.gstRate) / 100 : 0;
                    
                    return (
                      <tr key={index} className="border-t">
                        <td className="p-2">
                          <Select 
                            value={item.itemId} 
                            onValueChange={(value) => updateItem(index, 'itemId', value)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Select item" />
                            </SelectTrigger>
                            <SelectContent>
                              {inventory.map((inv) => (
                                <SelectItem key={inv.id} value={inv.id}>
                                  {inv.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                            className="h-8 text-center"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.rate}
                            onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                            className="h-8 text-right"
                          />
                        </td>
                        <td className="p-2 text-right">
                          {invItem ? `${invItem.gstRate}%` : '-'}
                        </td>
                        <td className="p-2 text-right font-medium">
                          {item.rate ? `₹${(taxableAmount + gstAmount).toFixed(2)}` : '-'}
                        </td>
                        <td className="p-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CGST:</span>
                <span>₹{totalCgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SGST:</span>
                <span>₹{totalSgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Round Off:</span>
                <span>₹{roundOff.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Grand Total:</span>
                <span>₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="btn-gradient" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Bill'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

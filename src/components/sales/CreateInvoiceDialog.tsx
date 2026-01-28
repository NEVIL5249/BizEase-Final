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
import { generateInvoiceNumber, InvoiceItem } from '@/lib/db';
import { format } from 'date-fns';

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateInvoiceDialog({ open, onOpenChange }: CreateInvoiceDialogProps) {
  const { customers, inventory, addSalesInvoice, company } = useApp();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [customerId, setCustomerId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState(format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('Thank you for your business!');
  const [terms, setTerms] = useState('Payment due within 30 days.');
  
  const [items, setItems] = useState<{
    itemId: string;
    quantity: number;
  }[]>([{ itemId: '', quantity: 1 }]);

  const selectedCustomer = customers.find(c => c.id === customerId);

  const addItem = () => {
    setItems([...items, { itemId: '', quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: 'itemId' | 'quantity', value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  // Calculate totals
  const invoiceItems: InvoiceItem[] = items
    .filter(item => item.itemId && item.quantity > 0)
    .map(item => {
      const invItem = inventory.find(i => i.id === item.itemId)!;
      const taxableAmount = invItem.sellingPrice * item.quantity;
      const gstAmount = (taxableAmount * invItem.gstRate) / 100;
      
      return {
        itemId: item.itemId,
        name: invItem.name,
        hsn: invItem.hsn,
        quantity: item.quantity,
        rate: invItem.sellingPrice,
        gstRate: invItem.gstRate,
        taxableAmount,
        cgst: gstAmount / 2,
        sgst: gstAmount / 2,
        igst: 0,
        totalAmount: taxableAmount + gstAmount,
      };
    });

  const subtotal = invoiceItems.reduce((sum, i) => sum + i.taxableAmount, 0);
  const totalCgst = invoiceItems.reduce((sum, i) => sum + i.cgst, 0);
  const totalSgst = invoiceItems.reduce((sum, i) => sum + i.sgst, 0);
  const grandTotal = Math.round(subtotal + totalCgst + totalSgst);
  const roundOff = grandTotal - (subtotal + totalCgst + totalSgst);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerId) {
      toast({ title: 'Error', description: 'Please select a customer', variant: 'destructive' });
      return;
    }
    
    if (invoiceItems.length === 0) {
      toast({ title: 'Error', description: 'Please add at least one item', variant: 'destructive' });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const invoiceNumber = await generateInvoiceNumber();
      
      await addSalesInvoice({
        invoiceNumber,
        invoiceDate: new Date(invoiceDate),
        dueDate: new Date(dueDate),
        customerId,
        customerName: selectedCustomer!.name,
        customerGstin: selectedCustomer?.gstin,
        customerAddress: `${selectedCustomer!.address}, ${selectedCustomer!.city}, ${selectedCustomer!.state} - ${selectedCustomer!.pincode}`,
        placeOfSupply: selectedCustomer!.state,
        items: invoiceItems,
        subtotal,
        totalCgst,
        totalSgst,
        totalIgst: 0,
        roundOff,
        grandTotal,
        amountPaid: 0,
        status: 'pending',
        notes,
        terms,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      toast({
        title: 'Invoice created',
        description: `Invoice ${invoiceNumber} has been created successfully.`,
      });
      
      onOpenChange(false);
      setCustomerId('');
      setItems([{ itemId: '', quantity: 1 }]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create invoice. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Sales Invoice</DialogTitle>
          <DialogDescription>Create a new GST-compliant sales invoice</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer & Date */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Customer *</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Invoice Date</Label>
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
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
              <Label>Invoice Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-1" /> Add Item
              </Button>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2 font-medium">Item</th>
                    <th className="text-center p-2 font-medium w-24">Qty</th>
                    <th className="text-right p-2 font-medium w-24">Rate</th>
                    <th className="text-right p-2 font-medium w-20">GST %</th>
                    <th className="text-right p-2 font-medium w-28">Amount</th>
                    <th className="p-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const invItem = inventory.find(i => i.id === item.itemId);
                    const taxableAmount = invItem ? invItem.sellingPrice * item.quantity : 0;
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
                                  {inv.name} ({inv.quantity} in stock)
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
                        <td className="p-2 text-right">
                          {invItem ? `₹${invItem.sellingPrice.toFixed(2)}` : '-'}
                        </td>
                        <td className="p-2 text-right">
                          {invItem ? `${invItem.gstRate}%` : '-'}
                        </td>
                        <td className="p-2 text-right font-medium">
                          {invItem ? `₹${(taxableAmount + gstAmount).toFixed(2)}` : '-'}
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
            <div>
              <Label>Terms & Conditions</Label>
              <Textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Payment terms..."
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="btn-gradient" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Invoice'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

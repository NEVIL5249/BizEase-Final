import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calculator, ArrowRight, ArrowLeft, RotateCcw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const GST_RATES = [0, 5, 12, 18, 28];

export function GSTCalculator() {
  const [amount, setAmount] = useState<string>('');
  const [gstRate, setGstRate] = useState<string>('18');
  const [calculationType, setCalculationType] = useState<'exclusive' | 'inclusive'>('exclusive');

  const numAmount = parseFloat(amount) || 0;
  const numGstRate = parseFloat(gstRate) || 0;

  const calculate = () => {
    if (calculationType === 'exclusive') {
      // Amount is without GST, calculate GST to add
      const gstAmount = (numAmount * numGstRate) / 100;
      const cgst = gstAmount / 2;
      const sgst = gstAmount / 2;
      const totalAmount = numAmount + gstAmount;
      
      return {
        originalAmount: numAmount,
        gstAmount,
        cgst,
        sgst,
        totalAmount,
        label: 'Amount Excluding GST',
        resultLabel: 'Total Amount (Incl. GST)',
      };
    } else {
      // Amount includes GST, calculate original amount
      const originalAmount = numAmount / (1 + numGstRate / 100);
      const gstAmount = numAmount - originalAmount;
      const cgst = gstAmount / 2;
      const sgst = gstAmount / 2;
      
      return {
        originalAmount,
        gstAmount,
        cgst,
        sgst,
        totalAmount: numAmount,
        label: 'Amount Including GST',
        resultLabel: 'Original Amount (Excl. GST)',
      };
    }
  };

  const result = calculate();

  const handleReset = () => {
    setAmount('');
    setGstRate('18');
    setCalculationType('exclusive');
  };

  return (
    <Card className="card-elevated p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Calculator className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">GST Calculator</h3>
          <p className="text-sm text-muted-foreground">Calculate GST inclusive or exclusive amounts</p>
        </div>
      </div>

      {/* Calculator Type Toggle */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={calculationType === 'exclusive' ? 'default' : 'outline'}
          className={cn("flex-1 gap-2", calculationType === 'exclusive' && "btn-gradient")}
          onClick={() => setCalculationType('exclusive')}
        >
          <ArrowRight className="w-4 h-4" />
          Add GST
        </Button>
        <Button
          variant={calculationType === 'inclusive' ? 'default' : 'outline'}
          className={cn("flex-1 gap-2", calculationType === 'inclusive' && "btn-gradient")}
          onClick={() => setCalculationType('inclusive')}
        >
          <ArrowLeft className="w-4 h-4" />
          Remove GST
        </Button>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <Label className="text-sm font-medium mb-2 block">
            {calculationType === 'exclusive' ? 'Amount (Excl. GST)' : 'Amount (Incl. GST)'}
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="pl-8 text-lg h-12"
            />
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium mb-2 block">GST Rate</Label>
          <Select value={gstRate} onValueChange={setGstRate}>
            <SelectTrigger className="h-12 text-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GST_RATES.map(rate => (
                <SelectItem key={rate} value={rate.toString()}>
                  {rate}%
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Section */}
      {numAmount > 0 && (
        <div className="space-y-4 border-t pt-6">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Calculation Result</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">
                {calculationType === 'exclusive' ? 'Original Amount' : 'Net Amount'}
              </p>
              <p className="text-2xl font-bold">
                ₹{result.originalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">Total GST</p>
              <p className="text-2xl font-bold text-primary">
                ₹{result.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">CGST ({numGstRate / 2}%)</span>
                <span className="font-medium">
                  ₹{result.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div className="p-3 rounded-lg border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">SGST ({numGstRate / 2}%)</span>
                <span className="font-medium">
                  ₹{result.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <div className={cn(
            "p-4 rounded-lg",
            calculationType === 'exclusive' ? "bg-success/10 border border-success/20" : "bg-info/10 border border-info/20"
          )}>
            <p className="text-sm text-muted-foreground mb-1">
              {calculationType === 'exclusive' ? 'Total Amount (Incl. GST)' : 'Amount (Incl. GST)'}
            </p>
            <p className={cn(
              "text-3xl font-bold",
              calculationType === 'exclusive' ? "text-success" : "text-info"
            )}>
              ₹{result.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          {/* Summary Table */}
          <div className="border rounded-lg overflow-hidden mt-4">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 font-medium">Description</th>
                  <th className="text-right p-3 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-3">Taxable Value</td>
                  <td className="p-3 text-right">
                    ₹{result.originalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">CGST @ {numGstRate / 2}%</td>
                  <td className="p-3 text-right">
                    ₹{result.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">SGST @ {numGstRate / 2}%</td>
                  <td className="p-3 text-right">
                    ₹{result.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr className="border-t bg-muted/50 font-semibold">
                  <td className="p-3">Total Amount</td>
                  <td className="p-3 text-right">
                    ₹{result.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reset Button */}
      <div className="mt-6">
        <Button variant="outline" className="w-full gap-2" onClick={handleReset}>
          <RotateCcw className="w-4 h-4" />
          Reset Calculator
        </Button>
      </div>
    </Card>
  );
}

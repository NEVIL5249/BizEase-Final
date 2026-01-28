import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, TrendingUp, TrendingDown, IndianRupee, Building2 } from 'lucide-react';
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
  Legend,
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import { generateReportPDF } from '@/lib/pdfGenerator';

export function GSTReport() {
  const { sales, purchases, company } = useApp();
  const [period, setPeriod] = useState('thisMonth');

  const filterByPeriod = (date: Date) => {
    const today = new Date();
    let startDate: Date;
    let endDate: Date = today;
    
    switch (period) {
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
      case 'lastQuarter':
        const lastQuarter = Math.floor(today.getMonth() / 3) - 1;
        const year = lastQuarter < 0 ? today.getFullYear() - 1 : today.getFullYear();
        const q = lastQuarter < 0 ? 3 : lastQuarter;
        startDate = new Date(year, q * 3, 1);
        endDate = endOfMonth(new Date(year, q * 3 + 2, 1));
        break;
      default:
        startDate = startOfMonth(today);
    }

    return isWithinInterval(date, { start: startDate, end: endDate });
  };

  const filteredData = useMemo(() => {
    const filteredSales = sales.filter(s => filterByPeriod(new Date(s.invoiceDate)));
    const filteredPurchases = purchases.filter(p => filterByPeriod(new Date(p.billDate)));
    return { sales: filteredSales, purchases: filteredPurchases };
  }, [sales, purchases, period]);

  // Calculate GST Summary
  const gstSummary = useMemo(() => {
    // Output GST (Sales)
    const outputCgst = filteredData.sales.reduce((sum, s) => sum + s.totalCgst, 0);
    const outputSgst = filteredData.sales.reduce((sum, s) => sum + s.totalSgst, 0);
    const outputIgst = filteredData.sales.reduce((sum, s) => sum + s.totalIgst, 0);
    const totalOutputGst = outputCgst + outputSgst + outputIgst;

    // Input GST (Purchases)
    const inputCgst = filteredData.purchases.reduce((sum, p) => sum + p.totalCgst, 0);
    const inputSgst = filteredData.purchases.reduce((sum, p) => sum + p.totalSgst, 0);
    const inputIgst = filteredData.purchases.reduce((sum, p) => sum + p.totalIgst, 0);
    const totalInputGst = inputCgst + inputSgst + inputIgst;

    // Net Payable
    const netCgst = outputCgst - inputCgst;
    const netSgst = outputSgst - inputSgst;
    const netIgst = outputIgst - inputIgst;
    const netPayable = netCgst + netSgst + netIgst;

    // Taxable values
    const taxableSales = filteredData.sales.reduce((sum, s) => sum + s.subtotal, 0);
    const taxablePurchases = filteredData.purchases.reduce((sum, p) => sum + p.subtotal, 0);

    return {
      output: { cgst: outputCgst, sgst: outputSgst, igst: outputIgst, total: totalOutputGst },
      input: { cgst: inputCgst, sgst: inputSgst, igst: inputIgst, total: totalInputGst },
      net: { cgst: netCgst, sgst: netSgst, igst: netIgst, total: netPayable },
      taxableSales,
      taxablePurchases,
      invoiceCount: filteredData.sales.length,
      billCount: filteredData.purchases.length,
    };
  }, [filteredData]);

  // GST Rate-wise breakdown
  const rateWiseBreakdown = useMemo(() => {
    const rates: { [key: number]: { sales: number; purchases: number; gstCollected: number; gstPaid: number } } = {};
    
    filteredData.sales.forEach(sale => {
      sale.items.forEach(item => {
        if (!rates[item.gstRate]) {
          rates[item.gstRate] = { sales: 0, purchases: 0, gstCollected: 0, gstPaid: 0 };
        }
        rates[item.gstRate].sales += item.taxableAmount;
        rates[item.gstRate].gstCollected += item.cgst + item.sgst + item.igst;
      });
    });

    filteredData.purchases.forEach(purchase => {
      purchase.items.forEach(item => {
        if (!rates[item.gstRate]) {
          rates[item.gstRate] = { sales: 0, purchases: 0, gstCollected: 0, gstPaid: 0 };
        }
        rates[item.gstRate].purchases += item.taxableAmount;
        rates[item.gstRate].gstPaid += item.cgst + item.sgst + item.igst;
      });
    });

    return Object.entries(rates)
      .map(([rate, data]) => ({ rate: parseInt(rate), ...data }))
      .sort((a, b) => a.rate - b.rate);
  }, [filteredData]);

  // HSN-wise summary
  const hsnSummary = useMemo(() => {
    const hsn: { [key: string]: { description: string; taxableValue: number; gstRate: number; cgst: number; sgst: number; total: number } } = {};
    
    filteredData.sales.forEach(sale => {
      sale.items.forEach(item => {
        if (!hsn[item.hsn]) {
          hsn[item.hsn] = { description: item.name, taxableValue: 0, gstRate: item.gstRate, cgst: 0, sgst: 0, total: 0 };
        }
        hsn[item.hsn].taxableValue += item.taxableAmount;
        hsn[item.hsn].cgst += item.cgst;
        hsn[item.hsn].sgst += item.sgst;
        hsn[item.hsn].total += item.totalAmount;
      });
    });

    return Object.entries(hsn)
      .map(([code, data]) => ({ hsn: code, ...data }))
      .sort((a, b) => b.taxableValue - a.taxableValue);
  }, [filteredData]);

  // Monthly comparison chart data
  const monthlyData = useMemo(() => {
    const months: { [key: string]: { outputGst: number; inputGst: number; netGst: number } } = {};
    
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const key = format(date, 'MMM');
      months[key] = { outputGst: 0, inputGst: 0, netGst: 0 };
    }

    sales.forEach(s => {
      const key = format(new Date(s.invoiceDate), 'MMM');
      if (months[key]) {
        months[key].outputGst += s.totalCgst + s.totalSgst + s.totalIgst;
      }
    });

    purchases.forEach(p => {
      const key = format(new Date(p.billDate), 'MMM');
      if (months[key]) {
        months[key].inputGst += p.totalCgst + p.totalSgst + p.totalIgst;
      }
    });

    return Object.entries(months).map(([month, data]) => ({
      month,
      outputGst: data.outputGst,
      inputGst: data.inputGst,
      netGst: data.outputGst - data.inputGst,
    }));
  }, [sales, purchases]);

  const handleExportPDF = () => {
    const headers = ['Particulars', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Total Tax'];
    const data: (string | number)[][] = [
      ['OUTWARD SUPPLIES (SALES)', '', '', '', '', ''],
      ['B2B Invoices', `₹${gstSummary.taxableSales.toLocaleString('en-IN')}`, `₹${gstSummary.output.cgst.toLocaleString('en-IN')}`, `₹${gstSummary.output.sgst.toLocaleString('en-IN')}`, `₹${gstSummary.output.igst.toLocaleString('en-IN')}`, `₹${gstSummary.output.total.toLocaleString('en-IN')}`],
      ['', '', '', '', '', ''],
      ['INWARD SUPPLIES (PURCHASES)', '', '', '', '', ''],
      ['From Registered Suppliers', `₹${gstSummary.taxablePurchases.toLocaleString('en-IN')}`, `₹${gstSummary.input.cgst.toLocaleString('en-IN')}`, `₹${gstSummary.input.sgst.toLocaleString('en-IN')}`, `₹${gstSummary.input.igst.toLocaleString('en-IN')}`, `₹${gstSummary.input.total.toLocaleString('en-IN')}`],
      ['', '', '', '', '', ''],
      ['TAX LIABILITY', '', '', '', '', ''],
      ['Output Tax (A)', '', `₹${gstSummary.output.cgst.toLocaleString('en-IN')}`, `₹${gstSummary.output.sgst.toLocaleString('en-IN')}`, `₹${gstSummary.output.igst.toLocaleString('en-IN')}`, `₹${gstSummary.output.total.toLocaleString('en-IN')}`],
      ['Input Tax Credit (B)', '', `₹${gstSummary.input.cgst.toLocaleString('en-IN')}`, `₹${gstSummary.input.sgst.toLocaleString('en-IN')}`, `₹${gstSummary.input.igst.toLocaleString('en-IN')}`, `₹${gstSummary.input.total.toLocaleString('en-IN')}`],
      ['Net Tax Payable (A-B)', '', `₹${gstSummary.net.cgst.toLocaleString('en-IN')}`, `₹${gstSummary.net.sgst.toLocaleString('en-IN')}`, `₹${gstSummary.net.igst.toLocaleString('en-IN')}`, `₹${gstSummary.net.total.toLocaleString('en-IN')}`],
    ];

    const summary = [
      { label: 'Period', value: period === 'thisMonth' ? format(new Date(), 'MMMM yyyy') : period },
      { label: 'Total Invoices', value: gstSummary.invoiceCount.toString() },
      { label: 'Total Bills', value: gstSummary.billCount.toString() },
      { label: 'Net GST Payable', value: `₹${gstSummary.net.total.toLocaleString('en-IN')}` },
    ];

    generateReportPDF('GST Summary Report (GSTR-3B Format)', headers, data, summary, company || undefined);
  };

  const handleExportHSNPDF = () => {
    const headers = ['HSN Code', 'Description', 'Taxable Value', 'GST Rate', 'CGST', 'SGST', 'Total'];
    const data = hsnSummary.map(h => [
      h.hsn,
      h.description,
      `₹${h.taxableValue.toLocaleString('en-IN')}`,
      `${h.gstRate}%`,
      `₹${h.cgst.toLocaleString('en-IN')}`,
      `₹${h.sgst.toLocaleString('en-IN')}`,
      `₹${h.total.toLocaleString('en-IN')}`,
    ]);

    generateReportPDF('HSN-wise Summary (GSTR-1 Annexure)', headers, data, [], company || undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">GST Report</h2>
          <p className="text-muted-foreground text-sm mt-1">CA-ready GST summary for filing</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="thisQuarter">This Quarter</SelectItem>
              <SelectItem value="lastQuarter">Last Quarter</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2" onClick={handleExportPDF}>
            <Download className="w-4 h-4" />
            GSTR-3B Format
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleExportHSNPDF}>
            <Download className="w-4 h-4" />
            HSN Summary
          </Button>
        </div>
      </div>

      {/* Company Info */}
      {company && (
        <Card className="p-4 bg-muted/30">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-semibold">{company.name}</p>
              <p className="text-sm text-muted-foreground">GSTIN: {company.gstin} | {company.address}, {company.city}, {company.state}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">Output GST (Sales)</span>
          </div>
          <p className="text-2xl font-bold">₹{gstSummary.output.total.toLocaleString('en-IN')}</p>
          <p className="text-xs text-muted-foreground mt-1">{gstSummary.invoiceCount} invoices</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingDown className="w-4 h-4" />
            <span className="text-xs">Input GST (Purchases)</span>
          </div>
          <p className="text-2xl font-bold text-success">₹{gstSummary.input.total.toLocaleString('en-IN')}</p>
          <p className="text-xs text-muted-foreground mt-1">{gstSummary.billCount} bills</p>
        </Card>
        <Card className={cn(
          "p-4",
          gstSummary.net.total > 0 ? "bg-warning/5 border-warning/20" : "bg-success/5 border-success/20"
        )}>
          <div className={cn("flex items-center gap-2 mb-1", gstSummary.net.total > 0 ? "text-warning" : "text-success")}>
            <IndianRupee className="w-4 h-4" />
            <span className="text-xs">Net GST Payable</span>
          </div>
          <p className={cn("text-2xl font-bold", gstSummary.net.total > 0 ? "text-warning" : "text-success")}>
            ₹{Math.abs(gstSummary.net.total).toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {gstSummary.net.total > 0 ? 'To Pay' : 'Refundable'}
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <FileText className="w-4 h-4" />
            <span className="text-xs">Taxable Turnover</span>
          </div>
          <p className="text-2xl font-bold">₹{(gstSummary.taxableSales / 100000).toFixed(2)}L</p>
          <p className="text-xs text-muted-foreground mt-1">For the period</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-semibold mb-4">GST Trend (Last 6 Months)</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
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
                  tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, '']}
                />
                <Legend />
                <Bar dataKey="outputGst" name="Output GST" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="inputGst" name="Input GST" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Rate-wise Breakdown */}
        <Card className="p-5">
          <h3 className="font-semibold mb-4">GST Rate-wise Summary</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rate</TableHead>
                <TableHead className="text-right">Taxable Sales</TableHead>
                <TableHead className="text-right">Taxable Purchases</TableHead>
                <TableHead className="text-right">GST Collected</TableHead>
                <TableHead className="text-right">GST Paid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rateWiseBreakdown.map(row => (
                <TableRow key={row.rate}>
                  <TableCell>
                    <Badge variant="outline">{row.rate}%</Badge>
                  </TableCell>
                  <TableCell className="text-right">₹{row.sales.toLocaleString('en-IN')}</TableCell>
                  <TableCell className="text-right">₹{row.purchases.toLocaleString('en-IN')}</TableCell>
                  <TableCell className="text-right text-primary">₹{row.gstCollected.toLocaleString('en-IN')}</TableCell>
                  <TableCell className="text-right text-success">₹{row.gstPaid.toLocaleString('en-IN')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* GSTR-3B Style Summary */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">GSTR-3B Summary</h3>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Summary for GST return filing</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-1/3">Particulars</TableHead>
              <TableHead className="text-right">Taxable Value</TableHead>
              <TableHead className="text-right">CGST</TableHead>
              <TableHead className="text-right">SGST</TableHead>
              <TableHead className="text-right">IGST</TableHead>
              <TableHead className="text-right">Total Tax</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="bg-primary/5 font-semibold">
              <TableCell colSpan={6}>3.1 Outward Supplies (Sales)</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="pl-8">B2B Supplies (Taxable)</TableCell>
              <TableCell className="text-right">₹{gstSummary.taxableSales.toLocaleString('en-IN')}</TableCell>
              <TableCell className="text-right">₹{gstSummary.output.cgst.toLocaleString('en-IN')}</TableCell>
              <TableCell className="text-right">₹{gstSummary.output.sgst.toLocaleString('en-IN')}</TableCell>
              <TableCell className="text-right">₹{gstSummary.output.igst.toLocaleString('en-IN')}</TableCell>
              <TableCell className="text-right font-medium">₹{gstSummary.output.total.toLocaleString('en-IN')}</TableCell>
            </TableRow>
            <TableRow className="bg-success/5 font-semibold">
              <TableCell colSpan={6}>4. Eligible ITC (Purchases)</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="pl-8">ITC Available</TableCell>
              <TableCell className="text-right">₹{gstSummary.taxablePurchases.toLocaleString('en-IN')}</TableCell>
              <TableCell className="text-right text-success">₹{gstSummary.input.cgst.toLocaleString('en-IN')}</TableCell>
              <TableCell className="text-right text-success">₹{gstSummary.input.sgst.toLocaleString('en-IN')}</TableCell>
              <TableCell className="text-right text-success">₹{gstSummary.input.igst.toLocaleString('en-IN')}</TableCell>
              <TableCell className="text-right font-medium text-success">₹{gstSummary.input.total.toLocaleString('en-IN')}</TableCell>
            </TableRow>
            <TableRow className={cn("font-bold text-lg", gstSummary.net.total > 0 ? "bg-warning/10" : "bg-success/10")}>
              <TableCell>6. Tax Payable / Refundable</TableCell>
              <TableCell></TableCell>
              <TableCell className={cn("text-right", gstSummary.net.cgst > 0 ? "text-warning" : "text-success")}>
                ₹{gstSummary.net.cgst.toLocaleString('en-IN')}
              </TableCell>
              <TableCell className={cn("text-right", gstSummary.net.sgst > 0 ? "text-warning" : "text-success")}>
                ₹{gstSummary.net.sgst.toLocaleString('en-IN')}
              </TableCell>
              <TableCell className={cn("text-right", gstSummary.net.igst > 0 ? "text-warning" : "text-success")}>
                ₹{gstSummary.net.igst.toLocaleString('en-IN')}
              </TableCell>
              <TableCell className={cn("text-right", gstSummary.net.total > 0 ? "text-warning" : "text-success")}>
                ₹{Math.abs(gstSummary.net.total).toLocaleString('en-IN')}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>

      {/* HSN Summary */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold">HSN-wise Summary (For GSTR-1)</h3>
          <p className="text-sm text-muted-foreground">HSN code summary of outward supplies</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>HSN Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Taxable Value</TableHead>
              <TableHead className="text-center">GST Rate</TableHead>
              <TableHead className="text-right">CGST</TableHead>
              <TableHead className="text-right">SGST</TableHead>
              <TableHead className="text-right">Total Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hsnSummary.slice(0, 10).map(row => (
              <TableRow key={row.hsn}>
                <TableCell className="font-mono">{row.hsn}</TableCell>
                <TableCell className="max-w-[200px] truncate">{row.description}</TableCell>
                <TableCell className="text-right">₹{row.taxableValue.toLocaleString('en-IN')}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline">{row.gstRate}%</Badge>
                </TableCell>
                <TableCell className="text-right">₹{row.cgst.toLocaleString('en-IN')}</TableCell>
                <TableCell className="text-right">₹{row.sgst.toLocaleString('en-IN')}</TableCell>
                <TableCell className="text-right font-medium">₹{row.total.toLocaleString('en-IN')}</TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-muted/50 font-semibold">
              <TableCell colSpan={2}>Total</TableCell>
              <TableCell className="text-right">₹{hsnSummary.reduce((s, h) => s + h.taxableValue, 0).toLocaleString('en-IN')}</TableCell>
              <TableCell></TableCell>
              <TableCell className="text-right">₹{hsnSummary.reduce((s, h) => s + h.cgst, 0).toLocaleString('en-IN')}</TableCell>
              <TableCell className="text-right">₹{hsnSummary.reduce((s, h) => s + h.sgst, 0).toLocaleString('en-IN')}</TableCell>
              <TableCell className="text-right">₹{hsnSummary.reduce((s, h) => s + h.total, 0).toLocaleString('en-IN')}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

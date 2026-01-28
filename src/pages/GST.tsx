import { useState } from 'react';
import { Calculator, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GSTCalculator } from '@/components/gst/GSTCalculator';
import { GSTReport } from '@/components/reports/GSTReport';
import { cn } from '@/lib/utils';

export function GST() {
  const { sales, purchases, isLoading } = useApp();
  const [activeTab, setActiveTab] = useState('summary');

  const totalSalesGst = sales.reduce((sum, s) => sum + s.totalCgst + s.totalSgst, 0);
  const totalPurchaseGst = purchases.reduce((sum, p) => sum + p.totalCgst + p.totalSgst, 0);
  const netGstPayable = totalSalesGst - totalPurchaseGst;

  const filingChecklist = [
    { title: 'GSTR-1 (Outward Supplies)', due: '11th Feb 2026', status: 'pending', description: 'Details of outward supplies' },
    { title: 'GSTR-3B (Monthly Return)', due: '20th Feb 2026', status: 'pending', description: 'Summary return with tax liability' },
    { title: 'GSTR-2B (Auto-drafted)', due: 'Auto Generated', status: 'completed', description: 'ITC statement from suppliers' },
    { title: 'GSTR-9 (Annual Return)', due: '31st Dec 2026', status: 'upcoming', description: 'Annual return for the FY' },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">GST & Compliance</h1>
        <p className="text-muted-foreground mt-1">Manage GST calculations, reports, and filings</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="report">GST Report</TabsTrigger>
          <TabsTrigger value="filings">Filings</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6">
          {/* GST Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="card-elevated p-5">
              <p className="text-sm text-muted-foreground">Output GST (Sales)</p>
              <p className="text-2xl font-bold text-foreground mt-1">₹{totalSalesGst.toLocaleString('en-IN')}</p>
              <p className="text-xs text-muted-foreground mt-2">{sales.length} invoices this period</p>
            </Card>
            <Card className="card-elevated p-5">
              <p className="text-sm text-muted-foreground">Input GST (Purchases)</p>
              <p className="text-2xl font-bold text-success mt-1">₹{totalPurchaseGst.toLocaleString('en-IN')}</p>
              <p className="text-xs text-muted-foreground mt-2">{purchases.length} bills this period</p>
            </Card>
            <Card className={cn(
              "card-elevated p-5",
              netGstPayable > 0 ? "bg-warning/5 border-warning/20" : "bg-success/5 border-success/20"
            )}>
              <p className="text-sm text-muted-foreground">Net GST Payable</p>
              <p className={cn("text-2xl font-bold mt-1", netGstPayable > 0 ? "text-warning" : "text-success")}>
                ₹{Math.abs(netGstPayable).toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {netGstPayable > 0 ? 'To be paid' : 'Refundable/Carry forward'}
              </p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* GST Breakdown */}
            <Card className="card-elevated p-5">
              <div className="flex items-center gap-3 mb-4">
                <Calculator className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">GST Breakdown</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span>Taxable Sales Value</span>
                  <span className="font-medium">₹{sales.reduce((s, i) => s + i.subtotal, 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>CGST Collected @ 50%</span>
                  <span className="font-medium">₹{sales.reduce((s, i) => s + i.totalCgst, 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>SGST Collected @ 50%</span>
                  <span className="font-medium">₹{sales.reduce((s, i) => s + i.totalSgst, 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-2 border-b bg-success/5 -mx-5 px-5">
                  <span>Less: Input Tax Credit</span>
                  <span className="font-medium text-success">-₹{totalPurchaseGst.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-3 font-semibold text-base bg-muted/50 -mx-5 px-5 rounded-b-lg">
                  <span>Net Tax Liability</span>
                  <span className={netGstPayable > 0 ? 'text-warning' : 'text-success'}>
                    ₹{netGstPayable.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </Card>

            {/* Filing Status */}
            <Card className="card-elevated p-5">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Filing Status</h3>
              </div>
              <div className="space-y-3">
                {filingChecklist.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {item.status === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : item.status === 'pending' ? (
                        <AlertCircle className="w-5 h-5 text-warning" />
                      ) : (
                        <Clock className="w-5 h-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs capitalize",
                          item.status === 'completed' && "bg-success/10 text-success border-success/20",
                          item.status === 'pending' && "bg-warning/10 text-warning border-warning/20",
                          item.status === 'upcoming' && "bg-muted text-muted-foreground"
                        )}
                      >
                        {item.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">Due: {item.due}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="calculator">
          <div className="max-w-2xl mx-auto">
            <GSTCalculator />
          </div>
        </TabsContent>

        <TabsContent value="report">
          <GSTReport />
        </TabsContent>

        <TabsContent value="filings" className="space-y-6">
          <Card className="card-elevated p-6">
            <h3 className="font-semibold text-lg mb-4">GST Filing Checklist</h3>
            <p className="text-muted-foreground mb-6">Track your GST filing deadlines and status</p>
            
            <div className="space-y-4">
              {filingChecklist.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      item.status === 'completed' && "bg-success/10",
                      item.status === 'pending' && "bg-warning/10",
                      item.status === 'upcoming' && "bg-muted"
                    )}>
                      {item.status === 'completed' ? (
                        <CheckCircle2 className="w-6 h-6 text-success" />
                      ) : item.status === 'pending' ? (
                        <AlertCircle className="w-6 h-6 text-warning" />
                      ) : (
                        <Clock className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <p className="text-sm font-medium mt-1">Due: {item.due}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "capitalize",
                        item.status === 'completed' && "bg-success/10 text-success border-success/20",
                        item.status === 'pending' && "bg-warning/10 text-warning border-warning/20",
                        item.status === 'upcoming' && "bg-muted text-muted-foreground"
                      )}
                    >
                      {item.status}
                    </Badge>
                    {item.status === 'pending' && (
                      <Button size="sm" className="btn-gradient">
                        Prepare Data
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

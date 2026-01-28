import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SalesReport } from '@/components/reports/SalesReport';
import { PurchaseReport } from '@/components/reports/PurchaseReport';
import { InventoryReport } from '@/components/reports/InventoryReport';
import { ProfitLossReport } from '@/components/reports/ProfitLossReport';
import { AgingReport } from '@/components/reports/AgingReport';
import { GSTReport } from '@/components/reports/GSTReport';

export function Reports() {
  const { isLoading } = useApp();
  const [activeTab, setActiveTab] = useState('sales');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground mt-1">Business analytics and CA-ready reports</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="pnl">P&L</TabsTrigger>
          <TabsTrigger value="aging">Aging</TabsTrigger>
          <TabsTrigger value="gst">GST</TabsTrigger>
        </TabsList>

        <TabsContent value="sales"><SalesReport /></TabsContent>
        <TabsContent value="purchases"><PurchaseReport /></TabsContent>
        <TabsContent value="inventory"><InventoryReport /></TabsContent>
        <TabsContent value="pnl"><ProfitLossReport /></TabsContent>
        <TabsContent value="aging"><AgingReport /></TabsContent>
        <TabsContent value="gst"><GSTReport /></TabsContent>
      </Tabs>
    </div>
  );
}

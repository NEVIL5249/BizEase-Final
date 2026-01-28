import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { AppProvider } from "@/context/AppContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { Dashboard } from "@/pages/Dashboard";
import { Sales } from "@/pages/Sales";
import { Purchases } from "@/pages/Purchases";
import { Inventory } from "@/pages/Inventory";
import { Customers } from "@/pages/Customers";
import { Ledger } from "@/pages/Ledger";
import { SupplierLedger } from "@/pages/SupplierLedger";
import { Expenses } from "@/pages/Expenses";
import { Reports } from "@/pages/Reports";
import { GST } from "@/pages/GST";
import { AIInsights } from "@/pages/AIInsights";
import { Settings } from "@/pages/Settings";
import Estimate from "@/pages/Estimate";
import NotFound from "./pages/NotFound";
import EWayBill from "./pages/EWayBill";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AppProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <MainLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/sales" element={<Sales />} />
                <Route path="/estimate" element={<Estimate />} />
                <Route path="/ewaybill" element={<EWayBill />} />
                <Route path="/purchases" element={<Purchases />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/ledger" element={<Ledger />} />
                <Route path="/supplier-ledger" element={<SupplierLedger />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/gst" element={<GST />} />
                <Route path="/ai-insights" element={<AIInsights />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </MainLayout>
          </BrowserRouter>
        </TooltipProvider>
      </AppProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

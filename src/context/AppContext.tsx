import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getDB, CompanyProfile, Customer, Supplier, InventoryItem, SalesInvoice, PurchaseBill, Expense, Alert } from '@/lib/db';
import { seedDatabase, getDashboardStats } from '@/lib/seedData';

interface DashboardStats {
  totalSales: number;
  totalPurchases: number;
  totalExpenses: number;
  outstandingReceivables: number;
  outstandingPayables: number;
  grossProfit: number;
  netProfit: number;
  lowStockItems: InventoryItem[];
  unreadAlerts: Alert[];
  salesByDay: { date: string; sales: number; purchases: number }[];
  totalInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
}

interface AppContextType {
  isLoading: boolean;
  company: CompanyProfile | null;
  customers: Customer[];
  suppliers: Supplier[];
  inventory: InventoryItem[];
  sales: SalesInvoice[];
  purchases: PurchaseBill[];
  expenses: Expense[];
  alerts: Alert[];
  dashboardStats: DashboardStats | null;
  refreshData: () => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  addSalesInvoice: (invoice: Omit<SalesInvoice, 'id'>) => Promise<void>;
  addPurchaseBill: (bill: Omit<PurchaseBill, 'id'>) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  markAlertRead: (alertId: string) => Promise<void>;
  updateInventoryItem: (item: InventoryItem) => Promise<void>;
  recordPayment: (invoiceId: string, amount: number) => Promise<void>;
  recordPurchasePayment: (billId: string, amount: number) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [sales, setSales] = useState<SalesInvoice[]>([]);
  const [purchases, setPurchases] = useState<PurchaseBill[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

  const loadData = async () => {
    try {
      const db = await getDB();
      
      // Seed database if empty
      await seedDatabase();
      
      // Load all data
      const [
        companyData,
        customersData,
        suppliersData,
        inventoryData,
        salesData,
        purchasesData,
        expensesData,
        alertsData,
        stats,
      ] = await Promise.all([
        db.get('companyProfile', 'company-1'),
        db.getAll('customers'),
        db.getAll('suppliers'),
        db.getAll('inventory'),
        db.getAll('sales'),
        db.getAll('purchases'),
        db.getAll('expenses'),
        db.getAll('alerts'),
        getDashboardStats(),
      ]);
      
      setCompany(companyData || null);
      setCustomers(customersData);
      setSuppliers(suppliersData);
      setInventory(inventoryData);
      setSales(salesData.sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()));
      setPurchases(purchasesData.sort((a, b) => new Date(b.billDate).getTime() - new Date(a.billDate).getTime()));
      setExpenses(expensesData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setAlerts(alertsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setDashboardStats(stats);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const refreshData = async () => {
    await loadData();
  };

  const addCustomer = async (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    const db = await getDB();
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newCustomer: Customer = {
      ...customer,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.put('customers', newCustomer);
    await refreshData();
  };

  const addInventoryItem = async (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const db = await getDB();
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newItem: InventoryItem = {
      ...item,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.put('inventory', newItem);
    await refreshData();
  };

  const updateInventoryItem = async (item: InventoryItem) => {
    const db = await getDB();
    await db.put('inventory', { ...item, updatedAt: new Date() });
    await refreshData();
  };

  const addSalesInvoice = async (invoice: Omit<SalesInvoice, 'id'>) => {
    const db = await getDB();
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newInvoice: SalesInvoice = { ...invoice, id };
    await db.put('sales', newInvoice);
    
    // Update inventory quantities
    for (const item of invoice.items) {
      const invItem = inventory.find(i => i.id === item.itemId);
      if (invItem) {
        await db.put('inventory', {
          ...invItem,
          quantity: invItem.quantity - item.quantity,
          lastSaleDate: new Date(),
          updatedAt: new Date(),
        });
      }
    }
    
    await refreshData();
  };

  const addPurchaseBill = async (bill: Omit<PurchaseBill, 'id'>) => {
    const db = await getDB();
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newBill: PurchaseBill = { ...bill, id };
    await db.put('purchases', newBill);
    
    // Update inventory quantities
    for (const item of bill.items) {
      const invItem = inventory.find(i => i.id === item.itemId);
      if (invItem) {
        await db.put('inventory', {
          ...invItem,
          quantity: invItem.quantity + item.quantity,
          lastPurchaseDate: new Date(),
          updatedAt: new Date(),
        });
      }
    }
    
    await refreshData();
  };

  const addExpense = async (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    const db = await getDB();
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newExpense: Expense = {
      ...expense,
      id,
      createdAt: new Date(),
    };
    await db.put('expenses', newExpense);
    await refreshData();
  };

  const markAlertRead = async (alertId: string) => {
    const db = await getDB();
    const alert = await db.get('alerts', alertId);
    if (alert) {
      await db.put('alerts', { ...alert, isRead: true });
      await refreshData();
    }
  };

  const recordPayment = async (invoiceId: string, amount: number) => {
    const db = await getDB();
    const invoice = await db.get('sales', invoiceId);
    if (invoice) {
      const newAmountPaid = invoice.amountPaid + amount;
      let newStatus: 'paid' | 'partial' | 'pending' | 'overdue' | 'draft' = invoice.status;
      
      if (newAmountPaid >= invoice.grandTotal) {
        newStatus = 'paid';
      } else if (newAmountPaid > 0) {
        newStatus = 'partial';
      }
      
      await db.put('sales', { 
        ...invoice, 
        amountPaid: newAmountPaid, 
        status: newStatus,
        updatedAt: new Date() 
      });
      await refreshData();
    }
  };

  const recordPurchasePayment = async (billId: string, amount: number) => {
    const db = await getDB();
    const bill = await db.get('purchases', billId);
    if (bill) {
      const newAmountPaid = bill.amountPaid + amount;
      let newStatus: 'paid' | 'partial' | 'pending' | 'overdue' | 'draft' = bill.status;
      
      if (newAmountPaid >= bill.grandTotal) {
        newStatus = 'paid';
      } else if (newAmountPaid > 0) {
        newStatus = 'partial';
      }
      
      await db.put('purchases', { 
        ...bill, 
        amountPaid: newAmountPaid, 
        status: newStatus,
        updatedAt: new Date() 
      });
      await refreshData();
    }
  };

  return (
    <AppContext.Provider
      value={{
        isLoading,
        company,
        customers,
        suppliers,
        inventory,
        sales,
        purchases,
        expenses,
        alerts,
        dashboardStats,
        refreshData,
        addCustomer,
        addInventoryItem,
        addSalesInvoice,
        addPurchaseBill,
        addExpense,
        markAlertRead,
        updateInventoryItem,
        recordPayment,
        recordPurchasePayment,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

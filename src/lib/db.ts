import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Type definitions for all business entities
export interface CompanyProfile {
  id: string;
  name: string;
  gstin: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  logo?: string;
  bankName?: string;
  bankAccount?: string;
  ifscCode?: string;
  currency: string;
  defaultGstRate: number;
}

export interface Customer {
  id: string;
  name: string;
  gstin?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email?: string;
  creditLimit: number;
  outstandingBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Supplier {
  id: string;
  name: string;
  gstin?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email?: string;
  outstandingBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryItem {
  id: string;
  name: string;
  hsn: string;
  sku: string;
  category: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  lowStockThreshold: number;
  gstRate: number;
  lastPurchaseDate?: Date;
  lastSaleDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  itemId: string;
  name: string;
  hsn: string;
  quantity: number;
  rate: number;
  gstRate: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  customerId: string;
  customerName: string;
  customerGstin?: string;
  customerAddress: string;
  placeOfSupply: string;
  items: InvoiceItem[];
  subtotal: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  roundOff: number;
  grandTotal: number;
  amountPaid: number;
  status: 'draft' | 'pending' | 'partial' | 'paid' | 'overdue';
  notes?: string;
  terms?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseBill {
  id: string;
  billNumber: string;
  supplierBillNumber?: string;
  billDate: Date;
  dueDate: Date;
  supplierId: string;
  supplierName: string;
  supplierGstin?: string;
  supplierAddress: string;
  items: InvoiceItem[];
  subtotal: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  roundOff: number;
  grandTotal: number;
  amountPaid: number;
  status: 'draft' | 'pending' | 'partial' | 'paid' | 'overdue';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Expense {
  id: string;
  date: Date;
  category: string;
  description: string;
  amount: number;
  paymentMode: 'cash' | 'digital' | 'credit';
  reference?: string;
  createdAt: Date;
}

export interface LedgerEntry {
  id: string;
  date: Date;
  type: 'sale' | 'purchase' | 'payment_received' | 'payment_made' | 'expense';
  referenceId: string;
  referenceNumber: string;
  partyId?: string;
  partyName?: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  createdAt: Date;
}

export interface Alert {
  id: string;
  type: 'low_stock' | 'overdue_payment' | 'high_expense' | 'sales_drop' | 'gst_reminder';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  isRead: boolean;
  relatedId?: string;
  createdAt: Date;
}

// IndexedDB Schema
interface BizEaseDB extends DBSchema {
  companyProfile: {
    key: string;
    value: CompanyProfile;
  };
  customers: {
    key: string;
    value: Customer;
    indexes: { 'by-name': string };
  };
  suppliers: {
    key: string;
    value: Supplier;
    indexes: { 'by-name': string };
  };
  inventory: {
    key: string;
    value: InventoryItem;
    indexes: { 'by-name': string; 'by-sku': string; 'by-category': string };
  };
  sales: {
    key: string;
    value: SalesInvoice;
    indexes: { 'by-customer': string; 'by-date': Date; 'by-status': string };
  };
  purchases: {
    key: string;
    value: PurchaseBill;
    indexes: { 'by-supplier': string; 'by-date': Date; 'by-status': string };
  };
  expenses: {
    key: string;
    value: Expense;
    indexes: { 'by-category': string; 'by-date': Date };
  };
  ledger: {
    key: string;
    value: LedgerEntry;
    indexes: { 'by-party': string; 'by-date': Date; 'by-type': string };
  };
  alerts: {
    key: string;
    value: Alert;
    indexes: { 'by-type': string; 'by-read': string };
  };
}

let dbInstance: IDBPDatabase<BizEaseDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<BizEaseDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<BizEaseDB>('bizease-db', 1, {
    upgrade(db) {
      // Company Profile
      if (!db.objectStoreNames.contains('companyProfile')) {
        db.createObjectStore('companyProfile', { keyPath: 'id' });
      }

      // Customers
      if (!db.objectStoreNames.contains('customers')) {
        const customerStore = db.createObjectStore('customers', { keyPath: 'id' });
        customerStore.createIndex('by-name', 'name');
      }

      // Suppliers
      if (!db.objectStoreNames.contains('suppliers')) {
        const supplierStore = db.createObjectStore('suppliers', { keyPath: 'id' });
        supplierStore.createIndex('by-name', 'name');
      }

      // Inventory
      if (!db.objectStoreNames.contains('inventory')) {
        const inventoryStore = db.createObjectStore('inventory', { keyPath: 'id' });
        inventoryStore.createIndex('by-name', 'name');
        inventoryStore.createIndex('by-sku', 'sku');
        inventoryStore.createIndex('by-category', 'category');
      }

      // Sales
      if (!db.objectStoreNames.contains('sales')) {
        const salesStore = db.createObjectStore('sales', { keyPath: 'id' });
        salesStore.createIndex('by-customer', 'customerId');
        salesStore.createIndex('by-date', 'invoiceDate');
        salesStore.createIndex('by-status', 'status');
      }

      // Purchases
      if (!db.objectStoreNames.contains('purchases')) {
        const purchaseStore = db.createObjectStore('purchases', { keyPath: 'id' });
        purchaseStore.createIndex('by-supplier', 'supplierId');
        purchaseStore.createIndex('by-date', 'billDate');
        purchaseStore.createIndex('by-status', 'status');
      }

      // Expenses
      if (!db.objectStoreNames.contains('expenses')) {
        const expenseStore = db.createObjectStore('expenses', { keyPath: 'id' });
        expenseStore.createIndex('by-category', 'category');
        expenseStore.createIndex('by-date', 'date');
      }

      // Ledger
      if (!db.objectStoreNames.contains('ledger')) {
        const ledgerStore = db.createObjectStore('ledger', { keyPath: 'id' });
        ledgerStore.createIndex('by-party', 'partyId');
        ledgerStore.createIndex('by-date', 'date');
        ledgerStore.createIndex('by-type', 'type');
      }

      // Alerts
      if (!db.objectStoreNames.contains('alerts')) {
        const alertStore = db.createObjectStore('alerts', { keyPath: 'id' });
        alertStore.createIndex('by-type', 'type');
        alertStore.createIndex('by-read', 'isRead');
      }
    },
  });

  return dbInstance;
}

// Generate unique IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Generate invoice number
export async function generateInvoiceNumber(): Promise<string> {
  const db = await getDB();
  const sales = await db.getAll('sales');
  const currentYear = new Date().getFullYear().toString().slice(-2);
  const nextNumber = (sales.length + 1).toString().padStart(4, '0');
  return `INV/${currentYear}/${nextNumber}`;
}

// Generate purchase bill number
export async function generateBillNumber(): Promise<string> {
  const db = await getDB();
  const purchases = await db.getAll('purchases');
  const currentYear = new Date().getFullYear().toString().slice(-2);
  const nextNumber = (purchases.length + 1).toString().padStart(4, '0');
  return `PUR/${currentYear}/${nextNumber}`;
}

import { getDB, generateId, CompanyProfile, Customer, Supplier, InventoryItem, SalesInvoice, PurchaseBill, Expense, Alert } from './db';

// Demo company profile
const demoCompany: CompanyProfile = {
  id: 'company-1',
  name: 'Kathiyawad Traders',
  gstin: '24AEGPT5467G1Z7',
  address: '9- Gandhi Society, Opp. Prayag Pan, Vora Society, Jamnagar Road',
  city: 'Rajkot',
  state: 'Gujarat',
  pincode: '360006',
  phone: '+91 98765 43210',
  email: 'info@kathiyawadtraders.com',
  bankName: 'HDFC Bank',
  bankAccount: '50200108719688',
  ifscCode: 'HDFC0003099',
  currency: 'INR',
  defaultGstRate: 18,
};

// Demo customers
const demoCustomers: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Jay Siyaram Hardware',
    gstin: '24ABCDE1234F1Z5',
    address: 'Station Road',
    city: 'Rajkot',
    state: 'Gujarat',
    pincode: '360001',
    phone: '+91 98765 11111',
    email: 'jaysiyaram@email.com',
    creditLimit: 100000,
    outstandingBalance: 15600,
  },
  {
    name: 'Shree Krishna Enterprises',
    gstin: '24FGHIJ5678K2L8',
    address: 'Kalawad Road',
    city: 'Rajkot',
    state: 'Gujarat',
    pincode: '360005',
    phone: '+91 98765 22222',
    email: 'shreekrishna@email.com',
    creditLimit: 200000,
    outstandingBalance: 42300,
  },
  {
    name: 'Patel & Sons Trading',
    gstin: '24MNOPQ9012R3S4',
    address: 'University Road',
    city: 'Rajkot',
    state: 'Gujarat',
    pincode: '360007',
    phone: '+91 98765 33333',
    creditLimit: 150000,
    outstandingBalance: 8750,
  },
  {
    name: 'Mahavir Hardware Store',
    address: 'Gondal Road',
    city: 'Rajkot',
    state: 'Gujarat',
    pincode: '360002',
    phone: '+91 98765 44444',
    creditLimit: 50000,
    outstandingBalance: 0,
  },
];

// Demo suppliers
const demoSuppliers: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Gujarat Cement Works',
    gstin: '24AABCT1234A1Z5',
    address: 'Industrial Area',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '380015',
    phone: '+91 79 12345678',
    email: 'sales@gujaratcement.com',
    outstandingBalance: 125000,
  },
  {
    name: 'Steel India Limited',
    gstin: '24BBEFU5678B2Z6',
    address: 'GIDC Estate',
    city: 'Vadodara',
    state: 'Gujarat',
    pincode: '390010',
    phone: '+91 265 9876543',
    email: 'orders@steelindia.com',
    outstandingBalance: 87500,
  },
  {
    name: 'Paint Masters Co.',
    gstin: '24CCFGV9012C3Z7',
    address: 'Market Yard',
    city: 'Surat',
    state: 'Gujarat',
    pincode: '395003',
    phone: '+91 261 5432109',
    outstandingBalance: 34200,
  },
];

// Demo inventory items
const demoInventory: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'ROF Bond Repair (150 ML)',
    hsn: '40021100',
    sku: 'ROF-150',
    category: 'Adhesives',
    unit: 'Pcs',
    purchasePrice: 45,
    sellingPrice: 55.08,
    quantity: 250,
    lowStockThreshold: 50,
    gstRate: 18,
  },
  {
    name: 'Portland Cement 50kg',
    hsn: '25232910',
    sku: 'CEM-50',
    category: 'Cement',
    unit: 'Bags',
    purchasePrice: 350,
    sellingPrice: 420,
    quantity: 120,
    lowStockThreshold: 30,
    gstRate: 28,
  },
  {
    name: 'TMT Steel Bar 12mm',
    hsn: '72142000',
    sku: 'STL-12',
    category: 'Steel',
    unit: 'Kg',
    purchasePrice: 58,
    sellingPrice: 72,
    quantity: 2500,
    lowStockThreshold: 500,
    gstRate: 18,
  },
  {
    name: 'White Cement 1kg',
    hsn: '25232990',
    sku: 'WCM-1',
    category: 'Cement',
    unit: 'Pcs',
    purchasePrice: 28,
    sellingPrice: 38,
    quantity: 80,
    lowStockThreshold: 25,
    gstRate: 28,
  },
  {
    name: 'Acrylic Emulsion Paint 20L',
    hsn: '32091010',
    sku: 'PNT-20',
    category: 'Paints',
    unit: 'Buckets',
    purchasePrice: 1800,
    sellingPrice: 2400,
    quantity: 45,
    lowStockThreshold: 15,
    gstRate: 18,
  },
  {
    name: 'PVC Pipe 4 inch',
    hsn: '39172900',
    sku: 'PVC-4',
    category: 'Pipes',
    unit: 'Meters',
    purchasePrice: 85,
    sellingPrice: 115,
    quantity: 350,
    lowStockThreshold: 100,
    gstRate: 18,
  },
  {
    name: 'Wall Putty 40kg',
    hsn: '32149090',
    sku: 'WPT-40',
    category: 'Finishing',
    unit: 'Bags',
    purchasePrice: 480,
    sellingPrice: 620,
    quantity: 15,
    lowStockThreshold: 20,
    gstRate: 18,
  },
  {
    name: 'Electric Wire 1.5mm 90m',
    hsn: '85441100',
    sku: 'WIR-15',
    category: 'Electrical',
    unit: 'Coils',
    purchasePrice: 1100,
    sellingPrice: 1450,
    quantity: 28,
    lowStockThreshold: 10,
    gstRate: 18,
  },
];

// Demo expense categories
const expenseCategories = ['Rent', 'Electricity', 'Salary', 'Transport', 'Office Supplies', 'Maintenance', 'Marketing', 'Miscellaneous'];

export async function seedDatabase(): Promise<void> {
  const db = await getDB();

  // Check if already seeded
  const existingCompany = await db.get('companyProfile', 'company-1');
  if (existingCompany) {
    console.log('Database already seeded');
    return;
  }

  // Seed company profile
  await db.put('companyProfile', demoCompany);

  // Seed customers
  const customerIds: string[] = [];
  for (const customer of demoCustomers) {
    const id = generateId();
    customerIds.push(id);
    await db.put('customers', {
      ...customer,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Seed suppliers
  const supplierIds: string[] = [];
  for (const supplier of demoSuppliers) {
    const id = generateId();
    supplierIds.push(id);
    await db.put('suppliers', {
      ...supplier,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Seed inventory
  const inventoryIds: string[] = [];
  for (const item of demoInventory) {
    const id = generateId();
    inventoryIds.push(id);
    await db.put('inventory', {
      ...item,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Generate demo sales invoices
  const today = new Date();
  const salesData: Omit<SalesInvoice, 'id'>[] = [];
  
  for (let i = 0; i < 15; i++) {
    const invoiceDate = new Date(today);
    invoiceDate.setDate(today.getDate() - Math.floor(Math.random() * 60));
    
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(invoiceDate.getDate() + 30);
    
    const customerIndex = Math.floor(Math.random() * demoCustomers.length);
    const customer = demoCustomers[customerIndex];
    
    const itemCount = Math.floor(Math.random() * 3) + 1;
    const items: any[] = [];
    let subtotal = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    
    for (let j = 0; j < itemCount; j++) {
      const invItem = demoInventory[Math.floor(Math.random() * demoInventory.length)];
      const qty = Math.floor(Math.random() * 20) + 1;
      const taxableAmount = invItem.sellingPrice * qty;
      const gstAmount = (taxableAmount * invItem.gstRate) / 100;
      
      items.push({
        itemId: inventoryIds[demoInventory.indexOf(invItem)],
        name: invItem.name,
        hsn: invItem.hsn,
        quantity: qty,
        rate: invItem.sellingPrice,
        gstRate: invItem.gstRate,
        taxableAmount,
        cgst: gstAmount / 2,
        sgst: gstAmount / 2,
        igst: 0,
        totalAmount: taxableAmount + gstAmount,
      });
      
      subtotal += taxableAmount;
      totalCgst += gstAmount / 2;
      totalSgst += gstAmount / 2;
    }
    
    const grandTotal = Math.round(subtotal + totalCgst + totalSgst);
    const roundOff = grandTotal - (subtotal + totalCgst + totalSgst);
    const isPaid = Math.random() > 0.4;
    const isPartial = !isPaid && Math.random() > 0.5;
    const isOverdue = !isPaid && !isPartial && dueDate < today;
    
    salesData.push({
      invoiceNumber: `INV/25/${(i + 1).toString().padStart(4, '0')}`,
      invoiceDate,
      dueDate,
      customerId: customerIds[customerIndex],
      customerName: customer.name,
      customerGstin: customer.gstin,
      customerAddress: `${customer.address}, ${customer.city}`,
      placeOfSupply: customer.state,
      items,
      subtotal,
      totalCgst,
      totalSgst,
      totalIgst: 0,
      roundOff,
      grandTotal,
      amountPaid: isPaid ? grandTotal : isPartial ? Math.floor(grandTotal * 0.5) : 0,
      status: isPaid ? 'paid' : isPartial ? 'partial' : isOverdue ? 'overdue' : 'pending',
      notes: 'Thank you for your business!',
      terms: 'Payment due within 30 days',
      createdAt: invoiceDate,
      updatedAt: invoiceDate,
    });
  }
  
  for (const sale of salesData) {
    await db.put('sales', { ...sale, id: generateId() });
  }

  // Generate demo purchase bills
  const purchaseData: Omit<PurchaseBill, 'id'>[] = [];
  
  for (let i = 0; i < 10; i++) {
    const billDate = new Date(today);
    billDate.setDate(today.getDate() - Math.floor(Math.random() * 45));
    
    const dueDate = new Date(billDate);
    dueDate.setDate(billDate.getDate() + 45);
    
    const supplierIndex = Math.floor(Math.random() * demoSuppliers.length);
    const supplier = demoSuppliers[supplierIndex];
    
    const itemCount = Math.floor(Math.random() * 4) + 1;
    const items: any[] = [];
    let subtotal = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    
    for (let j = 0; j < itemCount; j++) {
      const invItem = demoInventory[Math.floor(Math.random() * demoInventory.length)];
      const qty = Math.floor(Math.random() * 50) + 10;
      const taxableAmount = invItem.purchasePrice * qty;
      const gstAmount = (taxableAmount * invItem.gstRate) / 100;
      
      items.push({
        itemId: inventoryIds[demoInventory.indexOf(invItem)],
        name: invItem.name,
        hsn: invItem.hsn,
        quantity: qty,
        rate: invItem.purchasePrice,
        gstRate: invItem.gstRate,
        taxableAmount,
        cgst: gstAmount / 2,
        sgst: gstAmount / 2,
        igst: 0,
        totalAmount: taxableAmount + gstAmount,
      });
      
      subtotal += taxableAmount;
      totalCgst += gstAmount / 2;
      totalSgst += gstAmount / 2;
    }
    
    const grandTotal = Math.round(subtotal + totalCgst + totalSgst);
    const roundOff = grandTotal - (subtotal + totalCgst + totalSgst);
    const isPaid = Math.random() > 0.5;
    
    purchaseData.push({
      billNumber: `PUR/25/${(i + 1).toString().padStart(4, '0')}`,
      supplierBillNumber: `SUP-${Math.floor(Math.random() * 10000)}`,
      billDate,
      dueDate,
      supplierId: supplierIds[supplierIndex],
      supplierName: supplier.name,
      supplierGstin: supplier.gstin,
      supplierAddress: `${supplier.address}, ${supplier.city}`,
      items,
      subtotal,
      totalCgst,
      totalSgst,
      totalIgst: 0,
      roundOff,
      grandTotal,
      amountPaid: isPaid ? grandTotal : 0,
      status: isPaid ? 'paid' : 'pending',
      notes: '',
      createdAt: billDate,
      updatedAt: billDate,
    });
  }
  
  for (const purchase of purchaseData) {
    await db.put('purchases', { ...purchase, id: generateId() });
  }

  // Generate demo expenses
  for (let i = 0; i < 25; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - Math.floor(Math.random() * 60));
    
    const category = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
    const amount = Math.floor(Math.random() * 15000) + 500;
    
    await db.put('expenses', {
      id: generateId(),
      date,
      category,
      description: `${category} expense`,
      amount,
      paymentMode: Math.random() > 0.5 ? 'digital' : 'cash',
      createdAt: date,
    });
  }

  // Generate demo alerts
  const alerts: Alert[] = [
    {
      id: generateId(),
      type: 'low_stock',
      title: 'Low Stock Alert',
      message: 'Wall Putty 40kg is running low (15 remaining, threshold: 20)',
      severity: 'warning',
      isRead: false,
      createdAt: new Date(),
    },
    {
      id: generateId(),
      type: 'overdue_payment',
      title: 'Overdue Payment',
      message: 'Invoice INV/25/0003 is overdue by 5 days - ₹18,500 pending',
      severity: 'critical',
      isRead: false,
      createdAt: new Date(),
    },
    {
      id: generateId(),
      type: 'gst_reminder',
      title: 'GST Filing Reminder',
      message: 'GSTR-3B for January 2025 is due on 20th February',
      severity: 'info',
      isRead: false,
      createdAt: new Date(),
    },
    {
      id: generateId(),
      type: 'high_expense',
      title: 'High Expense Alert',
      message: 'Transport expenses are 35% higher than last month',
      severity: 'warning',
      isRead: true,
      createdAt: new Date(Date.now() - 86400000 * 2),
    },
  ];
  
  for (const alert of alerts) {
    await db.put('alerts', alert);
  }

  console.log('Database seeded successfully!');
}

// Get dashboard statistics
export async function getDashboardStats() {
  const db = await getDB();
  
  const sales = await db.getAll('sales');
  const purchases = await db.getAll('purchases');
  const expenses = await db.getAll('expenses');
  const inventory = await db.getAll('inventory');
  const alerts = await db.getAll('alerts');
  
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  const recentSales = sales.filter(s => new Date(s.invoiceDate) >= thirtyDaysAgo);
  const recentPurchases = purchases.filter(p => new Date(p.billDate) >= thirtyDaysAgo);
  const recentExpenses = expenses.filter(e => new Date(e.date) >= thirtyDaysAgo);
  
  const totalSales = recentSales.reduce((sum, s) => sum + s.grandTotal, 0);
  const totalPurchases = recentPurchases.reduce((sum, p) => sum + p.grandTotal, 0);
  const totalExpenses = recentExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  const outstandingReceivables = sales
    .filter(s => s.status !== 'paid')
    .reduce((sum, s) => sum + (s.grandTotal - s.amountPaid), 0);
    
  const outstandingPayables = purchases
    .filter(p => p.status !== 'paid')
    .reduce((sum, p) => sum + (p.grandTotal - p.amountPaid), 0);
  
  const grossProfit = totalSales - totalPurchases;
  const netProfit = grossProfit - totalExpenses;
  
  const lowStockItems = inventory.filter(i => i.quantity <= i.lowStockThreshold);
  const unreadAlerts = alerts.filter(a => !a.isRead);
  
  // Sales by day for chart
  const salesByDay: { date: string; sales: number; purchases: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const daySales = recentSales
      .filter(s => new Date(s.invoiceDate).toISOString().split('T')[0] === dateStr)
      .reduce((sum, s) => sum + s.grandTotal, 0);
      
    const dayPurchases = recentPurchases
      .filter(p => new Date(p.billDate).toISOString().split('T')[0] === dateStr)
      .reduce((sum, p) => sum + p.grandTotal, 0);
    
    salesByDay.push({ date: dateStr, sales: daySales, purchases: dayPurchases });
  }
  
  return {
    totalSales,
    totalPurchases,
    totalExpenses,
    outstandingReceivables,
    outstandingPayables,
    grossProfit,
    netProfit,
    lowStockItems,
    unreadAlerts,
    salesByDay,
    totalInvoices: sales.length,
    paidInvoices: sales.filter(s => s.status === 'paid').length,
    overdueInvoices: sales.filter(s => s.status === 'overdue').length,
  };
}

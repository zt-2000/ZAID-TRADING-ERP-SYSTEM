import { Product, Customer, Supplier, SaleInvoice, PurchaseOrder, ExpenseItem, FinancialOverview, CompanySettings } from '../types/erp';

const STORAGE_KEY = 'zaid_erp_data_v1';

export interface ERPStoreState {
  companySettings: CompanySettings;
  financials: FinancialOverview;
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  recentSales: SaleInvoice[];
  purchases: PurchaseOrder[];
  expenses: ExpenseItem[];
}

const defaultState: ERPStoreState = {
  companySettings: {
    name: 'ZAID TRADING (PVT) LTD',
    tradeName: 'ZAID Trading Wholesale ERP',
    currency: 'LKR (Rs.)',
    taxId: '102938475-7000',
    address: 'No. 45/A, Warehouse Complex, Peliyagoda, Colombo',
    phone: '+94 11 234 5678',
    email: 'info@zaidtrading.lk'
  },
  financials: {
    cashInHand: 142500,
    bankBalance: 845200,
    customerReceivables: 245000,
    supplierPayables: 168000,
    todaySales: 125000,
    todayPurchases: 48000,
    lowStockCount: 4,
    monthlyNetProfit: 418000,
    monthlyExpenses: 94500
  },
  products: [
    {
      id: 'prod-1',
      name: 'Anchor Full Cream Milk Powder 400g',
      sku: 'MLK-400',
      category: 'Dairy & Beverages',
      unit: 'Pack',
      costPrice: 920,
      sellingPrice: 1080,
      currentStock: 12,
      minStockAlert: 50,
      status: 'low_stock'
    },
    {
      id: 'prod-2',
      name: 'Prima Special Wheat Flour 1kg',
      sku: 'FLR-001',
      category: 'Flour & Bakery',
      unit: 'Pack',
      costPrice: 280,
      sellingPrice: 340,
      currentStock: 18,
      minStockAlert: 60,
      status: 'low_stock'
    },
    {
      id: 'prod-3',
      name: 'Munchee Super Cream Cracker 500g',
      sku: 'BKT-500',
      category: 'Snacks & Biscuits',
      unit: 'Pack',
      costPrice: 310,
      sellingPrice: 380,
      currentStock: 8,
      minStockAlert: 40,
      status: 'low_stock'
    },
    {
      id: 'prod-4',
      name: 'Dilmah Premium Ceylon Tea 200g',
      sku: 'TEA-200',
      category: 'Tea & Coffee',
      unit: 'Box',
      costPrice: 420,
      sellingPrice: 510,
      currentStock: 15,
      minStockAlert: 45,
      status: 'low_stock'
    },
    {
      id: 'prod-5',
      name: 'Fortune White Rice 5kg',
      sku: 'RIC-005',
      category: 'Grains & Rice',
      unit: 'Bag',
      costPrice: 1100,
      sellingPrice: 1350,
      currentStock: 140,
      minStockAlert: 30,
      status: 'active'
    },
    {
      id: 'prod-6',
      name: 'Sunlight Washing Powder 1kg',
      sku: 'DTR-100',
      category: 'Household Care',
      unit: 'Pack',
      costPrice: 540,
      sellingPrice: 650,
      currentStock: 85,
      minStockAlert: 25,
      status: 'active'
    }
  ],
  customers: [
    {
      id: 'cust-1',
      name: 'Lanka Distributors Ltd',
      accountType: 'Wholesale',
      phone: '+94 11 234 5678',
      email: 'orders@lankadist.lk',
      address: '24 Galle Road, Colombo 03',
      outstandingBalance: 42500,
      creditDays: 30
    },
    {
      id: 'cust-2',
      name: 'Silva Supermart & Grocers',
      accountType: 'Regular',
      phone: '+94 11 876 5432',
      email: 'purchasing@silvasupermart.lk',
      address: '88 High Level Road, Nugegoda',
      outstandingBalance: 18200,
      creditDays: 14
    },
    {
      id: 'cust-3',
      name: 'City Mart Wholesale',
      accountType: 'Wholesale',
      phone: '+94 11 998 2211',
      email: 'accounts@citymart.lk',
      address: '15 Negombo Rd, Peliyagoda',
      outstandingBalance: 35000,
      creditDays: 15
    },
    {
      id: 'cust-4',
      name: 'Perera Brothers Retail',
      accountType: 'Regular',
      phone: '+94 77 123 4567',
      email: 'pererabros@gmail.com',
      address: '42 Main Street, Kandy',
      outstandingBalance: 12500,
      creditDays: 7
    }
  ],
  suppliers: [
    {
      id: 'sup-1',
      name: 'Ceylon Grain Mills PLC',
      phone: '+94 11 445 6789',
      email: 'sales@celyongrain.lk',
      address: 'Dockyard Road, Colombo 15',
      outstandingPayable: 78000
    },
    {
      id: 'sup-2',
      name: 'Fonterra Dairy Brands',
      phone: '+94 11 987 6543',
      email: 'orders.lk@fonterra.com',
      address: 'Biyagama EPZ, Malwana',
      outstandingPayable: 90000
    }
  ],
  recentSales: [
    {
      id: 'inv-1',
      invoiceNo: 'INV-2024-0891',
      customerId: 'cust-1',
      customerName: 'Lanka Distributors Ltd',
      customerType: 'Wholesale Account',
      date: 'Today, 11:42 AM',
      totalAmount: 42500,
      paidAmount: 42500,
      status: 'Paid',
      itemsCount: 14
    },
    {
      id: 'inv-2',
      invoiceNo: 'INV-2024-0890',
      customerId: 'cust-2',
      customerName: 'Silva Supermart & Grocers',
      customerType: 'Regular Buyer',
      date: 'Today, 10:15 AM',
      totalAmount: 18200,
      paidAmount: 18200,
      status: 'Paid',
      itemsCount: 6
    },
    {
      id: 'inv-3',
      invoiceNo: 'INV-2024-0889',
      customerId: 'cust-3',
      customerName: 'City Mart Wholesale',
      customerType: 'Credit (15 Days)',
      date: 'Today, 09:30 AM',
      totalAmount: 35000,
      paidAmount: 0,
      status: 'Pending',
      itemsCount: 22
    },
    {
      id: 'inv-4',
      invoiceNo: 'INV-2024-0888',
      customerId: 'cust-walkin',
      customerName: 'Jayasinghe Traders',
      customerType: 'Direct Walk-in',
      date: 'Yesterday',
      totalAmount: 16800,
      paidAmount: 16800,
      status: 'Paid',
      itemsCount: 5
    },
    {
      id: 'inv-5',
      invoiceNo: 'INV-2024-0887',
      customerId: 'cust-4',
      customerName: 'Perera Brothers Retail',
      customerType: 'Overdue by 3 days',
      date: 'Yesterday',
      totalAmount: 12500,
      paidAmount: 0,
      status: 'Overdue',
      itemsCount: 8
    }
  ],
  purchases: [
    {
      id: 'po-1',
      poNumber: 'PO-2024-0312',
      supplierId: 'sup-1',
      supplierName: 'Ceylon Grain Mills PLC',
      date: 'Today, 08:30 AM',
      totalAmount: 48000,
      status: 'Received'
    },
    {
      id: 'po-2',
      poNumber: 'PO-2024-0311',
      supplierId: 'sup-2',
      supplierName: 'Fonterra Dairy Brands',
      date: 'Yesterday, 03:15 PM',
      totalAmount: 85000,
      status: 'Received'
    }
  ],
  expenses: [
    {
      id: 'exp-1',
      category: 'Utilities',
      description: 'Warehouse Electricity & Water',
      amount: 24500,
      date: 'Oct 22, 2024',
      paidVia: 'Bank'
    },
    {
      id: 'exp-2',
      category: 'Transport & Logistics',
      description: 'Fuel for delivery lorry (WP-CAB-4412)',
      amount: 18000,
      date: 'Oct 23, 2024',
      paidVia: 'Cash'
    }
  ]
};

export const loadERPState = (): ERPStoreState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);
    return {
      ...defaultState,
      ...parsed,
      companySettings: {
        ...defaultState.companySettings,
        ...(parsed.companySettings || {})
      }
    };
  } catch {
    return defaultState;
  }
};

export const saveERPState = (state: ERPStoreState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Failed to save to localStorage', err);
  }
};

import { Product, Customer, Supplier, SaleInvoice, PurchaseOrder, ExpenseItem, FinancialOverview, CompanySettings } from '../types/erp';

const STORAGE_KEY = 'zaid_erp_data_v2';
const OLD_STORAGE_KEY = 'zaid_erp_data_v1';

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
    cashInHand: 0,
    bankBalance: 0,
    customerReceivables: 0,
    supplierPayables: 0,
    todaySales: 0,
    todayPurchases: 0,
    lowStockCount: 0,
    monthlyNetProfit: 0,
    monthlyExpenses: 0
  },
  products: [],
  customers: [],
  suppliers: [],
  recentSales: [],
  purchases: [],
  expenses: []
};

export const loadERPState = (): ERPStoreState => {
  try {
    if (localStorage.getItem(OLD_STORAGE_KEY)) {
      localStorage.removeItem(OLD_STORAGE_KEY);
    }

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

export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return 'Today';
  if (dateStr.includes('Today') || dateStr.includes('Just now') || dateStr.includes('Yesterday')) {
    return dateStr;
  }
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
};

export const generateNextInvoiceNo = (sales: SaleInvoice[]): string => {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  let maxSeq = 0;
  sales.forEach(s => {
    if (s.invoiceNo && s.invoiceNo.startsWith(prefix)) {
      const parts = s.invoiceNo.split('-');
      const seqStr = parts[parts.length - 1];
      const seq = parseInt(seqStr, 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  });
  return `${prefix}${String(maxSeq + 1).padStart(5, '0')}`;
};

export const generateNextPoNo = (purchases: PurchaseOrder[]): string => {
  const year = new Date().getFullYear();
  const prefix = `PO-${year}-`;
  let maxSeq = 0;
  purchases.forEach(p => {
    if (p.poNumber && p.poNumber.startsWith(prefix)) {
      const parts = p.poNumber.split('-');
      const seqStr = parts[parts.length - 1];
      const seq = parseInt(seqStr, 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  });
  return `${prefix}${String(maxSeq + 1).padStart(5, '0')}`;
};

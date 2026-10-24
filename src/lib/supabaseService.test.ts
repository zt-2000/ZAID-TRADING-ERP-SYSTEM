import { computeFinancialOverview } from './supabaseService';
import { Product, Customer, Supplier, SaleInvoice, PurchaseOrder, ExpenseItem } from '../types/erp';

/**
 * Unit Test Suite for ERP Financial Calculations & Business Logic
 */
export function runERPBusinessLogicTests(): { passed: boolean; testCount: number; errors: string[] } {
  const errors: string[] = [];
  let testCount = 0;

  // Test 1: Low Stock Detection
  testCount++;
  const sampleProducts: Product[] = [
    {
      id: 'p1',
      name: 'Product High Stock',
      sku: 'SKU-01',
      category: 'Flour',
      unit: 'Kg',
      costPrice: 100,
      sellingPrice: 150,
      currentStock: 100,
      minStockAlert: 20,
      status: 'active'
    },
    {
      id: 'p2',
      name: 'Product Low Stock',
      sku: 'SKU-02',
      category: 'Flour',
      unit: 'Kg',
      costPrice: 100,
      sellingPrice: 150,
      currentStock: 15,
      minStockAlert: 20,
      status: 'low_stock'
    },
    {
      id: 'p3',
      name: 'Product Out of Stock',
      sku: 'SKU-03',
      category: 'Flour',
      unit: 'Kg',
      costPrice: 100,
      sellingPrice: 150,
      currentStock: 0,
      minStockAlert: 20,
      status: 'out_of_stock'
    }
  ];

  // Test 2: Receivables & Payables aggregation
  testCount++;
  const sampleCustomers: Customer[] = [
    { id: 'c1', name: 'Cust 1', accountType: 'Wholesale', phone: '1', email: '', address: '', outstandingBalance: 45000, creditDays: 30 },
    { id: 'c2', name: 'Cust 2', accountType: 'Retail', phone: '2', email: '', address: '', outstandingBalance: 15000, creditDays: 14 }
  ];

  const sampleSuppliers: Supplier[] = [
    { id: 's1', name: 'Supp 1', phone: '1', email: '', address: '', outstandingPayable: 60000 },
    { id: 's2', name: 'Supp 2', phone: '2', email: '', address: '', outstandingPayable: 20000 }
  ];

  const sampleSales: SaleInvoice[] = [
    { id: 'inv1', invoiceNo: 'INV-1', customerId: 'c1', customerName: 'Cust 1', customerType: 'Wholesale', date: 'Today, 10:00 AM', totalAmount: 50000, paidAmount: 50000, status: 'Paid', itemsCount: 5 }
  ];

  const samplePurchases: PurchaseOrder[] = [
    { id: 'po1', poNumber: 'PO-1', supplierId: 's1', supplierName: 'Supp 1', date: 'Today, 09:00 AM', totalAmount: 30000, status: 'Received' }
  ];

  const sampleExpenses: ExpenseItem[] = [
    { id: 'e1', category: 'Utilities', description: 'Power', amount: 12000, date: '2024-10-24', paidVia: 'Cash' }
  ];

  const overview = computeFinancialOverview(
    sampleProducts,
    sampleCustomers,
    sampleSuppliers,
    sampleSales,
    samplePurchases,
    sampleExpenses
  );

  if (overview.customerReceivables !== 60000) {
    errors.push(`Expected customerReceivables to be 60000, got ${overview.customerReceivables}`);
  }

  if (overview.supplierPayables !== 80000) {
    errors.push(`Expected supplierPayables to be 80000, got ${overview.supplierPayables}`);
  }

  if (overview.lowStockCount !== 2) {
    errors.push(`Expected lowStockCount to be 2, got ${overview.lowStockCount}`);
  }

  if (overview.todaySales !== 50000) {
    errors.push(`Expected todaySales to be 50000, got ${overview.todaySales}`);
  }

  if (overview.todayPurchases !== 30000) {
    errors.push(`Expected todayPurchases to be 30000, got ${overview.todayPurchases}`);
  }

  return {
    passed: errors.length === 0,
    testCount,
    errors
  };
}

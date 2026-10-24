import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase';
import { Product, Customer, Supplier, SaleInvoice, PurchaseOrder, ExpenseItem, FinancialOverview } from '../types/erp';
import { ERPStoreState } from './erpStore';

export interface CloudSyncStatus {
  mode: 'cloud_authenticated' | 'cloud_guest' | 'local_fallback';
  message: string;
  userEmail: string | null;
  userRole: string | null;
  warehouseCode: string;
  lastSyncedAt: Date | null;
  hasErrors: boolean;
  lastError: string | null;
}

export interface MigrationResult {
  success: boolean;
  productsMigrated: number;
  customersMigrated: number;
  suppliersMigrated: number;
  salesMigrated: number;
  purchasesMigrated: number;
  errors: string[];
}

let cacheMWWarehouseId: string | null = null;
const cacheCategories = new Map<string, string>();
const cacheUOMs = new Map<string, string>();
const cachePaymentMethods = new Map<string, string>();

export async function getDefaultWarehouseId(client: SupabaseClient): Promise<string> {
  if (cacheMWWarehouseId) return cacheMWWarehouseId;

  try {
    const { data } = await client
      .from('warehouses')
      .select('id')
      .eq('code', 'MW-01')
      .maybeSingle();

    if (data?.id) {
      cacheMWWarehouseId = data.id;
      return data.id;
    }

    const { data: anyWh } = await client.from('warehouses').select('id').limit(1).maybeSingle();
    if (anyWh?.id) {
      cacheMWWarehouseId = anyWh.id;
      return anyWh.id;
    }
  } catch {
    // Ignore
  }

  return '00000000-0000-0000-0000-000000000001';
}

export async function getCategoryId(client: SupabaseClient, categoryName: string): Promise<string | null> {
  if (cacheCategories.has(categoryName)) return cacheCategories.get(categoryName)!;

  try {
    const { data } = await client
      .from('product_categories')
      .select('id')
      .eq('name', categoryName)
      .maybeSingle();

    if (data?.id) {
      cacheCategories.set(categoryName, data.id);
      return data.id;
    }

    const { data: newCat } = await client
      .from('product_categories')
      .insert({ name: categoryName })
      .select('id')
      .maybeSingle();

    if (newCat?.id) {
      cacheCategories.set(categoryName, newCat.id);
      return newCat.id;
    }
  } catch {
    // Ignore
  }

  return null;
}

export async function getUomId(client: SupabaseClient, uomCodeOrName: string): Promise<string | null> {
  if (cacheUOMs.has(uomCodeOrName)) return cacheUOMs.get(uomCodeOrName)!;

  try {
    const { data } = await client
      .from('units_of_measurement')
      .select('id, code, name')
      .or(`code.eq.${uomCodeOrName},name.eq.${uomCodeOrName}`)
      .maybeSingle();

    if (data?.id) {
      cacheUOMs.set(uomCodeOrName, data.id);
      return data.id;
    }
  } catch {
    // ignore
  }

  return null;
}

export async function getPaymentMethodId(client: SupabaseClient, code: string = 'CASH'): Promise<string | null> {
  if (cachePaymentMethods.has(code)) return cachePaymentMethods.get(code)!;

  try {
    const { data } = await client
      .from('payment_methods')
      .select('id')
      .eq('code', code)
      .maybeSingle();

    if (data?.id) {
      cachePaymentMethods.set(code, data.id);
      return data.id;
    }
  } catch {
    // ignore
  }

  return null;
}

export async function fetchLiveProducts(client: SupabaseClient): Promise<Product[]> {
  const warehouseId = await getDefaultWarehouseId(client);

  const { data: rawProds, error: prodErr } = await client
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (prodErr) {
    throw new Error(`Failed to load products: ${prodErr.message}`);
  }

  const inventoryMap = new Map<string, number>();
  try {
    const { data: invRows } = await client.from('warehouse_inventory').select('*');
    if (invRows) {
      invRows.forEach((r: any) => {
        const qty = Number(r.quantity_on_hand ?? r.quantity ?? 0);
        inventoryMap.set(r.product_id, qty);
      });
    }
  } catch {
    // ignore
  }

  const categoryMap = new Map<string, string>();
  try {
    const { data: catRows } = await client.from('product_categories').select('id, name');
    if (catRows) {
      catRows.forEach((c: any) => categoryMap.set(c.id, c.name));
    }
  } catch {
    // ignore
  }

  return (rawProds || []).map((p: any) => {
    const currentStock = inventoryMap.get(p.id) ?? Number(p.quantity ?? p.current_stock ?? 0);
    const minAlert = Number(p.min_stock_alert ?? p.reorder_level ?? 10);
    const status: Product['status'] =
      currentStock === 0 ? 'out_of_stock' : currentStock <= minAlert ? 'low_stock' : 'active';

    const catName = (p.category_id ? categoryMap.get(p.category_id) : null) || p.category || 'General';
    const unitName = p.unit || 'Pack';

    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      category: catName,
      unit: unitName,
      costPrice: Number(p.cost_price || 0),
      sellingPrice: Number(p.selling_price || 0),
      currentStock,
      minStockAlert: minAlert,
      status,
      syncStatus: 'synced'
    };
  });
}

export async function createLiveProduct(
  client: SupabaseClient,
  productData: Omit<Product, 'id'>
): Promise<Product> {
  const warehouseId = await getDefaultWarehouseId(client);
  const categoryId = await getCategoryId(client, productData.category);

  const payload: any = {
    sku: productData.sku,
    name: productData.name,
    cost_price: productData.costPrice,
    selling_price: productData.sellingPrice,
    unit: productData.unit,
    is_active: true
  };

  if (categoryId) payload.category_id = categoryId;
  payload.reorder_level = productData.minStockAlert;

  const { data: newProd, error: insertErr } = await client
    .from('products')
    .insert(payload)
    .select('*')
    .single();

  if (insertErr || !newProd) {
    throw new Error(`Failed to insert product: ${insertErr?.message || 'Database error'}`);
  }

  if (productData.currentStock > 0 && warehouseId) {
    try {
      await client.from('inventory_movements').insert({
        warehouse_id: warehouseId,
        product_id: newProd.id,
        movement_type: 'PURCHASE_RECEIPT',
        quantity: productData.currentStock,
        quantity_change: productData.currentStock,
        reference_no: `INIT-${productData.sku}`,
        reason: 'Initial Product Stock Registration'
      });
    } catch (movErr) {
      console.warn('Initial stock movement error:', movErr);
    }
  }

  return {
    id: newProd.id,
    sku: newProd.sku,
    name: newProd.name,
    category: productData.category,
    unit: productData.unit,
    costPrice: productData.costPrice,
    sellingPrice: productData.sellingPrice,
    currentStock: productData.currentStock,
    minStockAlert: productData.minStockAlert,
    status: productData.status,
    syncStatus: 'synced'
  };
}

export async function adjustLiveStock(
  client: SupabaseClient,
  productId: string,
  quantityChange: number,
  reason: string,
  referenceNo?: string
): Promise<number> {
  const warehouseId = await getDefaultWarehouseId(client);
  const refNo = referenceNo || `ADJ-${Date.now().toString().slice(-6)}`;

  const { data, error } = await client
    .from('inventory_movements')
    .insert({
      warehouse_id: warehouseId,
      product_id: productId,
      movement_type: 'STOCK_ADJUSTMENT',
      quantity_change: quantityChange,
      balance_after: 0,
      reference_no: refNo,
      reason
    })
    .select('balance_after')
    .single();

  if (error) {
    throw new Error(`Stock adjustment failed: ${error.message}`);
  }

  await client.from('stock_adjustments').insert({
    adjustment_no: refNo,
    warehouse_id: warehouseId,
    product_id: productId,
    adjustment_type: quantityChange >= 0 ? 'INCREASE' : 'DECREASE',
    quantity: Math.abs(quantityChange),
    reason: [
      'Stock Count Correction',
      'Damaged Goods',
      'Expired Goods',
      'Lost Goods / Theft',
      'Internal Warehouse Transfer'
    ].includes(reason)
      ? reason
      : 'Stock Count Correction',
    notes: reason
  });

  return Number(data?.balance_after ?? 0);
}

export async function fetchLiveCustomers(client: SupabaseClient): Promise<Customer[]> {
  const { data, error } = await client
    .from('customers')
    .select(`
      id,
      name,
      account_type,
      phone,
      email,
      address,
      credit_limit,
      credit_days,
      is_active,
      sales_invoices ( total_amount, paid_amount, status )
    `)
    .order('name');

  if (error) {
    throw new Error(`Failed to load customers: ${error.message}`);
  }

  return (data || []).map((c: any) => {
    const unpaid = (c.sales_invoices || []).reduce((acc: number, inv: any) => {
      if (inv.status !== 'Void') {
        return acc + Math.max(0, Number(inv.total_amount || 0) - Number(inv.paid_amount || 0));
      }
      return acc;
    }, 0);

    return {
      id: c.id,
      name: c.name,
      accountType: c.account_type || 'Wholesale',
      phone: c.phone || '',
      email: c.email || '',
      address: c.address || '',
      outstandingBalance: unpaid,
      creditDays: c.credit_days || 14
    };
  });
}

export async function createLiveCustomer(
  client: SupabaseClient,
  customer: Customer
): Promise<Customer> {
  const { data, error } = await client
    .from('customers')
    .insert({
      name: customer.name,
      account_type: customer.accountType,
      phone: customer.phone,
      email: customer.email || null,
      address: customer.address || null,
      credit_days: customer.creditDays || 14
    })
    .select('id, name, account_type, phone, email, address, credit_days')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create customer: ${error?.message || 'Database error'}`);
  }

  return {
    id: data.id,
    name: data.name,
    accountType: data.account_type,
    phone: data.phone,
    email: data.email || '',
    address: data.address || '',
    outstandingBalance: 0,
    creditDays: data.credit_days
  };
}

export async function fetchLiveSuppliers(client: SupabaseClient): Promise<Supplier[]> {
  const { data, error } = await client
    .from('suppliers')
    .select(`
      id,
      name,
      phone,
      email,
      address,
      payment_terms,
      purchase_orders ( total_amount, paid_amount, status )
    `)
    .order('name');

  if (error) {
    throw new Error(`Failed to load suppliers: ${error.message}`);
  }

  return (data || []).map((s: any) => {
    const unpaid = (s.purchase_orders || []).reduce((acc: number, po: any) => {
      if (po.status !== 'Cancelled') {
        return acc + Math.max(0, Number(po.total_amount || 0) - Number(po.paid_amount || 0));
      }
      return acc;
    }, 0);

    return {
      id: s.id,
      name: s.name,
      phone: s.phone || '',
      email: s.email || '',
      address: s.address || '',
      outstandingPayable: unpaid
    };
  });
}

export async function createLiveSupplier(
  client: SupabaseClient,
  supplier: Supplier
): Promise<Supplier> {
  const { data, error } = await client
    .from('suppliers')
    .insert({
      name: supplier.name,
      phone: supplier.phone,
      email: supplier.email || null,
      address: supplier.address || null
    })
    .select('id, name, phone, email, address')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create supplier: ${error?.message || 'Database error'}`);
  }

  return {
    id: data.id,
    name: data.name,
    phone: data.phone,
    email: data.email || '',
    address: data.address || '',
    outstandingPayable: 0
  };
}

export async function fetchLiveSalesInvoices(client: SupabaseClient): Promise<SaleInvoice[]> {
  const { data, error } = await client
    .from('sales_invoices')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load sales invoices: ${error.message}`);
  }

  const custMap = new Map<string, { name: string; type: string }>();
  try {
    const { data: custs } = await client.from('customers').select('id, name, account_type');
    if (custs) {
      custs.forEach((c: any) => custMap.set(c.id, { name: c.name, type: c.account_type || 'Regular' }));
    }
  } catch {
    // ignore
  }

  return (data || []).map((inv: any) => {
    const cust = custMap.get(inv.customer_id);
    return {
      id: inv.id,
      invoiceNo: inv.invoice_no,
      customerId: inv.customer_id,
      customerName: cust?.name || 'Walk-in Customer',
      customerType: cust?.type || 'Regular',
      date: inv.invoice_date || inv.created_at || new Date().toISOString(),
      totalAmount: Number(inv.total_amount ?? inv.total ?? 0),
      paidAmount: Number(inv.paid_amount ?? (inv.status === 'Paid' ? (inv.total_amount ?? inv.total) : 0)),
      status: (inv.status || 'Pending') as SaleInvoice['status'],
      itemsCount: 1,
      syncStatus: 'synced'
    };
  });
}

export async function recordLiveSaleInvoice(
  client: SupabaseClient,
  invoice: SaleInvoice,
  lineItems?: Array<{ productId: string; quantity: number; unitPrice: number }>
): Promise<SaleInvoice> {
  const warehouseId = await getDefaultWarehouseId(client);

  let invoiceNo = invoice.invoiceNo;
  try {
    const { data: seqNo } = await client.rpc('generate_invoice_no');
    if (seqNo) invoiceNo = seqNo;
  } catch {
    // fallback if rpc not present
  }

  const invoicePayload: any = {
    invoice_no: invoiceNo,
    customer_id: invoice.customerId,
    invoice_date: new Date().toISOString(),
    subtotal: invoice.totalAmount,
    total: invoice.totalAmount,
    total_amount: invoice.totalAmount,
    status: invoice.status
  };
  if (warehouseId) invoicePayload.warehouse_id = warehouseId;
  if (invoice.paidAmount) invoicePayload.paid_amount = invoice.paidAmount;

  let newInv: any = null;
  const { data: res1, error: invErr1 } = await client
    .from('sales_invoices')
    .insert(invoicePayload)
    .select('*')
    .single();

  if (!invErr1 && res1) {
    newInv = res1;
  } else {
    const minimalPayload = {
      invoice_no: invoiceNo,
      customer_id: invoice.customerId,
      invoice_date: new Date().toISOString(),
      total: invoice.totalAmount,
      status: invoice.status
    };
    const { data: res2, error: invErr2 } = await client
      .from('sales_invoices')
      .insert(minimalPayload)
      .select('*')
      .single();

    if (invErr2 || !res2) {
      throw new Error(`Failed to save invoice: ${invErr2?.message || invErr1?.message}`);
    }
    newInv = res2;
  }

  if (lineItems && lineItems.length > 0) {
    const itemsToInsert = lineItems.map(item => ({
      invoice_id: newInv.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice
    }));

    try {
      await client.from('sales_invoice_items').insert(itemsToInsert);
    } catch (itemsErr: any) {
      console.warn('Items insert notice:', itemsErr.message);
    }

    for (const item of lineItems) {
      try {
        await client.from('inventory_movements').insert({
          warehouse_id: warehouseId,
          product_id: item.productId,
          movement_type: 'SALE_DELIVERY',
          quantity: item.quantity,
          quantity_change: -item.quantity,
          reference_no: newInv.invoice_no,
          reason: `Sales Invoice ${newInv.invoice_no}`
        });
      } catch (movErr: any) {
        console.warn('Inventory movement deduction notice:', movErr.message);
      }
    }
  }

  if (invoice.paidAmount > 0) {
    try {
      const payMethodId = await getPaymentMethodId(client, 'CASH');
      await client.from('payments').insert({
        payment_no: `PAY-${invoiceNo}`,
        party_type: 'CUSTOMER',
        customer_id: invoice.customerId,
        sales_invoice_id: newInv.id,
        payment_method_id: payMethodId,
        amount: invoice.paidAmount,
        notes: `Upfront settlement for ${invoiceNo}`
      });
    } catch {
      // payments table may not exist
    }
  }

  return {
    ...invoice,
    id: newInv.id,
    invoiceNo: newInv.invoice_no || invoiceNo,
    date: newInv.invoice_date || new Date().toISOString(),
    paidAmount: Number(newInv.paid_amount ?? newInv.total ?? invoice.paidAmount),
    status: newInv.status as SaleInvoice['status'],
    syncStatus: 'synced'
  };
}

export async function fetchLivePurchases(client: SupabaseClient): Promise<PurchaseOrder[]> {
  const { data, error } = await client
    .from('purchase_orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load purchases: ${error.message}`);
  }

  const supplierMap = new Map<string, string>();
  try {
    const { data: supps } = await client.from('suppliers').select('id, name');
    if (supps) supps.forEach((s: any) => supplierMap.set(s.id, s.name));
  } catch {
    // ignore
  }

  return (data || []).map((po: any) => ({
    id: po.id,
    poNumber: po.po_no || po.po_number || `PO-${po.id.slice(0, 6)}`,
    supplierId: po.supplier_id,
    supplierName: supplierMap.get(po.supplier_id) || 'Vendor',
    date: po.order_date || po.created_at || new Date().toISOString(),
    totalAmount: Number(po.total || po.total_amount || 0),
    status: (po.status || 'Received') as PurchaseOrder['status'],
    syncStatus: 'synced'
  }));
}

export async function recordLivePurchaseOrder(
  client: SupabaseClient,
  po: PurchaseOrder
): Promise<PurchaseOrder> {
  const warehouseId = await getDefaultWarehouseId(client);

  let poNumber = po.poNumber;
  try {
    const { data: seqNo } = await client.rpc('generate_po_no');
    if (seqNo) poNumber = seqNo;
  } catch {
    // fallback if rpc not present
  }

  const payload: any = {
    po_no: poNumber,
    po_number: poNumber,
    supplier_id: po.supplierId,
    order_date: new Date().toISOString(),
    total: po.totalAmount,
    total_amount: po.totalAmount,
    status: po.status
  };
  if (warehouseId) payload.warehouse_id = warehouseId;

  let newPo: any = null;
  const { data: res1, error: err1 } = await client
    .from('purchase_orders')
    .insert(payload)
    .select('*')
    .single();

  if (!err1 && res1) {
    newPo = res1;
  } else {
    const minPayload = {
      supplier_id: po.supplierId,
      order_date: new Date().toISOString(),
      total: po.totalAmount,
      status: po.status
    };
    const { data: res2, error: err2 } = await client
      .from('purchase_orders')
      .insert(minPayload)
      .select('*')
      .single();

    if (err2 || !res2) {
      throw new Error(`Failed to save purchase order: ${err2?.message || err1?.message}`);
    }
    newPo = res2;
  }

  return {
    ...po,
    id: newPo.id,
    poNumber: newPo.po_no || newPo.po_number || poNumber,
    date: newPo.order_date || new Date().toISOString(),
    syncStatus: 'synced'
  };
}

export async function recordLiveSupplierPayment(
  client: SupabaseClient,
  supplierId: string,
  amount: number
): Promise<void> {
  const payMethodId = await getPaymentMethodId(client, 'BANK_TRANSFER');
  const paymentNo = `PAY-SUP-${Date.now().toString().slice(-6)}`;

  const { error } = await client.from('payments').insert({
    payment_no: paymentNo,
    party_type: 'SUPPLIER',
    supplier_id: supplierId,
    payment_method_id: payMethodId,
    amount,
    notes: `Supplier account settlement`
  });

  if (error) {
    throw new Error(`Failed to record supplier payment: ${error.message}`);
  }
}

export async function fetchLiveExpenses(client: SupabaseClient): Promise<ExpenseItem[]> {
  const { data, error } = await client
    .from('expenses')
    .select(`
      id,
      expense_no,
      category,
      description,
      amount,
      expense_date,
      payment_methods ( name )
    `)
    .order('expense_date', { ascending: false });

  if (error) {
    throw new Error(`Failed to load expenses: ${error.message}`);
  }

  return (data || []).map((exp: any) => ({
    id: exp.id,
    category: exp.category,
    description: exp.description,
    amount: Number(exp.amount || 0),
    date: exp.expense_date,
    paidVia: (exp.payment_methods?.name?.includes('Bank') ? 'Bank' : 'Cash') as ExpenseItem['paidVia']
  }));
}

export async function createLiveExpense(
  client: SupabaseClient,
  expense: Omit<ExpenseItem, 'id'>
): Promise<ExpenseItem> {
  const warehouseId = await getDefaultWarehouseId(client);
  const payMethodId = await getPaymentMethodId(client, expense.paidVia === 'Bank' ? 'BANK_TRANSFER' : 'CASH');

  const payload: any = {
    expense_no: `EXP-${Date.now().toString().slice(-6)}`,
    category: expense.category,
    description: expense.description,
    amount: expense.amount,
    expense_date: expense.date || new Date().toISOString()
  };
  if (warehouseId) payload.warehouse_id = warehouseId;
  if (payMethodId) payload.payment_method_id = payMethodId;

  const { data, error } = await client
    .from('expenses')
    .insert(payload)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create expense: ${error?.message || 'Database error'}`);
  }

  return {
    id: data.id,
    category: data.category,
    description: data.description,
    amount: Number(data.amount || 0),
    date: data.expense_date || expense.date,
    paidVia: expense.paidVia
  };
}

export function computeFinancialOverview(
  products: Product[],
  customers: Customer[],
  suppliers: Supplier[],
  sales: SaleInvoice[],
  purchases: PurchaseOrder[],
  expenses: ExpenseItem[]
): FinancialOverview {
  const customerReceivables = customers.reduce((sum, c) => sum + (c.outstandingBalance || 0), 0);
  const supplierPayables = suppliers.reduce((sum, s) => sum + (s.outstandingPayable || 0), 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthPrefix = todayStr.slice(0, 7);

  const isToday = (dateStr?: string) => {
    if (!dateStr) return false;
    if (dateStr.includes('Today') || dateStr.includes('Just now')) return true;
    if (dateStr.startsWith(todayStr)) return true;
    try {
      return new Date(dateStr).toISOString().split('T')[0] === todayStr;
    } catch {
      return false;
    }
  };

  const isCurrentMonth = (dateStr?: string) => {
    if (!dateStr) return false;
    if (dateStr.includes('Today') || dateStr.includes('Just now') || dateStr.includes('Current')) return true;
    if (dateStr.startsWith(currentMonthPrefix)) return true;
    try {
      return new Date(dateStr).toISOString().startsWith(currentMonthPrefix);
    } catch {
      return false;
    }
  };

  const todaySales = sales
    .filter(s => isToday(s.date))
    .reduce((sum, s) => sum + s.totalAmount, 0);

  const todayPurchases = purchases
    .filter(p => isToday(p.date))
    .reduce((sum, p) => sum + p.totalAmount, 0);

  const lowStockCount = products.filter(p => p.status === 'low_stock' || p.status === 'out_of_stock').length;

  const monthlySales = sales
    .filter(s => isCurrentMonth(s.date))
    .reduce((sum, s) => sum + s.totalAmount, 0);

  const monthlyExpenses = expenses
    .filter(e => isCurrentMonth(e.date))
    .reduce((sum, e) => sum + e.amount, 0);

  const monthlyPurchases = purchases
    .filter(p => isCurrentMonth(p.date))
    .reduce((sum, p) => sum + p.totalAmount, 0);

  const totalPaidSales = sales.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalPurchasesCost = purchases.reduce((sum, p) => sum + p.totalAmount, 0);

  return {
    cashInHand: 0,
    bankBalance: Math.max(0, totalPaidSales - totalExpenses - totalPurchasesCost),
    customerReceivables,
    supplierPayables,
    todaySales,
    todayPurchases,
    lowStockCount,
    monthlyNetProfit: monthlySales - monthlyExpenses - monthlyPurchases,
    monthlyExpenses
  };
}

export async function migrateLocalStateToSupabase(
  client: SupabaseClient,
  localState: ERPStoreState
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    productsMigrated: 0,
    customersMigrated: 0,
    suppliersMigrated: 0,
    salesMigrated: 0,
    purchasesMigrated: 0,
    errors: []
  };

  try {
    const warehouseId = await getDefaultWarehouseId(client);

    for (const p of localState.products) {
      try {
        const catId = await getCategoryId(client, p.category);
        const uomId = await getUomId(client, p.unit);

        const { data: newProd, error: pErr } = await client
          .from('products')
          .insert({
            sku: p.sku,
            name: p.name,
            category_id: catId,
            uom_id: uomId,
            cost_price: p.costPrice,
            selling_price: p.sellingPrice,
            min_stock_alert: p.minStockAlert,
            is_active: true
          })
          .select('id')
          .single();

        if (!pErr && newProd && p.currentStock > 0) {
          await client.from('inventory_movements').insert({
            warehouse_id: warehouseId,
            product_id: newProd.id,
            movement_type: 'PURCHASE_RECEIPT',
            quantity_change: p.currentStock,
            balance_after: p.currentStock,
            reference_no: `MIG-${p.sku}`,
            reason: 'Migrated from Local Store'
          });
          result.productsMigrated++;
        }
      } catch (err: any) {
        result.errors.push(`Product ${p.sku}: ${err.message}`);
      }
    }

    for (const c of localState.customers) {
      try {
        const { error } = await client.from('customers').insert({
          name: c.name,
          account_type: c.accountType,
          phone: c.phone,
          email: c.email || null,
          address: c.address || null,
          credit_days: c.creditDays
        });
        if (!error) result.customersMigrated++;
      } catch (err: any) {
        result.errors.push(`Customer ${c.name}: ${err.message}`);
      }
    }

    for (const s of localState.suppliers) {
      try {
        const { error } = await client.from('suppliers').insert({
          name: s.name,
          phone: s.phone,
          email: s.email || null,
          address: s.address || null
        });
        if (!error) result.suppliersMigrated++;
      } catch (err: any) {
        result.errors.push(`Supplier ${s.name}: ${err.message}`);
      }
    }

    result.success = result.errors.length === 0;
    return result;
  } catch (globalErr: any) {
    result.errors.push(`Migration aborted: ${globalErr.message}`);
    return result;
  }
}

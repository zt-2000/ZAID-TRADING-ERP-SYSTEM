import React, { useState, useEffect, useCallback } from 'react';
import { ScreenId, Product, Customer, Supplier, SaleInvoice, PurchaseOrder, CompanySettings } from './types/erp';
import { loadERPState, saveERPState, ERPStoreState } from './lib/erpStore';
import { getSupabaseClient, checkSupabaseConnection } from './lib/supabase';
import {
  fetchLiveProducts,
  createLiveProduct,
  adjustLiveStock,
  fetchLiveCustomers,
  createLiveCustomer,
  fetchLiveSuppliers,
  createLiveSupplier,
  fetchLiveSalesInvoices,
  recordLiveSaleInvoice,
  fetchLivePurchases,
  recordLivePurchaseOrder,
  recordLiveSupplierPayment,
  fetchLiveExpenses,
  computeFinancialOverview
} from './lib/supabaseService';
import { Sidebar } from './components/Sidebar';
import { Header, HeaderCloudStatus } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { ProductsView } from './components/ProductsView';
import { InventoryView } from './components/InventoryView';
import { SalesView } from './components/SalesView';
import { PurchasesView } from './components/PurchasesView';
import { CustomersView } from './components/CustomersView';
import { SuppliersView } from './components/SuppliersView';
import { AccountingView } from './components/AccountingView';
import { SettingsView } from './components/SettingsView';
import { LoginView } from './components/LoginView';
import { GenericStitchScreenView } from './components/GenericStitchScreenView';
import { ScreenCatalogModal } from './components/ScreenCatalogModal';

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('01_dashboard');
  const [erpState, setErpState] = useState<ERPStoreState>(loadERPState);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);

  // Status notification banner
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Connection & Cloud Status
  const [cloudStatus, setCloudStatus] = useState<HeaderCloudStatus>({
    mode: 'local_fallback',
    userEmail: null,
    message: 'Local Offline Storage'
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(prev => (prev?.message === message ? null : prev));
    }, 5000);
  }, []);

  // Fetch live cloud data from Supabase
  const loadCloudData = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) {
      setCloudStatus({
        mode: 'local_fallback',
        userEmail: null,
        message: 'Supabase client not initialized'
      });
      return;
    }

    setIsLoadingCloud(true);
    try {
      // Check auth session
      const { data: sessionData } = await client.auth.getSession();
      const session = sessionData?.session;

      if (!session) {
        setCloudStatus({
          mode: 'cloud_guest',
          userEmail: null,
          message: 'Supabase reachable. Sign in to enable live RLS sync.'
        });
        setSupabaseConnected(true);
        setIsLoadingCloud(false);
        return;
      }

      setCloudStatus({
        mode: 'cloud_authenticated',
        userEmail: session.user.email,
        message: `Live cloud sync active (${session.user.email})`
      });
      setSupabaseConnected(true);

      // Parallel fetch live database records
      const [prods, custs, supps, sales, purchases, expenses] = await Promise.all([
        fetchLiveProducts(client).catch(err => {
          console.warn('Live products fetch notice:', err.message);
          return null;
        }),
        fetchLiveCustomers(client).catch(err => {
          console.warn('Live customers fetch notice:', err.message);
          return null;
        }),
        fetchLiveSuppliers(client).catch(err => {
          console.warn('Live suppliers fetch notice:', err.message);
          return null;
        }),
        fetchLiveSalesInvoices(client).catch(err => {
          console.warn('Live sales fetch notice:', err.message);
          return null;
        }),
        fetchLivePurchases(client).catch(err => {
          console.warn('Live purchases fetch notice:', err.message);
          return null;
        }),
        fetchLiveExpenses(client).catch(err => {
          console.warn('Live expenses fetch notice:', err.message);
          return null;
        })
      ]);

      // If database returned records, update state
      if (prods && custs && supps && sales && purchases && expenses) {
        const nextProducts = prods.length > 0 ? prods : erpState.products;
        const nextCustomers = custs.length > 0 ? custs : erpState.customers;
        const nextSuppliers = supps.length > 0 ? supps : erpState.suppliers;
        const nextSales = sales.length > 0 ? sales : erpState.recentSales;
        const nextPurchases = purchases.length > 0 ? purchases : erpState.purchases;
        const nextExpenses = expenses.length > 0 ? expenses : erpState.expenses;

        const nextFinancials = computeFinancialOverview(
          nextProducts,
          nextCustomers,
          nextSuppliers,
          nextSales,
          nextPurchases,
          nextExpenses
        );

        const cloudState: ERPStoreState = {
          companySettings: erpState.companySettings,
          products: nextProducts,
          customers: nextCustomers,
          suppliers: nextSuppliers,
          recentSales: nextSales,
          purchases: nextPurchases,
          expenses: nextExpenses,
          financials: nextFinancials
        };

        setErpState(cloudState);
        saveERPState(cloudState);
        showToast('Connected to Supabase. Loaded live cloud ERP records.', 'success');
      }
    } catch (err: any) {
      console.warn('Cloud sync fallback to local store:', err.message);
      showToast(`Cloud connection notice: ${err.message}. Operating in local fallback mode.`, 'info');
    } finally {
      setIsLoadingCloud(false);
    }
  }, [erpState, showToast]);

  useEffect(() => {
    checkSupabaseConnection().then(res => {
      setSupabaseConnected(res.connected);
    });
    loadCloudData();

    // Subscribe to real-time auth changes (sign-in, token refresh, sign-out)
    const client = getSupabaseClient();
    if (client) {
      const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          if (session?.user?.email) {
            setCloudStatus({
              mode: 'cloud_authenticated',
              userEmail: session.user.email,
              message: `Live cloud sync active (${session.user.email})`
            });
            loadCloudData();
          }
        } else if (event === 'SIGNED_OUT') {
          setCloudStatus({
            mode: 'cloud_guest',
            userEmail: null,
            message: 'Signed out. Operating in local fallback mode.'
          });
          const local = loadERPState();
          setErpState(local);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [loadCloudData]);

  // Compute pending sync count across local records
  const pendingSyncCount =
    erpState.products.filter(p => p.syncStatus === 'pending_sync').length +
    erpState.recentSales.filter(s => s.syncStatus === 'pending_sync').length +
    erpState.purchases.filter(po => po.syncStatus === 'pending_sync').length +
    erpState.customers.filter(c => c.syncStatus === 'pending_sync').length +
    erpState.suppliers.filter(s => s.syncStatus === 'pending_sync').length;

  const handleNavigate = (screen: ScreenId) => {
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSync = async () => {
    if (cloudStatus.mode === 'cloud_authenticated') {
      const client = getSupabaseClient();
      if (client && pendingSyncCount > 0) {
        showToast(`Syncing ${pendingSyncCount} pending local record(s) to Supabase cloud...`, 'info');
        // Synchronize pending products
        for (const p of erpState.products.filter(item => item.syncStatus === 'pending_sync')) {
          try {
            await createLiveProduct(client, p);
          } catch (e: any) {
            console.warn('Sync notice:', e.message);
          }
        }
      }
      loadCloudData();
    } else {
      const updated = loadERPState();
      setErpState(updated);
      showToast('Refreshed ERP records from local storage.', 'info');
    }
  };

  const handleAddProduct = async (newProdData: Omit<Product, 'id'>) => {
    const client = getSupabaseClient();
    if (cloudStatus.mode === 'cloud_authenticated' && client) {
      try {
        const created = await createLiveProduct(client, newProdData);
        const nextProducts = [created, ...erpState.products];
        const nextState = { ...erpState, products: nextProducts };
        setErpState(nextState);
        saveERPState(nextState);
        showToast(`Product "${created.name}" saved to Supabase cloud database.`, 'success');
        return;
      } catch (err: any) {
        showToast(`Supabase Error: ${err.message}`, 'error');
        console.error('Failed to save product to Supabase:', err);
        return;
      }
    }

    // Local fallback with pending sync flag
    const newProduct: Product = {
      ...newProdData,
      id: `prod-${Date.now()}`,
      syncStatus: 'pending_sync'
    };
    const nextProducts = [newProduct, ...erpState.products];
    const nextState: ERPStoreState = { ...erpState, products: nextProducts };
    setErpState(nextState);
    saveERPState(nextState);
    showToast(`Product "${newProduct.name}" saved locally (sign in to sync with cloud).`, 'info');
  };

  const handleUpdateProductStock = async (productId: string, newStock: number) => {
    const client = getSupabaseClient();
    const targetProduct = erpState.products.find(p => p.id === productId);
    const diff = targetProduct ? newStock - targetProduct.currentStock : 0;

    if (cloudStatus.mode === 'cloud_authenticated' && client && diff !== 0) {
      try {
        const updatedBalance = await adjustLiveStock(
          client,
          productId,
          diff,
          'Stock Count Correction'
        );
        const nextProducts = erpState.products.map(p =>
          p.id === productId
            ? {
                ...p,
                currentStock: updatedBalance,
                status: (updatedBalance <= p.minStockAlert
                  ? updatedBalance === 0
                    ? 'out_of_stock'
                    : 'low_stock'
                  : 'active') as Product['status']
              }
            : p
        );
        const nextState = { ...erpState, products: nextProducts };
        setErpState(nextState);
        saveERPState(nextState);
        showToast(`Stock updated in Supabase. New balance: ${updatedBalance}`, 'success');
        return;
      } catch (err: any) {
        showToast(`Supabase Stock Error: ${err.message}`, 'error');
        console.error('Failed to update stock in Supabase:', err);
        return;
      }
    }

    // Local fallback
    const nextProducts = erpState.products.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          currentStock: newStock,
          status: (newStock <= p.minStockAlert
            ? newStock === 0
              ? 'out_of_stock'
              : 'low_stock'
            : 'active') as Product['status']
        };
      }
      return p;
    });

    const nextState: ERPStoreState = { ...erpState, products: nextProducts };
    setErpState(nextState);
    saveERPState(nextState);
    showToast(`Stock updated in local store.`, 'info');
  };

  const handleRecordSale = async (newInvoice: SaleInvoice) => {
    const client = getSupabaseClient();
    if (cloudStatus.mode === 'cloud_authenticated' && client) {
      try {
        const saved = await recordLiveSaleInvoice(client, newInvoice);
        const nextSales = [saved, ...erpState.recentSales];
        const nextFinancials = computeFinancialOverview(
          erpState.products,
          erpState.customers,
          erpState.suppliers,
          nextSales,
          erpState.purchases,
          erpState.expenses
        );
        const nextState = { ...erpState, recentSales: nextSales, financials: nextFinancials };
        setErpState(nextState);
        saveERPState(nextState);
        showToast(`Sales invoice ${saved.invoiceNo} saved to Supabase cloud.`, 'success');
        return;
      } catch (err: any) {
        showToast(`Supabase Sales Error: ${err.message}`, 'error');
        console.error('Failed to save sale to Supabase:', err);
        return;
      }
    }

    // Local fallback
    const nextSales = [newInvoice, ...erpState.recentSales];
    const nextTodaySales = erpState.financials.todaySales + newInvoice.totalAmount;
    const nextBankBalance = erpState.financials.bankBalance + newInvoice.totalAmount;

    const nextState: ERPStoreState = {
      ...erpState,
      recentSales: nextSales,
      financials: {
        ...erpState.financials,
        todaySales: nextTodaySales,
        bankBalance: nextBankBalance
      }
    };
    setErpState(nextState);
    saveERPState(nextState);
    showToast(`Sales invoice ${newInvoice.invoiceNo} saved to local store.`, 'info');
  };

  const handleRecordPurchase = async (newPO: PurchaseOrder) => {
    const client = getSupabaseClient();
    if (cloudStatus.mode === 'cloud_authenticated' && client) {
      try {
        const saved = await recordLivePurchaseOrder(client, newPO);
        const nextPurchases = [saved, ...erpState.purchases];
        const nextFinancials = computeFinancialOverview(
          erpState.products,
          erpState.customers,
          erpState.suppliers,
          erpState.recentSales,
          nextPurchases,
          erpState.expenses
        );
        const nextState = { ...erpState, purchases: nextPurchases, financials: nextFinancials };
        setErpState(nextState);
        saveERPState(nextState);
        showToast(`Purchase order ${saved.poNumber} saved to Supabase cloud.`, 'success');
        return;
      } catch (err: any) {
        showToast(`Supabase Purchase Error: ${err.message}`, 'error');
        console.error('Failed to save purchase to Supabase:', err);
        return;
      }
    }

    // Local fallback
    const nextPurchases = [newPO, ...erpState.purchases];
    const nextTodayPurchases = erpState.financials.todayPurchases + newPO.totalAmount;
    const nextBankBalance = Math.max(0, erpState.financials.bankBalance - newPO.totalAmount);

    const nextState: ERPStoreState = {
      ...erpState,
      purchases: nextPurchases,
      financials: {
        ...erpState.financials,
        todayPurchases: nextTodayPurchases,
        bankBalance: nextBankBalance
      }
    };
    setErpState(nextState);
    saveERPState(nextState);
    showToast(`Purchase order ${newPO.poNumber} saved to local store.`, 'info');
  };

  const handleAddCustomer = async (newCustomer: Customer) => {
    const client = getSupabaseClient();
    if (cloudStatus.mode === 'cloud_authenticated' && client) {
      try {
        const saved = await createLiveCustomer(client, newCustomer);
        const nextCustomers = [saved, ...erpState.customers];
        const nextState = { ...erpState, customers: nextCustomers };
        setErpState(nextState);
        saveERPState(nextState);
        showToast(`Customer "${saved.name}" saved to Supabase cloud database.`, 'success');
        return;
      } catch (err: any) {
        showToast(`Supabase Customer Error: ${err.message}`, 'error');
        console.error('Failed to save customer to Supabase:', err);
        return;
      }
    }

    const nextState: ERPStoreState = {
      ...erpState,
      customers: [newCustomer, ...erpState.customers]
    };
    setErpState(nextState);
    saveERPState(nextState);
    showToast(`Customer "${newCustomer.name}" saved locally.`, 'info');
  };

  const handleAddSupplier = async (newSupplier: Supplier) => {
    const client = getSupabaseClient();
    if (cloudStatus.mode === 'cloud_authenticated' && client) {
      try {
        const saved = await createLiveSupplier(client, newSupplier);
        const nextSuppliers = [saved, ...erpState.suppliers];
        const nextState = { ...erpState, suppliers: nextSuppliers };
        setErpState(nextState);
        saveERPState(nextState);
        showToast(`Supplier "${saved.name}" saved to Supabase cloud database.`, 'success');
        return;
      } catch (err: any) {
        showToast(`Supabase Supplier Error: ${err.message}`, 'error');
        console.error('Failed to save supplier to Supabase:', err);
        return;
      }
    }

    const nextState: ERPStoreState = {
      ...erpState,
      suppliers: [newSupplier, ...erpState.suppliers]
    };
    setErpState(nextState);
    saveERPState(nextState);
    showToast(`Supplier "${newSupplier.name}" saved locally.`, 'info');
  };

  const handlePaySupplier = async (supplierId: string, amount: number) => {
    const client = getSupabaseClient();
    if (cloudStatus.mode === 'cloud_authenticated' && client) {
      try {
        await recordLiveSupplierPayment(client, supplierId, amount);
        showToast(`Supplier payment of Rs. ${amount.toLocaleString()} recorded in Supabase.`, 'success');
      } catch (err: any) {
        showToast(`Supabase Payment Error: ${err.message}`, 'error');
        console.error('Failed to record supplier payment in Supabase:', err);
        return;
      }
    }

    const nextSuppliers = erpState.suppliers.map(s => {
      if (s.id === supplierId) {
        return {
          ...s,
          outstandingPayable: Math.max(0, s.outstandingPayable - amount)
        };
      }
      return s;
    });

    const nextPayables = Math.max(0, erpState.financials.supplierPayables - amount);
    const nextBank = Math.max(0, erpState.financials.bankBalance - amount);

    const nextState: ERPStoreState = {
      ...erpState,
      suppliers: nextSuppliers,
      financials: {
        ...erpState.financials,
        supplierPayables: nextPayables,
        bankBalance: nextBank
      }
    };
    setErpState(nextState);
    saveERPState(nextState);
  };

  const handleSaveCompanySettings = async (newSettings: CompanySettings) => {
    const nextState: ERPStoreState = {
      ...erpState,
      companySettings: newSettings
    };
    setErpState(nextState);
    saveERPState(nextState);

    const client = getSupabaseClient();
    if (cloudStatus.mode === 'cloud_authenticated' && client) {
      try {
        await client.from('company_settings').upsert({
          id: '00000000-0000-0000-0000-000000000001',
          company_name: newSettings.name,
          trade_name: newSettings.tradeName,
          tax_id: newSettings.taxId,
          address: newSettings.address,
          phone: newSettings.phone,
          email: newSettings.email
        });
        showToast(`Company Profile updated & saved to Supabase.`, 'success');
      } catch (e: any) {
        console.warn('Company settings cloud save notice:', e.message);
        showToast(`Company Profile saved locally.`, 'info');
      }
    } else {
      showToast(`Company Profile saved. Updated across the entire app.`, 'success');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased">
      {/* Toast Notification Banner */}
      {notification && (
        <div
          className={`fixed bottom-5 right-5 z-50 max-w-md px-4 py-3 rounded-xl shadow-lg border text-sm flex items-center gap-3 transition-all animate-bounce ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : notification.type === 'error'
              ? 'bg-red-50 text-red-900 border-red-300'
              : 'bg-blue-50 text-blue-900 border-blue-300'
          }`}
        >
          <span className="material-symbols-outlined text-[20px] shrink-0">
            {notification.type === 'success' ? 'check_circle' : notification.type === 'error' ? 'error' : 'info'}
          </span>
          <span className="font-medium text-xs leading-relaxed flex-1">{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Sidebar Navigation matching Stitch & 0326a925dd0e9a63f270e4fb23547a87_a43867bd.jpg */}
      <Sidebar
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        companyName={erpState.companySettings?.name}
        onOpenScreenModal={() => setIsModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="pl-[250px]">
        {/* Top Header with accurate connection badge & dynamic company name */}
        <Header
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          supabaseConnected={supabaseConnected}
          companyName={erpState.companySettings?.name}
          cloudStatus={cloudStatus}
          pendingSyncCount={pendingSyncCount}
          onOpenScreenModal={() => setIsModalOpen(true)}
        />

        {/* Content Container */}
        <main className="w-full pt-16 min-h-screen">
          {isLoadingCloud && (
            <div className="w-full bg-blue-50 text-blue-700 text-xs py-1.5 px-6 flex items-center justify-center gap-2 border-b border-blue-100">
              <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
              <span>Synchronizing ERP records with Supabase cloud database...</span>
            </div>
          )}

          {/* Screen 01: Dashboard */}
          {currentScreen === '01_dashboard' && (
            <DashboardView
              state={erpState}
              onNavigate={handleNavigate}
              onSync={handleSync}
            />
          )}

          {/* Screens 02 & 03: Products Management */}
          {(currentScreen === '02_products_management' || currentScreen === '03_add_product') && (
            <ProductsView
              state={erpState}
              onNavigate={handleNavigate}
              onAddProduct={handleAddProduct}
              initialShowAddModal={currentScreen === '03_add_product'}
            />
          )}

          {/* Screens 04, 05, 34: Inventory Management & Stock Adjustment & Movement History */}
          {(currentScreen === '04_inventory_management' ||
            currentScreen === '05_stock_adjustment' ||
            currentScreen === '34_stock_movement_history') && (
            <InventoryView
              state={erpState}
              onNavigate={handleNavigate}
              onUpdateProductStock={handleUpdateProductStock}
              initialMode={
                currentScreen === '05_stock_adjustment'
                  ? 'adjustment'
                  : currentScreen === '34_stock_movement_history'
                  ? 'history'
                  : 'list'
              }
            />
          )}

          {/* Screens 06, 07, 08, 09, 10: Sales Management */}
          {(currentScreen === '06_sales_management' ||
            currentScreen === '07_create_sales_invoice' ||
            currentScreen === '08_invoice_details_print' ||
            currentScreen === '09_record_customer_payment' ||
            currentScreen === '10_sales_return') && (
            <SalesView
              state={erpState}
              onNavigate={handleNavigate}
              onRecordSale={handleRecordSale}
              initialMode={
                currentScreen === '07_create_sales_invoice'
                  ? 'create'
                  : currentScreen === '08_invoice_details_print'
                  ? 'print'
                  : 'list'
              }
            />
          )}

          {/* Screens 11, 12, 13, 14, 16: Purchases Management */}
          {(currentScreen === '11_purchases_management' ||
            currentScreen === '12_create_purchase' ||
            currentScreen === '13_purchase_details_print' ||
            currentScreen === '14_receive_stock' ||
            currentScreen === '16_purchase_return') && (
            <PurchasesView
              state={erpState}
              onNavigate={handleNavigate}
              onRecordPurchase={handleRecordPurchase}
            />
          )}

          {/* Screens 17, 18, 19: Customers Management */}
          {(currentScreen === '17_customers_management' ||
            currentScreen === '18_add_edit_customer' ||
            currentScreen === '19_customer_details_statement') && (
            <CustomersView
              state={erpState}
              onNavigate={handleNavigate}
              onAddCustomer={handleAddCustomer}
            />
          )}

          {/* Screens 20, 21, 22, 15: Suppliers Management & Payments */}
          {(currentScreen === '20_suppliers_management' ||
            currentScreen === '21_add_edit_supplier' ||
            currentScreen === '22_supplier_details_statement' ||
            currentScreen === '15_record_supplier_payment') && (
            <SuppliersView
              state={erpState}
              onNavigate={handleNavigate}
              onAddSupplier={handleAddSupplier}
              onPaySupplier={handlePaySupplier}
            />
          )}

          {/* Screens 25, 26, 27, 28, 29, 30, 31, 32: Accounting */}
          {(currentScreen === '25_accounting_overview' ||
            currentScreen === '26_cash_bank_book' ||
            currentScreen === '27_chart_of_accounts' ||
            currentScreen === '28_journal_entries' ||
            currentScreen === '29_general_ledger' ||
            currentScreen === '30_profit_loss_report' ||
            currentScreen === '31_trial_balance' ||
            currentScreen === '32_balance_sheet') && (
            <AccountingView
              state={erpState}
              onNavigate={handleNavigate}
            />
          )}

          {/* Screens 36, 37: Settings */}
          {(currentScreen === '36_company_settings' || currentScreen === '37_users_roles') && (
            <SettingsView
              state={erpState}
              onNavigate={handleNavigate}
              onSaveCompanySettings={handleSaveCompanySettings}
            />
          )}

          {/* Screen 38: Live Supabase Login & Authentication */}
          {currentScreen === '38_login' && (
            <LoginView
              onNavigate={handleNavigate}
              onAuthSuccess={loadCloudData}
            />
          )}

          {/* Any other screens in the 38-screen inventory */}
          {![
            '01_dashboard',
            '02_products_management',
            '03_add_product',
            '04_inventory_management',
            '05_stock_adjustment',
            '06_sales_management',
            '07_create_sales_invoice',
            '08_invoice_details_print',
            '09_record_customer_payment',
            '10_sales_return',
            '11_purchases_management',
            '12_create_purchase',
            '13_purchase_details_print',
            '14_receive_stock',
            '15_record_supplier_payment',
            '16_purchase_return',
            '17_customers_management',
            '18_add_edit_customer',
            '19_customer_details_statement',
            '20_suppliers_management',
            '21_add_edit_supplier',
            '22_supplier_details_statement',
            '25_accounting_overview',
            '26_cash_bank_book',
            '27_chart_of_accounts',
            '28_journal_entries',
            '29_general_ledger',
            '30_profit_loss_report',
            '31_trial_balance',
            '32_balance_sheet',
            '34_stock_movement_history',
            '36_company_settings',
            '37_users_roles',
            '38_login'
          ].includes(currentScreen) && (
            <GenericStitchScreenView
              screenId={currentScreen}
              onNavigate={handleNavigate}
            />
          )}
        </main>
      </div>

      {/* 38-Screen Catalog Modal */}
      <ScreenCatalogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentScreen={currentScreen}
        onSelectScreen={handleNavigate}
      />
    </div>
  );
};

export default App;

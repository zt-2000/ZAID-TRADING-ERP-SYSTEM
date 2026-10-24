import React, { useState, useEffect } from 'react';
import { ScreenId, Product, Customer, Supplier, SaleInvoice, PurchaseOrder } from './types/erp';
import { loadERPState, saveERPState, ERPStoreState } from './lib/erpStore';
import { checkSupabaseConnection } from './lib/supabase';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { ProductsView } from './components/ProductsView';
import { InventoryView } from './components/InventoryView';
import { SalesView } from './components/SalesView';
import { PurchasesView } from './components/PurchasesView';
import { CustomersView } from './components/CustomersView';
import { SuppliersView } from './components/SuppliersView';
import { AccountingView } from './components/AccountingView';
import { SettingsView } from './components/SettingsView';
import { GenericStitchScreenView } from './components/GenericStitchScreenView';
import { ScreenCatalogModal } from './components/ScreenCatalogModal';

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('01_dashboard');
  const [erpState, setErpState] = useState<ERPStoreState>(loadERPState);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supabaseConnected, setSupabaseConnected] = useState(false);

  useEffect(() => {
    checkSupabaseConnection().then(res => {
      setSupabaseConnected(res.connected);
    });
  }, []);

  const handleNavigate = (screen: ScreenId) => {
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSync = () => {
    const updated = loadERPState();
    setErpState(updated);
  };

  const handleAddProduct = (newProdData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...newProdData,
      id: `prod-${Date.now()}`
    };
    const nextProducts = [newProduct, ...erpState.products];
    const nextState: ERPStoreState = {
      ...erpState,
      products: nextProducts
    };
    setErpState(nextState);
    saveERPState(nextState);
  };

  const handleUpdateProductStock = (productId: string, newStock: number) => {
    const nextProducts = erpState.products.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          currentStock: newStock,
          status: (newStock <= p.minStockAlert ? (newStock === 0 ? 'out_of_stock' : 'low_stock') : 'active') as Product['status']
        };
      }
      return p;
    });

    const nextState: ERPStoreState = {
      ...erpState,
      products: nextProducts
    };
    setErpState(nextState);
    saveERPState(nextState);
  };

  const handleRecordSale = (newInvoice: SaleInvoice) => {
    const nextSales = [newInvoice, ...erpState.recentSales];
    const nextTodaySales = erpState.financials.todaySales + newInvoice.totalAmount;
    const nextBankBalance = erpState.financials.bankBalance + newInvoice.totalAmount;
    const nextCashInHand = erpState.financials.cashInHand;

    const nextState: ERPStoreState = {
      ...erpState,
      recentSales: nextSales,
      financials: {
        ...erpState.financials,
        todaySales: nextTodaySales,
        bankBalance: nextBankBalance,
        cashInHand: nextCashInHand
      }
    };
    setErpState(nextState);
    saveERPState(nextState);
  };

  const handleRecordPurchase = (newPO: PurchaseOrder) => {
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
  };

  const handleAddCustomer = (newCustomer: Customer) => {
    const nextState: ERPStoreState = {
      ...erpState,
      customers: [newCustomer, ...erpState.customers]
    };
    setErpState(nextState);
    saveERPState(nextState);
  };

  const handleAddSupplier = (newSupplier: Supplier) => {
    const nextState: ERPStoreState = {
      ...erpState,
      suppliers: [newSupplier, ...erpState.suppliers]
    };
    setErpState(nextState);
    saveERPState(nextState);
  };

  const handlePaySupplier = (supplierId: string, amount: number) => {
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased">
      {/* Sidebar Navigation matching Stitch */}
      <Sidebar
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        onOpenScreenModal={() => setIsModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="pl-[240px]">
        {/* Top Header */}
        <Header
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          supabaseConnected={supabaseConnected}
          onOpenScreenModal={() => setIsModalOpen(true)}
        />

        {/* Content Container */}
        <main className="w-full pt-16 min-h-screen">
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
            '37_users_roles'
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

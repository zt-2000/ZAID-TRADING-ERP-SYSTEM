import React, { useState } from 'react';
import { ERPStoreState } from '../lib/erpStore';
import { ScreenId } from '../types/erp';

interface InventoryMovement {
  id: string;
  date: string;
  referenceNo: string;
  type: 'Purchase' | 'Sale' | 'Adjustment' | 'Return';
  productName: string;
  sku: string;
  change: number;
  balanceAfter: number;
  reason: string;
}

interface InventoryViewProps {
  state: ERPStoreState;
  onNavigate: (screen: ScreenId) => void;
  onUpdateProductStock: (productId: string, newStock: number) => void;
  initialMode?: 'list' | 'adjustment' | 'history';
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  state,
  onNavigate,
  onUpdateProductStock,
  initialMode = 'list'
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'adjustment' | 'history'>(initialMode);
  const [selectedStockFilter, setSelectedStockFilter] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Stock Adjustment Form states
  const [adjustProductId, setAdjustProductId] = useState(state.products[0]?.id || '');
  const [adjustType, setAdjustType] = useState<'increase' | 'decrease'>('increase');
  const [adjustQty, setAdjustQty] = useState(5);
  const [adjustReason, setAdjustReason] = useState('Stock Count Correction');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [adjustmentSubmitted, setAdjustmentSubmitted] = useState(false);

  // Movements history ledger
  const [movements, setMovements] = useState<InventoryMovement[]>([]);

  const selectedProductForAdjustment = state.products.find(p => p.id === adjustProductId) || state.products[0];
  const calculatedNewStock = selectedProductForAdjustment
    ? adjustType === 'increase'
      ? selectedProductForAdjustment.currentStock + adjustQty
      : Math.max(0, selectedProductForAdjustment.currentStock - adjustQty)
    : 0;

  const handleApplyAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForAdjustment) {
      alert('Please select a valid product to adjust.');
      return;
    }

    onUpdateProductStock(selectedProductForAdjustment.id, calculatedNewStock);

    const newMov: InventoryMovement = {
      id: `mov-${Date.now()}`,
      date: 'Today, Just now',
      referenceNo: `#ADJ-2024-0${Math.floor(892 + Math.random() * 50)}`,
      type: 'Adjustment',
      productName: selectedProductForAdjustment.name,
      sku: selectedProductForAdjustment.sku,
      change: adjustType === 'increase' ? adjustQty : -adjustQty,
      balanceAfter: calculatedNewStock,
      reason: `${adjustReason}${adjustNotes ? ': ' + adjustNotes : ''}`
    };

    setMovements([newMov, ...movements]);
    setAdjustmentSubmitted(true);
    setTimeout(() => {
      setAdjustmentSubmitted(false);
      setViewMode('list');
    }, 1000);
  };

  const filteredProducts = state.products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedStockFilter === 'LOW') return p.currentStock <= p.minStockAlert && p.currentStock > 0;
    if (selectedStockFilter === 'OUT') return p.currentStock === 0;
    return true;
  });

  return (
    <div className="flex flex-col w-full p-6 space-y-6 max-w-[1600px] mx-auto select-text">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight">Inventory Management</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
              <span className="material-symbols-outlined text-[15px] text-[#64748B]">warehouse</span>
              Main Warehouse (MW-01)
            </span>
          </div>
          <p className="text-[14px] text-[#64748B]">Monitor and manage wholesale warehouse stock levels</p>
        </div>
        <div className="flex items-center gap-3">
          {viewMode !== 'list' && (
            <button
              onClick={() => setViewMode('list')}
              className="inline-flex items-center gap-2 h-[38px] px-4 rounded-[10px] bg-white border border-[#E2E8F0] text-[#0F172A] text-sm font-medium hover:bg-[#F8FAFC] shadow-sm cursor-pointer"
            >
              <span>Back to Inventory</span>
            </button>
          )}
          <button
            onClick={() => setViewMode('history')}
            className={`inline-flex items-center gap-2 h-[38px] px-4 rounded-[10px] border text-sm font-medium shadow-sm transition-colors cursor-pointer ${
              viewMode === 'history'
                ? 'bg-blue-50 text-[#2563EB] border-blue-200'
                : 'bg-white border-[#E2E8F0] text-[#0F172A] hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">history</span>
            <span>Stock History</span>
          </button>
          <button
            onClick={() => setViewMode('adjustment')}
            className="inline-flex items-center gap-2 h-[38px] px-4 rounded-[10px] bg-[#2563EB] text-white text-sm font-medium hover:bg-[#1D4ED8] active:bg-[#1E40AF] transition-colors shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Stock Adjustment</span>
          </button>
        </div>
      </div>

      {viewMode === 'list' && (
        <>
          {/* Inventory Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Total Products */}
            <div className="bg-white p-6 rounded-[10px] border border-[#E2E8F0] shadow-sm flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">TOTAL PRODUCTS</span>
                <span className="text-[28px] text-[#0F172A] font-bold tabular-nums">{state.products.length}</span>
                <span className="text-[13px] text-[#64748B]">Tracked catalog items</span>
              </div>
              <div className="w-12 h-12 rounded-[10px] bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center text-[#475569]">
                <span className="material-symbols-outlined text-[24px]">inventory_2</span>
              </div>
            </div>

            {/* Card 2: Low Stock Products */}
            <div className="bg-white p-6 rounded-[10px] border border-[#E2E8F0] shadow-sm flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">LOW STOCK PRODUCTS</span>
                  <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]">ATTENTION</span>
                </div>
                <span className="text-[28px] text-[#D97706] font-bold tabular-nums">
                  {state.products.filter(p => p.currentStock <= p.minStockAlert && p.currentStock > 0).length}
                </span>
                <span className="text-[13px] text-[#64748B]">At or below reorder threshold</span>
              </div>
              <div className="w-12 h-12 rounded-[10px] bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#D97706]">
                <span className="material-symbols-outlined text-[24px]">warning</span>
              </div>
            </div>

            {/* Card 3: Out of Stock Products */}
            <div className="bg-white p-6 rounded-[10px] border border-[#E2E8F0] shadow-sm flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">OUT OF STOCK</span>
                  <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]">CRITICAL</span>
                </div>
                <span className="text-[28px] text-[#DC2626] font-bold tabular-nums">
                  {state.products.filter(p => p.currentStock === 0).length}
                </span>
                <span className="text-[13px] text-[#64748B]">Requires immediate replenishment</span>
              </div>
              <div className="w-12 h-12 rounded-[10px] bg-[#FEE2E2] border border-[#FECACA] flex items-center justify-center text-[#DC2626]">
                <span className="material-symbols-outlined text-[24px]">error_outline</span>
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="bg-white border border-[#E2E8F0] rounded-[10px] p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <span className="material-symbols-outlined text-[18px] text-[#64748B] absolute left-3 top-2.5">search</span>
              <input
                type="text"
                placeholder="Search inventory by item or SKU..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedStockFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  selectedStockFilter === 'ALL'
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Stock
              </button>
              <button
                onClick={() => setSelectedStockFilter('LOW')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  selectedStockFilter === 'LOW'
                    ? 'bg-[#D97706] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Low Stock Only
              </button>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-white border border-[#E2E8F0] rounded-[10px] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-[#E2E8F0] text-[11px] font-semibold uppercase text-[#64748B]">
                    <th className="py-3 px-4">Item & SKU</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4 text-right">In Stock</th>
                    <th className="py-3 px-4 text-right">Min Reorder</th>
                    <th className="py-3 px-4 text-right">Valuation (LKR)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-sm">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-[#64748B] text-xs">
                        No inventory products found.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(product => {
                      const isLow = product.currentStock <= product.minStockAlert;
                      const valuation = product.costPrice * product.currentStock;
                      return (
                        <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[#0F172A]">{product.name}</div>
                            <div className="text-xs text-[#64748B] font-mono">SKU: {product.sku}</div>
                          </td>
                          <td className="py-3 px-4 text-xs text-[#64748B]">{product.category}</td>
                          <td className="py-3 px-4 text-xs font-medium text-slate-700">Main Warehouse</td>
                          <td className="py-3 px-4 text-right font-bold tabular-nums">
                            <span className={isLow ? 'text-rose-600' : 'text-[#0F172A]'}>
                              {product.currentStock} {product.unit}s
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-xs text-[#64748B] tabular-nums">
                            {product.minStockAlert} {product.unit}s
                          </td>
                          <td className="py-3 px-4 text-right font-medium tabular-nums text-[#0F172A]">
                            Rs. {valuation.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                isLow
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {isLow ? 'Low Stock' : 'In Stock'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setAdjustProductId(product.id);
                                setViewMode('adjustment');
                              }}
                              className="px-2.5 py-1 text-xs text-[#2563EB] hover:bg-blue-50 border border-blue-200 rounded cursor-pointer"
                            >
                              Adjust
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Stock Adjustment Form */}
      {viewMode === 'adjustment' && (
        <div className="w-full max-w-[820px] mx-auto bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-6 sm:p-8 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b pb-4 border-[#E2E8F0]">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[20px] font-bold text-[#0F172A]">Stock Adjustment</h2>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-[#2563EB]">
                  Main Warehouse (MW-01)
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Correct stock quantities in warehouse ledger with full audit traceability
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-[#64748B] uppercase block">Sequence</span>
              <span className="text-sm font-mono font-bold text-[#0F172A]">#ADJ-2024-0892</span>
            </div>
          </div>

          <form onSubmit={handleApplyAdjustment} className="space-y-6">
            {/* Select Product */}
            <div>
              <label className="block text-xs font-semibold text-[#64748B] uppercase mb-1">Select Product to Adjust</label>
              <select
                value={adjustProductId}
                onChange={e => setAdjustProductId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A]"
              >
                {state.products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (SKU: {p.sku}) — Current Stock: {p.currentStock} {p.unit}s
                  </option>
                ))}
              </select>
            </div>

            {selectedProductForAdjustment && (
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[#64748B] block font-medium">Product Name</span>
                  <span className="font-semibold text-[#0F172A] mt-0.5 block">{selectedProductForAdjustment.name}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block font-medium">SKU</span>
                  <span className="font-mono text-[#0F172A] mt-0.5 block">{selectedProductForAdjustment.sku}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block font-medium">Current Stock</span>
                  <span className="text-base font-bold text-[#0F172A] mt-0.5 block">
                    {selectedProductForAdjustment.currentStock} {selectedProductForAdjustment.unit}s
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block font-medium">Min Stock Alert</span>
                  <span className="text-sm font-medium text-[#0F172A] mt-0.5 block">
                    {selectedProductForAdjustment.minStockAlert} {selectedProductForAdjustment.unit}s
                  </span>
                </div>
              </div>
            )}

            {/* Adjustment Type & Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-[#64748B] uppercase mb-1">Adjustment Type</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setAdjustType('increase')}
                    className={`flex items-center justify-center gap-1.5 h-9 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      adjustType === 'increase'
                        ? 'bg-white text-[#2563EB] shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    <span>Increase (+)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('decrease')}
                    className={`flex items-center justify-center gap-1.5 h-9 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      adjustType === 'decrease'
                        ? 'bg-white text-rose-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">remove_circle</span>
                    <span>Decrease (-)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#64748B] uppercase mb-1">Adjustment Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={adjustQty}
                  onChange={e => setAdjustQty(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3.5 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] font-mono"
                />
              </div>
            </div>

            {/* Reason */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-[#64748B] uppercase mb-1">Reason for Adjustment</label>
                <select
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full px-3.5 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A]"
                >
                  <option>Stock Count Correction</option>
                  <option>Damaged Goods</option>
                  <option>Expired Goods</option>
                  <option>Lost Goods / Theft</option>
                  <option>Internal Warehouse Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#64748B] uppercase mb-1">Internal Reference / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Physical inventory audit"
                  value={adjustNotes}
                  onChange={e => setAdjustNotes(e.target.value)}
                  className="w-full px-3.5 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A]"
                />
              </div>
            </div>

            {/* Preview of new stock level */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between text-xs">
              <span className="text-[#2563EB] font-medium">Calculated Stock After Adjustment:</span>
              <span className="text-base font-bold text-[#2563EB] tabular-nums">
                {calculatedNewStock} {selectedProductForAdjustment?.unit}s
              </span>
            </div>

            {adjustmentSubmitted && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200">
                Adjustment successfully committed to inventory movement ledger!
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-sm hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-semibold hover:bg-[#1D4ED8] cursor-pointer"
              >
                Apply Stock Adjustment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stock Movement History */}
      {viewMode === 'history' && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-[#E2E8F0] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">Stock Movement History</h3>
              <p className="text-xs text-[#64748B]">Audited real-time journal of warehouse changes</p>
            </div>
            <span className="text-xs font-medium text-slate-500">Main Warehouse (MW-01)</span>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] uppercase tracking-wider text-[#64748B] font-semibold">
                <th className="py-2.5 px-4">Date / Time</th>
                <th className="py-2.5 px-4">Reference</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4">Item & SKU</th>
                <th className="py-2.5 px-4 text-right">Quantity Change</th>
                <th className="py-2.5 px-4 text-right">Balance After</th>
                <th className="py-2.5 px-4">Reason / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#64748B] text-xs">
                    No stock movements recorded yet.
                  </td>
                </tr>
              ) : (
                movements.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-[#64748B]">{m.date}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-[#0F172A]">{m.referenceNo}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold ${
                          m.type === 'Purchase'
                            ? 'bg-blue-50 text-blue-700'
                            : m.type === 'Sale'
                            ? 'bg-purple-50 text-purple-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {m.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#0F172A]">{m.productName}</div>
                      <div className="text-[10px] text-[#64748B] font-mono">{m.sku}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold tabular-nums">
                      <span className={m.change > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {m.change > 0 ? `+${m.change}` : m.change}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold tabular-nums text-[#0F172A]">
                      {m.balanceAfter}
                    </td>
                    <td className="py-3 px-4 text-[#64748B]">{m.reason}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

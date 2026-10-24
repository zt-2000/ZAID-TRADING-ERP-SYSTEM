import React, { useState } from 'react';
import { ERPStoreState } from '../lib/erpStore';
import { Product, ScreenId } from '../types/erp';

interface ProductsViewProps {
  state: ERPStoreState;
  onNavigate: (screen: ScreenId) => void;
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  initialShowAddModal?: boolean;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  state,
  onNavigate,
  onAddProduct,
  initialShowAddModal = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddModal, setShowAddModal] = useState(initialShowAddModal);

  // Form states for Add Product
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Dairy & Beverages');
  const [unit, setUnit] = useState('Pack');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [currentStock, setCurrentStock] = useState('');
  const [minStockAlert, setMinStockAlert] = useState('30');

  const categories = ['All', 'Dairy & Beverages', 'Flour & Bakery', 'Snacks & Biscuits', 'Tea & Coffee', 'Grains & Rice', 'Household Care'];

  const filtered = state.products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sku) return;

    onAddProduct({
      name,
      sku,
      category,
      unit,
      costPrice: parseFloat(costPrice) || 0,
      sellingPrice: parseFloat(sellingPrice) || 0,
      currentStock: parseInt(currentStock, 10) || 0,
      minStockAlert: parseInt(minStockAlert, 10) || 20,
      status: (parseInt(currentStock, 10) || 0) <= (parseInt(minStockAlert, 10) || 20) ? 'low_stock' : 'active'
    });

    setName('');
    setSku('');
    setCostPrice('');
    setSellingPrice('');
    setCurrentStock('');
    setShowAddModal(false);
  };

  return (
    <div className="flex flex-col w-full p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#0F172A] tracking-tight">Products Management</h1>
          <p className="text-[13px] text-[#64748B] mt-0.5">Manage your wholesale products, pricing, and catalog inventories</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const csvContent = "data:text/csv;charset=utf-8," 
                + ["Name,SKU,Category,Cost,Price,Stock"].join(",") + "\n"
                + state.products.map(p => `"${p.name}","${p.sku}","${p.category}",${p.costPrice},${p.sellingPrice},${p.currentStock}`).join("\n");
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", "products_export.csv");
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#0F172A] text-sm font-medium rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-[#64748B]">file_download</span>
            <span>Export</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white text-sm font-medium rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Total Products</span>
            <span className="text-[26px] font-bold text-[#0F172A] mt-1 tabular-nums">{state.products.length}</span>
            <span className="text-[12px] text-[#64748B] mt-1">All registered catalog items</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#2563EB] flex items-center justify-center shrink-0 border border-[#E2E8F0]">
            <span className="material-symbols-outlined text-[22px]">inventory_2</span>
          </div>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Active Products</span>
            <span className="text-[26px] font-bold text-[#0F172A] mt-1 tabular-nums">
              {state.products.filter(p => p.status === 'active').length}
            </span>
            <span className="text-[12px] text-emerald-600 font-medium mt-1">Ready for sales & orders</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <span className="material-symbols-outlined text-[22px]">check_circle</span>
          </div>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Low Stock Alert</span>
            <span className="text-[26px] font-bold text-rose-600 mt-1 tabular-nums">
              {state.products.filter(p => p.status === 'low_stock' || p.currentStock <= p.minStockAlert).length}
            </span>
            <span className="text-[12px] text-rose-600 font-medium mt-1">Reorder thresholds triggered</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
            <span className="material-symbols-outlined text-[22px]">warning</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined text-[18px] text-[#64748B] absolute left-3 top-2.5">search</span>
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium shrink-0 cursor-pointer transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-[#E2E8F0]">
                <th className="py-3 px-4 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Product Name</th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">SKU</th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Category</th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-right">Cost Price</th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-right">Selling Price</th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-right">Stock</th>
                <th className="py-3 px-4 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#64748B] text-xs">
                    No products found.
                  </td>
                </tr>
              ) : (
                filtered.map(product => {
                  const isLow = product.currentStock <= product.minStockAlert;
                  return (
                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-[14px] text-[#0F172A]">{product.name}</div>
                        <div className="text-xs text-[#64748B]">Unit: {product.unit}</div>
                      </td>
                      <td className="py-3 px-4 text-[13px] font-mono text-slate-600">{product.sku}</td>
                      <td className="py-3 px-4 text-[13px] text-[#64748B]">{product.category}</td>
                      <td className="py-3 px-4 text-[13px] text-right font-medium tabular-nums">
                        Rs. {product.costPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-[13px] text-right font-semibold text-[#0F172A] tabular-nums">
                        Rs. {product.sellingPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums">
                        <span className={`font-semibold ${isLow ? 'text-rose-600 font-bold' : 'text-slate-800'}`}>
                          {product.currentStock} {product.unit}s
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            isLow
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isLow ? 'Low Stock' : 'Active'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-[1px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2563EB]">add_circle</span>
                <h3 className="text-lg font-bold text-[#0F172A]">Add New Product</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-[#0F172A] cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anchor Full Cream Milk Powder 1kg"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1">SKU Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MLK-1000"
                    value={sku}
                    onChange={e => setSku(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A]"
                  >
                    {categories.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1">Cost Price (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 950"
                    value={costPrice}
                    onChange={e => setCostPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1">Selling Price (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 1150"
                    value={sellingPrice}
                    onChange={e => setSellingPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1">Unit</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1">Initial Stock</label>
                  <input
                    type="number"
                    placeholder="50"
                    value={currentStock}
                    onChange={e => setCurrentStock(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1">Min Alert Stock</label>
                  <input
                    type="number"
                    value={minStockAlert}
                    onChange={e => setMinStockAlert(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A]"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-[#1D4ED8] cursor-pointer"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

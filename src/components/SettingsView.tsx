import React, { useState, useEffect } from 'react';
import { ERPStoreState } from '../lib/erpStore';
import { ScreenId, CompanySettings } from '../types/erp';
import { runSupabaseDiagnostics, SupabaseDiagnostics, getSupabaseClient } from '../lib/supabase';

interface SettingsViewProps {
  state: ERPStoreState;
  onNavigate: (screen: ScreenId) => void;
  onSaveCompanySettings?: (newSettings: CompanySettings) => void;
  initialTab?: 'company' | 'users' | 'database';
}

interface UserRoleItem {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'cashier' | 'clerk';
  warehouse: string;
  isActive: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  state,
  onNavigate,
  onSaveCompanySettings,
  initialTab = 'company'
}) => {
  const [activeTab, setActiveTab] = useState<'company' | 'users' | 'database'>(initialTab);
  const [diagnostics, setDiagnostics] = useState<SupabaseDiagnostics | null>(null);
  const [checkingDb, setCheckingDb] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Users state
  const [usersList, setUsersList] = useState<UserRoleItem[]>([
    { id: 'usr-1', name: 'Zaid Administrator', email: 'zaidtrading.info@gmail.com', role: 'admin', warehouse: 'Main Warehouse (MW-01)', isActive: true },
    { id: 'usr-2', name: 'Store Manager', email: 'manager@zaidtrading.lk', role: 'manager', warehouse: 'Main Warehouse (MW-01)', isActive: true },
    { id: 'usr-3', name: 'Counter Cashier', email: 'cashier@zaidtrading.lk', role: 'cashier', warehouse: 'Peliyagoda Counter', isActive: true },
    { id: 'usr-4', name: 'Inventory Clerk', email: 'clerk@zaidtrading.lk', role: 'clerk', warehouse: 'Main Warehouse (MW-01)', isActive: true }
  ]);

  // Form state for Company Profile
  const [companyForm, setCompanyForm] = useState<CompanySettings>(state.companySettings || {
    name: 'ZAID TRADING (PVT) LTD',
    tradeName: 'ZAID Trading Wholesale ERP',
    currency: 'LKR (Rs.)',
    taxId: '102938475-7000',
    address: 'No. 45/A, Warehouse Complex, Peliyagoda, Colombo',
    phone: '+94 11 234 5678',
    email: 'info@zaidtrading.lk'
  });

  useEffect(() => {
    if (state.companySettings) {
      setCompanyForm(state.companySettings);
    }
  }, [state.companySettings]);

  const fetchDiagnostics = async () => {
    setCheckingDb(true);
    const diag = await runSupabaseDiagnostics();
    setDiagnostics(diag);

    // Try fetching live user roles from Supabase if connected
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data } = await client.from('user_roles').select('*');
        if (data && data.length > 0) {
          const mapped = data.map((u: any) => ({
            id: u.id,
            name: u.full_name || 'ERP User',
            email: u.email || 'user@zaidtrading.lk',
            role: u.role || 'clerk',
            warehouse: 'Main Warehouse (MW-01)',
            isActive: true
          }));
          setUsersList(mapped);
        }
      } catch {
        // Fallback to local default users
      }
    }

    setCheckingDb(false);
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  const handleCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaveCompanySettings) {
      onSaveCompanySettings(companyForm);
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const handleToggleUserActive = (userId: string) => {
    setUsersList(usersList.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u));
  };

  const handleChangeRole = (userId: string, newRole: UserRoleItem['role']) => {
    setUsersList(usersList.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  return (
    <div className="flex flex-col w-full p-6 space-y-6 max-w-[1600px] mx-auto select-text">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight">System &amp; Company Settings</h1>
          <p className="text-[14px] text-[#64748B] mt-0.5">Configuration, company profile, user access roles, and Supabase integration readiness</p>
        </div>
      </div>

      <div className="flex border-b border-[#E2E8F0] gap-4">
        <button
          onClick={() => setActiveTab('company')}
          className={`pb-2 text-sm font-semibold transition-colors cursor-pointer ${
            activeTab === 'company'
              ? 'border-b-2 border-[#2563EB] text-[#2563EB]'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          Company Profile (Screen 36)
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-2 text-sm font-semibold transition-colors cursor-pointer ${
            activeTab === 'users'
              ? 'border-b-2 border-[#2563EB] text-[#2563EB]'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          Users &amp; Access Roles (Screen 37)
        </button>
        <button
          onClick={() => setActiveTab('database')}
          className={`pb-2 text-sm font-semibold transition-colors cursor-pointer ${
            activeTab === 'database'
              ? 'border-b-2 border-[#2563EB] text-[#2563EB]'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          Supabase Readiness &amp; Diagnostics
        </button>
      </div>

      {activeTab === 'company' && (
        <form onSubmit={handleCompanySubmit} className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm max-w-2xl space-y-5">
          <div className="border-b pb-3 border-[#E2E8F0] flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">Company Profile</h3>
              <p className="text-xs text-[#64748B]">These details update the dashboard, sidebar, invoices, and reports dynamically</p>
            </div>
            {saveSuccess && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>Saved &amp; Updated App-Wide</span>
              </span>
            )}
          </div>
          <div className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-[#64748B] mb-1">Company Trade Name *</label>
              <input
                type="text"
                value={companyForm.name}
                onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })}
                required
                placeholder="e.g. ZAID TRADING (PVT) LTD"
                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-[#0F172A] font-semibold focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1">System Display Name / Tagline</label>
                <input
                  type="text"
                  value={companyForm.tradeName}
                  onChange={e => setCompanyForm({ ...companyForm, tradeName: e.target.value })}
                  placeholder="e.g. ZAID Trading Wholesale ERP"
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-[#0F172A]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1">VAT / TIN Registration</label>
                <input
                  type="text"
                  value={companyForm.taxId}
                  onChange={e => setCompanyForm({ ...companyForm, taxId: e.target.value })}
                  placeholder="102938475-7000"
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-[#0F172A]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1">Currency Code</label>
                <input
                  type="text"
                  value={companyForm.currency}
                  readOnly
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-[#0F172A] font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1">Phone Contact</label>
                <input
                  type="text"
                  value={companyForm.phone}
                  onChange={e => setCompanyForm({ ...companyForm, phone: e.target.value })}
                  placeholder="+94 11 234 5678"
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-[#0F172A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#64748B] mb-1">Registered Warehouse Address</label>
              <input
                type="text"
                value={companyForm.address}
                onChange={e => setCompanyForm({ ...companyForm, address: e.target.value })}
                placeholder="No. 45/A, Warehouse Complex, Peliyagoda, Colombo"
                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-[#0F172A]"
              />
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-3">
              <button
                type="submit"
                className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                <span>Save Company Profile</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {activeTab === 'users' && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-[#E2E8F0] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">Users &amp; Access Roles Management (Screen 37)</h3>
              <p className="text-xs text-[#64748B]">Manage staff permissions, RBAC security roles, and warehouse assignments</p>
            </div>
            <button
              onClick={() => onNavigate('38_login')}
              className="px-3 py-1 text-xs font-medium text-[#2563EB] bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer"
            >
              Sign In Session
            </button>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F8FAFC] text-[11px] uppercase text-[#64748B] border-b">
              <tr>
                <th className="py-2.5 px-4">User Name &amp; Email</th>
                <th className="py-2.5 px-4">Assigned Role</th>
                <th className="py-2.5 px-4">Warehouse Access</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {usersList.map(u => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[#0F172A]">{u.name}</div>
                    <div className="text-xs text-[#64748B]">{u.email}</div>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={u.role}
                      onChange={e => handleChangeRole(u.id, e.target.value as any)}
                      className="px-2 py-1 border rounded text-xs font-semibold bg-white text-[#0F172A]"
                    >
                      <option value="admin">Administrator (Full Access)</option>
                      <option value="manager">Manager (Operations &amp; Reports)</option>
                      <option value="cashier">Cashier (POS &amp; Payments)</option>
                      <option value="clerk">Inventory Clerk (Stock &amp; GRN)</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600 font-medium">{u.warehouse}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {u.isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleToggleUserActive(u.id)}
                      className={`px-2.5 py-1 text-xs rounded border font-medium cursor-pointer ${
                        u.isActive ? 'text-rose-600 border-rose-200 hover:bg-rose-50' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                      }`}
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'database' && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm max-w-3xl space-y-6">
          <div className="flex items-center justify-between border-b pb-4 border-[#E2E8F0]">
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">Supabase Integration Readiness &amp; Diagnostics</h3>
              <p className="text-xs text-[#64748B]">Safe non-destructive audit of cloud connection and data storage</p>
            </div>
            <button
              onClick={fetchDiagnostics}
              disabled={checkingDb}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#0F172A] rounded-lg text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5"
            >
              <span className={`material-symbols-outlined text-[16px] ${checkingDb ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>{checkingDb ? 'Testing...' : 'Re-run Diagnostics'}</span>
            </button>
          </div>

          {diagnostics ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-lg border bg-slate-50 border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">1. Environment Configuration</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      diagnostics.publicConfigPresent ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {diagnostics.publicConfigPresent ? 'Present' : 'Missing'}
                    </span>
                  </div>
                  <p className="text-slate-500 font-mono">
                    Host: {diagnostics.urlHost || 'None'}
                  </p>
                </div>

                <div className="p-3.5 rounded-lg border bg-slate-50 border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">2. Supabase SDK Client</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      diagnostics.clientInitialized ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {diagnostics.clientInitialized ? 'Initialized' : 'Failed'}
                    </span>
                  </div>
                  <p className="text-slate-500">
                    @supabase/supabase-js client instantiated.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-[#64748B]">
              Loading diagnostics...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

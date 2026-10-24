import React, { useState, useEffect } from 'react';
import { ERPStoreState } from '../lib/erpStore';
import { ScreenId, CompanySettings } from '../types/erp';
import { runSupabaseDiagnostics, SupabaseDiagnostics } from '../lib/supabase';

interface SettingsViewProps {
  state: ERPStoreState;
  onNavigate: (screen: ScreenId) => void;
  onSaveCompanySettings?: (newSettings: CompanySettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ state, onNavigate, onSaveCompanySettings }) => {
  const [activeTab, setActiveTab] = useState<'company' | 'users' | 'database'>('company');
  const [diagnostics, setDiagnostics] = useState<SupabaseDiagnostics | null>(null);
  const [checkingDb, setCheckingDb] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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

  return (
    <div className="flex flex-col w-full p-6 space-y-6 max-w-[1600px] mx-auto select-text">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight">System &amp; Company Settings</h1>
          <p className="text-[14px] text-[#64748B] mt-0.5">Configuration, company profile, user access, and Supabase integration readiness</p>
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
              <h3 className="text-base font-bold text-[#0F172A]">Company Profile (Screen 36)</h3>
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
              <p className="text-[11px] text-[#64748B] mt-1">
                This name is displayed across the header, sidebar, dashboard, invoices, and official statements.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1">System Display Name / Tagline</label>
                <input
                  type="text"
                  value={companyForm.tradeName}
                  onChange={e => setCompanyForm({ ...companyForm, tradeName: e.target.value })}
                  placeholder="e.g. ZAID Trading Wholesale ERP"
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1">VAT / TIN Registration</label>
                <input
                  type="text"
                  value={companyForm.taxId}
                  onChange={e => setCompanyForm({ ...companyForm, taxId: e.target.value })}
                  placeholder="102938475-7000"
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
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
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
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
                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
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
              <h3 className="text-sm font-bold text-[#0F172A]">Users &amp; Access Roles (Screen 37)</h3>
              <p className="text-xs text-[#64748B]">Role-based access control and branch permissions</p>
            </div>
            <button
              onClick={() => onNavigate('38_login')}
              className="px-3 py-1 text-xs font-medium text-[#2563EB] bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer"
            >
              Test Login Session (Screen 38)
            </button>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F8FAFC] text-[11px] uppercase text-[#64748B] border-b">
              <tr>
                <th className="py-2.5 px-4">User Name</th>
                <th className="py-2.5 px-4">Email</th>
                <th className="py-2.5 px-4">Assigned Role</th>
                <th className="py-2.5 px-4">Warehouse Access</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              <tr>
                <td className="py-3 px-4 font-semibold text-[#0F172A]">Kasun Perera</td>
                <td className="py-3 px-4 text-xs text-[#64748B]">kasun@zaidtrading.lk</td>
                <td className="py-3 px-4 font-medium text-blue-700">Store Manager</td>
                <td className="py-3 px-4 text-xs">Main Warehouse (MW-01)</td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">Active</span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-[#0F172A]">Mohamed Zaid</td>
                <td className="py-3 px-4 text-xs text-[#64748B]">zaid@zaidtrading.lk</td>
                <td className="py-3 px-4 font-medium text-purple-700">Administrator</td>
                <td className="py-3 px-4 text-xs">All Nodes &amp; Financials</td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">Active</span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-[#0F172A]">Nimal Fernando</td>
                <td className="py-3 px-4 text-xs text-[#64748B]">nimal@zaidtrading.lk</td>
                <td className="py-3 px-4 font-medium text-slate-700">Cashier</td>
                <td className="py-3 px-4 text-xs">Sales Invoicing Only</td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">Active</span>
                </td>
              </tr>
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
              {/* Diagnostic Checklist */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Item 1: Config */}
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
                  <p className="text-slate-400 text-[10px]">
                    Credentials protected (no keys printed).
                  </p>
                </div>

                {/* Item 2: Client Initialized */}
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
                  <p className="text-slate-400 text-[10px]">
                    Auth health: {diagnostics.authHealthOk ? 'Reachable (HTTP 200)' : 'Unreachable'}
                  </p>
                </div>

                {/* Item 3: Session */}
                <div className="p-3.5 rounded-lg border bg-slate-50 border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">3. Auth Session</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      diagnostics.hasActiveSession ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {diagnostics.hasActiveSession ? 'Authenticated' : 'Anonymous / Guest'}
                    </span>
                  </div>
                  <p className="text-slate-500">
                    {diagnostics.hasActiveSession
                      ? `Active user: ${diagnostics.sessionUserEmail}`
                      : 'No authenticated Supabase JWT session detected.'}
                  </p>
                  <p className="text-slate-400 text-[10px]">
                    Client requests run under anon role.
                  </p>
                </div>

                {/* Item 4: Table Read & Schema */}
                <div className="p-3.5 rounded-lg border bg-slate-50 border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">4. Harmless Table Read</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      diagnostics.tableReadSuccess ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {diagnostics.tableReadSuccess ? 'Table Exists' : 'HTTP 404 (Not Found)'}
                    </span>
                  </div>
                  <p className="text-slate-500">
                    Probed: <code className="bg-white px-1 py-0.5 rounded border border-slate-200">public.{diagnostics.testedTableName}</code>
                  </p>
                  <p className="text-slate-400 text-[10px]">
                    {diagnostics.tableReadError || 'Read successful'}
                  </p>
                </div>
              </div>

              {/* Active Storage Engine Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#2563EB]">storage</span>
                  <span className="font-bold text-sm text-[#0F172A]">Active Storage & Persistence Architecture</span>
                  <span className="ml-auto text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-[#2563EB] border border-blue-200">
                    {diagnostics.tableReadSuccess ? 'Cloud Database (Active)' : 'Local Storage Fallback'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Zaid Trading ERP uses PostgreSQL on Supabase with atomic stock locks, true double-entry journal balance triggers, and Row-Level Security (RLS). When signed in via <strong>Screen 38 (Login)</strong>, all catalog products, customer accounts, sales invoices, and stock movements are synchronized in real-time with the cloud database.
                </p>
              </div>

              {/* Safe Cloud Data Migration & Backup Utilities */}
              <div className="border border-[#E2E8F0] rounded-lg p-4 space-y-3 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#2563EB]">cloud_upload</span>
                    <h4 className="text-sm font-bold text-[#0F172A]">Cloud Sync &amp; Local Backup Tools</h4>
                  </div>
                  <button
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
                      const downloadAnchor = document.createElement('a');
                      downloadAnchor.setAttribute("href", dataStr);
                      downloadAnchor.setAttribute("download", `zaid_erp_backup_${new Date().toISOString().split('T')[0]}.json`);
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    <span>Download Local Backup (JSON)</span>
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Local ERP records are never deleted automatically. You can export a snapshot of your local data at any time.
                </p>
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

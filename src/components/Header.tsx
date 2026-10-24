import React from 'react';
import { ScreenId } from '../types/erp';

export interface HeaderCloudStatus {
  mode: 'cloud_authenticated' | 'cloud_guest' | 'local_fallback';
  userEmail?: string | null;
  message?: string;
}

interface HeaderProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  supabaseConnected: boolean;
  companyName?: string;
  cloudStatus?: HeaderCloudStatus;
  pendingSyncCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  supabaseConnected,
  companyName = 'ZAID TRADING (PVT) LTD',
  cloudStatus,
  pendingSyncCount = 0
}) => {
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const mode = cloudStatus?.mode || (supabaseConnected ? 'cloud_authenticated' : 'local_fallback');
  const userDisplayName = cloudStatus?.userEmail ? cloudStatus.userEmail.split('@')[0] : 'User';
  const userInitials = userDisplayName.slice(0, 2).toUpperCase();

  return (
    <header className="fixed top-0 left-[250px] right-0 h-16 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] z-40 flex items-center justify-between px-6 select-none shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      {/* Left: Date & Dynamic Company Context */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-[#3B82F6]">calendar_today</span>
          <span className="text-[13px] font-semibold text-[#0F172A]">
            {todayFormatted}
          </span>
        </div>

        <span className="text-[#CBD5E1]">·</span>

        <span
          onClick={() => onNavigate('36_company_settings')}
          className="text-[12px] font-bold text-[#475569] hover:text-[#2563EB] cursor-pointer max-w-[220px] truncate"
          title="Click to view Company Settings"
        >
          {companyName}
        </span>

        {pendingSyncCount > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
            <span className="material-symbols-outlined text-[14px]">cloud_upload</span>
            <span>{pendingSyncCount} Pending Sync</span>
          </span>
        )}
      </div>

      {/* Right: Actions, Cloud Status, Search, Notification & Profile */}
      <div className="flex items-center gap-3">
        {/* Search Icon Button */}
        <button
          onClick={() => onNavigate('02_products_management')}
          className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200/80 text-[#475569] flex items-center justify-center transition-colors cursor-pointer"
          title="Search products and invoices"
        >
          <span className="material-symbols-outlined text-[18px]">search</span>
        </button>

        {/* Notification Bell Button */}
        <div className="relative">
          <button
            onClick={() => onNavigate('04_inventory_management')}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200/80 text-[#475569] flex items-center justify-center transition-colors cursor-pointer"
            title="Notifications & Stock Alerts"
          >
            <span className="material-symbols-outlined text-[18px]">notifications</span>
          </button>
        </div>

        {/* Cloud Persistence Badge */}
        <button
          onClick={() => onNavigate(mode === 'cloud_guest' ? '38_login' : '36_company_settings')}
          title="Click to view Supabase Connection & Diagnostics"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium cursor-pointer transition-colors ${
            mode === 'cloud_authenticated'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              : mode === 'cloud_guest'
              ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              mode === 'cloud_authenticated'
                ? 'bg-emerald-500'
                : mode === 'cloud_guest'
                ? 'bg-amber-500 animate-pulse'
                : 'bg-slate-400'
            }`}
          ></span>
          <span>
            {mode === 'cloud_authenticated'
              ? `Cloud Sync: Live (${userDisplayName})`
              : mode === 'cloud_guest'
              ? 'Cloud: Ready (Sign In)'
              : 'Local Fallback'}
          </span>
        </button>

        <div className="h-6 w-px bg-[#E2E8F0]"></div>

        {/* Profile Avatar & Details */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#3B82F6] text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
            {userInitials}
          </div>
          <div className="hidden sm:flex flex-col text-left leading-tight">
            <span className="text-[13px] text-[#0F172A] font-bold capitalize">{userDisplayName}</span>
            <span className="text-[11px] text-[#64748B]">System User</span>
          </div>
        </div>
      </div>
    </header>
  );
};

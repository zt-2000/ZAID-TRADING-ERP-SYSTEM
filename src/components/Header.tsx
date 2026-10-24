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
  cloudStatus?: HeaderCloudStatus;
  onOpenScreenModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  supabaseConnected,
  cloudStatus,
  onOpenScreenModal
}) => {
  const todayStr = 'Thursday, Oct 24, 2024';
  const mode = cloudStatus?.mode || (supabaseConnected ? 'cloud_authenticated' : 'local_fallback');

  return (
    <header className="fixed top-0 left-[240px] right-0 h-16 bg-white border-b border-[#E2E8F0] z-40 flex items-center justify-between px-8 select-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      {/* Left: Date matching Stitch reference */}
      <div className="flex items-center gap-4">
        <div className="text-[13px] text-[#434655] font-normal">
          {todayStr}
        </div>
      </div>

      {/* Right: Stitch Warehouse Badge, Screen Switcher & Profile */}
      <div className="flex items-center gap-4">
        {/* Stitch Reference 38-Screen Switcher */}
        <button
          onClick={onOpenScreenModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-semibold bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] border border-[#CBD5E1] transition-all cursor-pointer"
          title="Inspect Stitch screens 01 to 38"
        >
          <span className="material-symbols-outlined text-[16px] text-[#2563EB]">layers</span>
          <span>Screens (38)</span>
        </button>

        {/* Distinguished Database & Cloud Persistence Status Badge */}
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
              ? `Cloud Sync: Live (${cloudStatus?.userEmail ? cloudStatus.userEmail.split('@')[0] : 'User'})`
              : mode === 'cloud_guest'
              ? 'Cloud: Ready (Sign In to Sync)'
              : 'Local Offline Storage'}
          </span>
        </button>

        {/* Warehouse Context: Main Warehouse (MW-01) */}
        <div className="flex items-center gap-1.5 bg-[#F1F5F9] text-[#475569] px-2.5 py-1 rounded-full border border-[#E2E8F0]">
          <span className="material-symbols-outlined text-[16px] text-[#64748B]">domain</span>
          <span className="text-[12px] font-medium text-[#475569]">Main Warehouse (MW-01)</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block ml-0.5"></span>
        </div>

        <div className="h-6 w-px bg-[#E2E8F0]"></div>

        {/* Profile Avatar & Details matching Stitch Screen 01 */}
        <div className="flex items-center gap-3">
          <img
            alt="Kasun Perera"
            className="w-9 h-9 rounded-full object-cover border border-[#E2E8F0]"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAW1bHYAra1ps0f1F8-kOWJ8zDLSos8VNR5aHhSwBFYOw8AYTuJjv22eT9fKiqTaxUj6Mrh1LCU6Ok7yIOV12M8bnNEgqWVf3VJtc5tnVE3wk0TEQBeZhuibFB5XI0n4izehFKIhsaGmiMnckB0J_CiwEbZVSwrBKQIVHiWZM8VgNCAQ9mvSiP5mBJaHxD2BhYuFLojsoH2PvZTHbSGX8BBO47oFPvdi4V75DAv46Ihm9Is_H3qFC2QJw"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent && !parent.querySelector('.avatar-fallback')) {
                const fb = document.createElement('div');
                fb.className = 'w-9 h-9 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-semibold text-xs border border-blue-200 shadow-sm avatar-fallback';
                fb.innerText = 'KP';
                parent.prepend(fb);
              }
            }}
          />
          <div className="hidden sm:flex flex-col text-left leading-tight">
            <span className="text-[14px] text-[#131B2E] font-semibold">Kasun Perera</span>
            <span className="text-[12px] text-[#434655]">Store Manager</span>
          </div>
        </div>
      </div>
    </header>
  );
};

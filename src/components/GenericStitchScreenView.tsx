import React from 'react';
import { ScreenId } from '../types/erp';
import { SCREEN_LIST } from './ScreenCatalogModal';

interface GenericStitchScreenViewProps {
  screenId: ScreenId;
  onNavigate: (screen: ScreenId) => void;
}

export const GenericStitchScreenView: React.FC<GenericStitchScreenViewProps> = ({
  screenId,
  onNavigate
}) => {
  const info = SCREEN_LIST.find(s => s.id === screenId) || SCREEN_LIST[0];

  return (
    <div className="flex flex-col w-full p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-blue-100 text-[#2563EB] font-bold text-xs flex items-center justify-center">
              {info.num}
            </span>
            <h1 className="text-[22px] font-bold text-[#0F172A] tracking-tight">{info.title}</h1>
            <span className="text-xs uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {info.module}
            </span>
          </div>
          <p className="text-[13px] text-[#64748B] mt-1">{info.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('01_dashboard')}
            className="px-3.5 py-2 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#0F172A] text-sm font-medium rounded-xl shadow-sm cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>

      {/* Screen Specification Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b pb-3 border-[#E2E8F0]">
          <span className="material-symbols-outlined text-[#2563EB]">design_services</span>
          <h3 className="text-sm font-bold text-[#0F172A]">Stitch Design Reference Mapping</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-2">
            <div className="font-semibold text-slate-700">HTML Reference:</div>
            <code className="text-[#2563EB] font-mono block bg-white p-2 rounded border border-slate-200">
              design-references/stitch/{info.htmlRef}
            </code>
            <div className="font-semibold text-slate-700 mt-2">Visual Screenshot:</div>
            <code className="text-[#2563EB] font-mono block bg-white p-2 rounded border border-slate-200">
              design-references/stitch/screens/{info.num}_{info.id.replace(/^[0-9]+_/, '')}/screen.png
            </code>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-2">
            <div className="font-semibold text-slate-700">Status & Phase:</div>
            <p className="text-slate-600">
              Included in the 38-screen design handoff inventory. In line with the design handoff instructions, screen 01 (Dashboard) and the shared design tokens/routes are prioritized for the initial review step.
            </p>
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => onNavigate('02_products_management')}
                className="px-3 py-1.5 bg-[#2563EB] text-white rounded text-xs font-medium cursor-pointer"
              >
                Products Management
              </button>
              <button
                onClick={() => onNavigate('25_accounting_overview')}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded text-xs font-medium hover:bg-slate-100 cursor-pointer"
              >
                Accounting
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

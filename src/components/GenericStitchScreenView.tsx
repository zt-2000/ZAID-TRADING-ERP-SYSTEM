import React from 'react';
import { ScreenId } from '../types/erp';

interface GenericStitchScreenViewProps {
  screenId: ScreenId;
  onNavigate: (screen: ScreenId) => void;
}

export const GenericStitchScreenView: React.FC<GenericStitchScreenViewProps> = ({
  onNavigate
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full p-6 text-center space-y-4 max-w-md mx-auto">
      <div className="w-16 h-16 bg-blue-50 text-[#3B82F6] rounded-2xl flex items-center justify-center shadow-xs">
        <span className="material-symbols-outlined text-[32px]">construction</span>
      </div>
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-[#0F172A]">This page is not built yet</h1>
        <p className="text-xs text-[#64748B] leading-relaxed">
          This feature module is currently under development. Check back soon or return to the main dashboard.
        </p>
      </div>
      <button
        onClick={() => onNavigate('01_dashboard')}
        className="px-5 py-2.5 bg-[#3B82F6] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-[18px]">dashboard</span>
        <span>Return to Dashboard</span>
      </button>
    </div>
  );
};

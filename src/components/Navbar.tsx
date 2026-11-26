import React from 'react';
import { 
  Users, 
  Settings, 
  ShieldCheck
} from 'lucide-react';
import type { BusinessSettings } from '../types';

interface NavbarProps {
  activeTab: 'daily' | 'monthly' | 'bill' | 'clients' | 'settings';
  setActiveTab: (tab: 'daily' | 'monthly' | 'bill' | 'clients' | 'settings') => void;
  settings: BusinessSettings;
  pendingAnomaliesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  settings,
  pendingAnomaliesCount,
}) => {
  return (
    <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-30">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-md font-bold text-xl text-white">
            🧵
          </div>
          <div>
            <h1 className="font-bold text-lg md:text-xl tracking-tight leading-tight">
              {settings.businessName || 'થ્રેડ કટિંગ બિલિંગ'}
            </h1>
            <p className="text-xs text-slate-400">
              સંચાલક: <span className="text-amber-400 font-medium">{settings.ownerName}</span> | ઓટોમેટિક હિસાબ સિસ્ટમ
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 px-3 py-1.5 rounded-full">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>ડેટા સુરક્ષિત (ઓફલાઇન + સેવ્ડ)</span>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="bg-slate-800/90 border-t border-slate-700/60 px-2 sm:px-4">
        <nav className="max-w-7xl mx-auto flex space-x-1 sm:space-x-2 overflow-x-auto scrollbar-none py-1.5">
          {/* DIARY 1: DAILY DIARY (લાંબો રોજમેળ ચોપડો) */}
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'daily'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <span>📓</span>
            <span>ડેઇલી ડાયરી (રોજમેળ)</span>
          </button>

          {/* DIARY 2: MONTHLY DIARY (ખાતાવહી ચોપડો - પેજ સ્વાઈપ) */}
          <button
            onClick={() => setActiveTab('monthly')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all whitespace-nowrap relative cursor-pointer ${
              activeTab === 'monthly'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <span>📖</span>
            <span>માસિક ડાયરી (ખાતાવહી)</span>
            {pendingAnomaliesCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping absolute top-1.5 right-1.5" />
            )}
          </button>

          {/* DIARY 3: BILL DIARY (ગ્રાહક બિલ સ્લીપ - જમા જમા) */}
          <button
            onClick={() => setActiveTab('bill')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'bill'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <span>📑</span>
            <span>બિલ ડાયરી (ગ્રાહક સ્લીપ)</span>
          </button>

          {/* ADMIN: CLIENTS */}
          <button
            onClick={() => setActiveTab('clients')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'clients'
                ? 'bg-slate-700 text-white font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>ગ્રાહકો & જમા</span>
          </button>

          {/* ADMIN: SETTINGS */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-slate-700 text-white font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>સેટિંગ્સ</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

import React from 'react';
import { 
  Users, 
  ArrowRight, 
  ShieldCheck, 
  TrendingUp,
  Calendar
} from 'lucide-react';
import type { Client, DailyEntry, PaymentRecord, BusinessSettings } from '../types';
import { formatDateDDMMYYYY } from '../utils/billing';

interface HomeScreenProps {
  onSelectDiary: (tab: 'daily' | 'monthly' | 'bill' | 'clients') => void;
  clients: Client[];
  entries: DailyEntry[];
  payments: PaymentRecord[];
  settings: BusinessSettings;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectDiary,
  clients,
  entries,
  payments,
  settings,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEntries = entries.filter((e) => e.date === todayStr);
  const todayMeters = todayEntries.reduce((sum, e) => sum + (e.meters || 0), 0);

  const today = new Date();
  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthEntries = entries.filter((e) => e.date.startsWith(currentMonthKey));
  const thisMonthMeters = thisMonthEntries.reduce((sum, e) => sum + (e.meters || 0), 0);

  const gujMonths = [
    'જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન',
    'જુલાઈ', 'ઓગસ્ટ', 'સપ્ટેમ્બર', 'ઓક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર'
  ];
  const currentMonthLabel = `${gujMonths[today.getMonth()]} ${today.getFullYear()}`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Top Welcome Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧵</span>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
              સુરત ટેક્સટાઈલ જોબવર્ક સોફ્ટવેર
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {settings.businessName || 'વિશ્વાસ થ્રેડ કટિંગ'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            સંચાલક: <strong className="text-amber-300">{settings.ownerName}</strong> | મો.: {settings.phone}
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2.5 rounded-2xl border border-slate-700 text-xs">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <span className="font-bold text-emerald-300 block">૧૦૦% ડેટા સુરક્ષિત</span>
            <span className="text-slate-400 text-[11px]">ઓટો-સેવ & ક્લાઉડફ્લેર સિન્ક</span>
          </div>
        </div>
      </div>

      {/* Main Title / Instruction */}
      <div className="text-center space-y-1">
        <h3 className="text-xl sm:text-2xl font-black text-slate-900">
          મુખ્ય ૪ ચોપડા (Main 4 Diaries)
        </h3>
        <p className="text-xs sm:text-sm text-slate-600">
          જે ચોપડો ખોલવો હોય તેના મોટા બટન પર ક્લિક કરો
        </p>
      </div>

      {/* ================= THE 4 PRIMARY MASTER BUTTONS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {/* BUTTON 1: DAILY DIARY (લાંબો રોજમેળ ચોપડો) */}
        <button
          type="button"
          onClick={() => onSelectDiary('daily')}
          className="group relative bg-white hover:bg-amber-50/40 rounded-3xl p-6 sm:p-7 shadow-md hover:shadow-xl border-2 border-slate-200 hover:border-amber-400 transition-all text-left flex flex-col justify-between cursor-pointer overflow-hidden animate-in fade-in"
        >
          <div className="flex items-start justify-between">
            <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-2xl shadow-md group-hover:scale-105 transition-transform">
              📓
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-amber-300">
              બટન નં. ૧
            </span>
          </div>

          <div className="space-y-2 mt-5">
            <div className="flex items-center gap-2">
              <h4 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-amber-600 transition-colors">
                ૧. ડેઇલી ડાયરી (રોજમેળ)
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
              <strong>લાંબો રોજમેળ ચોપડો:</strong> મહિનો અને તારીખ સિલેક્ટ કરો. ડાબી બાજુ લોટ્સ વિગત, વચ્ચે કુલ મીટર અને જમણી બાજુ પાર્ટીનું નામ.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 font-mono">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>આજે ({formatDateDDMMYYYY(todayStr)}): </span>
              <strong className="text-slate-900 font-bold">
                {todayMeters > 0 ? `${todayMeters.toLocaleString('gu-IN')} મી.` : 'એન્ટ્રી કરો'}
              </strong>
            </div>
            <span className="flex items-center gap-1 font-black text-amber-600 group-hover:translate-x-1 transition-transform">
              <span>ચોપડો ખોલો</span>
              <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </button>

        {/* BUTTON 2: MONTHLY DIARY (માસિક ખાતાવહી ચોપડો - પેજ સ્વાઈપ) */}
        <button
          type="button"
          onClick={() => onSelectDiary('monthly')}
          className="group relative bg-white hover:bg-sky-50/40 rounded-3xl p-6 sm:p-7 shadow-md hover:shadow-xl border-2 border-slate-200 hover:border-sky-400 transition-all text-left flex flex-col justify-between cursor-pointer overflow-hidden animate-in fade-in"
        >
          <div className="flex items-start justify-between">
            <div className="w-14 h-14 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-black text-2xl shadow-md group-hover:scale-105 transition-transform">
              📖
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-sky-100 text-sky-900 px-3 py-1 rounded-full border border-sky-300">
              બટન નં. ૨
            </span>
          </div>

          <div className="space-y-2 mt-5">
            <div className="flex items-center gap-2">
              <h4 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-sky-600 transition-colors">
                ૨. માસિક ડાયરી (ખાતાવહી)
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
              <strong>ચોપડો પેજ સ્વાઈપ:</strong> ૧૫૦+ ગ્રાહકોનો આખા માસનો હિસાબ. ૧ પેજ પર ૧૫ પાર્ટી. પાના પલટાવો અથવા સ્વાઈપ કરો (કોઈ QR કોડ નહીં, માત્ર આંતરિક યાદી).
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 font-mono">
              <TrendingUp className="w-4 h-4 text-sky-600" />
              <span>{currentMonthLabel}: </span>
              <strong className="text-slate-900 font-bold">
                {thisMonthMeters.toLocaleString('gu-IN')} મીટર
              </strong>
            </div>
            <span className="flex items-center gap-1 font-black text-sky-600 group-hover:translate-x-1 transition-transform">
              <span>ચોપડો ખોલો</span>
              <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </button>

        {/* BUTTON 3: BILL DIARY (ગ્રાહક બિલ સ્લીપ - ૧૦ માસનો હિસાબ & જમા જમા) */}
        <button
          type="button"
          onClick={() => onSelectDiary('bill')}
          className="group relative bg-white hover:bg-emerald-50/40 rounded-3xl p-6 sm:p-7 shadow-md hover:shadow-xl border-2 border-slate-200 hover:border-emerald-400 transition-all text-left flex flex-col justify-between cursor-pointer overflow-hidden animate-in fade-in"
        >
          <div className="flex items-start justify-between">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-2xl shadow-md group-hover:scale-105 transition-transform">
              📑
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full border border-emerald-300">
              બટન નં. ૩
            </span>
          </div>

          <div className="space-y-2 mt-5">
            <div className="flex items-center gap-2">
              <h4 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                ૩. બિલ ડાયરી (ગ્રાહક સ્લીપ)
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
              <strong>ગ્રાહક બિલ સ્લીપ:</strong> પાર્ટીનું નામ, ખાતા નં, ૧૦ મહિનાનો હિસાબ, લીલા રંગમાં &ldquo;જમા જમા&rdquo; સ્ટેમ્પ, આડો લીટો, કુલ બાકી, UPI QR અને WhatsApp.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold font-sans">
              <span className="bg-emerald-100 px-2 py-0.5 rounded text-[11px] border border-emerald-400">
                જમા &nbsp; જમા ✅
              </span>
              <span>+ UPI QR કોડ</span>
            </div>
            <span className="flex items-center gap-1 font-black text-emerald-700 group-hover:translate-x-1 transition-transform">
              <span>સ્લીપ જુઓ</span>
              <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </button>

        {/* BUTTON 4: CLIENTS & SETTINGS (ગ્રાહક યાદી, જમા ખાતાવહી & સેટિંગ્સ) */}
        <button
          type="button"
          onClick={() => onSelectDiary('clients')}
          className="group relative bg-white hover:bg-purple-50/40 rounded-3xl p-6 sm:p-7 shadow-md hover:shadow-xl border-2 border-slate-200 hover:border-purple-400 transition-all text-left flex flex-col justify-between cursor-pointer overflow-hidden animate-in fade-in"
        >
          <div className="flex items-start justify-between">
            <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black text-2xl shadow-md group-hover:scale-105 transition-transform">
              👥
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-purple-100 text-purple-900 px-3 py-1 rounded-full border border-purple-300">
              બટન નં. ૪
            </span>
          </div>

          <div className="space-y-2 mt-5">
            <div className="flex items-center gap-2">
              <h4 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-purple-700 transition-colors">
                ૪. ગ્રાહકો & જમા હિસાબ
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
              <strong>ખાતાવહી સંચાલન:</strong> નવી પાર્ટી ઉમેરો, ખાતા નં & સોસાયટી, રોકડ/UPI પેમેન્ટ જમા કરો, નુકસાની કપાત અને ડેટા બેકઅપ.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 font-mono">
              <Users className="w-4 h-4 text-purple-600" />
              <span>{clients.length} ગ્રાહકો ({payments.length} જમા રેકોર્ડ)</span>
            </div>
            <span className="flex items-center gap-1 font-black text-purple-700 group-hover:translate-x-1 transition-transform">
              <span>ખાતાવહી ખોલો</span>
              <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </button>
      </div>

      {/* Quick Info Footer Strip */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>📍 વિશ્વાસ થ્રેડ કટિંગ, સુરત | તમામ પ્રકારના સાડી, ડ્રેસ, એમ્બ્રોઇડરી જોબવર્ક</span>
        <span className="font-bold text-slate-700">UPI ID: {settings.upiId || 'સેટ નથી'}</span>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Share2, 
  Printer, 
  CreditCard,
  Phone,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { Client, DailyEntry, PaymentRecord, BusinessSettings } from '../types';
import { 
  getClientMultiMonthLedger, 
  formatWhatsAppMultiMonthBill,
  generateUpiUrl 
} from '../utils/billing';

interface BillDiaryViewProps {
  clients: Client[];
  entries: DailyEntry[];
  payments: PaymentRecord[];
  settings: BusinessSettings;
  onOpenPaymentModal: (clientId: string) => void;
}

export const BillDiaryView: React.FC<BillDiaryViewProps> = ({
  clients,
  entries,
  payments,
  settings,
  onOpenPaymentModal,
}) => {
  // Sort clients by account number ascending
  const sortedClients = useMemo(() => {
    return [...clients].sort((a, b) => (a.accountNo || 0) - (b.accountNo || 0));
  }, [clients]);

  // Selected client index or ID
  const [selectedClientId, setSelectedClientId] = useState<string>(
    sortedClients[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Find active client
  const activeClientIndex = sortedClients.findIndex((c) => c.id === selectedClientId);
  const activeClient = sortedClients[activeClientIndex] || sortedClients[0];

  // Multi-month ledger statement for active client
  const statement = useMemo(() => {
    if (!activeClient) return null;
    return getClientMultiMonthLedger(activeClient, entries, payments);
  }, [activeClient, entries, payments]);

  // Navigate to previous or next client slip
  const handlePrevClient = () => {
    if (activeClientIndex > 0) {
      setSelectedClientId(sortedClients[activeClientIndex - 1].id);
    }
  };

  const handleNextClient = () => {
    if (activeClientIndex < sortedClients.length - 1) {
      setSelectedClientId(sortedClients[activeClientIndex + 1].id);
    }
  };

  // Filter clients for dropdown/search
  const filteredClients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sortedClients;
    return sortedClients.filter((c) => {
      const matchAcc = c.accountNo ? c.accountNo.toString().includes(q) : false;
      const matchName = c.name.toLowerCase().includes(q);
      const matchArea = c.area ? c.area.toLowerCase().includes(q) : false;
      const matchPhone = c.phone.includes(q);
      return matchAcc || matchName || matchArea || matchPhone;
    });
  }, [sortedClients, searchQuery]);

  if (!activeClient || !statement) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center text-slate-500">
        કોઈ ગ્રાહક મળ્યા નથી.
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const encodedMsg = formatWhatsAppMultiMonthBill(statement, settings);
    const cleanPhone = activeClient.phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    window.open(`https://wa.me/${phoneWithCountry}?text=${encodedMsg}`, '_blank');
  };

  const upiUrl = generateUpiUrl(settings, statement.netDue, activeClient.name);

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Top Controls Bar (Hidden in Print) */}
      <div className="print:hidden bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📑</span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              બિલ ડાયરી (ગ્રાહક ખાતાવહી સ્લીપ)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            અસલ પોકેટ ડાયરી ફોર્મેટ: છેલ્લા ૧૦ મહિનાનો હિસાબ &ldquo;જમા જમા&rdquo; સ્ટેમ્પ સાથે
          </p>
        </div>

        {/* Client Search & Prev/Next Switcher */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ખાતા નં અથવા નામ શોધો..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={handlePrevClient}
              disabled={activeClientIndex === 0}
              className="p-1.5 rounded-lg text-slate-700 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-all"
              title="અગાઉનું ખાતું"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold px-2 text-slate-800">
              #{activeClient.accountNo}
            </span>
            <button
              type="button"
              onClick={handleNextClient}
              disabled={activeClientIndex === sortedClients.length - 1}
              className="p-1.5 rounded-lg text-slate-700 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-all"
              title="આગળનું ખાતું"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleWhatsApp}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap"
          >
            <Share2 className="w-4 h-4" />
            <span>WhatsApp બિલ</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap"
          >
            <Printer className="w-4 h-4" />
            <span>સ્લીપ પ્રિન્ટ</span>
          </button>
        </div>
      </div>

      {/* Client Quick Picker (Chips of First 20 or Filtered) */}
      <div className="print:hidden bg-white/70 backdrop-blur-xs rounded-2xl p-2.5 border border-slate-200/80 overflow-x-auto scrollbar-none flex items-center gap-1.5">
        <span className="text-[11px] font-bold text-slate-400 shrink-0 px-2">ખાતા પસંદ કરો:</span>
        {filteredClients.slice(0, 30).map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSelectedClientId(c.id)}
            className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              c.id === activeClient.id
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            #{c.accountNo} {c.name.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* ================= AUTHENTIC DESHI POCKET DIARY SLIP (PHOTO 1 & 2 SPEC) ================= */}
      <div className="flex justify-center">
        <div className="bg-white rounded-3xl shadow-xl border-2 border-slate-300 w-full max-w-2xl overflow-hidden font-mono text-slate-900 print:shadow-none print:border-slate-800 print:rounded-none">
          {/* Perforated Top Red Notepad Header */}
          <div className="bg-red-500/10 border-b-2 border-dashed border-red-300 py-2 px-5 text-center text-xs font-sans text-red-800 font-bold flex items-center justify-between">
            <span className="flex items-center gap-1">✂️ ફાડવા માટે અહીંથી કટ</span>
            <span className="font-bold tracking-wide">
              {settings.businessName || 'વિશ્વાસ થ્રેડ કટિંગ'} — ગ્રાહક બિલ ડાયરી સ્લીપ
            </span>
            <span className="font-mono bg-red-100 text-red-900 px-2 py-0.5 rounded">
              પાના નં: #{activeClient.accountNo}
            </span>
          </div>

          {/* Slip Header (Top Part of Notepad) */}
          <div className="p-5 pb-3 border-b-2 border-slate-900 flex justify-between items-end bg-amber-50/25">
            <div className="text-left space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black text-slate-900 leading-none">
                  {activeClient.accountNo}
                </span>
                <span className="text-xs text-slate-500 font-sans font-bold uppercase tracking-wider">
                  પાના નંબર
                </span>
              </div>
              {activeClient.area && (
                <div className="flex items-center gap-1 text-xs text-slate-600 font-sans font-bold">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>{activeClient.area}</span>
                </div>
              )}
            </div>

            <div className="text-right space-y-0.5">
              <h3 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                {activeClient.name}
              </h3>
              {activeClient.phone && (
                <div className="flex items-center justify-end gap-1.5 text-xs sm:text-sm font-bold text-slate-700 tracking-wider font-mono">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{activeClient.phone}</span>
                </div>
              )}
              <div className="text-[11px] text-slate-500 font-sans">
                પ્રોપ્રાઈટર: {settings.ownerName} | મો.: {settings.phone}
              </div>
            </div>
          </div>

          {/* ================= 10 MONTHS HISTORY WITH "જમા જમા" STAMP ================= */}
          <div className="p-4 sm:p-6 space-y-2">
            <div className="text-[11px] font-sans font-bold text-slate-500 flex justify-between items-center pb-2 border-b-2 border-blue-300">
              <span className="w-1/4 text-left">મહિનાવાર બિલ રકમ</span>
              <span className="w-1/4 text-center">માસ (મહિનો)</span>
              <span className="w-1/4 text-center">ચુકવણી તારીખ</span>
              <span className="w-1/4 text-right">ખાતાવહી સ્થિતિ</span>
            </div>

            <div className="divide-y divide-blue-100 font-sans text-xs">
              {statement.months.map((m, idx) => {
                return (
                  <div
                    key={m.monthKey}
                    className={`flex items-center justify-between py-2.5 px-2 transition-colors ${
                      m.isCurrentMonth
                        ? 'bg-amber-50/80 font-bold border-l-4 border-amber-500'
                        : idx % 2 === 0
                        ? 'bg-slate-50/40'
                        : 'bg-white'
                    }`}
                  >
                    {/* 1. Left Side: Month-wise Amount */}
                    <div className="w-1/4 text-left">
                      <span className="font-mono font-black text-slate-950 text-sm">
                        ₹{m.billAmount.toLocaleString('gu-IN')}
                      </span>
                    </div>

                    {/* 2. Month Name */}
                    <div className="w-1/4 text-center">
                      <span className="font-bold text-slate-800">
                        {m.monthLabelGujarati}
                      </span>
                      {m.isCurrentMonth && (
                        <span className="block text-[10px] text-amber-700 font-bold">
                          (ચાલુ માસ)
                        </span>
                      )}
                    </div>

                    {/* 3. Payment Date */}
                    <div className="w-1/4 text-center">
                      {m.isPaid ? (
                        <span className="font-mono text-slate-700 font-bold text-[11px]">
                          જમા તા. {m.paymentDate || '-'}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </div>

                    {/* 4. Status: Two times Green "જમા જમા" or "બાકી" */}
                    <div className="w-1/4 text-right">
                      {m.isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-100 border border-emerald-400 text-emerald-800 font-black text-[11px] tracking-wider shadow-2xs">
                          <span>જમા</span>
                          <span>જમા</span>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 ml-0.5" />
                        </span>
                      ) : m.isCurrentMonth ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-100 border border-amber-300 text-amber-900 font-bold text-[11px]">
                          ચાલુ માસ બાકી
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-red-100 border border-red-300 text-red-800 font-bold text-[11px]">
                          બાકી (₹{m.pendingAmount.toLocaleString('gu-IN')})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ================= HORIZONTAL RULING LINE (આડો લીટો) ================= */}
            <div className="border-t-4 border-slate-900 my-4" />

            {/* Bottom Total & QR Code Area */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-2">
              {/* Financial Calculation Summary (7 Cols) */}
              <div className="md:col-span-7 space-y-2 font-sans">
                <div className="flex justify-between items-center text-xs text-slate-600">
                  <span>૧૦ મહિનાનું કુલ બિલ:</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{statement.totalBilled.toLocaleString('gu-IN')}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs text-emerald-700">
                  <span>કુલ જમા થયેલ રકમ (જમા જમા):</span>
                  <span className="font-mono font-bold">
                    - ₹{statement.totalPaid.toLocaleString('gu-IN')}
                  </span>
                </div>

                <div className="p-3 bg-slate-900 text-amber-400 rounded-2xl flex justify-between items-center shadow-md">
                  <div>
                    <span className="text-[10px] text-slate-300 uppercase font-bold block">
                      કુલ ચૂકવવાપાત્ર ચોખ્ખી બાકી રકમ:
                    </span>
                    <span className="text-xl sm:text-2xl font-black font-mono">
                      ₹{statement.netDue.toLocaleString('gu-IN')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenPaymentModal(activeClient.id)}
                    className="print:hidden px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>જમા લોગ કરો</span>
                  </button>
                </div>
              </div>

              {/* UPI QR Code Area (5 Cols) - Strictly in Bill Diary! */}
              <div className="md:col-span-5 bg-slate-50 p-3 rounded-2xl border border-slate-300 text-center flex flex-col items-center justify-center">
                {settings.upiId && statement.netDue > 0 ? (
                  <>
                    <QRCodeSVG
                      value={upiUrl}
                      size={105}
                      level="M"
                      className="rounded-lg shadow-2xs border border-slate-200 bg-white p-1"
                    />
                    <div className="mt-1.5">
                      <span className="text-[10px] text-slate-700 font-bold block">
                        GPay / PhonePe / Paytm થી સ્કેન કરો
                      </span>
                      <span className="text-[9px] font-mono text-slate-500 block">
                        UPI: {settings.upiId}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
                    <span className="font-bold text-slate-700 block">ખાતું ચુકતે છે!</span>
                    <span>કોઈ બાકી રકમ નથી.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Signature */}
            <div className="pt-3 border-t border-dashed border-slate-300 flex justify-between items-center text-[10px] text-slate-500 font-sans">
              <span>* આ બિલ કમ્પ્યુટર નિર્મિત પાકી ખાતાવહી સ્લીપ છે.</span>
              <span className="font-bold text-slate-800">
                {settings.businessName || 'વિશ્વાસ થ્રેડ કટિંગ'} વતી
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

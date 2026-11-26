import React, { useState } from 'react';
import { X, Phone, Calendar, AlertCircle, CheckCircle2, CreditCard } from 'lucide-react';
import type { Client, DailyEntry, PaymentRecord } from '../types';
import { formatDateDDMMYYYY } from '../utils/billing';

interface ClientDetailModalProps {
  client: Client;
  entries: DailyEntry[];
  payments: PaymentRecord[];
  onClose: () => void;
  onOpenPaymentModal: (clientId: string) => void;
}

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  client,
  entries,
  payments,
  onClose,
  onOpenPaymentModal,
}) => {
  // USER REQUEST: Toggle between Authentic Pocket Diary Slip (Photo 1 & 2) and Modern Summary
  const [modalViewMode, setModalViewMode] = useState<'pocket' | 'summary'>('pocket');
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  
  // Last month calculation
  const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

  const clientEntries = entries.filter((e) => e.clientId === client.id);
  const thisMonthEntries = clientEntries.filter((e) => e.date.startsWith(currentMonth));
  const lastMonthEntries = clientEntries.filter((e) => e.date.startsWith(lastMonth));

  // Sort entries descending
  const sortedEntries = [...clientEntries].sort((a, b) => b.date.localeCompare(a.date));
  const latestEntry = sortedEntries[0];

  // Days since last visit calculation
  let daysSinceLastVisit: number | null = null;
  if (latestEntry) {
    const lastDate = new Date(latestEntry.date);
    const diffTime = Math.abs(today.getTime() - lastDate.getTime());
    daysSinceLastVisit = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  // Monthly meters
  const thisMonthMeters = thisMonthEntries.reduce((sum, e) => sum + (e.meters || 0), 0);
  const lastMonthMeters = lastMonthEntries.reduce((sum, e) => sum + (e.meters || 0), 0);
  const allTimeMeters = clientEntries.reduce((sum, e) => sum + (e.meters || 0), 0);

  // Financials
  const thisMonthBill = thisMonthEntries.reduce((sum, e) => sum + (e.meters * e.rateApplied), 0);
  const totalPaid = payments
    .filter((p) => p.clientId === client.id)
    .reduce((sum, p) => sum + (p.amountPaid || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full h-[88vh] max-h-[88vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header - Fixed at Top */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-start justify-between shrink-0 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-lg">
                ખાતા નં: #{client.accountNo}
              </span>
              {client.area && (
                <span className="bg-slate-800 text-slate-300 text-xs px-2.5 py-0.5 rounded-lg border border-slate-700">
                  {client.area}
                </span>
              )}
            </div>
            <h3 className="text-xl font-black text-white">{client.name}</h3>
            {client.phone && (
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>{client.phone}</span>
                <a
                  href={`tel:${client.phone}`}
                  className="ml-2 px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px]"
                >
                  કૉલ કરો
                </a>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle: Pocket Diary Slip vs Modern */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl text-xs font-bold border border-slate-700">
              <button
                type="button"
                onClick={() => setModalViewMode('pocket')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  modalViewMode === 'pocket'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📑 પોકેટ ડાયરી
              </button>
              <button
                type="button"
                onClick={() => setModalViewMode('summary')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  modalViewMode === 'summary'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📊 સમરી
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain divide-y divide-slate-100">
          {modalViewMode === 'pocket' ? (
            /* ================= 1. AUTHENTIC POCKET DIARY SLIP (PHOTO 1 & 2 STYLE) ================= */
            <div className="p-4 sm:p-6 bg-slate-100 flex justify-center">
              <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-300 w-full max-w-lg overflow-hidden font-mono text-slate-900">
                {/* Perforated Top Notepad Header with Red Strip */}
                <div className="bg-red-500/10 border-b-2 border-dashed border-red-300 py-1.5 px-4 text-center text-[11px] font-sans text-red-800 font-bold flex items-center justify-between">
                  <span>✂️ ફાડવા માટે અહીંથી કટ</span>
                  <span className="font-mono">વિશ્વાસ થ્રેડ કટિંગ — પાર્ટી ખાતાવહી સ્લીપ</span>
                  <span>#{client.accountNo}</span>
                </div>

                {/* Slip Header matching photo: Account # on Left, Party Name & Phone on Right */}
                <div className="p-4 pb-2 border-b-2 border-slate-800 flex justify-between items-end bg-amber-50/20">
                  <div className="text-left">
                    <span className="text-3xl font-black text-slate-900 leading-none">
                      {client.accountNo}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-sans">ખાતા નંબર</span>
                  </div>

                  <div className="text-right">
                    <h4 className="text-lg font-black text-slate-950 tracking-wide">
                      {client.name}
                    </h4>
                    {client.phone && (
                      <span className="text-xs font-bold text-slate-700 tracking-wider block">
                        {client.phone}
                      </span>
                    )}
                  </div>
                </div>

                {/* 2-Column Split Body (Left: Entries | Right: Calculation Area) */}
                <div className="grid grid-cols-12 min-h-[380px] text-xs">
                  {/* Left Column (7 Cols): Meters & Dates with vertical blue divider line */}
                  <div className="col-span-7 border-r-2 border-blue-400 p-2 sm:p-3 divide-y divide-blue-100">
                    <div className="flex justify-between pb-1 font-bold text-slate-600 text-[11px] border-b-2 border-blue-300 font-sans mb-1">
                      <span>કાપડના મીટર</span>
                      <span>તારીખ (Date)</span>
                    </div>

                    {clientEntries.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 font-sans">
                        કોઈ એન્ટ્રી નથી
                      </div>
                    ) : (
                      clientEntries.slice(0, 22).map((entry) => (
                        <div key={entry.id} className="flex justify-between py-1 px-1 hover:bg-amber-50/50">
                          <span className="font-bold text-slate-900 text-xs">
                            {entry.meters}
                          </span>
                          <span className="font-bold text-slate-700 tracking-wider">
                            {formatDateDDMMYYYY(entry.date).replace(/\//g, ' , ')}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Right Column (5 Cols): Ruled Calculation Box (Total * Rate = Bill) */}
                  <div className="col-span-5 p-3 flex flex-col justify-between bg-slate-50/60 font-sans">
                    <div className="space-y-3">
                      <div className="border-b border-slate-300 pb-2">
                        <span className="text-[10px] text-slate-500 uppercase block font-bold">ચાલુ માસ મીટર:</span>
                        <span className="text-base font-black text-slate-950 font-mono">
                          {thisMonthMeters.toLocaleString('gu-IN')} મી.
                        </span>
                      </div>

                      <div className="border-b border-slate-300 pb-2">
                        <span className="text-[10px] text-slate-500 uppercase block font-bold">મીટર દીઠ ભાવ:</span>
                        <span className="text-sm font-black text-amber-800 font-mono">
                          × ₹{client.ratePerMeter.toFixed(2)}
                        </span>
                      </div>

                      <div className="bg-amber-100/70 p-2 rounded-xl border border-amber-300">
                        <span className="text-[10px] text-amber-900 block font-bold">આ માસનું બિલ:</span>
                        <span className="text-base font-black text-amber-950 font-mono">
                          ₹{thisMonthBill.toLocaleString('gu-IN')}
                        </span>
                      </div>

                      {client.openingBalance > 0 && (
                        <div className="text-[11px] text-slate-600 pt-1">
                          <span>જૂની બાકી: </span>
                          <strong className="text-slate-900 font-mono">₹{client.openingBalance.toLocaleString('gu-IN')}</strong>
                        </div>
                      )}

                      {totalPaid > 0 && (
                        <div className="text-[11px] text-emerald-700 pt-0.5">
                          <span>મળેલ જમા: </span>
                          <strong className="font-mono">-₹{totalPaid.toLocaleString('gu-IN')}</strong>
                        </div>
                      )}
                    </div>

                    {/* Bottom Grand Total Box */}
                    <div className="pt-3 border-t-2 border-slate-900 mt-4">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">ચૂકવવાપાત્ર બાકી:</span>
                      <span className="text-lg font-black text-slate-950 font-mono block">
                        ₹{(client.openingBalance + thisMonthBill - totalPaid).toLocaleString('gu-IN')}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenPaymentModal(client.id);
                        }}
                        className="mt-3 w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>જમા કરો</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ================= 2. MODERN SUMMARY VIEW ================= */
            <>
              {/* Inactivity Alert / Frequency Tracker */}
              <div className="p-4 bg-slate-50">
                {daysSinceLastVisit === null ? (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <AlertCircle className="w-4 h-4 text-slate-400" />
                    <span>હજુ સુધી કોઈ નવી એન્ટ્રી નોંધાયેલ નથી.</span>
                  </div>
                ) : daysSinceLastVisit <= 3 ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span><strong>રેગ્યુલર ગ્રાહક:</strong> છેલ્લે {formatDateDDMMYYYY(latestEntry.date)} ના રોજ આવ્યા હતા (ડેઇલી માલ આવે છે).</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs text-amber-900 bg-amber-50 p-3 rounded-xl border border-amber-200">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        <strong>ધ્યાન આપો:</strong> છેલ્લા <strong>{daysSinceLastVisit} દિવસ</strong> ({formatDateDDMMYYYY(latestEntry.date)}) થી કામ નથી આવ્યું!
                      </span>
                    </div>
                    {client.phone && (
                      <a
                        href={`tel:${client.phone}`}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] shrink-0"
                      >
                        પૂછવા માટે કૉલ કરો
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">ચાલુ માસ કાપડ</span>
                    <span className="text-base font-black text-slate-900">
                      {thisMonthMeters.toLocaleString('gu-IN')}{' '}
                      <span className="text-[10px] font-normal text-slate-400">મી.</span>
                    </span>
                    <span className="text-[10px] text-amber-700 font-bold block mt-0.5">
                      બિલ: ₹{thisMonthBill.toLocaleString('gu-IN')}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">ગયા માસ કાપડ</span>
                    <span className="text-base font-black text-slate-700">
                      {lastMonthMeters.toLocaleString('gu-IN')}{' '}
                      <span className="text-[10px] font-normal text-slate-400">મી.</span>
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">કુલ લાઇફટાઇમ</span>
                    <span className="text-base font-black text-amber-700">
                      {allTimeMeters.toLocaleString('gu-IN')}{' '}
                      <span className="text-[10px] font-normal text-slate-400">મી.</span>
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                      જમા: ₹{totalPaid.toLocaleString('gu-IN')}
                    </span>
                  </div>
                </div>

                {/* Account Balance Summary */}
                <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block">અગાઉની જૂની બાકી રકમ:</span>
                    <span className="text-lg font-black text-amber-400">₹{client.openingBalance.toLocaleString('gu-IN')}</span>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenPaymentModal(client.id);
                    }}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>પેમેન્ટ / કપાત જમા કરો</span>
                  </button>
                </div>

                {/* Recent Daily Entries Table */}
                <div>
                  <h4 className="font-bold text-xs text-slate-800 mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    <span>તાજેતરનું કામ (આંતરિક વિગત):</span>
                  </h4>
                  <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 text-xs">
                    {clientEntries.length === 0 ? (
                      <div className="p-3 text-center text-slate-400">કોઈ એન્ટ્રી નથી.</div>
                    ) : (
                      sortedEntries.slice(0, 15).map((entry) => (
                        <div key={entry.id} className="p-3 flex justify-between items-center hover:bg-slate-50">
                          <div>
                            <span className="font-bold font-mono text-slate-800">{formatDateDDMMYYYY(entry.date)}</span>
                            {entry.notes && <span className="text-slate-400 ml-2">({entry.notes})</span>}
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-slate-900">{entry.meters.toLocaleString()} મીટર</span>
                            <span className="text-slate-400 text-[11px] ml-2">₹{(entry.meters * entry.rateApplied).toFixed(2)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer - Fixed at Bottom */}
        <div className="bg-slate-50 p-3.5 px-5 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            કુલ {clientEntries.length} એન્ટ્રીઓ ઉપલબ્ધ
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-sm"
          >
            બંધ કરો (Close)
          </button>
        </div>
      </div>
    </div>
  );
};

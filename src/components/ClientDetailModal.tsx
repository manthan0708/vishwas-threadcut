import React from 'react';
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
        <div className="bg-slate-900 text-white p-5 flex items-start justify-between shrink-0 border-b border-slate-800">
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

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain divide-y divide-slate-100">
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

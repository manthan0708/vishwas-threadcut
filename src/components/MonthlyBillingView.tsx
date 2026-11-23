import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  Share2, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar,
  CreditCard,
  Eye
} from 'lucide-react';
import type { Client, DailyEntry, PaymentRecord, BusinessSettings, MonthlyCalculation } from '../types';
import { calculateClientMonth, formatWhatsAppMessage } from '../utils/billing';
import { BillInvoiceModal } from './BillInvoiceModal';
import { ClientDetailModal } from './ClientDetailModal';

interface MonthlyBillingViewProps {
  clients: Client[];
  entries: DailyEntry[];
  payments: PaymentRecord[];
  settings: BusinessSettings;
  onOpenPaymentModal: (clientId: string) => void;
}

export const MonthlyBillingView: React.FC<MonthlyBillingViewProps> = ({
  clients,
  entries,
  payments,
  settings,
  onOpenPaymentModal,
}) => {
  const today = new Date();
  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'due' | 'anomalies'>('all');
  const [viewingBillCalc, setViewingBillCalc] = useState<MonthlyCalculation | null>(null);
  const [detailClient, setDetailClient] = useState<Client | null>(null);

  // Month name formatting in Gujarati
  const getGujaratiMonthName = (monthStr: string) => {
    const [y, m] = monthStr.split('-');
    const gujMonths = [
      'જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન',
      'જુલાઈ', 'ઓગસ્ટ', 'સપ્ટેમ્બર', 'ઓક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર'
    ];
    const monthIdx = parseInt(m, 10) - 1;
    return `${gujMonths[monthIdx]} ${y}`;
  };

  const monthLabel = getGujaratiMonthName(selectedMonth);

  // Calculate for all active clients
  const allCalculations = useMemo(() => {
    return clients
      .filter((c) => c.active)
      .map((client) => calculateClientMonth(client, entries, payments, selectedMonth))
      .sort((a, b) => (a.accountNo || 0) - (b.accountNo || 0));
  }, [clients, entries, payments, selectedMonth]);

  // Totals
  const totalMetersAll = allCalculations.reduce((sum, c) => sum + c.totalMeters, 0);
  const totalMonthBill = allCalculations.reduce((sum, c) => sum + c.currentMonthAmount, 0);
  const totalPreviousPending = allCalculations.reduce((sum, c) => sum + c.previousBalance, 0);
  const totalNetOutstanding = allCalculations.reduce((sum, c) => sum + c.finalTotalDue, 0);
  const anomalyCount = allCalculations.filter((c) => c.hasAnomaly).length;

  // Filtered list
  const filteredCalculations = allCalculations.filter((calc) => {
    const q = searchQuery.trim().toLowerCase();
    const accMatch = calc.accountNo ? calc.accountNo.toString().includes(q) : false;
    const nameMatch = calc.clientName.toLowerCase().includes(q);
    const areaMatch = calc.area ? calc.area.toLowerCase().includes(q) : false;
    const phoneMatch = calc.phone.includes(q);

    const matchesSearch = !q || accMatch || nameMatch || areaMatch || phoneMatch;
    if (!matchesSearch) return false;

    if (filterType === 'due') return calc.finalTotalDue > 0;
    if (filterType === 'anomalies') return calc.hasAnomaly;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Month Picker & Verification Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span>📊</span> માસિક હિસાબ & બિલિંગ સ્ટેટમેન્ટ
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            ૧૫૦+ ગ્રાહકોનું ઓટોમેટિક કેલ્ક્યુલેશન, વેરિફિકેશન અને વ્હોટ્સએપ બિલિંગ
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2">
          <Calendar className="w-5 h-5 text-amber-600" />
          <span className="text-xs font-semibold text-slate-600">મહિનો:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent font-bold text-slate-800 text-sm focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Smart Verification Alert Banner */}
      {anomalyCount > 0 ? (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center gap-3 text-amber-900 text-xs sm:text-sm shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <span className="font-bold">સ્માર્ટ વેરિફિકેશન એલર્ટ:</span>{' '}
            {anomalyCount} ગ્રાહકના બિલમાં અસામાન્ય એન્ટ્રી જણાઈ છે. કૃપા કરીને ચેક કરો.
          </div>
          <button
            onClick={() => setFilterType('anomalies')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shrink-0 cursor-pointer"
          >
            એલર્ટ જુઓ
          </button>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center gap-2.5 text-emerald-900 text-xs sm:text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>
            <strong>સ્માર્ટ વેરિફિકેશન પાસ:</strong> તમામ ગ્રાહકોના બિલ અને સરવાળા ૧૦૦% સાચા અને વેરિફાઈડ છે.
          </span>
        </div>
      )}

      {/* Top Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <span className="text-xs font-medium text-slate-500">આ મહિનાનું કુલ કાપડ</span>
          <div className="text-lg sm:text-2xl font-black text-slate-900 mt-1">
            {totalMetersAll.toLocaleString('gu-IN')}{' '}
            <span className="text-xs font-normal text-slate-500">મીટર</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <span className="text-xs font-medium text-slate-500">આ મહિનાનું નવું બિલ</span>
          <div className="text-lg sm:text-2xl font-black text-amber-600 mt-1">
            ₹{totalMonthBill.toLocaleString('gu-IN')}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <span className="text-xs font-medium text-slate-500">અગાઉની જૂની બાકી રકમ</span>
          <div className="text-lg sm:text-2xl font-black text-slate-700 mt-1">
            ₹{totalPreviousPending.toLocaleString('gu-IN')}
          </div>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-sm">
          <span className="text-xs font-medium text-slate-400">કુલ વસૂલવાની બાકી રકમ</span>
          <div className="text-lg sm:text-2xl font-black text-amber-400 mt-1">
            ₹{totalNetOutstanding.toLocaleString('gu-IN')}
          </div>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="ખાતા નં (દા.ત. 14) / નામથી શોધો..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs sm:text-sm pl-9 pr-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 self-stretch sm:self-auto overflow-x-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            તમામ ({allCalculations.length})
          </button>
          <button
            onClick={() => setFilterType('due')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterType === 'due'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            બાકી વાળા ({allCalculations.filter((c) => c.finalTotalDue > 0).length})
          </button>
          {anomalyCount > 0 && (
            <button
              onClick={() => setFilterType('anomalies')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterType === 'anomalies'
                  ? 'bg-red-600 text-white font-bold'
                  : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              ચેતવણી વાળા ({anomalyCount})
            </button>
          )}
        </div>
      </div>

      {/* Client Calculation Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-bold">ખાતા નં / ગ્રાહકનું નામ</th>
                <th className="py-3 px-3 font-semibold text-right">આ માસ બિલ</th>
                <th className="py-3 px-3 font-semibold text-right">જૂની બાકી</th>
                <th className="py-3 px-3 font-semibold text-right">કુલ બાકી</th>
                <th className="py-3 px-4 text-center font-semibold">એક્શન</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCalculations.map((calc) => {
                const waEncodedMsg = formatWhatsAppMessage(calc, settings, monthLabel);
                const waLink = `https://wa.me/91${calc.phone.replace(/[^0-9]/g, '')}?text=${waEncodedMsg}`;
                const rawClient = clients.find((c) => c.id === calc.clientId);

                return (
                  <tr key={calc.clientId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="bg-slate-900 text-amber-400 font-bold text-xs px-2 py-0.5 rounded-md shrink-0">
                          #{calc.accountNo}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            {calc.clientName}
                            {calc.area && (
                              <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                {calc.area}
                              </span>
                            )}
                            {calc.hasAnomaly && (
                              <span
                                className="w-2 h-2 rounded-full bg-red-500 shrink-0"
                                title={calc.anomalyReason}
                              />
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">{calc.phone}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-semibold text-slate-900">
                      ₹{calc.currentMonthAmount.toLocaleString('gu-IN')}
                    </td>

                    <td className="py-3 px-3 text-right text-slate-500">
                      ₹{calc.previousBalance.toLocaleString('gu-IN')}
                    </td>

                    <td className="py-3 px-3 text-right font-black text-amber-700 text-sm">
                      ₹{calc.finalTotalDue.toLocaleString('gu-IN')}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* View Bill Button */}
                        <button
                          onClick={() => setViewingBillCalc(calc)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                          title="માસિક બિલ વાઉચર જુઓ અને પ્રિન્ટ કરો"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        {/* WhatsApp Button */}
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors"
                          title="WhatsApp બિલ મોકલો"
                        >
                          <Share2 className="w-4 h-4" />
                        </a>

                        {/* Payment Button */}
                        <button
                          onClick={() => onOpenPaymentModal(calc.clientId)}
                          className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg transition-colors cursor-pointer"
                          title="પેમેન્ટ જમા અથવા કપાત એન્ટ્રી કરો"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>

                        {/* Detail History Button */}
                        {rawClient && (
                          <button
                            onClick={() => setDetailClient(rawClient)}
                            className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg transition-colors cursor-pointer"
                            title="ગ્રાહકનો સંપૂર્ણ ઇતિહાસ જુઓ"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill Invoice Modal */}
      {viewingBillCalc && (
        <BillInvoiceModal
          calculation={viewingBillCalc}
          settings={settings}
          monthName={monthLabel}
          onClose={() => setViewingBillCalc(null)}
        />
      )}

      {/* Client Detail History Modal */}
      {detailClient && (
        <ClientDetailModal
          client={detailClient}
          entries={entries}
          payments={payments}
          onClose={() => setDetailClient(null)}
          onOpenPaymentModal={onOpenPaymentModal}
        />
      )}
    </div>
  );
};

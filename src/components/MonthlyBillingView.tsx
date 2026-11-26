import React, { useState, useMemo } from 'react';
import { 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import type { Client, DailyEntry, PaymentRecord, BusinessSettings, MonthlyCalculation } from '../types';
import { calculateClientMonth } from '../utils/billing';
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

  // USER REQUEST: Physical Notebook Page Mode with Swiping
  const [displayMode, setDisplayMode] = useState<'chopdo_pages' | 'list'>('chopdo_pages');
  const [pageIndex, setPageIndex] = useState<number>(0);
  const pageSize = 15; // 15 entries per page, exactly like a physical notebook page

  // Touch swipe tracking state
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Gujarati Month Names
  const gujMonths = [
    'જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન',
    'જુલાઈ', 'ઓગસ્ટ', 'સપ્ટેમ્બર', 'ઓક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર'
  ];

  const [selectedYear, selectedMonthNum] = selectedMonth.split('-');
  const monthLabel = `${gujMonths[parseInt(selectedMonthNum, 10) - 1]} ${selectedYear}`;

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
  const filteredCalculations = useMemo(() => {
    return allCalculations.filter((calc) => {
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
  }, [allCalculations, searchQuery, filterType]);

  // Pagination for Notebook Pages
  const totalPages = Math.max(1, Math.ceil(filteredCalculations.length / pageSize));
  const validPageIndex = Math.min(pageIndex, totalPages - 1);
  const pageCalculations = useMemo(() => {
    const start = validPageIndex * pageSize;
    return filteredCalculations.slice(start, start + pageSize);
  }, [filteredCalculations, validPageIndex, pageSize]);

  // Touch Swipe Handlers for notebook page turning
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 50) {
      // Swiped Left -> Next page
      if (validPageIndex < totalPages - 1) setPageIndex(validPageIndex + 1);
    } else if (diff < -50) {
      // Swiped Right -> Previous page
      if (validPageIndex > 0) setPageIndex(validPageIndex - 1);
    }
    setTouchStartX(null);
  };

  const handlePrevPage = () => {
    if (validPageIndex > 0) setPageIndex(validPageIndex - 1);
  };

  const handleNextPage = () => {
    if (validPageIndex < totalPages - 1) setPageIndex(validPageIndex + 1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Month & Year Picker Bar */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📖</span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              માસિક ડાયરી (ખાતાવહી ચોપડો)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            તમામ પાર્ટીઓનું માસિક કાપડ અને હિસાબ — પેજ સ્વાઈપ સાથે આંતરિક ચોપડો
          </p>
        </div>

        {/* Year and Month Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Year selector */}
          <select
            value={selectedYear}
            onChange={(e) => {
              const newYear = e.target.value;
              setSelectedMonth(`${newYear}-${selectedMonthNum}`);
              setPageIndex(0);
            }}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 cursor-pointer focus:ring-2 focus:ring-amber-500"
          >
            <option value="2026">૨૦૨૬ (2026)</option>
            <option value="2025">૨૦૨૫ (2025)</option>
            <option value="2024">૨૦૨૪ (2024)</option>
          </select>

          {/* Month selector */}
          <select
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setPageIndex(0);
            }}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 cursor-pointer focus:ring-2 focus:ring-amber-500"
          >
            {gujMonths.map((m, idx) => {
              const mVal = `${selectedYear}-${String(idx + 1).padStart(2, '0')}`;
              return (
                <option key={mVal} value={mVal}>
                  {m} ({idx + 1})
                </option>
              );
            })}
          </select>

          {/* Mode Switcher: Chopdo Pages vs Table List */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
            <button
              type="button"
              onClick={() => setDisplayMode('chopdo_pages')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                displayMode === 'chopdo_pages'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📖 પેજ સ્વાઈપ
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('list')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                displayMode === 'list'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📋 આખી લિસ્ટ
            </button>
          </div>
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
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center gap-2.5 text-emerald-900 text-xs sm:text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>સ્માર્ટ વેરિફિકેશન પાસ:</strong> આ માસના તમામ ૧૫૦+ ગ્રાહકોના મીટર અને સરવાળા ચોપડા મુજબ વેરિફાઈડ છે.
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

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="ખાતા નં (દા.ત. 14) / નામથી શોધો..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPageIndex(0);
            }}
            className="w-full text-xs sm:text-sm pl-9 pr-4 py-1.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 self-stretch sm:self-auto overflow-x-auto">
          <button
            onClick={() => {
              setFilterType('all');
              setPageIndex(0);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-slate-800 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            તમામ ({allCalculations.length})
          </button>
          <button
            onClick={() => {
              setFilterType('due');
              setPageIndex(0);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterType === 'due'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            બાકી વાળા ({allCalculations.filter((c) => c.finalTotalDue > 0).length})
          </button>
        </div>
      </div>

      {/* ================= VIEW 1: AUTHENTIC CHOPDO PAGES WITH TOUCH SWIPING ================= */}
      {displayMode === 'chopdo_pages' ? (
        <div
          className="space-y-4"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Page Navigation & Flip Controls */}
          <div className="bg-slate-900 text-white rounded-2xl p-3 sm:p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-black text-sm flex items-center gap-1">
                <span>📖</span> માસિક ખાતાવહી ચોપડો
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">
                ({monthLabel})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={validPageIndex === 0}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>પાછલું પાનું</span>
              </button>

              <span className="text-xs font-mono font-bold bg-amber-500 text-slate-950 px-3 py-1.5 rounded-xl shadow-xs">
                પાનું {validPageIndex + 1} / {totalPages}
              </span>

              <button
                type="button"
                onClick={handleNextPage}
                disabled={validPageIndex >= totalPages - 1}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <span>આગળનું પાનું</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="text-center text-[11px] text-slate-500 font-sans">
            👉 મોબાઈલમાં ચોપડાના પાના પલટાવવા ડાબે-જમણે સ્વાઈપ (Swipe) કરી શકો છો
          </div>

          {/* Physical Deshi Chopdo Page */}
          <div className="deshi-chopdo-page rounded-3xl border-2 border-slate-300 shadow-xl p-4 sm:p-6 font-mono text-slate-900 overflow-x-auto min-h-[500px]">
            {/* Top Red Margin Header */}
            <div className="flex justify-between items-center pb-3 border-b-2 border-red-400 mb-3 text-xs font-sans">
              <div className="text-slate-600 font-bold">
                શ્રી ગણેશાય નમઃ | માસ: <strong className="text-slate-900">{monthLabel}</strong>
              </div>
              <div className="bg-red-100 text-red-900 px-3 py-0.5 rounded-full font-bold">
                ચોપડા પાના નં: {validPageIndex + 1} (ખાતા #{pageCalculations[0]?.accountNo || 1} થી #{pageCalculations[pageCalculations.length - 1]?.accountNo || 15})
              </div>
              <div className="text-slate-600 font-bold">
                વિશ્વાસ થ્રેડ કટિંગ ખાતાવહી
              </div>
            </div>

            <table className="w-full text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-red-300 text-slate-700 font-bold font-sans">
                  <th className="py-2.5 px-3 text-left w-12">ખાતા નં</th>
                  <th className="py-2.5 px-3 text-left">પાર્ટીનું નામ & વિસ્તાર</th>
                  <th className="py-2.5 px-3 text-right">આ માસ કાપડ</th>
                  <th className="py-2.5 px-3 text-right">બિલ રકમ (₹)</th>
                  <th className="py-2.5 px-3 text-right">જૂની બાકી (₹)</th>
                  <th className="py-2.5 px-3 text-right">જમા રકમ (₹)</th>
                  <th className="py-2.5 px-3 text-right font-black">ચોખ્ખી બાકી (₹)</th>
                  <th className="py-2.5 px-2 text-center w-10">સ્લીપ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-200">
                {pageCalculations.map((calc) => {
                  const rawClient = clients.find((c) => c.id === calc.clientId);

                  return (
                    <tr key={calc.clientId} className="hover:bg-amber-100/40 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        #{calc.accountNo}
                      </td>

                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        <span>{calc.clientName}</span>
                        {calc.area && (
                          <span className="text-[11px] text-slate-500 font-normal ml-2 font-sans">
                            ({calc.area})
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                        {calc.totalMeters.toLocaleString('gu-IN')} મી.
                      </td>

                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        ₹{calc.currentMonthAmount.toLocaleString('gu-IN')}
                      </td>

                      <td className="py-2.5 px-3 text-right text-slate-600">
                        ₹{calc.previousBalance.toLocaleString('gu-IN')}
                      </td>

                      <td className="py-2.5 px-3 text-right text-emerald-700 font-bold">
                        {calc.paymentsReceived > 0 ? `₹${calc.paymentsReceived.toLocaleString('gu-IN')}` : '-'}
                      </td>

                      <td className="py-2.5 px-3 text-right font-black text-amber-900 text-sm">
                        ₹{calc.finalTotalDue.toLocaleString('gu-IN')}
                      </td>

                      <td className="py-2.5 px-2 text-center">
                        {rawClient && (
                          <button
                            type="button"
                            onClick={() => setDetailClient(rawClient)}
                            className="p-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-slate-900 transition-colors cursor-pointer"
                            title="ગ્રાહકની સ્લીપ જુઓ"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-red-400 font-bold bg-amber-50/50">
                <tr>
                  <td colSpan={2} className="py-2.5 px-3 text-slate-800 font-sans">
                    આ પાનાનો સરવાળો ({pageCalculations.length} પાર્ટી):
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {pageCalculations.reduce((sum, c) => sum + c.totalMeters, 0).toLocaleString('gu-IN')} મી.
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    ₹{pageCalculations.reduce((sum, c) => sum + c.currentMonthAmount, 0).toLocaleString('gu-IN')}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-500">-</td>
                  <td className="py-2.5 px-3 text-right text-emerald-700">
                    ₹{pageCalculations.reduce((sum, c) => sum + c.paymentsReceived, 0).toLocaleString('gu-IN')}
                  </td>
                  <td className="py-2.5 px-3 text-right text-amber-950 font-black">
                    ₹{pageCalculations.reduce((sum, c) => sum + c.finalTotalDue, 0).toLocaleString('gu-IN')}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        /* ================= VIEW 2: STANDARD TABLE LIST ================= */
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
                          {rawClient && (
                            <button
                              onClick={() => setDetailClient(rawClient)}
                              className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg transition-colors cursor-pointer"
                              title="ગ્રાહકની સ્લીપ જુઓ"
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
      )}

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

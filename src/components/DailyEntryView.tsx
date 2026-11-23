import React, { useState, useMemo } from 'react';
import { 
  PlusCircle, 
  Calendar, 
  Check, 
  Trash2, 
  AlertTriangle, 
  ArrowRight, 
  CheckSquare, 
  Square,
  Lock,
  Unlock,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Client, DailyEntry } from '../types';
import { formatDateDDMMYYYY } from '../utils/billing';

interface DailyEntryViewProps {
  clients: Client[];
  entries: DailyEntry[];
  onAddEntry: (entry: Omit<DailyEntry, 'id' | 'createdAt'>) => Promise<void>;
  onDeleteEntry: (id: string) => Promise<void>;
}

export const DailyEntryView: React.FC<DailyEntryViewProps> = ({
  clients,
  entries,
  onAddEntry,
  onDeleteEntry,
}) => {
  // Always default to real system TODAY
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [meters, setMeters] = useState<string>('');
  const [customRate, setCustomRate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // USER RULE: Default hide Rate and Rupees unless checkbox is checked!
  const [showRateAndRupees, setShowRateAndRupees] = useState<boolean>(false);

  // Locked/Finalized Dates tracking (stored in localStorage so it persists)
  const [finalizedDates, setFinalizedDates] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('vtc_finalized_dates');
      if (saved) return new Set(JSON.parse(saved));
    } catch {}
    // Default past dates are finalized
    return new Set<string>();
  });

  // Calculate Last 3 Days for the compact top selector
  const last3Days = useMemo(() => {
    const dates: { dateStr: string; label: string }[] = [];
    const labels = ['આજે', 'ગઈકાલે', 'પરમદિવસે'];
    for (let i = 0; i < 3; i++) {
      const dt = new Date();
      dt.setDate(dt.getDate() - i);
      dates.push({
        dateStr: dt.toISOString().split('T')[0],
        label: labels[i],
      });
    }
    return dates;
  }, []);

  // Determine if the currently viewed date is locked
  const isPastDate = selectedDate < todayStr;
  const isDayFinalized = finalizedDates.has(selectedDate) || isPastDate;

  // Manual unlock state for emergency corrections
  const [unlockedDates, setUnlockedDates] = useState<Set<string>>(new Set());
  const isCurrentlyLocked = isDayFinalized && !unlockedDates.has(selectedDate);

  // Selected client object
  const activeClient = clients.find((c) => c.id === selectedClientId);

  // Check if selected client already visited on selectedDate
  const existingDayEntry = entries.find(
    (e) => e.clientId === selectedClientId && e.date === selectedDate
  );

  // Compute regularity for each client (entries in last 7 days)
  const clientActivityMap = useMemo(() => {
    const map = new Map<string, number>();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];

    for (const entry of entries) {
      if (entry.date >= oneWeekAgoStr) {
        map.set(entry.clientId, (map.get(entry.clientId) || 0) + 1);
      }
    }
    return map;
  }, [entries]);

  // Sort clients: Regular / frequent visitors come FIRST!
  const sortedClients = useMemo(() => {
    return [...clients].filter((c) => c.active).sort((a, b) => {
      const aRecent = clientActivityMap.get(a.id) || 0;
      const bRecent = clientActivityMap.get(b.id) || 0;
      if (bRecent !== aRecent) {
        return bRecent - aRecent;
      }
      return (a.accountNo || 0) - (b.accountNo || 0);
    });
  }, [clients, clientActivityMap]);

  // Handle client selection
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setCustomRate(client.ratePerMeter.toString());
    }
  };

  // Filter client search by Account No, Name, Area, or Phone
  const filteredClients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sortedClients;

    return sortedClients.filter((c) => {
      const accMatch = c.accountNo ? c.accountNo.toString() === q || c.accountNo.toString().includes(q) : false;
      const nameMatch = c.name.toLowerCase().includes(q);
      const areaMatch = c.area ? c.area.toLowerCase().includes(q) : false;
      const phoneMatch = c.phone.includes(q);
      return accMatch || nameMatch || areaMatch || phoneMatch;
    });
  }, [sortedClients, searchQuery]);

  // Auto-select if exact account number matched
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    const trimmed = val.trim();
    if (trimmed && /^\d+$/.test(trimmed)) {
      const exactAcc = clients.find((c) => c.accountNo === parseInt(trimmed, 10));
      if (exactAcc) {
        handleClientSelect(exactAcc.id);
      }
    }
  };

  const handleSaveDraftEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCurrentlyLocked) {
      alert('આ તારીખનો હિસાબ ફાઇનલ થયેલ છે. એન્ટ્રી ઉમેરવા માટે પહેલા અનલોક કરો.');
      return;
    }

    if (!selectedClientId || !activeClient) {
      alert('કૃપા કરીને ખાતા નં અથવા નામથી ગ્રાહક પસંદ કરો.');
      return;
    }
    const parsedMeters = parseFloat(meters);
    if (isNaN(parsedMeters) || parsedMeters <= 0) {
      alert('કૃપા કરીને માન્ય મીટર દાખલ કરો.');
      return;
    }
    const parsedRate = parseFloat(customRate) || activeClient.ratePerMeter;

    await onAddEntry({
      clientId: activeClient.id,
      clientName: activeClient.name,
      date: selectedDate,
      meters: parsedMeters,
      rateApplied: parsedRate,
      notes: notes.trim() || undefined,
    });

    setMeters('');
    setNotes('');
    setSearchQuery('');

    if (existingDayEntry) {
      const prevTotal = existingDayEntry.meters;
      const newTotal = prevTotal + parsedMeters;
      setSuccessToast(`✓ ખાતા #${activeClient.accountNo} માં +${parsedMeters} મીટર જોડાયા (${prevTotal} + ${parsedMeters} = ${newTotal})!`);
    } else {
      setSuccessToast(`✓ ખાતા #${activeClient.accountNo} (${activeClient.name}) ના ${parsedMeters} મીટર સેવ થયા!`);
    }

    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Finalize / Save & Update Day Entries
  const handleFinalizeAndCommit = () => {
    const updated = new Set(finalizedDates);
    updated.add(selectedDate);
    setFinalizedDates(updated);
    try {
      localStorage.setItem('vtc_finalized_dates', JSON.stringify(Array.from(updated)));
    } catch {}

    // Lock date
    setUnlockedDates((prev) => {
      const next = new Set(prev);
      next.delete(selectedDate);
      return next;
    });

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.7 },
    });

    setSuccessToast(`✓ તારીખ ${formatDateDDMMYYYY(selectedDate)} નો સંપૂર્ણ હિસાબ સેવ & અપડેટ થઈ ગયો છે!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleUnlockDay = () => {
    if (confirm(`શું તમે તારીખ ${formatDateDDMMYYYY(selectedDate)} નો હિસાબ સુધારા માટે અનલોક કરવા માંગો છો?`)) {
      setUnlockedDates((prev) => new Set(prev).add(selectedDate));
    }
  };

  // Filter entries for selected date
  const dateEntries = entries.filter((e) => e.date === selectedDate);
  const totalDayMeters = dateEntries.reduce((sum, e) => sum + (e.meters || 0), 0);
  const totalDayAmount = dateEntries.reduce(
    (sum, e) => sum + (e.meters || 0) * (e.rateApplied || 0),
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Success Notification Toast */}
      {successToast && (
        <div className="fixed bottom-4 right-4 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <Check className="w-5 h-5" />
          <span className="font-bold text-sm">{successToast}</span>
        </div>
      )}

      {/* Top Banner with Clean Compact Selector (Max 3 Days) */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 space-y-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>📝</span> ડેઇલી થ્રેડ કટિંગ એન્ટ્રી
              </h2>
              {isCurrentlyLocked ? (
                <span className="inline-flex items-center gap-1 bg-slate-900 text-amber-400 font-bold text-xs px-2.5 py-0.5 rounded-full border border-slate-800">
                  <Lock className="w-3 h-3" />
                  સેવ & અપડેટ થયેલ (Locked)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-bold text-xs px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  ચાલુ એન્ટ્રી (Active)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              સાંજે ડાયરીમાંથી એન્ટ્રી કરી વેરિફાય કર્યા બાદ <strong>'સેવ & અપડેટ'</strong> કરો
            </p>
          </div>

          {/* Compact Date Controls: Last 3 Days Pills + Clean Date Picker */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Last 3 Days Pills */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
              {last3Days.map((item) => (
                <button
                  key={item.dateStr}
                  onClick={() => setSelectedDate(item.dateStr)}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    selectedDate === item.dateStr
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                  title={formatDateDDMMYYYY(item.dateStr)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Calendar Input */}
            <label className="relative flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-2xl px-3 py-1.5 text-xs cursor-pointer shadow-xs transition-colors">
              <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-mono font-bold text-slate-800">
                તારીખ: {formatDateDDMMYYYY(selectedDate)}
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                title="બીજી તારીખ પસંદ કરો"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Entry Form OR Locked State */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          {isCurrentlyLocked ? (
            /* ================= LOCKED PAST DATE CARD ================= */
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto border border-slate-200 shadow-xs">
                <Lock className="w-8 h-8 text-slate-600" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-slate-900 text-base">
                  તારીખ {formatDateDDMMYYYY(selectedDate)} નો હિસાબ ફાઇનલ છે
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  ભૂલથી ખોટી એન્ટ્રી ન થઈ જાય તે માટે પાછલા દિવસોનું ફોર્મ લૉક રાખવામાં આવે છે.
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs space-y-1 max-w-xs mx-auto text-left">
                <div className="flex justify-between text-slate-600">
                  <span>કુલ ગ્રાહકો:</span>
                  <strong className="text-slate-900">{dateEntries.length} જણા</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>કુલ કાપડ:</span>
                  <strong className="text-slate-900">{totalDayMeters.toLocaleString('gu-IN')} મીટર</strong>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleUnlockDay}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 mx-auto transition-colors cursor-pointer border border-slate-300"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>સુધારો કરવા માટે અનલોક કરો</span>
                </button>
              </div>
            </div>
          ) : (
            /* ================= ACTIVE ENTRY FORM ================= */
            <>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-amber-500" />
                નવી એન્ટ્રી ઉમેરો ({formatDateDDMMYYYY(selectedDate)})
              </h3>

              <form onSubmit={handleSaveDraftEntry} className="space-y-4">
                {/* Quick Search with Account No / Name / Area */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    ખાતા નં / નામ / વિસ્તાર શોધો:
                  </label>
                  <input
                    type="text"
                    placeholder="દા.ત. 14 અથવા સુરેશ અથવા દિવાળીબાગ"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 mb-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />

                  {/* Select Dropdown with Account No */}
                  <select
                    value={selectedClientId}
                    onChange={(e) => handleClientSelect(e.target.value)}
                    required
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none font-semibold text-slate-900"
                  >
                    <option value="">-- ગ્રાહક પસંદ કરો ({filteredClients.length} હાજર) --</option>
                    {filteredClients.map((client) => {
                      const isRegular = (clientActivityMap.get(client.id) || 0) > 0;
                      return (
                        <option key={client.id} value={client.id}>
                          #{client.accountNo} - {client.name} {client.area ? `(${client.area})` : ''} {isRegular ? '🔥 [રેગ્યુલર]' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Selected Client Card Preview & Existing Visit Alert */}
                {activeClient && (
                  <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-amber-950 text-sm">
                        #{activeClient.accountNo} - {activeClient.name}
                      </span>
                      {activeClient.area && (
                        <span className="bg-amber-200/80 text-amber-900 font-bold px-2 py-0.5 rounded-md text-[11px]">
                          {activeClient.area}
                        </span>
                      )}
                    </div>

                    {/* Notice if client already came today */}
                    {existingDayEntry ? (
                      <div className="p-2 bg-emerald-100/80 border border-emerald-300 rounded-xl text-emerald-900 font-bold text-[11px] flex items-center gap-1.5">
                        <span>⚡</span>
                        <span>
                          આ ગ્રાહક આજે પહેલેથી આવી ગયા છે ({existingDayEntry.meters} મીટર). હવે જે મીટર નાખશો તે સીધા <strong>પ્લસ (+)</strong> થઈ જશે!
                        </span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-slate-700 font-medium">
                        <span>જૂની બાકી: <strong className="text-slate-900">₹{activeClient.openingBalance.toLocaleString('gu-IN')}</strong></span>
                        {showRateAndRupees && (
                          <span>ફિક્સ ભાવ: <strong className="text-amber-800">₹{activeClient.ratePerMeter}/મીટર</strong></span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Meters Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    કાપડના મીટર (Meters):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      placeholder="દા.ત. 2200"
                      value={meters}
                      onChange={(e) => setMeters(e.target.value)}
                      required
                      className="w-full text-lg font-black px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <span className="absolute right-3.5 top-3 text-xs font-bold text-slate-400">
                      મીટર
                    </span>
                  </div>
                  {parseFloat(meters) > 8000 && (
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-300">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>અસામાન્ય મોટી એન્ટ્રી છે ({meters} મીટર). શું આ સાચું છે?</span>
                    </div>
                  )}
                </div>

                {/* Custom Rate Override (Only if showRateAndRupees is ON) */}
                {showRateAndRupees && (
                  <div className="grid grid-cols-2 gap-3 animate-in fade-in">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        મીટર દીઠ ભાવ (₹):
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={customRate}
                        onChange={(e) => setCustomRate(e.target.value)}
                        className="w-full text-sm font-semibold px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        આજની રકમ:
                      </label>
                      <div className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-sm font-bold text-slate-800 flex items-center h-[38px]">
                        ₹
                        {(
                          (parseFloat(meters) || 0) *
                          (parseFloat(customRate) || (activeClient?.ratePerMeter ?? 0))
                        ).toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    નોંધ / લોટ નંબર (મરજિયાત):
                  </label>
                  <input
                    type="text"
                    placeholder="દા.ત. સાડી, ડ્રેસ, લોટ ૧, લોટ ૨"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  <span>{existingDayEntry ? 'મીટર જોડો (+ Add to Today)' : 'એન્ટ્રી સેવ કરો (Add Entry)'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>

        {/* Right Column (7 Cols): Today's Entries Table + Final Save & Update Button */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Table Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">
                  તારીખ {formatDateDDMMYYYY(selectedDate)} ની એન્ટ્રીઓ
                </h3>
                <p className="text-xs text-slate-500">
                  કુલ {dateEntries.length} ગ્રાહકોનું કામ નોંધાયેલું છે
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Checkbox to Toggle Rate & Rupees Display */}
                <label className="flex items-center gap-1.5 cursor-pointer bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 select-none transition-colors">
                  <input
                    type="checkbox"
                    checked={showRateAndRupees}
                    onChange={(e) => setShowRateAndRupees(e.target.checked)}
                    className="hidden"
                  />
                  {showRateAndRupees ? (
                    <CheckSquare className="w-4 h-4 text-amber-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>ભાવ & રકમ (₹) દર્શાવો</span>
                </label>

                <div className="flex gap-2 text-xs bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <div>
                    કુલ મીટર: <span className="font-black text-slate-900">{totalDayMeters.toLocaleString('gu-IN')}</span>
                  </div>
                  {showRateAndRupees && (
                    <div className="border-l border-slate-300 pl-2">
                      કુલ રકમ: <span className="font-bold text-amber-700">₹{totalDayAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Table */}
            {dateEntries.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs sm:text-sm border border-dashed rounded-2xl p-6">
                આ તારીખ માટે કોઈ એન્ટ્રી નથી. ડાબી બાજુથી ગ્રાહક પસંદ કરીને મીટર ઉમેરો.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 font-bold">ગ્રાહક (ખાતા નં)</th>
                      <th className="py-2.5 px-3 font-bold text-right">કાપડના મીટર (Meters)</th>
                      {showRateAndRupees && (
                        <>
                          <th className="py-2.5 px-3 font-semibold text-right">ભાવ</th>
                          <th className="py-2.5 px-3 font-semibold text-right">રકમ (₹)</th>
                        </>
                      )}
                      {!isCurrentlyLocked && (
                        <th className="py-2.5 px-2 text-center font-bold">ક્રિયા</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dateEntries.map((entry) => {
                      const client = clients.find((c) => c.id === entry.clientId);
                      const hasMultipleVisits = entry.metersBreakdown && entry.metersBreakdown.length > 1;

                      return (
                        <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              {client?.accountNo && (
                                <span className="bg-slate-900 text-amber-400 font-bold text-[10px] px-1.5 py-0.5 rounded">
                                  #{client.accountNo}
                                </span>
                              )}
                              <span className="font-bold text-slate-900">{entry.clientName}</span>
                            </div>
                            {entry.notes && (
                              <div className="text-xs text-slate-400 mt-0.5">{entry.notes}</div>
                            )}
                          </td>

                          {/* Meters Cell: Formula (2200 + 440 + 230) and Final Total */}
                          <td className="py-3 px-3 text-right">
                            {hasMultipleVisits ? (
                              <div className="space-y-0.5">
                                <div className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded inline-block">
                                  {entry.metersBreakdown!.join(' + ')}
                                </div>
                                <div className="font-black text-slate-950 text-sm">
                                  = {entry.meters.toLocaleString('gu-IN')} મીટર
                                </div>
                              </div>
                            ) : (
                              <div className="font-black text-slate-950 text-sm">
                                {entry.meters.toLocaleString('gu-IN')} મીટર
                              </div>
                            )}
                          </td>

                          {/* Optional Rate & Amount Columns */}
                          {showRateAndRupees && (
                            <>
                              <td className="py-3 px-3 text-right text-slate-600 font-mono">
                                ₹{entry.rateApplied.toFixed(2)}
                              </td>
                              <td className="py-3 px-3 text-right font-black text-amber-700">
                                ₹{(entry.meters * entry.rateApplied).toFixed(2)}
                              </td>
                            </>
                          )}

                          {!isCurrentlyLocked && (
                            <td className="py-3 px-2 text-center">
                              <button
                                onClick={() => {
                                  if (confirm(`શું તમે ${entry.clientName} ની આ એન્ટ્રી ડિલીટ કરવા માંગો છો?`)) {
                                    onDeleteEntry(entry.id);
                                  }
                                }}
                                className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                title="Delete entry"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ================= USER REQUEST: "SAVE & UPDATE" BUTTON ================= */}
          {dateEntries.length > 0 && !isCurrentlyLocked && (
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80">
              <div className="text-xs text-amber-950">
                <span className="font-bold block">હિસાબ વેરિફિકેશન:</span>
                <span>તમામ એન્ટ્રીઓ ચેક કરી લીધા બાદ નીચેનું બટન દબાવો જેથી ડેટા ફાઇનલ થઈ જાય.</span>
              </div>

              <button
                type="button"
                onClick={handleFinalizeAndCommit}
                className="w-full sm:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer shrink-0"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>સેવ & અપડેટ (Save & Update)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { 
  UserPlus, 
  Search, 
  Edit2, 
  X, 
  Flame, 
  AlertCircle, 
  Eye, 
  CreditCard, 
  Trash2,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import type { Client, DailyEntry, PaymentRecord } from '../types';
import { ClientDetailModal } from './ClientDetailModal';
import { formatDateDDMMYYYY } from '../utils/billing';

interface ClientsViewProps {
  clients: Client[];
  entries: DailyEntry[];
  payments: PaymentRecord[];
  onAddClient: (client: Omit<Client, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  onOpenPaymentModal: (clientId: string) => void;
  onDeletePayment?: (id: string) => Promise<void>;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  entries,
  payments,
  onAddClient,
  onUpdateClient,
  onOpenPaymentModal,
  onDeletePayment,
}) => {
  // Sub-Tab Switcher: 'clients' (ગ્રાહક લિસ્ટ) OR 'payments' (જમા & નુકસાની હિસાબ)
  const [subTab, setSubTab] = useState<'clients' | 'payments'>('clients');

  // Client search & filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'regular' | 'inactive'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [detailClient, setDetailClient] = useState<Client | null>(null);

  // Payment ledger states
  const [paymentSearch, setPaymentSearch] = useState<string>('');
  const [quickPayClientId, setQuickPayClientId] = useState<string>('');

  // Form states for adding new client
  const [accountNo, setAccountNo] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [area, setArea] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [ratePerMeter, setRatePerMeter] = useState<string>('1.25');
  const [openingBalance, setOpeningBalance] = useState<string>('0');
  const [notes, setNotes] = useState<string>('');

  // Map for fast client lookup
  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);

  // Aggregate stats
  const totalCollected = useMemo(
    () => payments.reduce((sum, p) => sum + (p.amountPaid || 0), 0),
    [payments]
  );
  const totalDamageWaived = useMemo(
    () => payments.reduce((sum, p) => sum + (p.discountOrDamage || 0), 0),
    [payments]
  );

  // Calculate activity and days since last visit for each client
  const clientActivityStats = useMemo(() => {
    const today = new Date();
    const map = new Map<string, { daysSince: number | null; isRegular: boolean; totalMeters: number }>();

    for (const c of clients) {
      const cEntries = entries.filter((e) => e.clientId === c.id);
      const totalM = cEntries.reduce((sum, e) => sum + (e.meters || 0), 0);
      
      if (cEntries.length === 0) {
        map.set(c.id, { daysSince: null, isRegular: false, totalMeters: totalM });
        continue;
      }

      const sorted = [...cEntries].sort((a, b) => b.date.localeCompare(a.date));
      const lastDate = new Date(sorted[0].date);
      const diffDays = Math.floor(Math.abs(today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      map.set(c.id, {
        daysSince: diffDays,
        isRegular: diffDays <= 7,
        totalMeters: totalM,
      });
    }

    return map;
  }, [clients, entries]);

  // Next suggested account number
  const nextAccNo = useMemo(() => {
    const maxAcc = clients.reduce((max, c) => Math.max(max, c.accountNo || 0), 0);
    return maxAcc + 1;
  }, [clients]);

  const resetForm = () => {
    setAccountNo(nextAccNo.toString());
    setName('');
    setArea('');
    setPhone('');
    setRatePerMeter('1.25');
    setOpeningBalance('0');
    setNotes('');
  };

  const handleSaveNewClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('કૃપા કરીને ગ્રાહકનું નામ દાખલ કરો.');
      return;
    }

    await onAddClient({
      accountNo: parseInt(accountNo, 10) || nextAccNo,
      name: name.trim(),
      area: area.trim() || undefined,
      phone: phone.trim(),
      ratePerMeter: parseFloat(ratePerMeter) || 1.25,
      openingBalance: parseFloat(openingBalance) || 0,
      notes: notes.trim() || undefined,
      active: true,
    });

    resetForm();
    setIsAddModalOpen(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    await onUpdateClient(editingClient.id, {
      accountNo: Number(editingClient.accountNo) || 1,
      name: editingClient.name,
      area: editingClient.area,
      phone: editingClient.phone,
      ratePerMeter: Number(editingClient.ratePerMeter) || 1.25,
      openingBalance: Number(editingClient.openingBalance) || 0,
      notes: editingClient.notes,
    });

    setEditingClient(null);
  };

  // Filter & sort clients
  const filteredClients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return clients
      .filter((c) => {
        if (!c.active) return false;
        
        const stats = clientActivityStats.get(c.id);
        if (filterMode === 'regular' && !stats?.isRegular) return false;
        if (filterMode === 'inactive' && (stats?.daysSince === null || stats?.daysSince === undefined || stats.daysSince <= 10)) return false;

        if (!q) return true;

        const accMatch = c.accountNo?.toString().includes(q);
        const nameMatch = c.name.toLowerCase().includes(q);
        const areaMatch = c.area?.toLowerCase().includes(q);
        const phoneMatch = c.phone.includes(q);
        return accMatch || nameMatch || areaMatch || phoneMatch;
      })
      .sort((a, b) => {
        // Regular clients at the top!
        const aRegular = clientActivityStats.get(a.id)?.isRegular ? 1 : 0;
        const bRegular = clientActivityStats.get(b.id)?.isRegular ? 1 : 0;
        if (bRegular !== aRegular) return bRegular - aRegular;
        return (a.accountNo || 0) - (b.accountNo || 0);
      });
  }, [clients, searchQuery, filterMode, clientActivityStats]);

  // Filter & sort payments
  const filteredPayments = useMemo(() => {
    const q = paymentSearch.trim().toLowerCase();
    return payments
      .filter((p) => {
        if (!q) return true;
        const c = clientMap.get(p.clientId);
        const nameMatch = c?.name.toLowerCase().includes(q) || false;
        const accMatch = c?.accountNo?.toString().includes(q) || false;
        const dateMatch = formatDateDDMMYYYY(p.date).includes(q) || p.date.includes(q);
        const notesMatch = p.notes?.toLowerCase().includes(q) || false;
        return nameMatch || accMatch || dateMatch || notesMatch;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [payments, paymentSearch, clientMap]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header Banner */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>👥</span> ગ્રાહક & જમા ખાતાવહી
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            પાર્ટીઓની યાદી, ખાતા નંબર, અગાઉની બાકી રકમ, નવું પેમેન્ટ અને કપાતનો હિસાબ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Quick Pay Dropdown */}
          <select
            value={quickPayClientId}
            onChange={(e) => {
              if (e.target.value) {
                onOpenPaymentModal(e.target.value);
                setQuickPayClientId('');
              }
            }}
            className="px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm cursor-pointer shadow-xs transition-colors"
          >
            <option value="" className="text-slate-900 bg-white">+ નવું પેમેન્ટ / કપાત જમા કરો</option>
            {clients.filter(c => c.active).map((c) => (
              <option key={c.id} value={c.id} className="text-slate-900 bg-white">
                #{c.accountNo} - {c.name} {c.area ? `(${c.area})` : ''}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-xs transition-all text-xs sm:text-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>નવો ગ્રાહક ઉમેરો</span>
          </button>
        </div>
      </div>

      {/* Top Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">કુલ ગ્રાહકો (Client Master)</span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {clients.length} <span className="text-xs font-normal text-slate-400">પાર્ટીઓ</span>
            </div>
            <span className="text-[11px] text-emerald-700 font-bold block mt-1">
              રેગ્યુલર: {[...clientActivityStats.values()].filter(s => s.isRegular).length} | ગેરહાજર (૧૦+ દિવસ): {[...clientActivityStats.values()].filter(s => s.daysSince !== null && s.daysSince > 10).length}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xl">
            👥
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">કુલ વસૂલ થયેલ જમા રકમ</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              ₹{totalCollected.toLocaleString('gu-IN')}
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">
              કુલ {payments.length} પેમેન્ટ એન્ટ્રીઓ
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl">
            💵
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">કુલ નુકસાની / વળતર કપાત</span>
            <div className="text-2xl font-black text-sky-600 mt-1">
              ₹{totalDamageWaived.toLocaleString('gu-IN')}
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">
              માફ / એડજસ્ટ કરેલ રકમ
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-xl">
            ✂️
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Pills */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200">
        <button
          onClick={() => setSubTab('clients')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            subTab === 'clients'
              ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>📋 ગ્રાહકો & બાકી રકમ</span>
          <span className="bg-slate-900/10 px-2 py-0.5 rounded-full text-xs">
            {clients.length}
          </span>
        </button>
        <button
          onClick={() => setSubTab('payments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            subTab === 'payments'
              ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>જમા & નુકસાની હિસાબ</span>
          <span className="bg-slate-900/10 px-2 py-0.5 rounded-full text-xs">
            {payments.length}
          </span>
        </button>
      </div>

      {/* ================= SUB-TAB 1: CLIENTS MASTER ================= */}
      {subTab === 'clients' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Search & Filter Tabs */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="ખાતા નં (દા.ત. 14) / નામ / વિસ્તાર શોધો..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs sm:text-sm pl-9 pr-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 self-stretch sm:self-auto overflow-x-auto">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                તમામ ({clients.length})
              </button>
              <button
                onClick={() => setFilterMode('regular')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  filterMode === 'regular'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>રોજિંદા / રેગ્યુલર</span>
              </button>
              <button
                onClick={() => setFilterMode('inactive')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  filterMode === 'inactive'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>૧૦+ દિવસથી નથી આવ્યા</span>
              </button>
            </div>
          </div>

          {/* Client Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client) => {
              const stats = clientActivityStats.get(client.id);

              return (
                <div
                  key={client.id}
                  className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all space-y-3.5 relative group"
                >
                  {/* Top Row: Account No + Name + Actions */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-slate-900 text-amber-400 font-black flex flex-col items-center justify-center shrink-0 shadow-xs">
                        <span className="text-[10px] text-slate-400 uppercase font-sans">ખાતા</span>
                        <span className="text-sm leading-none font-bold">#{client.accountNo}</span>
                      </div>

                      <div>
                        <h4 className="font-black text-slate-900 text-base flex items-center gap-1.5">
                          {client.name}
                        </h4>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          {client.area && (
                            <span className="bg-slate-100 font-semibold px-2 py-0.5 rounded text-[11px] text-slate-700">
                              {client.area}
                            </span>
                          )}
                          {client.phone && (
                            <span className="font-mono text-slate-400">{client.phone}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingClient(client)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="વિગતો એડિટ કરો"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Regularity Status Banner */}
                  <div>
                    {stats?.isRegular ? (
                      <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg">
                        <Flame className="w-3.5 h-3.5 text-emerald-600" />
                        <span>રેગ્યુલર ગ્રાહક (ડેઇલી માલ આવે છે)</span>
                      </div>
                    ) : stats?.daysSince !== null && stats?.daysSince !== undefined && stats.daysSince > 10 ? (
                      <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        <span>છેલ્લા {stats.daysSince} દિવસથી નથી આવ્યા</span>
                        {client.phone && (
                          <a
                            href={`tel:${client.phone}`}
                            className="text-amber-700 underline font-black ml-1"
                          >
                            કૉલ કરો
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>સામાન્ય ગ્રાહક</span>
                      </div>
                    )}
                  </div>

                  {/* Rates and Balances */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                      <span className="text-slate-500 block text-[11px]">મીટર દીઠ ભાવ:</span>
                      <span className="font-bold text-amber-700 text-sm">
                        ₹{client.ratePerMeter.toFixed(2)}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                      <span className="text-slate-500 block text-[11px]">જૂની બાકી રકમ:</span>
                      <span className="font-bold text-slate-900 text-sm">
                        ₹{client.openingBalance.toLocaleString('gu-IN')}
                      </span>
                    </div>
                  </div>

                  {/* 1-Click Action Buttons: Payment (જમા/કપાત) + Ledger Details */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onOpenPaymentModal(client.id)}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      title="આ ગ્રાહકના ખાતામાં રોકડ/ઓનલાઇન જમા અથવા કપાત ઉમેરો"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>₹ જમા / કપાત</span>
                    </button>

                    <button
                      onClick={() => setDetailClient(client)}
                      className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      title="સંપૂર્ણ હિસાબ અને રોજિંદી એન્ટ્રીઓ જુઓ"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span>ખાતાવહી જુઓ</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 2: PAYMENT & DEDUCTION LEDGER ================= */}
      {subTab === 'payments' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Search Bar for Payments */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="ગ્રાહકનું નામ, તારીખ (DD/MM/YYYY) કે નોંધ શોધો..."
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                className="w-full text-xs sm:text-sm pl-9 pr-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div className="text-xs text-slate-500 font-semibold">
              કુલ ટ્રાન્ઝેક્શન્સ: {filteredPayments.length}
            </div>
          </div>

          {/* Payments Table */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
            {filteredPayments.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                કોઈ પેમેન્ટ રેકોર્ડ મળેલ નથી. ઉપરથી '+ નવું પેમેન્ટ / કપાત જમા કરો' પર ક્લિક કરો.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-bold">તારીખ</th>
                      <th className="py-3 px-4 font-bold">ગ્રાહક (ખાતા નં)</th>
                      <th className="py-3 px-3 font-bold text-right">મળેલ જમા રકમ (₹)</th>
                      <th className="py-3 px-3 font-bold text-right">નુકસાની કપાત (₹)</th>
                      <th className="py-3 px-3 font-bold text-center">મોડ</th>
                      <th className="py-3 px-4 font-bold">નોંધ</th>
                      {onDeletePayment && (
                        <th className="py-3 px-2 text-center">ક્રિયા</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPayments.map((p) => {
                      const client = clientMap.get(p.clientId);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-800 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-amber-500" />
                            <span>{formatDateDDMMYYYY(p.date)}</span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <div className="flex items-center gap-1.5">
                              {client?.accountNo && (
                                <span className="bg-slate-900 text-amber-400 font-bold text-[10px] px-1.5 py-0.5 rounded">
                                  #{client.accountNo}
                                </span>
                              )}
                              <span>{client?.name || 'અજ્ઞાત ગ્રાહક'}</span>
                            </div>
                            {client?.area && (
                              <span className="text-[11px] text-slate-400 block font-normal">
                                {client.area}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-black text-emerald-600">
                            ₹{p.amountPaid.toLocaleString('gu-IN')}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-sky-600">
                            {p.discountOrDamage > 0 ? `₹${p.discountOrDamage.toLocaleString('gu-IN')}` : '-'}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
                              {p.paymentMode}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-500">
                            {p.notes || '-'}
                          </td>
                          {onDeletePayment && (
                            <td className="py-3 px-2 text-center">
                              <button
                                onClick={() => {
                                  if (confirm(`શું તમે આ પેમેન્ટ એન્ટ્રી ડિલીટ કરવા માંગો છો?`)) {
                                    onDeletePayment(p.id);
                                  }
                                }}
                                className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                title="પેમેન્ટ એન્ટ્રી ડિલીટ કરો"
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
        </div>
      )}

      {/* Add Client Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
              <h3 className="font-bold text-base flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-400" />
                નવો ગ્રાહક ઉમેરો
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewClient} className="p-6 space-y-4 flex-1 min-h-0 overflow-y-auto">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ખાતા નં: *
                  </label>
                  <input
                    type="number"
                    placeholder="14"
                    value={accountNo}
                    onChange={(e) => setAccountNo(e.target.value)}
                    required
                    className="w-full text-sm font-black px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ગ્રાહક / પેઢીનું નામ: *
                  </label>
                  <input
                    type="text"
                    placeholder="દા.ત. સુરેશભાઈ"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full text-sm font-semibold px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    વિસ્તાર / માર્કેટ:
                  </label>
                  <input
                    type="text"
                    placeholder="દા.ત. દિવાળીબાગ"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    WhatsApp મોબાઈલ:
                  </label>
                  <input
                    type="tel"
                    placeholder="૧૦ આંકડાનો નંબર"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    મીટર દીઠ ભાવ (₹): *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="1.25"
                    value={ratePerMeter}
                    onChange={(e) => setRatePerMeter(e.target.value)}
                    required
                    className="w-full text-sm font-bold px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    જૂની બાકી રકમ (₹):
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                    className="w-full text-sm font-bold px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  નોંધ / સરનામું (મરજિયાત):
                </label>
                <input
                  type="text"
                  placeholder="દા.ત. દિવાળીબાગ ખાતા નં ૧૪"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100"
                >
                  રદ કરો
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
                >
                  સેવ કરો
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {editingClient && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                ગ્રાહકની વિગતો બદલો
              </h3>
              <button
                onClick={() => setEditingClient(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4 flex-1 min-h-0 overflow-y-auto">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ખાતા નં:
                  </label>
                  <input
                    type="number"
                    value={editingClient.accountNo || ''}
                    onChange={(e) =>
                      setEditingClient({ ...editingClient, accountNo: parseInt(e.target.value, 10) || 0 })
                    }
                    required
                    className="w-full text-sm font-black px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    નામ:
                  </label>
                  <input
                    type="text"
                    value={editingClient.name}
                    onChange={(e) =>
                      setEditingClient({ ...editingClient, name: e.target.value })
                    }
                    required
                    className="w-full text-sm font-semibold px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    વિસ્તાર:
                  </label>
                  <input
                    type="text"
                    value={editingClient.area || ''}
                    onChange={(e) =>
                      setEditingClient({ ...editingClient, area: e.target.value })
                    }
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    મોબાઈલ:
                  </label>
                  <input
                    type="tel"
                    value={editingClient.phone}
                    onChange={(e) =>
                      setEditingClient({ ...editingClient, phone: e.target.value })
                    }
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ભાવ (₹):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingClient.ratePerMeter}
                    onChange={(e) =>
                      setEditingClient({
                        ...editingClient,
                        ratePerMeter: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full text-sm font-bold px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    જૂની બાકી:
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editingClient.openingBalance}
                    onChange={(e) =>
                      setEditingClient({
                        ...editingClient,
                        openingBalance: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full text-sm font-bold px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  નોંધ:
                </label>
                <input
                  type="text"
                  value={editingClient.notes || ''}
                  onChange={(e) =>
                    setEditingClient({ ...editingClient, notes: e.target.value })
                  }
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs"
                >
                  રદ કરો
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
                >
                  સુધારો સાચવો
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Detail Modal */}
      {detailClient && (
        <ClientDetailModal
          client={detailClient}
          entries={entries}
          payments={payments}
          onClose={() => setDetailClient(null)}
          onOpenPaymentModal={(clientId) => {
            setDetailClient(null);
            onOpenPaymentModal(clientId);
          }}
        />
      )}
    </div>
  );
};

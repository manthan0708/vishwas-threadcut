import React, { useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import type { Client, PaymentRecord } from '../types';
import { formatDateDDMMYYYY } from '../utils/billing';

interface PaymentLedgerViewProps {
  clients: Client[];
  payments: PaymentRecord[];
  onOpenPaymentModal: (clientId: string) => void;
  onDeletePayment: (id: string) => Promise<void>;
}

export const PaymentLedgerView: React.FC<PaymentLedgerViewProps> = ({
  clients,
  payments,
  onOpenPaymentModal,
  onDeletePayment,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  const clientMap = new Map(clients.map((c) => [c.id, c.name]));

  const filteredPayments = payments
    .filter((p) => {
      const clientName = clientMap.get(p.clientId) || '';
      return (
        clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.date.includes(searchQuery)
      );
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalCollected = payments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
  const totalDamageWaived = payments.reduce((sum, p) => sum + (p.discountOrDamage || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span>💰</span> પેમેન્ટ જમા & નુકસાની કપાત રજિસ્ટર
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            ગ્રાહકો પાસેથી આવેલ રોકડ, ઓનલાઇન જમા અને માફ કરેલ નુકસાનીનો હિસાબ
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedClientId}
            onChange={(e) => {
              if (e.target.value) {
                onOpenPaymentModal(e.target.value);
                setSelectedClientId('');
              }
            }}
            className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl border border-slate-300 bg-amber-500 text-slate-950 font-bold text-xs sm:text-sm cursor-pointer shadow-sm"
          >
            <option value="">+ નવું પેમેન્ટ / કપાત ઉમેરો</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">કુલ વસૂલ થયેલ રકમ (Collected)</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              ₹{totalCollected.toLocaleString('gu-IN')}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            💵
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">કુલ નુકસાની / વળતર કપાત (Waived)</span>
            <div className="text-2xl font-black text-sky-600 mt-1">
              ₹{totalDamageWaived.toLocaleString('gu-IN')}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            ✂️
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="પેમેન્ટ હિસ્ટ્રી શોધો..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs sm:text-sm pl-9 pr-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>
        <div className="text-xs text-slate-500 font-semibold">
          કુલ ટ્રાન્ઝેક્શન્સ: {filteredPayments.length}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        {filteredPayments.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            કોઈ પેમેન્ટ રેકોર્ડ મળેલ નથી. ઉપરથી 'નવું પેમેન્ટ ઉમેરો' ક્લિક કરો.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-bold">તારીખ</th>
                  <th className="py-3 px-4 font-bold">ગ્રાહકનું નામ</th>
                  <th className="py-3 px-3 font-bold text-right">મળેલ રકમ (₹)</th>
                  <th className="py-3 px-3 font-bold text-right">નુકસાની કપાત (₹)</th>
                  <th className="py-3 px-3 font-bold text-center">મોડ</th>
                  <th className="py-3 px-4 font-bold">નોંધ</th>
                  <th className="py-3 px-2 text-center">ક્રિયા</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => {
                  const clientName = clientMap.get(p.clientId) || 'અજ્ઞાત ગ્રાહક';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{formatDateDDMMYYYY(p.date)}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{clientName}</td>
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
                      <td className="py-3 px-2 text-center">
                        <button
                          onClick={() => {
                            if (confirm(`શું તમે આ પેમેન્ટ એન્ટ્રી ડિલીટ કરવા માંગો છો?`)) {
                              onDeletePayment(p.id);
                            }
                          }}
                          className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

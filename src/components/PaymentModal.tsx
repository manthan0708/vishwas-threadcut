import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Client, PaymentRecord } from '../types';

interface PaymentModalProps {
  client: Client;
  currentDue: number;
  month: string;
  onClose: () => void;
  onSavePayment: (payment: Omit<PaymentRecord, 'id' | 'createdAt'>) => Promise<void>;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  client,
  currentDue,
  month,
  onClose,
  onSavePayment,
}) => {
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'cheque'>('cash');
  const [discountOrDamage, setDiscountOrDamage] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const parsedPaid = parseFloat(amountPaid) || 0;
  const parsedDiscount = parseFloat(discountOrDamage) || 0;
  const remainingDue = Math.max(0, currentDue - parsedPaid - parsedDiscount);

  const handleFullPayment = () => {
    setAmountPaid(currentDue.toString());
    setDiscountOrDamage('0');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedPaid <= 0 && parsedDiscount <= 0) {
      alert('કૃપા કરીને જમા રકમ અથવા નુકસાની કપાત દાખલ કરો.');
      return;
    }

    await onSavePayment({
      clientId: client.id,
      month,
      date: new Date().toISOString().split('T')[0],
      amountPaid: parsedPaid,
      paymentMode,
      discountOrDamage: parsedDiscount,
      notes: notes.trim() || undefined,
    });

    // If fully cleared, trigger celebratory confetti!
    if (remainingDue === 0 && parsedPaid > 0) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <span>💳</span> પેમેન્ટ જમા & નુકસાની કપાત
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              ગ્રાહક: <strong className="text-amber-400">{client.name}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1 min-h-0 overflow-y-auto">
          {/* Current Due Banner */}
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-amber-800 block">કુલ બાકી રકમ (Due Amount):</span>
              <span className="text-xl font-black text-amber-950">₹{currentDue.toLocaleString('gu-IN')}</span>
            </div>
            <button
              type="button"
              onClick={handleFullPayment}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              પૂરેપૂરી રકમ ભરી
            </button>
          </div>

          {/* Amount Paid Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              મળેલ રોકડ / ઓનલાઇન રકમ (₹):
            </label>
            <input
              type="number"
              step="any"
              placeholder="દા.ત. 15000"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              className="w-full text-base font-bold px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              પેમેન્ટ મોડ:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMode('cash')}
                className={`py-2 text-xs font-bold rounded-lg border cursor-pointer transition-all ${
                  paymentMode === 'cash'
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                💵 રોકડ (Cash)
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode('upi')}
                className={`py-2 text-xs font-bold rounded-lg border cursor-pointer transition-all ${
                  paymentMode === 'upi'
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                📲 UPI / GPay
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode('cheque')}
                className={`py-2 text-xs font-bold rounded-lg border cursor-pointer transition-all ${
                  paymentMode === 'cheque'
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🏦 બેંક / ચેક
              </button>
            </div>
          </div>

          {/* Damage / Discount Waiver (ખૂબ મહત્વનું) */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              નુકસાની / ડિસ્કાઉન્ટ કપાત (₹) [જો માફ કર્યું હોય તો]:
            </label>
            <input
              type="number"
              step="any"
              placeholder="દા.ત. 550"
              value={discountOrDamage}
              onChange={(e) => setDiscountOrDamage(e.target.value)}
              className="w-full text-sm font-semibold px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
            <div className="flex items-start gap-1.5 text-[11px] text-slate-500">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>
                આ રકમ કાપડ નુકસાની કે વળતર પેટે માફ કરેલી ગણાશે અને આવતા મહિનાના બિલમાં <strong>ફરીથી ઉમેરાશે નહીં</strong>.
              </span>
            </div>
          </div>

          {/* Remaining Balance Preview */}
          <div className="bg-slate-100 p-3 rounded-xl flex justify-between items-center text-xs sm:text-sm font-bold">
            <span className="text-slate-600">આવતા મહિને આગળ ખેંચાતી બાકી રકમ:</span>
            <span className={`text-base ${remainingDue === 0 ? 'text-emerald-600' : 'text-amber-700'}`}>
              ₹{remainingDue.toLocaleString('gu-IN')} {remainingDue === 0 && ' (ક્લિયર ✓)'}
            </span>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              નોંધ (મરજિયાત):
            </label>
            <input
              type="text"
              placeholder="દા.ત. અડધા પૈસા આપ્યા, બાકીના આવતા અઠવાડિયે આપશે"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              રદ કરો
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>પેમેન્ટ સેવ કરો</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

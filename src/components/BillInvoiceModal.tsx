import React, { useState } from 'react';
import { X, Printer, Share2, CheckSquare, Square } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { MonthlyCalculation, BusinessSettings } from '../types';
import { generateUpiUrl } from '../utils/billing';

interface BillInvoiceModalProps {
  calculation: MonthlyCalculation;
  settings: BusinessSettings;
  monthName: string; // e.g. "11/2026" or "01/11/2026"
  onClose: () => void;
}

export const BillInvoiceModal: React.FC<BillInvoiceModalProps> = ({
  calculation,
  settings,
  onClose,
}) => {
  // 3 Interactive user options (default per user requirements)
  // Option 1: Default false -> do not include current month by default unless ticked!
  const [includeCurrentMonth, setIncludeCurrentMonth] = useState<boolean>(false);
  // Option 2: Default false -> hide meter x rate calculation unless checked
  const [showCalculationDetails, setShowCalculationDetails] = useState<boolean>(false);
  // Option 3: Default false -> do not show 2nd page daily ledger unless checked
  const [includeSecondPage, setIncludeSecondPage] = useState<boolean>(false);

  // USER REQUEST: Authentic Deshi Chopdo Slip (Photo 1 & 2 Style) vs Voucher
  const [invoiceStyle, setInvoiceStyle] = useState<'chopdo' | 'voucher'>('chopdo');

  // Month formatted strictly as 01/MM/YYYY
  const today = new Date();
  const currentMonthNum = String(today.getMonth() + 1).padStart(2, '0');
  const currentYear = today.getFullYear();
  const currentMonthFormatted = `01/${currentMonthNum}/${currentYear}`;

  // Last month formatted as 01/MM/YYYY
  const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthNum = String(lastMonthDate.getMonth() + 1).padStart(2, '0');
  const lastYear = lastMonthDate.getFullYear();
  const lastMonthFormatted = `01/${lastMonthNum}/${lastYear}`;

  // Prior month 2
  const priorMonth2Date = new Date(today.getFullYear(), today.getMonth() - 2, 1);
  const prior2Num = String(priorMonth2Date.getMonth() + 1).padStart(2, '0');
  const prior2Year = priorMonth2Date.getFullYear();
  const prior2Formatted = `01/${prior2Num}/${prior2Year}`;

  // Calculations based on toggles
  const currentMonthBill = includeCurrentMonth ? calculation.currentMonthAmount : 0;
  const grandTotalDue = Math.max(
    0,
    calculation.previousBalance + currentMonthBill - calculation.paymentsReceived - calculation.damageDeduction
  );

  const upiUrl = generateUpiUrl(settings, grandTotalDue, calculation.clientName);

  // Generate WhatsApp message with strictly 01/MM/YYYY date format
  const waLines = [
    `🧵 *${settings.businessName || 'વિશ્વાસ થ્રેડ કટિંગ'}*`,
    `📋 *હિસાબ વાઉચર (માસ: ${lastMonthFormatted})*`,
    `🔢 ખાતા નં: *#${calculation.accountNo}*`,
    `👤 ગ્રાહક: *${calculation.clientName}*${calculation.area ? ` (${calculation.area})` : ''}`,
    `--------------------------------`,
    `▪️ અગાઉના મહિનાઓની બાકી: *₹${calculation.previousBalance.toLocaleString('gu-IN')}*`,
  ];

  if (includeCurrentMonth && currentMonthBill > 0) {
    waLines.push(`▪️ ચાલુ માસનું બિલ (${currentMonthFormatted}): *₹${currentMonthBill.toLocaleString('gu-IN')}*`);
  }
  if (calculation.paymentsReceived > 0) {
    waLines.push(`▫️ મળેલ જમા રકમ: *-₹${calculation.paymentsReceived.toLocaleString('gu-IN')}*`);
  }
  if (calculation.damageDeduction > 0) {
    waLines.push(`▫️ નુકસાની કપાત: *-₹${calculation.damageDeduction.toLocaleString('gu-IN')}*`);
  }

  waLines.push(`--------------------------------`);
  waLines.push(`💰 *કુલ ચૂકવવાપાત્ર બાકી રકમ: ₹${grandTotalDue.toLocaleString('gu-IN')}*`);
  waLines.push(`--------------------------------`);
  if (settings.upiId) {
    waLines.push(`📲 UPI ID: \`${settings.upiId}\``);
  }
  waLines.push(`સંપર્ક: ${settings.ownerName} (${settings.phone})`);

  const waLink = `https://wa.me/91${calculation.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waLines.join('\n'))}`;

  const handlePrint = () => {
    window.print();
  };

  const billNo = `VTC-${calculation.accountNo}-${lastMonthFormatted.replace(/\//g, '')}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full h-[92vh] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Top Control Bar (Hidden in Print) */}
        <div className="print:hidden bg-slate-900 text-white p-4 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-black text-base flex items-center gap-1.5">
                <span>🧵</span> {settings.businessName || 'વિશ્વાસ થ્રેડ કટિંગ'}
              </span>
              <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700">
                ખાતા નં: #{calculation.accountNo}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* View Switcher: Authentic Chopdo Slip vs Modern Voucher */}
              <div className="flex items-center bg-slate-800 p-1 rounded-xl text-xs font-bold border border-slate-700">
                <button
                  type="button"
                  onClick={() => setInvoiceStyle('chopdo')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    invoiceStyle === 'chopdo'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📑 ચોપડો સ્લીપ
                </button>
                <button
                  type="button"
                  onClick={() => setInvoiceStyle('voucher')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    invoiceStyle === 'voucher'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📄 વાઉચર
                </button>
              </div>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-200 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>પ્રિન્ટ / PDF</span>
              </button>

              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-bold text-white transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp શેર</span>
              </a>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Interactive Checkbox Options */}
          <div className="bg-slate-800/90 rounded-2xl p-3 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-200 border border-slate-700">
            {/* Checkbox 1: Include Current Month till today */}
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors select-none">
              <input
                type="checkbox"
                checked={includeCurrentMonth}
                onChange={(e) => setIncludeCurrentMonth(e.target.checked)}
                className="hidden"
              />
              {includeCurrentMonth ? (
                <CheckSquare className="w-4 h-4 text-amber-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>ચાલુ માસ ({currentMonthFormatted} આજ સુધી) ઉમેરો</span>
            </label>

            {/* Checkbox 2: Show Meter x Rate Calculation */}
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors select-none">
              <input
                type="checkbox"
                checked={showCalculationDetails}
                onChange={(e) => setShowCalculationDetails(e.target.checked)}
                className="hidden"
              />
              {showCalculationDetails ? (
                <CheckSquare className="w-4 h-4 text-amber-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>મીટર અને ભાવની ગણતરી જોડો</span>
            </label>

            {/* Checkbox 3: Include 2nd Page Daily Ledger */}
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors select-none">
              <input
                type="checkbox"
                checked={includeSecondPage}
                onChange={(e) => setIncludeSecondPage(e.target.checked)}
                className="hidden"
              />
              {includeSecondPage ? (
                <CheckSquare className="w-4 h-4 text-amber-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>પેજ ૨: રોજિંદી વિગત જોડો</span>
            </label>
          </div>
        </div>

        {/* Scrollable Bill Area */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          {invoiceStyle === 'chopdo' ? (
            /* ================= 1. AUTHENTIC DESHI CHOPDO SLIP (PHOTO 1 & 2 STYLE) ================= */
            <div className="p-4 sm:p-6 bg-slate-100 flex justify-center print:p-0 print:bg-white" id="printable-bill-page1">
              <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-300 w-full max-w-xl overflow-hidden font-mono text-slate-900 print:shadow-none print:border-slate-800">
                {/* Perforated Top Header */}
                <div className="bg-red-500/10 border-b-2 border-dashed border-red-300 py-1.5 px-4 text-center text-[11px] font-sans text-red-800 font-bold flex items-center justify-between">
                  <span>✂️ હિસાબ સ્લીપ</span>
                  <span>{settings.businessName || 'વિશ્વાસ થ્રેડ કટિંગ'} — માસિક ખાતાવહી સ્લીપ</span>
                  <span>માસ: {lastMonthFormatted}</span>
                </div>

                {/* Header row: Account # on left, Name & Phone on right */}
                <div className="p-4 pb-2 border-b-2 border-slate-800 flex justify-between items-end bg-amber-50/20">
                  <div className="text-left">
                    <span className="text-3xl font-black text-slate-900 leading-none">
                      {calculation.accountNo}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-sans">ખાતા નંબર</span>
                  </div>

                  <div className="text-right">
                    <h4 className="text-lg font-black text-slate-950 tracking-wide">
                      {calculation.clientName}
                    </h4>
                    <span className="text-xs font-bold text-slate-700 tracking-wider block">
                      {calculation.phone} {calculation.area ? `(${calculation.area})` : ''}
                    </span>
                  </div>
                </div>

                {/* 2-Column Split Body */}
                <div className="grid grid-cols-12 min-h-[420px] text-xs">
                  {/* Left Column (7 Cols): Daily lots list on ruled lines */}
                  <div className="col-span-7 border-r-2 border-blue-400 p-3 divide-y divide-blue-100">
                    <div className="flex justify-between pb-1 font-bold text-slate-600 text-[11px] border-b-2 border-blue-300 font-sans mb-1">
                      <span>કાપડના મીટર</span>
                      <span>તારીખ (Date)</span>
                    </div>

                    {calculation.entries.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 font-sans">
                        આ માસમાં કોઈ એન્ટ્રી નથી
                      </div>
                    ) : (
                      calculation.entries.slice(0, 25).map((e) => {
                        const [y, m, d] = e.date.split('-');
                        const formattedSlipDate = `${parseInt(d, 10)} , ${parseInt(m, 10)} , ${y.slice(-2)}`;
                        return (
                          <div key={e.id} className="flex justify-between py-1 px-1 hover:bg-amber-50/50">
                            <span className="font-bold text-slate-900 text-xs">
                              {e.meters}
                            </span>
                            <span className="font-bold text-slate-700 tracking-wider">
                              {formattedSlipDate}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Right Column (5 Cols): Calculation & Totals + UPI QR */}
                  <div className="col-span-5 p-3 flex flex-col justify-between bg-slate-50/60 font-sans">
                    <div className="space-y-3">
                      <div className="border-b border-slate-300 pb-2">
                        <span className="text-[10px] text-slate-500 uppercase block font-bold">કુલ કાપડ:</span>
                        <span className="text-base font-black text-slate-950 font-mono">
                          {calculation.totalMeters.toLocaleString('gu-IN')} મી.
                        </span>
                      </div>

                      <div className="border-b border-slate-300 pb-2">
                        <span className="text-[10px] text-slate-500 uppercase block font-bold">મીટર દીઠ ભાવ:</span>
                        <span className="text-sm font-black text-amber-800 font-mono">
                          × ₹{calculation.ratePerMeter.toFixed(2)}
                        </span>
                      </div>

                      <div className="bg-amber-100/70 p-2 rounded-xl border border-amber-300">
                        <span className="text-[10px] text-amber-900 block font-bold">આ માસનું બિલ:</span>
                        <span className="text-base font-black text-amber-950 font-mono">
                          ₹{calculation.currentMonthAmount.toLocaleString('gu-IN')}
                        </span>
                      </div>

                      {calculation.previousBalance > 0 && (
                        <div className="text-[11px] text-slate-600 pt-1">
                          <span>જૂની બાકી: </span>
                          <strong className="text-slate-900 font-mono">₹{calculation.previousBalance.toLocaleString('gu-IN')}</strong>
                        </div>
                      )}

                      {calculation.paymentsReceived > 0 && (
                        <div className="text-[11px] text-emerald-700 pt-0.5">
                          <span>મળેલ જમા: </span>
                          <strong className="font-mono">-₹{calculation.paymentsReceived.toLocaleString('gu-IN')}</strong>
                        </div>
                      )}

                      {calculation.damageDeduction > 0 && (
                        <div className="text-[11px] text-sky-700 pt-0.5">
                          <span>નુકસાની કપાત: </span>
                          <strong className="font-mono">-₹{calculation.damageDeduction.toLocaleString('gu-IN')}</strong>
                        </div>
                      )}
                    </div>

                    {/* Bottom Grand Total Box + QR Code */}
                    <div className="pt-3 border-t-2 border-slate-900 mt-4 space-y-2">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">ચૂકવવાપાત્ર બાકી:</span>
                        <span className="text-xl font-black text-slate-950 font-mono block">
                          ₹{grandTotalDue.toLocaleString('gu-IN')}
                        </span>
                      </div>

                      {/* UPI QR */}
                      {settings.upiId && grandTotalDue > 0 && (
                        <div className="bg-white p-2 rounded-xl border border-slate-300 text-center">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(
                              `upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(
                                settings.businessName || 'Vishwas Thread Cutting'
                              )}&am=${grandTotalDue}&cu=INR`
                            )}`}
                            alt="UPI QR"
                            className="w-16 h-16 mx-auto"
                          />
                          <span className="text-[9px] text-slate-500 font-bold block mt-1">
                            GPay / PhonePe થી સ્કેન કરો
                          </span>
                        </div>
                      )}

                      <div className="text-[10px] text-slate-500 text-right pt-2 border-t border-dashed">
                        {settings.businessName || 'વિશ્વાસ થ્રેડ કટિંગ'} વતી
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ================= 2. MODERN PRINTABLE VOUCHER ================= */
            <>
              {/* PAGE 1: MAIN MONTHLY INVOICE */}
              <div className="p-6 sm:p-8 space-y-6 text-slate-900 bg-white" id="printable-bill-page1">
                {/* Business Header */}
                <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black text-slate-950 tracking-tight">
                        {settings.businessName || 'વિશ્વાસ થ્રેડ કટિંગ'}
                      </span>
                      <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded uppercase">
                        ઓરિજિનલ
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 mt-1">
                      તમામ પ્રકારના એમ્બ્રોઇડરી વર્ક થ્રેડ કટિંગ & ફિનિશિંગ જોબવર્ક
                    </p>
                    <p className="text-xs text-slate-500">
                      પ્રોપ્રાઈટર: <strong className="text-slate-800">{settings.ownerName}</strong> | મો.: {settings.phone}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="inline-block bg-slate-900 text-amber-400 font-black text-xs uppercase px-3 py-1 rounded-lg">
                      હિસાબ વાઉચર
                    </span>
                    <p className="text-[11px] font-mono text-slate-500 mt-1.5">
                      વાઉચર નં: <strong className="text-slate-800">{billNo}</strong>
                    </p>
                    <p className="text-xs font-bold text-slate-700">
                      તારીખ: <span className="font-mono text-slate-950 font-black">{lastMonthFormatted}</span>
                    </p>
                  </div>
                </div>

          {/* Client Details Box with Account Number */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-slate-900 text-amber-400 font-black text-xs px-2.5 py-0.5 rounded-lg">
                  ખાતા નં: #{calculation.accountNo}
                </span>
                {calculation.area && (
                  <span className="bg-amber-100 text-amber-900 font-bold text-xs px-2.5 py-0.5 rounded-lg">
                    {calculation.area}
                  </span>
                )}
              </div>
              <div className="font-black text-slate-950 text-base sm:text-xl mt-1">
                {calculation.clientName}
              </div>
              {calculation.phone && (
                <div className="text-xs text-slate-600 font-mono mt-0.5">
                  મોબાઈલ: {calculation.phone}
                </div>
              )}
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                બિલ અવધિ:
              </span>
              <span className="font-mono text-xs font-black text-slate-900 bg-slate-200/60 px-2.5 py-1 rounded-md inline-block mt-0.5">
                {includeCurrentMonth ? `${prior2Formatted} થી ${currentMonthFormatted}` : `${prior2Formatted} થી ${lastMonthFormatted}`}
              </span>
            </div>
          </div>

          {/* Month-Wise Statement Table (Exact User Layout: Left Month, Right Payment) */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-xs sm:text-sm text-slate-800">
                માસિક બિલિંગ હિસાબ યાદી (Month-Wise Statement):
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                ફોર્મેટ: 01/MM/YYYY
              </span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 w-12 text-center">ક્રમ</th>
                    <th className="py-2.5 px-4">બિલ માસ (Month)</th>
                    {showCalculationDetails && (
                      <>
                        <th className="py-2.5 px-3 text-right">કુલ મીટર</th>
                        <th className="py-2.5 px-3 text-right">ભાવ</th>
                      </>
                    )}
                    <th className="py-2.5 px-4 text-right font-black">બિલ રકમ (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {/* Prior Months Row */}
                  {calculation.previousBalance > 0 && (
                    <tr className="bg-amber-50/30">
                      <td className="py-2.5 px-4 text-center text-slate-400">૧</td>
                      <td className="py-2.5 px-4 font-bold text-slate-800">
                        <span className="font-mono text-slate-950 font-black">{prior2Formatted}</span>
                        <span className="text-xs text-slate-500 ml-2">(અગાઉના મહિનાઓની બાકી)</span>
                      </td>
                      {showCalculationDetails && (
                        <>
                          <td className="py-2.5 px-3 text-right text-slate-400">-</td>
                          <td className="py-2.5 px-3 text-right text-slate-400">-</td>
                        </>
                      )}
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                        ₹{calculation.previousBalance.toLocaleString('gu-IN')}
                      </td>
                    </tr>
                  )}

                  {/* Last Month Row */}
                  <tr>
                    <td className="py-2.5 px-4 text-center text-slate-400">
                      {calculation.previousBalance > 0 ? '૨' : '૧'}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">
                      <span className="font-mono text-slate-950 font-black">{lastMonthFormatted}</span>
                      <span className="text-xs text-slate-500 ml-2">(પાછલા માસનું બિલ)</span>
                    </td>
                    {showCalculationDetails && (
                      <>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-700">
                          {calculation.totalMeters.toLocaleString('gu-IN')} મી.
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600">
                          ₹{calculation.ratePerMeter.toFixed(2)}
                        </td>
                      </>
                    )}
                    <td className="py-2.5 px-4 text-right font-black text-slate-900">
                      ₹{calculation.currentMonthAmount.toLocaleString('gu-IN')}
                    </td>
                  </tr>

                  {/* Current Month Row (only if user checked includeCurrentMonth) */}
                  {includeCurrentMonth && (
                    <tr className="bg-emerald-50/40">
                      <td className="py-2.5 px-4 text-center text-slate-400">૩</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        <span className="font-mono text-emerald-800 font-black">{currentMonthFormatted}</span>
                        <span className="text-xs text-emerald-700 ml-2">(ચાલુ માસ - આજ સુધી)</span>
                      </td>
                      {showCalculationDetails && (
                        <>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-800">
                            {calculation.totalMeters.toLocaleString('gu-IN')} મી.
                          </td>
                          <td className="py-2.5 px-3 text-right text-emerald-800">
                            ₹{calculation.ratePerMeter.toFixed(2)}
                          </td>
                        </>
                      )}
                      <td className="py-2.5 px-4 text-right font-black text-emerald-800">
                        ₹{currentMonthBill.toLocaleString('gu-IN')}
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-50 font-black border-t-2 border-slate-200">
                  <tr>
                    <td colSpan={showCalculationDetails ? 4 : 2} className="py-2.5 px-4 text-slate-800 text-xs sm:text-sm">
                      કુલ રકમ:
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-950 font-black text-sm sm:text-base">
                      ₹{(calculation.previousBalance + calculation.currentMonthAmount + (includeCurrentMonth ? currentMonthBill : 0)).toLocaleString('gu-IN')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Final Summary & Direct Ledger Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-1">
            {/* Left: Dynamic UPI QR Code Box */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center gap-4">
              <div className="bg-white p-2 rounded-xl shadow-xs border border-slate-200 shrink-0">
                <QRCodeSVG value={upiUrl} size={92} level="M" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full inline-block">
                  Google Pay / PhonePe / Paytm
                </span>
                <p className="text-xs font-bold text-slate-800">
                  ઓનલાઇન સ્કેન કરી પે કરો
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  UPI: {settings.upiId}
                </p>
              </div>
            </div>

            {/* Right: Direct Clean Ledger Box */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-2 text-xs sm:text-sm shadow-md">
              <div className="flex justify-between text-slate-300">
                <span>બિલ રકમ:</span>
                <span className="font-bold text-amber-400">
                  ₹{(calculation.previousBalance + calculation.currentMonthAmount + (includeCurrentMonth ? currentMonthBill : 0)).toLocaleString('gu-IN')}
                </span>
              </div>

              {calculation.paymentsReceived > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>મળેલ જમા રકમ:</span>
                  <span className="font-bold">
                    - ₹{calculation.paymentsReceived.toLocaleString('gu-IN')}
                  </span>
                </div>
              )}

              {calculation.damageDeduction > 0 && (
                <div className="flex justify-between text-sky-300">
                  <span>નુકસાની કપાત:</span>
                  <span className="font-bold">
                    - ₹{calculation.damageDeduction.toLocaleString('gu-IN')}
                  </span>
                </div>
              )}

              <div className="border-t-2 border-slate-700/80 pt-2 flex justify-between items-center">
                <span className="font-bold text-slate-200 text-xs sm:text-sm">
                  કુલ ચૂકવવાપાત્ર બાકી રકમ:
                </span>
                <span className="text-lg sm:text-xl font-black text-amber-400">
                  ₹{grandTotalDue.toLocaleString('gu-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Signature & Authorized Stamp */}
          <div className="pt-4 border-t border-slate-200 flex justify-between items-end text-xs">
            <div className="text-[11px] text-slate-400 max-w-xs">
              * બિલ મળ્યાના ૭ દિવસમાં પેમેન્ટ કરી આપવું. થ્રેડ કટિંગ બાબતે કોઈ ફરિયાદ હોય તો તાત્કાલિક જાણ કરવી.
            </div>
            <div className="text-center font-bold text-slate-800">
              <div className="h-8"></div>
              <div className="border-t border-slate-400 pt-1 px-4 text-xs font-bold">
                {settings.businessName || 'વિશ્વાસ થ્રેડ કટિંગ'} વતી
              </div>
            </div>
          </div>
        </div>

        {/* ================= PAGE 2: DAILY METER BREAKDOWN (OPTIONAL VIA CHECKBOX) ================= */}
        {includeSecondPage && (
          <div className="p-6 sm:p-8 space-y-5 text-slate-900 bg-white border-t-4 border-slate-900 print:break-before-page" id="printable-bill-page2">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <span className="text-xs bg-slate-900 text-amber-400 font-bold px-2.5 py-0.5 rounded">
                  પેજ ૨
                </span>
                <h3 className="font-black text-base sm:text-lg text-slate-900 mt-1">
                  રોજિંદી તારીખ વાઇઝ મીટર હિસાબ પત્રક (Daily Meter Ledger)
                </h3>
                <p className="text-xs text-slate-500">
                  ગ્રાહક: <strong>{calculation.clientName}</strong> (ખાતા નં: #{calculation.accountNo})
                </p>
              </div>
              <div className="text-right font-mono text-xs text-slate-500">
                તારીખ: {lastMonthFormatted}
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3 text-center w-10">ક્રમ</th>
                    <th className="py-2 px-3 font-mono">તારીખ (DD/MM/YYYY)</th>
                    <th className="py-2 px-3">વિગત</th>
                    <th className="py-2 px-3 text-right">કાપડના મીટર</th>
                    <th className="py-2 px-3 text-right">ભાવ (₹)</th>
                    <th className="py-2 px-3 text-right font-bold">કુલ રકમ (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {calculation.entries.map((entry, idx) => {
                    const [y, m, d] = entry.date.split('-');
                    const formattedDate = `${d}/${m}/${y}`;
                    const amount = entry.meters * entry.rateApplied;

                    return (
                      <tr key={entry.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-center text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{formattedDate}</td>
                        <td className="py-2 px-3 text-slate-600">{entry.notes || 'એમ્બ્રોઇડરી થ્રેડ કટિંગ'}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">{entry.meters.toLocaleString('gu-IN')} મી.</td>
                        <td className="py-2 px-3 text-right text-slate-600">₹{entry.rateApplied.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-bold text-amber-700">₹{amount.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-100 font-black border-t-2 border-slate-300">
                  <tr>
                    <td colSpan={3} className="py-2.5 px-3 text-slate-800">
                      કુલ સરવાળો ({calculation.entries.length} દિવસ):
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-950">
                      {calculation.totalMeters.toLocaleString('gu-IN')} મીટર
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500">-</td>
                    <td className="py-2.5 px-3 text-right text-amber-800 text-sm">
                      ₹{calculation.currentMonthAmount.toLocaleString('gu-IN')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="text-right text-xs text-slate-400 pt-1">
              * આ પત્રક માત્ર આંતરિક વેરિફિકેશન અને મીટર ચકાસણી માટે છે.
            </div>
          </div>
        )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

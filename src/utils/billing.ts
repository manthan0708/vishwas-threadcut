import type { Client, DailyEntry, PaymentRecord, MonthlyCalculation, BusinessSettings } from '../types';

export function formatDateDDMMYYYY(dateStr: string): string {
  if (!dateStr) return '';
  const clean = dateStr.split('T')[0];
  const parts = clean.includes('/') ? clean.split('/') : clean.split('-');
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD -> DD/MM/YYYY
      return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
    }
  }
  return dateStr;
}

export function calculateClientMonth(
  client: Client,
  allEntries: DailyEntry[],
  allPayments: PaymentRecord[],
  targetMonth: string // 'YYYY-MM'
): MonthlyCalculation {
  // All entries for this client across time (to calculate last visit & frequency)
  const clientAllEntries = allEntries.filter((e) => e.clientId === client.id);
  
  // Sort all entries descending by date to find latest visit
  const sortedAllEntries = [...clientAllEntries].sort((a, b) => b.date.localeCompare(a.date));
  const latestEntry = sortedAllEntries[0];

  let daysSinceLastVisit: number | undefined;
  let lastVisitDate: string | undefined;

  if (latestEntry) {
    lastVisitDate = latestEntry.date;
    const today = new Date();
    const lastDate = new Date(latestEntry.date);
    const diffTime = Math.abs(today.getTime() - lastDate.getTime());
    daysSinceLastVisit = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  // Filter entries for target month
  const monthEntries = allEntries.filter(
    (e) => e.clientId === client.id && e.date.startsWith(targetMonth)
  );

  const totalMeters = monthEntries.reduce((sum, e) => sum + (Number(e.meters) || 0), 0);
  
  // Calculate current month bill using each entry's rate or fallback to client rate
  const currentMonthAmount = monthEntries.reduce((sum, e) => {
    const rate = Number(e.rateApplied) || Number(client.ratePerMeter) || 0;
    return sum + (Number(e.meters) || 0) * rate;
  }, 0);

  // Filter payments for this client
  const clientPayments = allPayments.filter((p) => p.clientId === client.id);
  
  // Payments specifically recorded for this month
  const thisMonthPayments = clientPayments.filter((p) => p.month === targetMonth);
  const paymentsReceived = thisMonthPayments.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);
  const damageDeduction = thisMonthPayments.reduce((sum, p) => sum + (Number(p.discountOrDamage) || 0), 0);

  // Anomaly check
  let hasAnomaly = false;
  let anomalyReason = '';

  for (const entry of monthEntries) {
    const dmy = formatDateDDMMYYYY(entry.date);
    if (entry.meters > 8000) {
      hasAnomaly = true;
      anomalyReason = `તારીખ ${dmy} ના રોજ ${entry.meters} મીટરની અસામાન્ય મોટી એન્ટ્રી છે. કૃપા કરીને ચેક કરો.`;
      break;
    }
    if (entry.rateApplied !== client.ratePerMeter) {
      hasAnomaly = true;
      anomalyReason = `તારીખ ${dmy} ના રોજ ભાવ ₹${entry.rateApplied} લાગ્યો છે, જ્યારે ક્લાયન્ટનો ફિક્સ ભાવ ₹${client.ratePerMeter} છે.`;
      break;
    }
  }

  // Final outstanding balance
  const previousBalance = Number(client.openingBalance) || 0;
  const finalTotalDue = Math.max(0, Math.round(previousBalance + currentMonthAmount - paymentsReceived - damageDeduction));

  return {
    clientId: client.id,
    accountNo: client.accountNo ?? 0,
    clientName: client.name,
    area: client.area,
    phone: client.phone,
    ratePerMeter: client.ratePerMeter,
    totalMeters: Math.round(totalMeters),
    currentMonthAmount: Math.round(currentMonthAmount),
    previousBalance: Math.round(previousBalance),
    paymentsReceived: Math.round(paymentsReceived),
    damageDeduction: Math.round(damageDeduction),
    finalTotalDue,
    entriesCount: monthEntries.length,
    entries: monthEntries.sort((a, b) => a.date.localeCompare(b.date)),
    hasAnomaly,
    anomalyReason,
    daysSinceLastVisit,
    lastVisitDate,
  };
}

export function generateUpiUrl(settings: BusinessSettings, amount: number, clientName: string): string {
  const note = encodeURIComponent(`Vishwas ThreadCut Bill - ${clientName}`);
  const pn = encodeURIComponent(settings.businessName || 'Vishwas Thread Cutting');
  return `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${pn}&am=${amount}&cu=INR&tn=${note}`;
}

export function formatWhatsAppMessage(calc: MonthlyCalculation, settings: BusinessSettings, monthName: string): string {
  const lines = [
    `🧵 *${settings.businessName || 'વિશ્વાસ થ્રેડ કટિંગ'}*`,
    `📋 *હિસાબ સ્ટેટમેન્ટ (${monthName})*`,
    `🔢 ખાતા નં: *#${calc.accountNo}*`,
    `👤 ગ્રાહક: *${calc.clientName}*${calc.area ? ` (${calc.area})` : ''}`,
    `--------------------------------`,
    `▪️ આ માસનું બિલ: *₹${calc.currentMonthAmount.toLocaleString('gu-IN')}*`,
  ];

  if (calc.previousBalance > 0) {
    lines.push(`▪️ અગાઉના મહિનાઓની જૂની બાકી રકમ: *₹${calc.previousBalance.toLocaleString('gu-IN')}*`);
  }

  if (calc.paymentsReceived > 0) {
    lines.push(`▫️ મળેલ જમા રકમ: *-₹${calc.paymentsReceived.toLocaleString('gu-IN')}*`);
  }

  if (calc.damageDeduction > 0) {
    lines.push(`▫️ નુકસાની / વળતર કપાત: *-₹${calc.damageDeduction.toLocaleString('gu-IN')}*`);
  }

  lines.push(`--------------------------------`);
  lines.push(`💰 *કુલ ચૂકવવાપાત્ર બાકી રકમ: ₹${calc.finalTotalDue.toLocaleString('gu-IN')}*`);
  lines.push(`--------------------------------`);
  
  if (settings.upiId) {
    lines.push(`📲 *ઓનલાઇન પેમેન્ટ UPI ID:* \`${settings.upiId}\``);
  }
  lines.push(`સંપર્ક: ${settings.ownerName} (${settings.phone})`);
  lines.push(`_કૃપા કરીને હિસાબ ચેક કરી પેમેન્ટ કરી આપશો. આભાર!_ 🙏`);

  return encodeURIComponent(lines.join('\n'));
}

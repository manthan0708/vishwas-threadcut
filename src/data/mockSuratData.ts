import type { Client, DailyEntry, PaymentRecord } from '../types';

export function generate150SuratClients(): {
  clients: Client[];
  entries: DailyEntry[];
  payments: PaymentRecord[];
} {
  const societies = [
    'દિવાળીબાગ',
    'જીઆઈડીસી',
    'બબરીક',
    'કાચા નગર',
    'પંડોળ',
    'ઉમિયાધામ',
    'શ્રીકૃપા',
    'ખોડલધામ સોસાયટી',
    'હરિકૃષ્ણ સોસાયટી',
    'સરદાર પટેલ સોસાયટી',
  ];

  const firstNames = [
    'રમેશભાઈ',
    'પરેશભાઈ',
    'જયંતીભાઈ',
    'સુરેશભાઈ',
    'મુકેશભાઈ',
    'દિનેશભાઈ',
    'હરેશભાઈ',
    'વિપુલભાઈ',
    'કાંતિભાઈ',
    'ભાવેશભાઈ',
    'રાજુભાઈ',
    'મનોજભાઈ',
    'પ્રવીણભાઈ',
    'અશોકભાઈ',
    'સંજયભાઈ',
    'ચેતનભાઈ',
    'હિતેશભાઈ',
    'ધર્મેશભાઈ',
    'મહેશભાઈ',
    'ભરતભાઈ',
  ];

  const surnames = [
    'તેજાણી',
    'બાબરીયા',
    'પટેલ',
    'મોરડિયા',
    'ચોવટિયા',
    'સાવલિયા',
    'ધાનાણી',
    'કાકડિયા',
    'ગોયાણી',
    'વેકરિયા',
    'કાનાણી',
    'ગજેરા',
    'વાઘાણી',
    'ભંડેરી',
    'ખોખાણી',
  ];

  const clients: Client[] = [];
  const entries: DailyEntry[] = [];
  const payments: PaymentRecord[] = [];

  let globalEntryId = 1;
  let globalPaymentId = 1;

  // Real today from system
  const todayObj = new Date();

  for (let i = 1; i <= 150; i++) {
    const fn = firstNames[(i - 1) % firstNames.length];
    const sn = surnames[(i * 3) % surnames.length];
    const soc = societies[(i * 7) % societies.length];
    const houseNo = `${(i * 13) % 150 + 1}/${(i * 7) % 60 + 10}`;

    let clientName = '';
    const area = soc;

    if (i % 3 === 0) {
      clientName = `${fn} ${sn}`;
    } else if (i % 3 === 1) {
      clientName = `${fn} ${soc} ${houseNo}`;
    } else {
      clientName = `${fn} ${sn} (${soc})`;
    }

    let category: 'inactive' | 'new' | 'regular' = 'regular';
    if (i <= 30) {
      category = 'inactive';
    } else if (i <= 50) {
      category = 'new';
    }

    const rates = [1.00, 1.10, 1.15, 1.20, 1.25, 1.30, 1.35, 1.40, 1.50];
    const ratePerMeter = rates[i % rates.length];

    const phonePrefix = ['9825', '9898', '9426', '9712', '9909', '9979'][i % 6];
    const phone = `${phonePrefix}${String(100000 + i * 271).slice(-6)}`;

    let openingBalance = 0;
    if (category === 'inactive') {
      openingBalance = (i % 2 === 0) ? Math.round(((i * 730) % 15000 + 2000) / 100) * 100 : 0;
    } else if (category === 'new') {
      openingBalance = (i % 3 === 0) ? Math.round(((i * 450) % 5000) / 100) * 100 : 0;
    } else {
      openingBalance = Math.round(((i * 1234) % 30000 + 5000) / 100) * 100;
    }

    const clientId = `client_${i}`;
    clients.push({
      id: clientId,
      accountNo: i,
      name: clientName,
      area,
      phone,
      ratePerMeter,
      openingBalance,
      active: true,
      createdAt: category === 'new' ? '2026-08-15' : '2024-03-01',
      notes: `${soc} ખાતા નંબર ${i}`,
    });

    if (category === 'inactive') {
      // Inactive clients: stopped coming 6-8 months ago
      entries.push({
        id: `e_${globalEntryId++}`,
        clientId,
        clientName,
        date: '2026-04-12',
        meters: 650,
        rateApplied: ratePerMeter,
        createdAt: '2026-04-12T18:00:00Z',
        notes: 'છેલ્લી એન્ટ્રી (કામ બંધ)',
      });
    }
  }

  // Generate continuous working day entries for past 45 days up to today
  // Ensuring EVERY day (like 2026-10-28, 2026-10-29, etc.) has rich data!
  const textileNotes = [
    'સાડી થ્રેડ કટિંગ',
    'ડ્રેસ મટીરીયલ (2 પાસ)',
    'લેસ કટિંગ & રોલ',
    'દુપટ્ટા એમ્બ્રોઇડરી',
    'કુર્તી થ્રેડ કટિંગ',
    'બ્લાઉઝ પીસ',
    'કોમ્બો લોટ',
  ];

  const regularClients = clients.filter(c => c.accountNo > 50);

  for (let daysAgo = 45; daysAgo >= 0; daysAgo--) {
    const dObj = new Date(todayObj);
    dObj.setDate(dObj.getDate() - daysAgo);
    
    // Skip Sundays
    if (dObj.getDay() === 0) continue;

    const dateStr = dObj.toISOString().split('T')[0];

    // Pick 12 to 18 regular clients each day
    const daySeed = daysAgo * 7 + 13;
    const clientCountForDay = 12 + (daySeed % 7);

    for (let cIdx = 0; cIdx < clientCountForDay; cIdx++) {
      const clientIndex = (daySeed * 3 + cIdx * 5) % regularClients.length;
      const client = regularClients[clientIndex];
      const note = textileNotes[(daySeed + cIdx) % textileNotes.length];

      // Give some clients multiple visits in the same day (e.g. client 14 or client 28 or every 4th client)
      const hasMultipleVisits = (client.accountNo === 14 || client.accountNo === 28 || cIdx % 4 === 0);

      let meters = 0;
      let metersBreakdown: number[] | undefined = undefined;

      if (hasMultipleVisits) {
        // e.g. 2200 + 440 + 230 = 2870
        const m1 = Math.round((1200 + (cIdx * 190) % 1500) / 10) * 10;
        const m2 = Math.round((300 + (cIdx * 90) % 500) / 10) * 10;
        const m3 = Math.round((150 + (cIdx * 60) % 350) / 10) * 10;
        metersBreakdown = [m1, m2, m3];
        meters = m1 + m2 + m3;
      } else {
        meters = Math.round((450 + ((cIdx + daySeed) * 63) % 1200) / 10) * 10;
      }

      entries.push({
        id: `e_${globalEntryId++}`,
        clientId: client.id,
        clientName: client.name,
        date: dateStr,
        meters,
        metersBreakdown,
        rateApplied: client.ratePerMeter,
        createdAt: `${dateStr}T18:${String((cIdx * 3) % 50 + 10).padStart(2, '0')}:00Z`,
        notes: note,
      });
    }

    // Also include a new client visit if recent
    if (daysAgo <= 15 && daysAgo % 3 === 0) {
      const newClients = clients.filter(c => c.accountNo > 30 && c.accountNo <= 50);
      const nc = newClients[daysAgo % newClients.length];
      entries.push({
        id: `e_${globalEntryId++}`,
        clientId: nc.id,
        clientName: nc.name,
        date: dateStr,
        meters: 650,
        rateApplied: nc.ratePerMeter,
        createdAt: `${dateStr}T17:30:00Z`,
        notes: 'નવા ગ્રાહક પહેલો લોટ',
      });
    }
  }

  // Monthly Payments for past months (August, September, October 2026)
  const pastMonths = [
    { month: '2026-08', payDate: '2026-08-25' },
    { month: '2026-09', payDate: '2026-09-24' },
    { month: '2026-10', payDate: '2026-10-25' },
  ];

  for (const pm of pastMonths) {
    for (let i = 1; i <= 150; i++) {
      if (i <= 30) continue; // Inactive
      if (i % 2 === 0) {
        const client = clients[i - 1];
        const payAmount = Math.round(((i * 750) % 12000 + 3500) / 100) * 100;
        const damage = (i % 5 === 0) ? 250 : 0;

        payments.push({
          id: `p_${globalPaymentId++}`,
          clientId: client.id,
          month: pm.month,
          date: pm.payDate,
          amountPaid: payAmount,
          paymentMode: (i % 3 === 0) ? 'upi' : 'cash',
          discountOrDamage: damage,
          notes: damage > 0 ? 'સાડી ડેમેજ કપાત' : 'માસિક પેમેન્ટ',
          createdAt: `${pm.payDate}T19:00:00Z`,
        });
      }
    }
  }

  return { clients, entries, payments };
}

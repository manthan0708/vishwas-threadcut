import { describe, it, expect } from 'vitest';
import { calculateClientMonth, formatWhatsAppMessage, generateUpiUrl } from './billing';
import type { Client, DailyEntry, PaymentRecord, BusinessSettings } from '../types';

describe('Billing Calculation & Ledger Logic', () => {
  const mockClient: Client = {
    id: 'client-1',
    accountNo: 1,
    name: 'રમેશભાઈ એમ્બ્રોઇડરી',
    area: 'રીંગરોડ',
    phone: '9825112345',
    ratePerMeter: 1.15,
    openingBalance: 10000,
    active: true,
    createdAt: '2026-01-01',
  };

  const mockSettings: BusinessSettings = {
    businessName: 'શ્રી ગણેશ એમ્બ્રોઇડરી',
    ownerName: 'મંથનભાઈ',
    phone: '9876543210',
    upiId: 'manthan@upi',
    rateCardDefault: 1.25,
  };

  it('correctly calculates basic monthly total meters and amount', () => {
    const entries: DailyEntry[] = [
      { id: '1', clientId: 'client-1', clientName: 'રમેશભાઈ', date: '2026-11-01', meters: 1000, rateApplied: 1.15, createdAt: '' },
      { id: '2', clientId: 'client-1', clientName: 'રમેશભાઈ', date: '2026-11-05', meters: 2000, rateApplied: 1.15, createdAt: '' },
    ];
    const payments: PaymentRecord[] = [];

    const result = calculateClientMonth(mockClient, entries, payments, '2026-11');
    expect(result.totalMeters).toBe(3000);
    expect(result.currentMonthAmount).toBe(3450); // 3000 * 1.15 = 3450
    // Previous balance 10000 + 3450 = 13450
    expect(result.finalTotalDue).toBe(13450);
    expect(result.hasAnomaly).toBe(false);
  });

  it('correctly handles partial payment and damage deduction (નુકસાની કપાત)', () => {
    const entries: DailyEntry[] = [
      { id: '1', clientId: 'client-1', clientName: 'રમેશભાઈ', date: '2026-11-10', meters: 10000, rateApplied: 1.15, createdAt: '' },
    ]; // 10000 * 1.15 = 11500
    
    // User scenario: bill 11500 + 10000 opening = 21500.
    // Client pays 20000 cash, 500 damage deduction waived, 1000 remaining.
    const payments: PaymentRecord[] = [
      {
        id: 'p1',
        clientId: 'client-1',
        month: '2026-11',
        date: '2026-11-20',
        amountPaid: 20000,
        paymentMode: 'cash',
        discountOrDamage: 500, // Explicitly waived due to fabric damage
        createdAt: '',
      },
    ];

    const result = calculateClientMonth(mockClient, entries, payments, '2026-11');
    expect(result.paymentsReceived).toBe(20000);
    expect(result.damageDeduction).toBe(500);
    // 10000 + 11500 - 20000 - 500 = 1000 remaining
    expect(result.finalTotalDue).toBe(1000);
  });

  it('ATTACK VECTOR / EDGE CASE: flags rate tampering anomaly when rate applied != client rate', () => {
    const tamperedEntries: DailyEntry[] = [
      { id: '1', clientId: 'client-1', clientName: 'રમેશભાઈ', date: '2026-11-01', meters: 500, rateApplied: 0.15, createdAt: '' },
    ];
    const result = calculateClientMonth(mockClient, tamperedEntries, [], '2026-11');
    expect(result.hasAnomaly).toBe(true);
    expect(result.anomalyReason).toContain('ભાવ ₹0.15 લાગ્યો છે');
  });

  it('EDGE CASE: flags unusually large meters entry (>8000 meters in a day)', () => {
    const hugeEntries: DailyEntry[] = [
      { id: '1', clientId: 'client-1', clientName: 'રમેશભાઈ', date: '2026-11-02', meters: 12000, rateApplied: 1.15, createdAt: '' },
    ];
    const result = calculateClientMonth(mockClient, hugeEntries, [], '2026-11');
    expect(result.hasAnomaly).toBe(true);
    expect(result.anomalyReason).toContain('અસામાન્ય મોટી એન્ટ્રી');
  });

  it('EDGE CASE: overpayment does not produce negative balance in finalTotalDue', () => {
    const entries: DailyEntry[] = [];
    const payments: PaymentRecord[] = [
      { id: 'p1', clientId: 'client-1', month: '2026-11', date: '2026-11-15', amountPaid: 15000, paymentMode: 'upi', discountOrDamage: 0, createdAt: '' },
    ];
    // opening balance was 10000, paid 15000
    const result = calculateClientMonth(mockClient, entries, payments, '2026-11');
    expect(result.finalTotalDue).toBe(0);
  });

  it('generates valid UPI payment link and WhatsApp message', () => {
    const upi = generateUpiUrl(mockSettings, 5000, 'રમેશભાઈ');
    expect(upi).toContain('upi://pay');
    expect(upi).toContain('manthan%40upi');
    expect(upi).toContain('5000');

    const result = calculateClientMonth(mockClient, [], [], '2026-11');
    const wa = formatWhatsAppMessage(result, mockSettings, 'નવેમ્બર ૨૦૨૬');
    expect(decodeURIComponent(wa)).toContain('રમેશભાઈ એમ્બ્રોઇડરી');
    expect(decodeURIComponent(wa)).toContain('કુલ ચૂકવવાપાત્ર બાકી રકમ');
  });
});

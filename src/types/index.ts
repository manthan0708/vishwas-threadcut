export interface Client {
  id: string;
  accountNo: number; // ખાતા નંબર (દા.ત. ૧૪)
  name: string;
  area?: string; // વિસ્તાર / માર્કેટ (દા.ત. 'દિવાળીબાગ', 'રીંગરોડ')
  phone: string;
  ratePerMeter: number;
  openingBalance: number; // અગાઉના મહિનાઓની કુલ જૂની બાકી રકમ
  photoUrl?: string;
  notes?: string;
  createdAt: string;
  active: boolean;
}

export interface DailyEntry {
  id: string;
  clientId: string;
  clientName: string;
  date: string; // YYYY-MM-DD
  meters: number;
  metersBreakdown?: number[]; // [2200, 440, 230] for multiple visits in a single day
  rateApplied: number;
  notes?: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  clientId: string;
  month: string; // YYYY-MM
  date: string; // YYYY-MM-DD
  amountPaid: number;
  paymentMode: 'cash' | 'upi' | 'cheque' | 'other';
  discountOrDamage: number; // નુકસાની / ડિસ્કાઉન્ટ કપાત (waived, will NOT carry forward)
  notes?: string;
  createdAt: string;
}

export interface BusinessSettings {
  businessName: string;
  ownerName: string;
  phone: string;
  upiId: string;
  address?: string;
  rateCardDefault: number;
}

export interface MonthlyCalculation {
  clientId: string;
  accountNo: number;
  clientName: string;
  area?: string;
  phone: string;
  ratePerMeter: number;
  totalMeters: number;
  currentMonthAmount: number;
  previousBalance: number;
  paymentsReceived: number;
  damageDeduction: number;
  finalTotalDue: number;
  entriesCount: number;
  entries: DailyEntry[];
  hasAnomaly?: boolean;
  anomalyReason?: string;
  daysSinceLastVisit?: number;
  lastVisitDate?: string;
}

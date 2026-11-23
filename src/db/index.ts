import Dexie, { type Table } from 'dexie';
import type { Client, DailyEntry, PaymentRecord, BusinessSettings } from '../types';
import { generate150SuratClients } from '../data/mockSuratData';

export class BillingDatabase extends Dexie {
  clients!: Table<Client, string>;
  entries!: Table<DailyEntry, string>;
  payments!: Table<PaymentRecord, string>;
  settings!: Table<{ key: string; value: any }, string>;

  constructor() {
    super('ThreadCutBillingDB');
    this.version(25).stores({
      clients: 'id, accountNo, name, phone, active',
      entries: 'id, clientId, date, createdAt',
      payments: 'id, clientId, month, date',
      settings: 'key',
    });
  }
}

export const db = new BillingDatabase();

export const DEFAULT_SETTINGS: BusinessSettings = {
  businessName: 'વિશ્વાસ થ્રેડ કટિંગ',
  ownerName: 'મંથનભાઈ',
  phone: '9876543210',
  upiId: 'manthan@upi',
  address: 'સુરત, ગુજરાત',
  rateCardDefault: 1.25,
};

export async function getSettings(): Promise<BusinessSettings> {
  const item = await db.settings.get('profile');
  if (item && item.value) {
    if (item.value.businessName === 'શ્રી ગણેશ એમ્બ્રોઇડરી થ્રેડ કટિંગ') {
      item.value.businessName = 'વિશ્વાસ થ્રેડ કટિંગ';
      await db.settings.put({ key: 'profile', value: item.value });
    }
    return item.value;
  }
  await db.settings.put({ key: 'profile', value: DEFAULT_SETTINGS });
  return DEFAULT_SETTINGS;
}

export async function saveSettings(settings: BusinessSettings): Promise<void> {
  await db.settings.put({ key: 'profile', value: settings });
}

// Seed 150 Surat Textile Clients with realistic history
export async function seedSampleDataIfEmpty() {
  const [clientCount, entryCount] = await Promise.all([
    db.clients.count(),
    db.entries.count(),
  ]);
  if (clientCount >= 50 && entryCount >= 50) return; // Already has rich data

  await reseed150Clients();
}

export async function reseed150Clients() {
  const { clients, entries, payments } = generate150SuratClients();

  await db.transaction('rw', [db.clients, db.entries, db.payments], async () => {
    await db.clients.clear();
    await db.entries.clear();
    await db.payments.clear();

    await db.clients.bulkAdd(clients);
    await db.entries.bulkAdd(entries);
    await db.payments.bulkAdd(payments);
  });
}

// 100% Reliable Backup & Restore
export async function exportDatabaseBackupJSON(): Promise<string> {
  const clients = await db.clients.toArray();
  const entries = await db.entries.toArray();
  const payments = await db.payments.toArray();
  const settings = await db.settings.toArray();

  const backupData = {
    version: 2,
    exportedAt: new Date().toISOString(),
    clients,
    entries,
    payments,
    settings,
  };

  return JSON.stringify(backupData, null, 2);
}

export async function importDatabaseBackupJSON(jsonString: string): Promise<{ success: boolean; message: string }> {
  try {
    const data = JSON.parse(jsonString);
    if (!data.clients || !data.entries) {
      throw new Error('અમાન્ય બેકઅપ ફાઇલ (Invalid backup structure)');
    }

    await db.transaction('rw', [db.clients, db.entries, db.payments, db.settings], async () => {
      await db.clients.clear();
      await db.entries.clear();
      await db.payments.clear();
      await db.settings.clear();

      if (data.clients?.length) await db.clients.bulkAdd(data.clients);
      if (data.entries?.length) await db.entries.bulkAdd(data.entries);
      if (data.payments?.length) await db.payments.bulkAdd(data.payments);
      if (data.settings?.length) await db.settings.bulkAdd(data.settings);
    });

    return { success: true, message: 'બેકઅપ સફળતાપૂર્વક રિસ્ટોર થયું!' };
  } catch (error: any) {
    return { success: false, message: error.message || 'બેકઅપ રિસ્ટોર કરવામાં ભૂલ આવી.' };
  }
}

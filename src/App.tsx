import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { HomeScreen } from './components/HomeScreen';
import { DailyEntryView } from './components/DailyEntryView';
import { MonthlyBillingView } from './components/MonthlyBillingView';
import { BillDiaryView } from './components/BillDiaryView';
import { ClientsView } from './components/ClientsView';
import { SettingsBackupView } from './components/SettingsBackupView';
import { PaymentModal } from './components/PaymentModal';

import type { Client, DailyEntry, PaymentRecord, BusinessSettings } from './types';
import { 
  db, 
  getSettings, 
  saveSettings, 
  seedSampleDataIfEmpty, 
  DEFAULT_SETTINGS 
} from './db';
import { calculateClientMonth } from './utils/billing';

export function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'daily' | 'monthly' | 'bill' | 'clients' | 'settings'>('home');
  const [clients, setClients] = useState<Client[]>([]);
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Active payment modal state
  const [paymentModalClientId, setPaymentModalClientId] = useState<string | null>(null);

  // Refresh all state from Dexie IndexedDB
  const refreshAllData = useCallback(async () => {
    try {
      await seedSampleDataIfEmpty();
      const [c, e, p, s] = await Promise.all([
        db.clients.toArray(),
        db.entries.toArray(),
        db.payments.toArray(),
        getSettings(),
      ]);
      setClients(c);
      setEntries(e);
      setPayments(p);
      setSettings(s);
    } catch (err) {
      console.error('Failed to load database:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Current Month for calculation
  const today = new Date();
  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  // Anomalies count
  const pendingAnomaliesCount = clients.reduce((acc, client) => {
    const calc = calculateClientMonth(client, entries, payments, currentMonthStr);
    return acc + (calc.hasAnomaly ? 1 : 0);
  }, 0);

  // Handlers
  const handleAddEntry = async (entryData: Omit<DailyEntry, 'id' | 'createdAt'>) => {
    // Check if client already has an entry on this exact date
    const existing = entries.find(
      (e) => e.clientId === entryData.clientId && e.date === entryData.date
    );

    if (existing) {
      // Merge multiple visits on same day: 2200 + 440 + 230
      const currentBreakdown = existing.metersBreakdown && existing.metersBreakdown.length > 0
        ? existing.metersBreakdown
        : [existing.meters];
      
      const updatedBreakdown = [...currentBreakdown, entryData.meters];
      const updatedTotalMeters = updatedBreakdown.reduce((sum, m) => sum + m, 0);
      const updatedNotes = entryData.notes
        ? existing.notes
          ? `${existing.notes}, ${entryData.notes}`
          : entryData.notes
        : existing.notes;

      await db.entries.update(existing.id, {
        meters: updatedTotalMeters,
        metersBreakdown: updatedBreakdown,
        notes: updatedNotes,
        rateApplied: entryData.rateApplied || existing.rateApplied,
      });

      setEntries((prev) =>
        prev.map((e) =>
          e.id === existing.id
            ? {
                ...e,
                meters: updatedTotalMeters,
                metersBreakdown: updatedBreakdown,
                notes: updatedNotes,
                rateApplied: entryData.rateApplied || existing.rateApplied,
              }
            : e
        )
      );
    } else {
      const newEntry: DailyEntry = {
        ...entryData,
        metersBreakdown: [entryData.meters],
        id: 'e_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        createdAt: new Date().toISOString(),
      };
      await db.entries.add(newEntry);
      setEntries((prev) => [newEntry, ...prev]);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    await db.entries.delete(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleAddClient = async (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient: Client = {
      ...clientData,
      id: 'c_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      createdAt: new Date().toISOString(),
    };
    await db.clients.add(newClient);
    setClients((prev) => [...prev, newClient]);
  };

  const handleUpdateClient = async (id: string, updates: Partial<Client>) => {
    await db.clients.update(id, updates);
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const handleSavePayment = async (paymentData: Omit<PaymentRecord, 'id' | 'createdAt'>) => {
    const newPayment: PaymentRecord = {
      ...paymentData,
      id: 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      createdAt: new Date().toISOString(),
    };
    await db.payments.add(newPayment);
    setPayments((prev) => [newPayment, ...prev]);
  };

  const handleDeletePayment = async (id: string) => {
    await db.payments.delete(id);
    setPayments((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSaveSettings = async (newSettings: BusinessSettings) => {
    await saveSettings(newSettings);
    setSettings(newSettings);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="text-4xl animate-bounce">🧵</div>
          <p className="text-sm font-semibold text-slate-300">
            થ્રેડ કટિંગ બિલિંગ સોફ્ટવેર લોડ થઈ રહ્યું છે...
          </p>
        </div>
      </div>
    );
  }

  const activeClientForPayment = paymentModalClientId
    ? clients.find((c) => c.id === paymentModalClientId)
    : null;

  const activeDueForPayment = activeClientForPayment
    ? calculateClientMonth(activeClientForPayment, entries, payments, currentMonthStr).finalTotalDue
    : 0;

  return (
    <div className="min-h-screen bg-slate-100/60 pb-12">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={settings}
        pendingAnomaliesCount={pendingAnomaliesCount}
      />

      {/* Quick Return to Home Button when viewing any Diary */}
      {activeTab !== 'home' && (
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-2xl text-xs font-black text-slate-800 shadow-xs transition-all cursor-pointer group"
          >
            <span className="text-amber-600 font-bold group-hover:-translate-x-1 transition-transform">←</span>
            <span>મેઈન સ્ક્રીન (મુખ્ય ૪ બટન પર પાછા જાઓ)</span>
          </button>
        </div>
      )}

      <main>
        {activeTab === 'home' && (
          <HomeScreen
            onSelectDiary={(tab) => setActiveTab(tab)}
            clients={clients}
            entries={entries}
            payments={payments}
            settings={settings}
          />
        )}

        {activeTab === 'daily' && (
          <DailyEntryView
            clients={clients}
            entries={entries}
            onAddEntry={handleAddEntry}
            onDeleteEntry={handleDeleteEntry}
          />
        )}

        {activeTab === 'monthly' && (
          <MonthlyBillingView
            clients={clients}
            entries={entries}
            payments={payments}
            settings={settings}
            onOpenPaymentModal={(clientId) => setPaymentModalClientId(clientId)}
          />
        )}

        {activeTab === 'bill' && (
          <BillDiaryView
            clients={clients}
            entries={entries}
            payments={payments}
            settings={settings}
            onOpenPaymentModal={(clientId) => setPaymentModalClientId(clientId)}
          />
        )}

        {activeTab === 'clients' && (
          <ClientsView
            clients={clients}
            entries={entries}
            payments={payments}
            onAddClient={handleAddClient}
            onUpdateClient={handleUpdateClient}
            onOpenPaymentModal={(clientId) => setPaymentModalClientId(clientId)}
            onDeletePayment={handleDeletePayment}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsBackupView
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onRefreshData={refreshAllData}
            clientCount={clients.length}
            entryCount={entries.length}
          />
        )}
      </main>

      {/* Payment Modal if opened */}
      {activeClientForPayment && (
        <PaymentModal
          client={activeClientForPayment}
          currentDue={activeDueForPayment}
          month={currentMonthStr}
          onClose={() => setPaymentModalClientId(null)}
          onSavePayment={handleSavePayment}
        />
      )}
    </div>
  );
}

export default App;

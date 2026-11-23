import React, { useState } from 'react';
import { 
  Download, 
  Upload, 
  ShieldCheck, 
  Save, 
  Check, 
  AlertTriangle,
  QrCode,
  Building
} from 'lucide-react';
import type { BusinessSettings } from '../types';
import { exportDatabaseBackupJSON, importDatabaseBackupJSON, reseed150Clients } from '../db';
import { RefreshCw } from 'lucide-react';

interface SettingsBackupViewProps {
  settings: BusinessSettings;
  onSaveSettings: (settings: BusinessSettings) => Promise<void>;
  onRefreshData: () => Promise<void>;
  clientCount: number;
  entryCount: number;
}

export const SettingsBackupView: React.FC<SettingsBackupViewProps> = ({
  settings,
  onSaveSettings,
  onRefreshData,
  clientCount,
  entryCount,
}) => {
  const [formData, setFormData] = useState<BusinessSettings>(settings);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveSettings(formData);
    setStatusMsg({ type: 'success', text: 'સેટિંગ્સ સફળતાપૂર્વક સેવ થઈ ગયા!' });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleReseedData = async () => {
    if (!confirm('શું તમે ૧૫૦ સુરત ટેક્સટાઇલ ક્લાયન્ટ્સનો ૨ વર્ષનો સેમ્પલ ડેટા (દિવાળીબાગ, બબરીક, કાચા નગર, પંડોળ વગેરે) લોડ કરવા માંગો છો?')) {
      return;
    }
    await reseed150Clients();
    await onRefreshData();
    setStatusMsg({
      type: 'success',
      text: '૧૫૦ સુરત ટેક્સટાઇલ ક્લાયન્ટ્સ અને ૨ વર્ષનો સંપૂર્ણ ડેટા સફળતાપૂર્વક લોડ થઈ ગયો છે!',
    });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleDownloadBackup = async () => {
    try {
      const jsonStr = await exportDatabaseBackupJSON();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `ThreadCut_Backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatusMsg({
        type: 'success',
        text: 'સંપૂર્ણ ડેટા બેકઅપ ફાઇલ ડાઉનલોડ થઈ ગઈ છે! તેને ગૂગલ ડ્રાઇવ કે વ્હોટ્સએપ પર સુરક્ષિત રાખો.',
      });
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: 'બેકઅપ ડાઉનલોડ કરવામાં ભૂલ આવી.' });
    }
  };

  const handleFileRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('ચેતવણી: બેકઅપ રિસ્ટોર કરવાથી વર્તમાન ડેટા ફાઇલ મુજબ બદલાઈ જશે. શું તમે આગળ વધવા માંગો છો?')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target?.result as string;
      const res = await importDatabaseBackupJSON(content);
      if (res.success) {
        await onRefreshData();
        setStatusMsg({ type: 'success', text: res.message });
      } else {
        setStatusMsg({ type: 'error', text: res.message });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Status Alert */}
      {statusMsg && (
        <div
          className={`p-4 rounded-xl flex items-center gap-2 text-sm font-semibold shadow-md ${
            statusMsg.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {statusMsg.type === 'success' ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Zero Data Loss Assurance Card */}
      <div className="bg-gradient-to-r from-emerald-950 to-slate-900 border border-emerald-500/40 rounded-2xl p-6 text-white shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-emerald-300">
              ૧૦૦% સેફ ડેટા સિક્યોરિટી ગેરંટી (Zero Data Loss)
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              તમારો ₹૫ થી ૭ લાખનો હિસાબ ક્યારેય ખોવાઈ નહીં જાય.
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          આ એપ્લિકેશન તમારા તમામ ગ્રાહકો, ડેઇલી મીટર અને પેમેન્ટનો ડેટા તમારા ડિવાઇસમાં સુરક્ષિત રાખે છે. દર અઠવાડિયે કે મહિને ફક્ત એક ક્લિકમાં બેકઅપ ફાઇલ ડાઉનલોડ કરી તમારા વ્હોટ્સએપ કે ગૂગલ ડ્રાઇવમાં સેવ કરી શકો છો.
        </p>

        <div className="pt-2 flex flex-wrap gap-3">
          <button
            onClick={handleDownloadBackup}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl shadow-md text-xs sm:text-sm transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>સંપૂર્ણ ડેટા બેકઅપ ડાઉનલોડ કરો (Backup JSON)</span>
          </button>

          <button
            onClick={handleReseedData}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-md text-xs sm:text-sm transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>૧૫૦ સુરત ક્લાયન્ટ્સનો ૨ વર્ષનો ડેટા લોડ કરો</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-xl text-xs sm:text-sm transition-all cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>જૂનું બેકઅપ રિસ્ટોર કરો (Restore)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileRestore}
              className="hidden"
            />
          </label>
        </div>

        <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 flex gap-6">
          <span>હાલમાં રજિસ્ટર્ડ ગ્રાહકો: <strong className="text-white">{clientCount}</strong></span>
          <span>કુલ રેકોર્ડેડ એન્ટ્રીઓ: <strong className="text-white">{entryCount}</strong></span>
        </div>
      </div>

      {/* Business Details Form */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Building className="w-5 h-5 text-amber-500" />
            બિઝનેસ & UPI પેમેન્ટ સેટિંગ્સ
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            આ માહિતી તમામ ગ્રાહકોના બિલ અને WhatsApp મેસેજમાં પ્રિન્ટ થશે
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                પેઢી / કારખાનાનું નામ:
              </label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) =>
                  setFormData({ ...formData, businessName: e.target.value })
                }
                required
                className="w-full text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                સંચાલક / માલિકનું નામ:
              </label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={(e) =>
                  setFormData({ ...formData, ownerName: e.target.value })
                }
                required
                className="w-full text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                સંપર્ક મોબાઈલ નંબર:
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                required
                className="w-full text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ઓનલાઇન પેમેન્ટ UPI ID (QR કોડ માટે):
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="દા.ત. 9876543210@paytm અથવા manthan@upi"
                  value={formData.upiId}
                  onChange={(e) =>
                    setFormData({ ...formData, upiId: e.target.value })
                  }
                  required
                  className="w-full text-sm font-mono font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <QrCode className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              સરનામું / લોકેશન (બિલમાં પ્રિન્ટ માટે):
            </label>
            <input
              type="text"
              value={formData.address || ''}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              placeholder="દા.ત. પ્લોટ નં. ૨૫, એમ્બ્રોઇડરી પાર્ક, સુરત"
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all shadow-md cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>સેટિંગ્સ સેવ કરો</span>
          </button>
        </form>
      </div>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Check, X, AlertCircle, Pill } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import type { MedicationReminder, MedicationLog } from '../../lib/supabase';
import { todayISO, formatDate } from '../../lib/utils';
import { Modal } from '../ui/Modal';

interface Props { onBack: () => void; }

const FREQ_LABELS: Record<string, string> = {
  daily: 'Ogni giorno',
  weekly: 'Settimanale',
  biweekly: 'Due volte a settimana',
  monthly: 'Mensile',
  once: 'Una volta',
  as_needed: 'Al bisogno',
};

const CAT_LABELS: Record<string, string> = {
  medication: 'Farmaco',
  supplement: 'Supplemento',
  appointment: 'Visita',
  exam: 'Esame',
  cpap: 'CPAP',
  other: 'Altro',
};

export function MedicationsPage({ onBack }: Props) {
  const { user, isDemo, demoData, showToast } = useApp();
  const [reminders, setReminders] = useState<MedicationReminder[]>([]);
  const [todayLogs, setTodayLogs] = useState<MedicationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'supplement', frequency: 'daily', notes: '' });

  const today = todayISO();

  useEffect(() => {
    loadData();
  }, [isDemo, user]);

  const loadData = async () => {
    setLoading(true);
    if (isDemo) {
      setReminders(demoData.medications);
      setTodayLogs([]);
    } else if (user) {
      const [remRes, logsRes] = await Promise.all([
        supabase.from('medication_reminders').select('*').eq('user_id', user.id).eq('is_active', true).order('created_at'),
        supabase.from('medication_logs').select('*').eq('user_id', user.id).eq('log_date', today),
      ]);
      setReminders(remRes.data ?? []);
      setTodayLogs(logsRes.data ?? []);
    }
    setLoading(false);
  };

  const markTaken = async (reminder: MedicationReminder, taken: boolean) => {
    if (isDemo) {
      setTodayLogs(prev => {
        const filtered = prev.filter(l => l.reminder_id !== reminder.id);
        return [...filtered, {
          id: Math.random().toString(36),
          user_id: 'demo',
          reminder_id: reminder.id,
          reminder_name: reminder.name,
          log_date: today,
          log_time: new Date().toTimeString().slice(0, 5),
          taken,
          notes: null,
          symptoms_to_report: null,
          created_at: new Date().toISOString(),
        }];
      });
      showToast(taken ? `"${reminder.name}" segnato come assunto` : `"${reminder.name}" segnato come non assunto`, 'success');
      return;
    }
    if (!user) return;
    const { data } = await supabase.from('medication_logs').upsert({
      user_id: user.id,
      reminder_id: reminder.id,
      reminder_name: reminder.name,
      log_date: today,
      log_time: new Date().toTimeString().slice(0, 5),
      taken,
    }, { onConflict: 'user_id,reminder_id,log_date' as any }).select().maybeSingle();
    if (data) {
      setTodayLogs(prev => {
        const filtered = prev.filter(l => l.reminder_id !== reminder.id);
        return [...filtered, data];
      });
    }
    showToast(taken ? 'Segnato come assunto' : 'Segnato come non assunto', 'success');
  };

  const addReminder = async () => {
    if (!form.name.trim()) return;
    if (isDemo) {
      setReminders(prev => [...prev, {
        id: Math.random().toString(36),
        user_id: 'demo',
        name: form.name,
        category: form.category as MedicationReminder['category'],
        frequency: form.frequency as MedicationReminder['frequency'],
        scheduled_days: null,
        scheduled_time: null,
        is_active: true,
        notes: form.notes || null,
        professional_note: 'Segui esclusivamente la prescrizione del professionista sanitario. Non modificare dose o frequenza tramite questa applicazione.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }]);
      setAddModal(false);
      setForm({ name: '', category: 'supplement', frequency: 'daily', notes: '' });
      return;
    }
    if (!user) return;
    const { data } = await supabase.from('medication_reminders').insert({
      user_id: user.id,
      name: form.name,
      category: form.category as MedicationReminder['category'],
      frequency: form.frequency as MedicationReminder['frequency'],
      notes: form.notes || null,
      is_active: true,
    }).select().maybeSingle();
    if (data) setReminders(prev => [...prev, data]);
    setAddModal(false);
    setForm({ name: '', category: 'supplement', frequency: 'daily', notes: '' });
    showToast('Promemoria aggiunto!', 'success');
  };

  if (loading) {
    return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="card animate-pulse h-20 bg-warm-gray-100" />)}</div>;
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-warm-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-warm-gray-700" />
        </button>
        <h1 className="section-title flex-1">Terapie e supplementi</h1>
        <button onClick={() => setAddModal(true)} className="btn-primary py-2 px-3 text-sm">
          <Plus size={16} />
        </button>
      </div>

      {/* Professional note */}
      <div className="card bg-petrol-50 border-petrol-200">
        <div className="flex gap-3">
          <AlertCircle size={18} className="text-petrol-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-petrol-700 leading-relaxed">
            Questa sezione è solo un promemoria personale. Segui esclusivamente la prescrizione del professionista sanitario. Non modificare dose o frequenza tramite questa applicazione.
          </p>
        </div>
      </div>

      {/* Today's overview */}
      <div className="card">
        <h2 className="font-semibold text-warm-gray-800 mb-3">Oggi — {formatDate(today)}</h2>
        {reminders.length === 0 ? (
          <p className="text-sm text-warm-gray-400 text-center py-4">Nessun promemoria. Aggiungine uno!</p>
        ) : (
          <div className="space-y-3">
            {reminders.map(rem => {
              const log = todayLogs.find(l => l.reminder_id === rem.id);
              const catColors: Record<string, string> = {
                medication: 'bg-blue-100 text-blue-700',
                supplement: 'bg-sage-100 text-sage-700',
                cpap: 'bg-petrol-100 text-petrol-700',
                other: 'bg-warm-gray-100 text-warm-gray-700',
              };
              return (
                <div key={rem.id} className={`flex items-center gap-3 p-3 rounded-xl ${log?.taken ? 'bg-sage-50 border border-sage-200' : 'bg-warm-gray-50'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${catColors[rem.category] ?? catColors.other}`}>
                    <Pill size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-warm-gray-800 text-sm">{rem.name}</p>
                    <p className="text-xs text-warm-gray-500">{CAT_LABELS[rem.category]} · {FREQ_LABELS[rem.frequency]}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => markTaken(rem, true)}
                      className={`p-2 rounded-xl transition-all ${log?.taken === true ? 'bg-sage-500 text-white' : 'bg-warm-gray-100 text-warm-gray-500 hover:bg-sage-100 hover:text-sage-600'}`}
                      title="Segnato come assunto"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => markTaken(rem, false)}
                      className={`p-2 rounded-xl transition-all ${log?.taken === false ? 'bg-red-400 text-white' : 'bg-warm-gray-100 text-warm-gray-500 hover:bg-red-50 hover:text-red-400'}`}
                      title="Non assunto"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {addModal && (
        <Modal isOpen title="Aggiungi promemoria" onClose={() => setAddModal(false)} size="sm">
          <div className="space-y-4">
            <div className="card bg-amber-50 border-amber-200 py-2">
              <p className="text-xs text-amber-700">Inserisci solo il nome del prodotto, senza dosaggi. Segui sempre la prescrizione del tuo professionista.</p>
            </div>
            <div>
              <label className="label">Nome</label>
              <input type="text" className="input-field" placeholder="Es. Vitamina D" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} autoFocus />
            </div>
            <div>
              <label className="label">Categoria</label>
              <select className="input-field" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                {Object.entries(CAT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Frequenza</label>
              <select className="input-field" value={form.frequency} onChange={e => setForm(p => ({ ...p, frequency: e.target.value }))}>
                {Object.entries(FREQ_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Note (opzionale)</label>
              <input type="text" className="input-field" placeholder="Es. Secondo prescrizione medica" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
            <button onClick={addReminder} disabled={!form.name.trim()} className="btn-primary w-full">Aggiungi</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

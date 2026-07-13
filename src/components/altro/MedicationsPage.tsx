import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Check, X, AlertCircle, Pill, Power, Edit3 } from 'lucide-react';
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
  other: 'Altro',
};

export function MedicationsPage({ onBack }: Props) {
  const { user, isDemo, demoData, showToast, dataVersion } = useApp();
  const [reminders, setReminders] = useState<MedicationReminder[]>([]);
  const [todayLogs, setTodayLogs] = useState<MedicationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [editing, setEditing] = useState<MedicationReminder | null>(null);
  const [unlinkedNames, setUnlinkedNames] = useState<string[]>([]);
  const [form, setForm] = useState({ name: '', category: 'supplement', dosage_text: '', frequency: 'daily', scheduled_time: '08:00', scheduled_days: '', notes: '', is_active: true });

  const today = todayISO();

  useEffect(() => {
    loadData();
  }, [isDemo, user, dataVersion]);

  const loadData = async () => {
    setLoading(true);
    if (isDemo) {
      setReminders(demoData.medications);
      setTodayLogs([]);
    } else if (user) {
      const recent = new Date(); recent.setDate(recent.getDate() - 90);
      const [remRes, logsRes, recentLogsRes] = await Promise.all([
        supabase.from('medication_reminders').select('*').eq('user_id', user.id).order('is_active', { ascending: false }).order('created_at'),
        supabase.from('medication_logs').select('*').eq('user_id', user.id).eq('log_date', today),
        supabase.from('medication_logs').select('reminder_id,reminder_name').eq('user_id', user.id).gte('log_date', recent.toISOString().split('T')[0]),
      ]);
      setReminders((remRes.data ?? []).filter(reminder => reminder.category !== 'cpap'));
      setTodayLogs(logsRes.data ?? []);
      const knownIds = new Set((remRes.data ?? []).map(item => item.id));
      setUnlinkedNames([...new Set((recentLogsRes.data ?? []).filter(log => !log.reminder_id || !knownIds.has(log.reminder_id)).map(log => log.reminder_name))]);
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

  const saveReminder = async () => {
    if (!form.name.trim()) return;
    if (isDemo) {
      setReminders(prev => [...prev, {
        id: Math.random().toString(36),
        user_id: 'demo',
        name: form.name,
        category: form.category as MedicationReminder['category'],
        frequency: form.frequency as MedicationReminder['frequency'],
        scheduled_days: form.scheduled_days ? form.scheduled_days.split(',').map(day => day.trim()).filter(Boolean) : null,
        scheduled_time: form.scheduled_time || null,
        is_active: form.is_active,
        notes: form.notes || null,
        professional_note: 'Segui esclusivamente la prescrizione del professionista sanitario. Non modificare dose o frequenza tramite questa applicazione.',
        dosage_text: form.dosage_text || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }]);
      setAddModal(false);
      setForm({ name: '', category: 'supplement', dosage_text: '', frequency: 'daily', scheduled_time: '08:00', scheduled_days: '', notes: '', is_active: true });
      return;
    }
    if (!user) return;
    const payload = {
      user_id: user.id,
      name: form.name,
      category: form.category as MedicationReminder['category'],
      dosage_text: form.dosage_text || null,
      frequency: form.frequency as MedicationReminder['frequency'],
      scheduled_time: form.scheduled_time || null,
      scheduled_days: form.scheduled_days ? form.scheduled_days.split(',').map(day => day.trim()).filter(Boolean) : null,
      notes: form.notes || null,
      is_active: form.is_active,
    };
    const query = editing
      ? supabase.from('medication_reminders').update(payload).eq('id', editing.id)
      : supabase.from('medication_reminders').insert(payload);
    const { data } = await query.select().maybeSingle();
    if (data) {
      setReminders(prev => editing ? prev.map(item => item.id === data.id ? data : item) : [...prev, data]);
      if (!editing && form.scheduled_time && form.frequency === 'daily') {
        const remindAt = new Date(`${today}T${form.scheduled_time}:00`);
        if (remindAt.getTime() < Date.now()) remindAt.setDate(remindAt.getDate() + 1);
        await supabase.from('reminders').insert({
          user_id: user.id,
          title: `Assunzione: ${form.name}`,
          entity_type: 'medication',
          entity_id: data.id,
          remind_at: remindAt.toISOString(),
          repeat_rule: 'daily',
        });
      }
    }
    setAddModal(false);
    setEditing(null);
    setForm({ name: '', category: 'supplement', dosage_text: '', frequency: 'daily', scheduled_time: '08:00', scheduled_days: '', notes: '', is_active: true });
    showToast(editing ? 'Terapia aggiornata.' : 'Promemoria aggiunto!', 'success');
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', category: 'medication', dosage_text: '', frequency: 'daily', scheduled_time: '08:00', scheduled_days: '', notes: '', is_active: true });
    setAddModal(true);
  };

  const openEdit = (reminder: MedicationReminder) => {
    setEditing(reminder);
    setForm({
      name: reminder.name,
      category: reminder.category,
      dosage_text: reminder.dosage_text || '',
      frequency: reminder.frequency,
      scheduled_time: reminder.scheduled_time?.slice(0, 5) || '',
      scheduled_days: reminder.scheduled_days?.join(', ') || '',
      notes: reminder.notes || '',
      is_active: reminder.is_active,
    });
    setAddModal(true);
  };

  const deactivateReminder = async (reminder: MedicationReminder) => {
    if (!confirm(`Disattivare i promemoria di "${reminder.name}"?`)) return;
    if (isDemo) {
      setReminders(prev => prev.filter(item => item.id !== reminder.id));
      return;
    }
    if (!user) return;

    const { error } = await supabase.from('medication_reminders').update({ is_active: false }).eq('id', reminder.id);
    if (!error) {
      await supabase
        .from('reminders')
        .update({ is_enabled: false })
        .eq('user_id', user.id)
        .eq('entity_type', 'medication')
        .eq('entity_id', reminder.id);
      setReminders(prev => prev.filter(item => item.id !== reminder.id));
    }
    showToast(error ? `Promemoria non disattivato: ${error.message}` : `Promemoria di ${reminder.name} disattivati.`, error ? 'error' : 'success');
  };

  if (loading) {
    return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="card animate-pulse h-20 bg-warm-gray-100" />)}</div>;
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="page-intro flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-warm-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-warm-gray-700" />
        </button>
        <h1 className="section-title flex-1">Terapie e supplementi</h1>
        <button onClick={openNew} className="btn-primary py-2 px-3 text-sm">
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
          <div className="operational-list">
            {reminders.map(rem => {
              const log = todayLogs.find(l => l.reminder_id === rem.id);
              const catColors: Record<string, string> = {
                medication: 'bg-blue-100 text-blue-700',
                supplement: 'bg-sage-100 text-sage-700',
                other: 'bg-warm-gray-100 text-warm-gray-700',
              };
              return (
                <div key={rem.id} className={`operational-row flex items-center gap-3 p-3 rounded-xl ${!rem.is_active ? 'opacity-55 bg-warm-gray-50' : log?.taken ? 'bg-sage-50 border border-sage-200' : 'bg-warm-gray-50'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${catColors[rem.category] ?? catColors.other}`}>
                    <Pill size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <button onClick={() => openEdit(rem)} className="font-medium text-warm-gray-800 text-sm hover:text-sage-700 text-left inline-flex items-center gap-1">{rem.name}<Edit3 size={12} /></button>
                    <p className="text-xs text-warm-gray-500">{CAT_LABELS[rem.category]} · {FREQ_LABELS[rem.frequency]}</p>
                    {rem.dosage_text && <p className="text-xs font-medium text-warm-gray-600 mt-1">{rem.dosage_text}</p>}
                    {rem.scheduled_time && <p className="text-xs text-warm-gray-500">Promemoria ore {rem.scheduled_time.slice(0, 5)}</p>}
                    {rem.notes && <p className="text-xs text-warm-gray-500 mt-1">{rem.notes}</p>}
                    {!rem.is_active && <p className="text-[10px] uppercase tracking-wide text-warm-gray-400 mt-1">Non attivo</p>}
                  </div>
                  <div className="flex gap-1">
                    {rem.is_active && <button
                      onClick={() => markTaken(rem, true)}
                      className={`p-2 rounded-xl transition-all ${log?.taken === true ? 'bg-sage-500 text-white' : 'bg-warm-gray-100 text-warm-gray-500 hover:bg-sage-100 hover:text-sage-600'}`}
                      title="Segnato come assunto"
                    >
                      <Check size={16} />
                    </button>}
                    {rem.is_active && <button
                      onClick={() => markTaken(rem, false)}
                      className={`p-2 rounded-xl transition-all ${log?.taken === false ? 'bg-red-400 text-white' : 'bg-warm-gray-100 text-warm-gray-500 hover:bg-red-50 hover:text-red-400'}`}
                      title="Non assunto"
                    >
                      <X size={16} />
                    </button>}
                    {rem.is_active && <button
                      onClick={() => deactivateReminder(rem)}
                      className="p-2 rounded-xl bg-warm-gray-100 text-warm-gray-500 hover:bg-amber-50 hover:text-amber-600 transition-all"
                      title="Disattiva promemoria"
                    >
                      <Power size={16} />
                    </button>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {unlinkedNames.length > 0 && <div className="card bg-amber-50 border-amber-200">
        <h2 className="font-semibold text-amber-900">Assunzioni senza scheda terapia</h2>
        <p className="text-xs text-amber-800 mt-1">Jarvis ha registrato questi nomi, ma manca una terapia base collegata:</p>
        <div className="flex flex-wrap gap-2 mt-3">{unlinkedNames.map(name => <button key={name} onClick={() => { setEditing(null); setForm({ name, category: 'medication', dosage_text: '', frequency: 'daily', scheduled_time: '', scheduled_days: '', notes: '', is_active: true }); setAddModal(true); }} className="px-3 py-1.5 rounded-full bg-white text-amber-800 text-xs font-semibold border border-amber-200">+ {name}</button>)}</div>
      </div>}

      {addModal && (
        <Modal isOpen title={editing ? 'Modifica terapia' : 'Aggiungi terapia'} onClose={() => { setAddModal(false); setEditing(null); }} size="sm">
          <div className="space-y-4">
            <div className="card bg-amber-50 border-amber-200 py-2">
              <p className="text-xs text-amber-700">Riporta fedelmente prescrizione e posologia nelle note. L’app non modifica le indicazioni del professionista.</p>
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
              <label className="label">Posologia prescritta</label>
              <input type="text" className="input-field" placeholder="Es. 1 compressa dopo colazione" value={form.dosage_text} onChange={e => setForm(p => ({ ...p, dosage_text: e.target.value }))} />
            </div>
            <div>
              <label className="label">Frequenza</label>
              <select className="input-field" value={form.frequency} onChange={e => setForm(p => ({ ...p, frequency: e.target.value }))}>
                {Object.entries(FREQ_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Ora promemoria</label>
              <input type="time" className="input-field" value={form.scheduled_time} onChange={e => setForm(p => ({ ...p, scheduled_time: e.target.value }))} />
            </div>
            <div>
              <label className="label">Giorni (opzionale)</label>
              <input type="text" className="input-field" placeholder="Es. lunedì, mercoledì, venerdì" value={form.scheduled_days} onChange={e => setForm(p => ({ ...p, scheduled_days: e.target.value }))} />
            </div>
            <div>
              <label className="label">Note</label>
              <textarea className="input-field h-20 resize-none" placeholder="Indicazioni aggiuntive del professionista" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
            <label className="flex items-center gap-3 rounded-xl bg-warm-gray-50 p-3 text-sm text-warm-gray-700"><input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} /> Terapia attiva</label>
            <button onClick={saveReminder} disabled={!form.name.trim()} className="btn-primary w-full">{editing ? 'Salva modifiche' : 'Aggiungi'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

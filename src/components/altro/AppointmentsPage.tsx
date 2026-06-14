import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, CalendarClock, AlertTriangle, Archive, CheckCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import type { Appointment } from '../../lib/supabase';
import { todayISO, formatDate, formatDateLong } from '../../lib/utils';
import { Modal } from '../ui/Modal';

interface Props { onBack: () => void; }

const TYPE_LABELS: Record<string, string> = {
  medical: 'Visita medica',
  dietitian: 'Controllo dietistico',
  exam: 'Esame',
  therapy: 'Terapia',
  other: 'Altro',
};

export function AppointmentsPage({ onBack }: Props) {
  const { user, isDemo, demoData, showToast } = useApp();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [archiveModal, setArchiveModal] = useState<Appointment | null>(null);
  const [outcome, setOutcome] = useState('');
  const [form, setForm] = useState({
    title: '',
    appointment_date: '',
    appointment_time: '',
    type: 'medical',
    location: '',
    notes: '',
    reminder_day_before: true,
    reminder_two_hours: true,
  });

  const today = todayISO();

  useEffect(() => {
    loadData();
  }, [isDemo, user]);

  const loadData = async () => {
    setLoading(true);
    if (isDemo) {
      setAppointments(demoData.appointments);
    } else if (user) {
      const { data } = await supabase.from('appointments').select('*').eq('user_id', user.id).eq('is_archived', false).order('appointment_date');
      setAppointments(data ?? []);
    }
    setLoading(false);
  };

  const addAppointment = async () => {
    if (!form.title.trim() || !form.appointment_date) return;
    const isPast = form.appointment_date < today;
    if (isDemo) {
      setAppointments(prev => [...prev, {
        id: Math.random().toString(36),
        user_id: 'demo',
        title: form.title,
        appointment_date: form.appointment_date,
        appointment_time: form.appointment_time || null,
        type: form.type as Appointment['type'],
        location: form.location || null,
        notes: form.notes || null,
        is_past: isPast,
        outcome: null,
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }]);
      setAddModal(false);
      return;
    }
    if (!user) return;
    const { data } = await supabase.from('appointments').insert({
      user_id: user.id,
      title: form.title,
      appointment_date: form.appointment_date,
      appointment_time: form.appointment_time || null,
      type: form.type as Appointment['type'],
      location: form.location || null,
      notes: form.notes || null,
      is_past: isPast,
    }).select().maybeSingle();
    if (data) {
      setAppointments(prev => [...prev, data].sort((a, b) => a.appointment_date.localeCompare(b.appointment_date)));
      const appointmentAt = new Date(`${form.appointment_date}T${form.appointment_time || '09:00'}:00`);
      const reminders = [];
      if (form.reminder_day_before) reminders.push({ label: 'domani', date: new Date(appointmentAt.getTime() - 86400000) });
      if (form.reminder_two_hours) reminders.push({ label: 'tra due ore', date: new Date(appointmentAt.getTime() - 7200000) });
      const futureReminders = reminders.filter(reminder => reminder.date.getTime() > Date.now());
      if (futureReminders.length) {
        await supabase.from('reminders').insert(futureReminders.map(reminder => ({
          user_id: user.id,
          title: `${form.title}: ${reminder.label}`,
          entity_type: 'appointment',
          entity_id: data.id,
          remind_at: reminder.date.toISOString(),
        })));
      }
    }
    setAddModal(false);
    showToast('Appuntamento aggiunto!', 'success');
  };

  const archiveAppointment = async (appt: Appointment) => {
    if (isDemo) {
      setAppointments(prev => prev.filter(a => a.id !== appt.id));
      setArchiveModal(null);
      return;
    }
    if (!user) return;
    await supabase.from('appointments').update({ is_archived: true, outcome: outcome || null }).eq('id', appt.id);
    setAppointments(prev => prev.filter(a => a.id !== appt.id));
    setArchiveModal(null);
    showToast('Appuntamento archiviato.', 'info');
  };

  const upcomingAppts = appointments.filter(a => a.appointment_date >= today && !a.is_archived);
  const pastAppts = appointments.filter(a => a.appointment_date < today && !a.is_archived);

  if (loading) {
    return <div className="space-y-4">{[1,2].map(i => <div key={i} className="card animate-pulse h-20 bg-warm-gray-100" />)}</div>;
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-warm-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-warm-gray-700" />
        </button>
        <h1 className="section-title flex-1">Controlli e visite</h1>
        <button onClick={() => setAddModal(true)} className="btn-primary py-2 px-3 text-sm">
          <Plus size={16} />
        </button>
      </div>

      {/* Upcoming */}
      <div>
        <h2 className="font-semibold text-warm-gray-700 text-sm mb-2 px-1">Prossimi appuntamenti</h2>
        {upcomingAppts.length === 0 ? (
          <div className="text-center py-8 text-warm-gray-400">
            <CalendarClock size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nessun appuntamento futuro</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingAppts.map(a => (
              <div key={a.id} className="card">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-petrol-100 flex items-center justify-center flex-shrink-0">
                    <CalendarClock size={18} className="text-petrol-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-warm-gray-800">{a.title}</p>
                    <p className="text-sm text-warm-gray-500">{formatDateLong(a.appointment_date)}{a.appointment_time ? ` · ${a.appointment_time}` : ''}</p>
                    <span className="text-xs text-petrol-600 bg-petrol-50 px-2 py-0.5 rounded-full mt-1 inline-block">{TYPE_LABELS[a.type]}</span>
                    {a.notes && <p className="text-xs text-warm-gray-500 mt-1">{a.notes}</p>}
                  </div>
                  <button onClick={() => { setArchiveModal(a); setOutcome(''); }} className="text-xs text-warm-gray-400 hover:text-warm-gray-600 p-1">
                    <Archive size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past appointments that need attention */}
      {pastAppts.length > 0 && (
        <div>
          <h2 className="font-semibold text-amber-700 text-sm mb-2 px-1 flex items-center gap-1">
            <AlertTriangle size={14} /> Appuntamenti passati da gestire
          </h2>
          <div className="space-y-3">
            {pastAppts.map(a => (
              <div key={a.id} className="card border-amber-200 bg-amber-50">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={18} className="text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-warm-gray-800">{a.title}</p>
                    <p className="text-sm text-amber-600">{formatDate(a.appointment_date)} — Data passata</p>
                    <p className="text-xs text-warm-gray-600 mt-1">Vuoi archiviarlo o registrare l'esito?</p>
                  </div>
                  <button onClick={() => { setArchiveModal(a); setOutcome(''); }} className="btn-secondary py-1.5 px-3 text-xs">
                    Gestisci
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Modal */}
      {addModal && (
        <Modal isOpen title="Aggiungi appuntamento" onClose={() => setAddModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="label">Titolo *</label>
              <input type="text" className="input-field" placeholder="Es. Visita dietistica" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Data *</label>
                <input type="date" className="input-field" value={form.appointment_date} onChange={e => setForm(p => ({ ...p, appointment_date: e.target.value }))} />
              </div>
              <div>
                <label className="label">Ora</label>
                <input type="time" className="input-field" value={form.appointment_time} onChange={e => setForm(p => ({ ...p, appointment_time: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label">Tipo</label>
              <select className="input-field" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Note</label>
              <input type="text" className="input-field" placeholder="Es. A digiuno, portare referti..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
            <div className="card-sm bg-warm-gray-50 space-y-2">
              <p className="text-sm font-semibold text-warm-gray-700">Promemoria</p>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.reminder_day_before} onChange={e => setForm(p => ({ ...p, reminder_day_before: e.target.checked }))} /> Il giorno prima</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.reminder_two_hours} onChange={e => setForm(p => ({ ...p, reminder_two_hours: e.target.checked }))} /> Due ore prima</label>
            </div>
            <button onClick={addAppointment} disabled={!form.title || !form.appointment_date} className="btn-primary w-full">Aggiungi</button>
          </div>
        </Modal>
      )}

      {/* Archive Modal */}
      {archiveModal && (
        <Modal isOpen title="Archivia appuntamento" onClose={() => setArchiveModal(null)} size="sm">
          <div className="space-y-4">
            <p className="text-sm text-warm-gray-600">"{archiveModal.title}" — {formatDate(archiveModal.appointment_date)}</p>
            <div>
              <label className="label">Esito / note (opzionale)</label>
              <textarea className="input-field h-20 resize-none" placeholder="Es. Esito positivo, prossimo controllo tra 3 mesi..." value={outcome} onChange={e => setOutcome(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setArchiveModal(null)} className="btn-secondary flex-1">Annulla</button>
              <button onClick={() => archiveAppointment(archiveModal)} className="btn-primary flex-1 flex items-center gap-1 justify-center">
                <CheckCircle size={16} /> Archivia
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

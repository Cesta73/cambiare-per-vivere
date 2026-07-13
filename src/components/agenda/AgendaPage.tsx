import { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, Check, ChevronLeft, ChevronRight, Clock3, Edit3, MapPin, Pill, RotateCw, Stethoscope, Trash2, Briefcase } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import type { Appointment, MedicationReminder, Reminder, WorkShift } from '../../lib/supabase';
import { formatDateLong, SHIFT_LABELS, todayISO } from '../../lib/utils';
import { Modal } from '../ui/Modal';

type AgendaItem = {
  id: string;
  time: string;
  title: string;
  detail: string;
  source: 'turno' | 'visita' | 'promemoria' | 'terapia';
  done: boolean;
  appointment?: Appointment;
  reminder?: Reminder;
};

const SOURCE_STYLE = {
  turno: 'bg-petrol-100 text-petrol-700',
  visita: 'bg-amber-100 text-amber-800',
  promemoria: 'bg-sage-100 text-sage-700',
  terapia: 'bg-blue-100 text-blue-700',
};

const emptyForm = (date: string) => ({ title: '', appointment_date: date, appointment_time: '', type: 'medical', location: '', notes: '' });

export function AgendaPage() {
  const { user, showToast, dataVersion } = useApp();
  const [date, setDate] = useState(todayISO());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [medications, setMedications] = useState<MedicationReminder[]>([]);
  const [shift, setShift] = useState<WorkShift | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm(date));

  useEffect(() => { void loadData(); }, [user, date, dataVersion]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T23:59:59`);
    const [appointmentRes, reminderRes, medicationRes, shiftRes] = await Promise.all([
      supabase.from('appointments').select('*').eq('user_id', user.id).eq('appointment_date', date).eq('is_archived', false),
      supabase.from('reminders').select('*').eq('user_id', user.id).gte('remind_at', start.toISOString()).lte('remind_at', end.toISOString()).order('remind_at'),
      supabase.from('medication_reminders').select('*').eq('user_id', user.id).eq('is_active', true),
      supabase.from('work_shifts').select('*').eq('user_id', user.id).eq('date', date).maybeSingle(),
    ]);
    setAppointments(appointmentRes.data ?? []);
    setReminders(reminderRes.data ?? []);
    setMedications((medicationRes.data ?? []).filter(item => item.category === 'medication' || item.category === 'supplement'));
    setShift(shiftRes.data);
    setLoading(false);
  };

  const items = useMemo<AgendaItem[]>(() => {
    const result: AgendaItem[] = [];
    if (shift && shift.shift_type !== 'rest') result.push({
      id: `shift-${shift.id}`, time: shift.start_time?.slice(0, 5) || '00:00',
      title: shift.custom_label || SHIFT_LABELS[shift.shift_type], detail: 'Turno di lavoro', source: 'turno', done: false,
    });
    appointments.forEach(item => result.push({
      id: `appointment-${item.id}`, time: item.appointment_time?.slice(0, 5) || '12:00', title: item.title,
      detail: [item.location, item.notes].filter(Boolean).join(' · ') || 'Visita o controllo', source: 'visita', done: item.is_past, appointment: item,
    }));
    reminders.filter(item => item.is_enabled).forEach(item => result.push({
      id: `reminder-${item.id}`, time: new Date(item.remind_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      title: item.title, detail: item.notes || 'Promemoria Jarvis', source: item.entity_type === 'medication' ? 'terapia' : 'promemoria',
      done: Boolean(item.completed_at), reminder: item,
    }));
    medications.filter(item => !reminders.some(rem => rem.entity_id === item.id)).forEach(item => result.push({
      id: `medication-${item.id}`, time: item.scheduled_time?.slice(0, 5) || '—', title: item.name,
      detail: item.notes || 'Terapia prevista', source: 'terapia', done: false,
    }));
    return result.sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, medications, reminders, shift]);

  const openNew = () => { setEditing(null); setForm(emptyForm(date)); setModalOpen(true); };
  const openEdit = (item: Appointment) => {
    setEditing(item);
    setForm({ title: item.title, appointment_date: item.appointment_date, appointment_time: item.appointment_time?.slice(0, 5) || '', type: item.type, location: item.location || '', notes: item.notes || '' });
    setModalOpen(true);
  };

  const saveAppointment = async () => {
    if (!user || !form.title.trim() || !form.appointment_date) return;
    const payload = { user_id: user.id, title: form.title.trim(), appointment_date: form.appointment_date, appointment_time: form.appointment_time || null, type: form.type as Appointment['type'], location: form.location || null, notes: form.notes || null };
    const operation = editing
      ? supabase.from('appointments').update(payload).eq('id', editing.id)
      : supabase.from('appointments').insert(payload);
    const { error } = await operation;
    if (error) return showToast(`Impegno non salvato: ${error.message}`, 'error');
    setModalOpen(false); await loadData(); showToast(editing ? 'Impegno aggiornato.' : 'Impegno aggiunto.', 'success');
  };

  const completeReminder = async (item: Reminder) => {
    const { error } = await supabase.from('reminders').update({ completed_at: item.completed_at ? null : new Date().toISOString() }).eq('id', item.id);
    if (error) showToast(`Promemoria non aggiornato: ${error.message}`, 'error'); else await loadData();
  };

  const deleteAppointment = async (item: Appointment) => {
    if (!confirm(`Eliminare “${item.title}”?`)) return;
    const { error } = await supabase.from('appointments').delete().eq('id', item.id);
    if (error) showToast(`Impegno non eliminato: ${error.message}`, 'error'); else { await loadData(); showToast('Impegno eliminato.', 'info'); }
  };

  const sourceIcon = (source: AgendaItem['source']) => source === 'turno' ? Briefcase : source === 'visita' ? Stethoscope : source === 'terapia' ? Pill : RotateCw;
  const moveDate = (amount: number) => {
    const next = new Date(`${date}T12:00:00`);
    next.setDate(next.getDate() + amount);
    setDate(next.toISOString().slice(0, 10));
  };
  const pendingItems = items.filter(item => !item.done).length;
  const therapyItems = items.filter(item => item.source === 'terapia').length;

  return (
    <div className="space-y-4 pb-4">
      <div className="page-intro flex items-start justify-between gap-3">
        <div><p className="eyebrow text-sage-700">Tutto in ordine cronologico</p><h1 className="section-title mt-1">Agenda</h1></div>
        <button onClick={openNew} className="btn-primary py-2 px-3"><CalendarPlus size={18} /><span className="hidden sm:inline">Nuovo</span></button>
      </div>
      <div className="page-date-nav">
        <button type="button" onClick={() => moveDate(-1)} aria-label="Giorno precedente"><ChevronLeft size={18} /></button>
        <input type="date" className="input-field" value={date} onChange={event => setDate(event.target.value)} />
        <button type="button" onClick={() => setDate(todayISO())} className="page-date-today"><Clock3 size={16} /> Oggi</button>
        <button type="button" onClick={() => moveDate(1)} aria-label="Giorno successivo"><ChevronRight size={18} /></button>
      </div>
      <p className="text-sm font-semibold text-warm-gray-700 capitalize px-1">{formatDateLong(date)}</p>

      {!loading && <div className="page-stat-grid">
        <div><strong>{items.length}</strong><span>totali</span></div>
        <div><strong>{pendingItems}</strong><span>da seguire</span></div>
        <div><strong>{therapyItems}</strong><span>terapie</span></div>
      </div>}

      {loading ? <div className="card animate-pulse h-32 bg-warm-gray-100" /> : items.length === 0 ? (
        <div className="card text-center py-10"><Clock3 className="mx-auto text-warm-gray-300" size={34} /><p className="font-semibold text-warm-gray-700 mt-3">Nessun impegno</p><p className="text-sm text-warm-gray-500 mt-1">La giornata è libera oppure non è ancora stata sincronizzata.</p></div>
      ) : <div className="card divide-y divide-warm-gray-100">
        {items.map(item => { const Icon = sourceIcon(item.source); return (
          <div key={item.id} className={`py-3 first:pt-0 last:pb-0 flex gap-3 ${item.done ? 'opacity-55' : ''}`}>
            <div className="w-12 text-sm font-bold text-petrol-800 pt-2">{item.time}</div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${SOURCE_STYLE[item.source]}`}><Icon size={18} /></div>
            <div className="flex-1 min-w-0"><p className={`font-semibold text-sm text-warm-gray-800 ${item.done ? 'line-through' : ''}`}>{item.title}</p><p className="text-xs text-warm-gray-500 mt-1">{item.detail}</p><span className="inline-block mt-1.5 text-[10px] uppercase tracking-wide text-warm-gray-400">{item.source}</span></div>
            <div className="flex items-start gap-1">
              {item.reminder && <button onClick={() => completeReminder(item.reminder!)} className="p-2 rounded-lg bg-sage-50 text-sage-700" title="Segna come fatto"><Check size={15} /></button>}
              {item.appointment && <><button onClick={() => openEdit(item.appointment!)} className="p-2 rounded-lg bg-warm-gray-100 text-warm-gray-600" title="Modifica"><Edit3 size={15} /></button><button onClick={() => deleteAppointment(item.appointment!)} className="p-2 rounded-lg bg-red-50 text-red-500" title="Elimina"><Trash2 size={15} /></button></>}
            </div>
          </div>
        ); })}
      </div>}

      <div className="card bg-sage-50 border-sage-200"><p className="text-xs text-sage-800">L’Agenda riunisce turni, visite, promemoria e terapie salvati nell’app. Gli eventi Google saranno mostrati qui appena il collegamento Calendar verrà esposto in modo sicuro alla web app.</p></div>

      {modalOpen && <Modal isOpen title={editing ? 'Modifica impegno' : 'Nuovo impegno'} onClose={() => setModalOpen(false)} size="sm">
        <div className="space-y-3">
          <div><label className="label">Titolo</label><input className="input-field" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} autoFocus /></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="label">Data</label><input type="date" className="input-field" value={form.appointment_date} onChange={e => setForm(p => ({ ...p, appointment_date: e.target.value }))} /></div><div><label className="label">Ora</label><input type="time" className="input-field" value={form.appointment_time} onChange={e => setForm(p => ({ ...p, appointment_time: e.target.value }))} /></div></div>
          <div><label className="label">Tipo</label><select className="input-field" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}><option value="medical">Visita medica</option><option value="dietitian">Nutrizionista</option><option value="exam">Esame</option><option value="therapy">Terapia</option><option value="other">Altro</option></select></div>
          <div><label className="label">Luogo</label><div className="relative"><MapPin size={15} className="absolute left-3 top-3 text-warm-gray-400" /><input className="input-field pl-9" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} /></div></div>
          <div><label className="label">Note</label><textarea className="input-field h-20 resize-none" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
          <button onClick={saveAppointment} className="btn-primary w-full" disabled={!form.title.trim()}>Salva impegno</button>
        </div>
      </Modal>}
    </div>
  );
}

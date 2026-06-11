import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Copy, Trash2, Star, Check } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import type { PlannedMeal, WorkShift, FavoriteMeal } from '../../lib/supabase';
import { getWeekStart, getWeekDays, dateToISO, formatDateShort, getDayNameShort, SHIFT_LABELS, SHIFT_COLORS, MEAL_TYPE_LABELS, todayISO } from '../../lib/utils';
import { Modal } from '../ui/Modal';

const MEAL_TYPES = ['breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'night_snack'] as const;
const SHIFT_TYPES = ['morning', 'afternoon', 'night', 'rest', 'custom'] as const;

interface MealFormData {
  name: string;
  ingredients: string;
  notes: string;
  mealType: string;
  date: string;
}

export function SettimanaPage() {
  const { user, isDemo, demoData, showToast } = useApp();
  const [weekStart, setWeekStart] = useState(() => getWeekStart());
  const [meals, setMeals] = useState<PlannedMeal[]>([]);
  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [favorites, setFavorites] = useState<FavoriteMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string>(todayISO());
  const [modal, setModal] = useState<'add_meal' | 'add_shift' | 'favorites' | null>(null);
  const [editMeal, setEditMeal] = useState<PlannedMeal | null>(null);
  const [mealForm, setMealForm] = useState<MealFormData>({ name: '', ingredients: '', notes: '', mealType: 'lunch', date: todayISO() });
  const [shiftType, setShiftType] = useState<string>('morning');

  const weekDays = getWeekDays(weekStart);

  useEffect(() => {
    loadData();
  }, [weekStart, isDemo, user]);

  const loadData = async () => {
    setLoading(true);
    const startISO = dateToISO(weekStart);
    const endDate = new Date(weekStart);
    endDate.setDate(endDate.getDate() + 6);
    const endISO = dateToISO(endDate);

    if (isDemo) {
      setMeals([]);
      setShifts(demoData.workShifts.filter(s => s.date >= startISO && s.date <= endISO));
      setFavorites(demoData.favoriteMeals);
    } else if (user) {
      const [mealsRes, shiftsRes, favsRes] = await Promise.all([
        supabase.from('planned_meals').select('*').eq('user_id', user.id).gte('plan_date', startISO).lte('plan_date', endISO),
        supabase.from('work_shifts').select('*').eq('user_id', user.id).gte('date', startISO).lte('date', endISO),
        supabase.from('favorite_meals').select('*').eq('user_id', user.id).order('use_count', { ascending: false }),
      ]);
      setMeals(mealsRes.data ?? []);
      setShifts(shiftsRes.data ?? []);
      setFavorites(favsRes.data ?? []);
    }
    setLoading(false);
  };

  const openAddMeal = (date: string, mealType = 'lunch') => {
    setEditMeal(null);
    setMealForm({ name: '', ingredients: '', notes: '', mealType, date });
    setModal('add_meal');
  };

  const openEditMeal = (meal: PlannedMeal) => {
    setEditMeal(meal);
    setMealForm({ name: meal.name, ingredients: meal.ingredients ?? '', notes: meal.notes ?? '', mealType: meal.meal_type, date: meal.plan_date });
    setModal('add_meal');
  };

  const saveMeal = async () => {
    if (!mealForm.name.trim()) return;
    if (isDemo) {
      if (editMeal) {
        setMeals(prev => prev.map(m => m.id === editMeal.id ? { ...m, ...mealForm, meal_type: mealForm.mealType as PlannedMeal['meal_type'], plan_date: mealForm.date } : m));
      } else {
        const newMeal: PlannedMeal = {
          id: Math.random().toString(36).slice(2),
          user_id: 'demo',
          plan_date: mealForm.date,
          meal_type: mealForm.mealType as PlannedMeal['meal_type'],
          name: mealForm.name,
          ingredients: mealForm.ingredients || null,
          notes: mealForm.notes || null,
          is_completed: false,
          favorite_meal_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setMeals(prev => [...prev, newMeal]);
      }
      setModal(null);
      showToast('Pasto salvato!', 'success');
      return;
    }
    if (!user) return;
    if (editMeal) {
      const { data } = await supabase.from('planned_meals').update({
        name: mealForm.name,
        ingredients: mealForm.ingredients || null,
        notes: mealForm.notes || null,
        meal_type: mealForm.mealType as PlannedMeal['meal_type'],
        plan_date: mealForm.date,
      }).eq('id', editMeal.id).select().maybeSingle();
      if (data) setMeals(prev => prev.map(m => m.id === editMeal.id ? data : m));
    } else {
      const { data } = await supabase.from('planned_meals').insert({
        user_id: user.id,
        plan_date: mealForm.date,
        meal_type: mealForm.mealType as PlannedMeal['meal_type'],
        name: mealForm.name,
        ingredients: mealForm.ingredients || null,
        notes: mealForm.notes || null,
      }).select().maybeSingle();
      if (data) setMeals(prev => [...prev, data]);
    }
    setModal(null);
    showToast('Pasto salvato!', 'success');
  };

  const deleteMeal = async (meal: PlannedMeal) => {
    if (!confirm(`Eliminare "${meal.name}"?`)) return;
    if (isDemo) {
      setMeals(prev => prev.filter(m => m.id !== meal.id));
    } else if (user) {
      await supabase.from('planned_meals').delete().eq('id', meal.id);
      setMeals(prev => prev.filter(m => m.id !== meal.id));
    }
    showToast('Pasto eliminato', 'info');
  };

  const toggleMealComplete = async (meal: PlannedMeal) => {
    const newVal = !meal.is_completed;
    if (isDemo) {
      setMeals(prev => prev.map(m => m.id === meal.id ? { ...m, is_completed: newVal } : m));
      return;
    }
    if (!user) return;
    await supabase.from('planned_meals').update({ is_completed: newVal }).eq('id', meal.id);
    setMeals(prev => prev.map(m => m.id === meal.id ? { ...m, is_completed: newVal } : m));
  };

  const saveShift = async () => {
    if (!selectedDay) return;
    if (isDemo) {
      setShifts(prev => {
        const filtered = prev.filter(s => s.date !== selectedDay);
        return [...filtered, {
          id: Math.random().toString(36),
          user_id: 'demo',
          date: selectedDay,
          shift_type: shiftType as WorkShift['shift_type'],
          custom_label: null,
          start_time: null,
          end_time: null,
          notes: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }];
      });
      setModal(null);
      return;
    }
    if (!user) return;
    const { data } = await supabase.from('work_shifts').upsert({
      user_id: user.id,
      date: selectedDay,
      shift_type: shiftType as WorkShift['shift_type'],
    }, { onConflict: 'user_id,date' }).select().maybeSingle();
    if (data) {
      setShifts(prev => {
        const filtered = prev.filter(s => s.date !== selectedDay);
        return [...filtered, data];
      });
    }
    setModal(null);
    showToast('Turno salvato!', 'success');
  };

  const addFavoriteMeal = (fav: FavoriteMeal) => {
    setMealForm(prev => ({ ...prev, name: fav.name, ingredients: fav.ingredients ?? '', notes: fav.notes ?? '', mealType: fav.meal_type ?? prev.mealType }));
    setModal('add_meal');
  };

  const copyPrevWeek = async () => {
    const prevStart = new Date(weekStart);
    prevStart.setDate(prevStart.getDate() - 7);
    const prevStartISO = dateToISO(prevStart);
    const prevEnd = new Date(prevStart);
    prevEnd.setDate(prevEnd.getDate() + 6);
    const prevEndISO = dateToISO(prevEnd);

    if (isDemo) {
      showToast('In modalità demo non ci sono pasti della settimana precedente.', 'info');
      return;
    }
    if (!user) return;
    const { data: prevMeals } = await supabase.from('planned_meals').select('*').eq('user_id', user.id).gte('plan_date', prevStartISO).lte('plan_date', prevEndISO);
    if (!prevMeals?.length) { showToast('Nessun pasto trovato nella settimana precedente.', 'info'); return; }

    const newMeals = prevMeals.map(m => {
      const prevDate = new Date(m.plan_date + 'T12:00:00');
      const dayOffset = Math.round((prevDate.getTime() - new Date(prevStartISO + 'T12:00:00').getTime()) / 86400000);
      const newDate = new Date(weekStart);
      newDate.setDate(newDate.getDate() + dayOffset);
      return { user_id: user.id, plan_date: dateToISO(newDate), meal_type: m.meal_type, name: m.name, ingredients: m.ingredients, notes: m.notes };
    });

    const { data } = await supabase.from('planned_meals').insert(newMeals).select();
    if (data) setMeals(prev => [...prev, ...data]);
    showToast(`Copiati ${newMeals.length} pasti dalla settimana precedente!`, 'success');
  };

  const goToPrevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); };
  const goToNextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); };

  const getMealsForDay = (date: string) => meals.filter(m => m.plan_date === date);
  const getShiftForDay = (date: string) => shifts.find(s => s.date === date);

  const weekLabel = `${formatDateShort(dateToISO(weekStart))} – ${formatDateShort(dateToISO(weekDays[6]))}`;

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="section-title">Pianificazione</h1>
        <div className="flex gap-2">
          <button onClick={copyPrevWeek} className="text-xs text-sage-600 font-medium hover:underline">Copia settimana prec.</button>
        </div>
      </div>

      {/* Week Navigator */}
      <div className="flex items-center justify-between card py-3">
        <button onClick={goToPrevWeek} className="p-2 rounded-xl hover:bg-warm-gray-100 transition-colors">
          <ChevronLeft size={20} className="text-warm-gray-600" />
        </button>
        <span className="font-semibold text-warm-gray-800">{weekLabel}</span>
        <button onClick={goToNextWeek} className="p-2 rounded-xl hover:bg-warm-gray-100 transition-colors">
          <ChevronRight size={20} className="text-warm-gray-600" />
        </button>
      </div>

      {/* Day selector */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {weekDays.map(day => {
          const iso = dateToISO(day);
          const shift = getShiftForDay(iso);
          const dayMeals = getMealsForDay(iso);
          const isToday = iso === todayISO();
          const isSelected = iso === selectedDay;
          return (
            <button
              key={iso}
              onClick={() => setSelectedDay(iso)}
              className={`flex flex-col items-center min-w-[4.5rem] rounded-2xl py-3 px-2 transition-all ${
                isSelected ? 'bg-sage-600 text-white shadow-md' :
                isToday ? 'bg-sage-50 border-2 border-sage-300 text-sage-800' :
                'bg-white border border-warm-gray-100 text-warm-gray-700 hover:bg-warm-gray-50'
              }`}
            >
              <span className="text-xs font-medium uppercase">{getDayNameShort(iso)}</span>
              <span className="text-xl font-bold leading-none mt-0.5">{day.getDate()}</span>
              {shift && (
                <span className={`text-xs mt-1 px-1.5 py-0.5 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-sage-100 text-sage-700'
                }`}>
                  {shift.shift_type === 'morning' ? 'Mat' : shift.shift_type === 'afternoon' ? 'Pom' : shift.shift_type === 'night' ? 'Not' : shift.shift_type === 'rest' ? 'Rip' : 'Per'}
                </span>
              )}
              {dayMeals.length > 0 && (
                <span className={`text-xs mt-0.5 ${isSelected ? 'text-sage-200' : 'text-warm-gray-400'}`}>
                  {dayMeals.length} pasti
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-semibold text-warm-gray-800 capitalize">{getDayNameShort(selectedDay)}, {formatDateShort(selectedDay)}</h2>
            <div className="flex gap-2">
              <button onClick={() => { setShiftType(getShiftForDay(selectedDay)?.shift_type ?? 'morning'); setModal('add_shift'); }}
                className="text-xs text-petrol-600 font-medium bg-petrol-50 px-3 py-1.5 rounded-lg hover:bg-petrol-100 transition-colors">
                {getShiftForDay(selectedDay) ? 'Cambia turno' : 'Aggiungi turno'}
              </button>
            </div>
          </div>

          {MEAL_TYPES.map(mealType => {
            const dayMeals = getMealsForDay(selectedDay).filter(m => m.meal_type === mealType);
            return (
              <div key={mealType} className="card">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-warm-gray-700 text-sm">{MEAL_TYPE_LABELS[mealType]}</h3>
                  <div className="flex gap-2">
                    <button onClick={() => { setModal('favorites'); setMealForm(prev => ({ ...prev, mealType, date: selectedDay })); }}
                      className="p-1.5 rounded-lg text-warm-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-colors" title="Pasti preferiti">
                      <Star size={16} />
                    </button>
                    <button onClick={() => openAddMeal(selectedDay, mealType)}
                      className="p-1.5 rounded-lg text-warm-gray-400 hover:text-sage-600 hover:bg-sage-50 transition-colors" title="Aggiungi pasto">
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
                {dayMeals.length === 0 ? (
                  <p className="text-xs text-warm-gray-300 italic">Non pianificato</p>
                ) : (
                  <div className="space-y-2">
                    {dayMeals.map(meal => (
                      <div key={meal.id} className={`flex items-start gap-2 p-2 rounded-xl ${meal.is_completed ? 'bg-sage-50' : 'bg-warm-gray-50'}`}>
                        <button onClick={() => toggleMealComplete(meal)}
                          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${meal.is_completed ? 'bg-sage-500 border-sage-500' : 'border-warm-gray-300'}`}>
                          {meal.is_completed && <Check size={12} className="text-white" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${meal.is_completed ? 'line-through text-warm-gray-400' : 'text-warm-gray-800'}`}>{meal.name}</p>
                          {meal.ingredients && <p className="text-xs text-warm-gray-500 mt-0.5">{meal.ingredients}</p>}
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => openEditMeal(meal)} className="p-1 rounded-lg hover:bg-warm-gray-200 text-warm-gray-400 transition-colors">
                            <Copy size={13} />
                          </button>
                          <button onClick={() => deleteMeal(meal)} className="p-1 rounded-lg hover:bg-red-50 text-warm-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Meal Modal */}
      {modal === 'add_meal' && (
        <Modal isOpen title={editMeal ? 'Modifica pasto' : 'Aggiungi pasto'} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div>
              <label className="label">Tipo di pasto</label>
              <select className="input-field" value={mealForm.mealType} onChange={e => setMealForm(p => ({ ...p, mealType: e.target.value }))}>
                {MEAL_TYPES.map(t => <option key={t} value={t}>{MEAL_TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Nome pasto *</label>
              <input type="text" className="input-field" placeholder="Es. Pasta al pomodoro" value={mealForm.name} onChange={e => setMealForm(p => ({ ...p, name: e.target.value }))} autoFocus />
            </div>
            <div>
              <label className="label">Ingredienti / contenuto (opzionale)</label>
              <textarea className="input-field h-20 resize-none" placeholder="Es. Pasta integrale, pomodoro, basilico..." value={mealForm.ingredients} onChange={e => setMealForm(p => ({ ...p, ingredients: e.target.value }))} />
            </div>
            <div>
              <label className="label">Note</label>
              <input type="text" className="input-field" placeholder="Opzionale..." value={mealForm.notes} onChange={e => setMealForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1">Annulla</button>
              <button onClick={saveMeal} disabled={!mealForm.name.trim()} className="btn-primary flex-1">Salva</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Shift Modal */}
      {modal === 'add_shift' && (
        <Modal isOpen title="Imposta turno" onClose={() => setModal(null)} size="sm">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {SHIFT_TYPES.filter(t => t !== 'custom').map(t => (
                <button key={t} onClick={() => setShiftType(t)}
                  className={`py-3 rounded-xl text-sm font-semibold transition-all ${shiftType === t ? 'bg-petrol-500 text-white' : 'bg-warm-gray-100 text-warm-gray-700 hover:bg-warm-gray-200'}`}>
                  {SHIFT_LABELS[t]}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1">Annulla</button>
              <button onClick={saveShift} className="btn-primary flex-1">Salva turno</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Favorites Modal */}
      {modal === 'favorites' && (
        <Modal isOpen title="Pasti preferiti" onClose={() => setModal(null)}>
          <div className="space-y-3">
            {favorites.length === 0 ? (
              <p className="text-sm text-warm-gray-400 text-center py-4">Nessun pasto preferito ancora.</p>
            ) : (
              favorites.map(fav => (
                <button key={fav.id} onClick={() => { addFavoriteMeal(fav); }}
                  className="w-full text-left card-sm hover:bg-sage-50 hover:border-sage-200 transition-all">
                  <p className="font-medium text-warm-gray-800">{fav.name}</p>
                  {fav.ingredients && <p className="text-xs text-warm-gray-500 mt-0.5">{fav.ingredients}</p>}
                  <p className="text-xs text-warm-gray-400 mt-1">{MEAL_TYPE_LABELS[fav.meal_type ?? ''] ?? fav.meal_type} · Usato {fav.use_count}x</p>
                </button>
              ))
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

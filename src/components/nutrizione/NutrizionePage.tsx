import { useEffect, useMemo, useState } from 'react';
import {
  BookOpenCheck, CalendarDays, ChevronDown, ChevronUp, ClipboardList,
  Droplets, MessageCircle, Sparkles, Utensils,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useNutritionPlan } from '../../contexts/NutritionPlanContext';
import { supabase } from '../../lib/supabase';
import type { HungerSatietyEntry } from '../../lib/supabase';
import { MEAL_TYPE_LABELS, todayISO } from '../../lib/utils';
import { QuickMealModal } from '../oggi/QuickMealModal';
import { SettimanaPage } from '../settimana/SettimanaPage';
import { ShoppingPage } from '../altro/ShoppingPage';

type NutritionTab = 'oggi' | 'piano' | 'settimana' | 'spesa';

const DAY_LABELS: Record<string, string> = {
  monday: 'Lunedì', tuesday: 'Martedì', wednesday: 'Mercoledì',
  thursday: 'Giovedì', friday: 'Venerdì', saturday: 'Sabato', sunday: 'Domenica',
};

const CATEGORY_LABELS: Record<string, string> = {
  carboidrati: 'Carboidrati', proteine: 'Proteine', proteine_latticini: 'Proteine e latticini',
  grassi: 'Grassi', verdura: 'Verdura', frutta: 'Frutta',
  dolcificante_condimento: 'Condimento previsto',
};

const FREQUENCY_LABELS: Record<string, string> = {
  fish_lean_total: 'Pesce', fish_fat: 'Pesce grasso', white_meat: 'Carne bianca',
  red_meat: 'Carne rossa', eggs: 'Uova', legumes: 'Legumi', fresh_cheese: 'Formaggi freschi',
  aged_cheese: 'Formaggi stagionati', canned_or_smoked_fish: 'Pesce conservato',
  lean_cold_cuts: 'Affettati magri', free_meal: 'Pasto libero', alcohol: 'Alcol',
};

export function NutrizionePage() {
  const { user, openJarvisCore, dataVersion } = useApp();
  const { plan, loading, error, refresh } = useNutritionPlan();
  const [tab, setTab] = useState<NutritionTab>('oggi');
  const [mealModal, setMealModal] = useState(false);
  const [meals, setMeals] = useState<HungerSatietyEntry[]>([]);
  const [openMeal, setOpenMeal] = useState<string | null>('lunch');

  useEffect(() => {
    if (!user) return;
    const date = todayISO();
    const start = new Date(`${date}T00:00:00`).toISOString();
    const end = new Date(`${date}T23:59:59`).toISOString();
    supabase.from('hunger_satiety_entries').select('*').eq('user_id', user.id)
      .gte('entry_datetime', start).lte('entry_datetime', end).order('entry_datetime')
      .then(({ data }) => setMeals(data ?? []));
  }, [user, dataVersion, mealModal]);

  const mindfulMeals = useMemo(() => meals.filter(meal =>
    meal.pre_hunger !== null && meal.post_satiety !== null && meal.post_satisfaction !== null,
  ).length, [meals]);

  if (tab === 'spesa') {
    return <ShoppingPage onBack={() => setTab('oggi')} />;
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="page-intro">
        <p className="eyebrow text-sage-700">Piano ufficiale · guida quotidiana</p>
        <h1 className="section-title mt-1">Nutrizione</h1>
        <p>Il piano della dietista tradotto in scelte concrete, senza modifiche o compensazioni.</p>
      </div>

      <div className="segmented-control grid grid-cols-4 gap-1 bg-warm-gray-100 rounded-xl p-1">
        {([
          ['oggi', 'Oggi'], ['piano', 'Piano'], ['settimana', 'Settimana'], ['spesa', 'Spesa'],
        ] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`min-w-0 py-2 rounded-lg text-xs font-semibold ${tab === id ? 'bg-white text-sage-700 shadow-sm' : 'text-warm-gray-500'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading && <div className="card h-32 animate-pulse bg-warm-gray-100" />}
      {error && !loading && (
        <div className="card border-amber-200 bg-amber-50">
          <p className="font-semibold text-warm-gray-800">Piano momentaneamente non raggiungibile</p>
          <p className="text-sm text-warm-gray-600 mt-1">{error}</p>
          <button onClick={() => void refresh()} className="btn-secondary mt-3 text-sm">Riprova</button>
        </div>
      )}

      {plan && tab === 'oggi' && (
        <div className="space-y-4">
          <section className="nutrition-plan-status">
            <div>
              <p className="eyebrow text-amber-200">Piano attivo</p>
              <h2>{DAY_LABELS[plan.weekday] ?? plan.weekday}</h2>
              <p>{plan.plan.author}</p>
            </div>
            <BookOpenCheck size={30} />
          </section>

          {plan.shift.rule && (
            <section className="card border-petrol-200 bg-petrol-50">
              <div className="flex gap-3">
                <CalendarDays size={19} className="text-petrol-700 flex-shrink-0 mt-0.5" />
                <div><p className="font-semibold text-petrol-900">Adattamento al turno</p><p className="text-sm text-petrol-800 mt-1 leading-relaxed">{plan.shift.rule}</p></div>
              </div>
            </section>
          )}

          <section className="card">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div><p className="eyebrow text-sage-700">Riferimento flessibile</p><h2 className="font-semibold text-warm-gray-900 mt-1">Menù di oggi</h2></div>
              <Utensils size={20} className="text-amber-600" />
            </div>
            <div className="nutrition-today-menu">
              {(['breakfast', 'lunch', 'afternoon_snack', 'dinner'] as const).map(type => {
                const value = plan.weekly_menu.today?.[type];
                if (!value) return null;
                return <div key={type}><span>{MEAL_TYPE_LABELS[type]}</span><p>{value}</p></div>;
              })}
            </div>
            <p className="text-xs text-warm-gray-500 mt-3">È un esempio: puoi usare le alternative previste mantenendo le quantità del piano.</p>
          </section>

          <div className="grid grid-cols-2 gap-3">
            <section className="card">
              <Droplets size={19} className="text-petrol-600 mb-2" />
              <p className="text-xs text-warm-gray-500">Acqua</p>
              <p className="font-semibold text-warm-gray-900 mt-1">{plan.daily.water}</p>
            </section>
            <section className="card">
              <Sparkles size={19} className="text-amber-600 mb-2" />
              <p className="text-xs text-warm-gray-500">Consapevolezza</p>
              <p className="font-semibold text-warm-gray-900 mt-1">{mindfulMeals}/{meals.length || 0} pasti completi</p>
            </section>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setMealModal(true)} className="btn-primary flex items-center justify-center gap-2"><ClipboardList size={17} /> Registra pasto</button>
            <button onClick={openJarvisCore} className="btn-secondary flex items-center justify-center gap-2"><MessageCircle size={17} /> Chiedi a Jarvis</button>
          </div>

          <section className="card">
            <h2 className="font-semibold text-warm-gray-900">Struttura dei pasti principali</h2>
            <div className="flex flex-wrap gap-2 mt-3">
              {plan.daily.main_meal_structure.map(item => <span key={item} className="nutrition-chip">{item}</span>)}
            </div>
          </section>
        </div>
      )}

      {plan && tab === 'piano' && (
        <div className="space-y-4">
          <section className="card">
            <p className="eyebrow text-sage-700">Prescrizioni</p>
            <h2 className="font-semibold text-warm-gray-900 mt-1">Quantità e alternative</h2>
            <p className="text-sm text-warm-gray-600 mt-1">Per ogni pasto scegli un alimento da ciascuna riga.</p>
          </section>
          {Object.entries(plan.meals).map(([mealType, meal]) => (
            <section key={mealType} className="card p-0 overflow-hidden">
              <button onClick={() => setOpenMeal(openMeal === mealType ? null : mealType)} className="w-full flex items-center gap-3 p-4 text-left">
                <Utensils size={18} className="text-amber-600" />
                <span className="flex-1 font-semibold text-warm-gray-900">{meal.label || MEAL_TYPE_LABELS[mealType] || mealType}</span>
                {openMeal === mealType ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {openMeal === mealType && (
                <div className="border-t border-warm-gray-100 p-4 space-y-4">
                  {meal.rows?.map(row => (
                    <div key={row.category}>
                      <p className="text-xs font-semibold uppercase text-sage-700">{CATEGORY_LABELS[row.category] ?? row.category}</p>
                      <ul className="nutrition-option-list mt-2">{row.choose_one.map(option => <li key={option}>{option}</li>)}</ul>
                    </div>
                  ))}
                  {meal.choose_one_once_weekly?.length ? (
                    <div><p className="text-xs font-semibold uppercase text-amber-700">Una volta a settimana</p><ul className="nutrition-option-list mt-2">{meal.choose_one_once_weekly.map(option => <li key={option}>{option}</li>)}</ul></div>
                  ) : null}
                </div>
              )}
            </section>
          ))}
          <section className="card">
            <h2 className="font-semibold text-warm-gray-900">Frequenze settimanali</h2>
            <div className="divide-y divide-warm-gray-100 mt-2">
              {Object.entries(plan.weekly_frequencies).map(([key, value]) => <div key={key} className="py-3"><p className="text-sm font-semibold text-warm-gray-800">{FREQUENCY_LABELS[key] ?? key}</p><p className="text-sm text-warm-gray-600 mt-0.5">{value}</p></div>)}
            </div>
          </section>
          <section className="card bg-sage-50 border-sage-200">
            <h2 className="font-semibold text-sage-900">Regole essenziali</h2>
            <ol className="nutrition-rule-list mt-3">{plan.core_rules.map(rule => <li key={rule}>{rule}</li>)}</ol>
          </section>
        </div>
      )}

      {plan && tab === 'settimana' && (
        <div className="space-y-5">
          <section className="card">
            <div className="flex items-center justify-between gap-3">
              <div><p className="eyebrow text-sage-700">Esempio flessibile</p><h2 className="font-semibold text-warm-gray-900 mt-1">Menù della dietista</h2></div>
              <CalendarDays size={20} className="text-petrol-700" />
            </div>
            <div className="divide-y divide-warm-gray-100 mt-3">
              {Object.entries(plan.weekly_menu.days).map(([day, menu]) => (
                <div key={day} className="py-3">
                  <p className="font-semibold text-warm-gray-900">{DAY_LABELS[day] ?? day}</p>
                  <p className="text-sm text-warm-gray-600 mt-1"><strong>Pranzo:</strong> {menu.lunch}</p>
                  <p className="text-sm text-warm-gray-600 mt-1"><strong>Cena:</strong> {menu.dinner}</p>
                </div>
              ))}
            </div>
          </section>
          <SettimanaPage compact />
        </div>
      )}

      {mealModal && <QuickMealModal onClose={() => setMealModal(false)} />}
    </div>
  );
}

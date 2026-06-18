import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Copy, Trash2, Star, Check, ClipboardCheck, ShoppingCart, CalendarDays } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import type { PlannedMeal, WorkShift, FavoriteMeal, HungerSatietyEntry } from '../../lib/supabase';
import { getWeekStart, getWeekDays, dateToISO, formatDateShort, getDayNameShort, SHIFT_LABELS, SHIFT_COLORS, MEAL_TYPE_LABELS, todayISO } from '../../lib/utils';
import { Modal } from '../ui/Modal';
import { QuickMealModal } from '../oggi/QuickMealModal';
import { RecipeBuilderModal } from './RecipeBuilderModal';

const MEAL_TYPES = ['breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'night_snack'] as const;
const SHIFT_TYPES = ['morning', 'afternoon', 'night', 'rest', 'custom'] as const;
const MEAL_SUGGESTIONS = [
  { name: 'Pesce, verdure e cereale integrale', ingredients: 'pesce azzurro, verdure di stagione, riso integrale' },
  { name: 'Legumi e verdure', ingredients: 'legumi, verdure di stagione, pane integrale' },
  { name: 'Pollo e verdure', ingredients: 'pollo, verdure di stagione, patate' },
  { name: 'Yogurt e frutta', ingredients: 'yogurt, frutta fresca, avena' },
];

interface FoodResult {
  name: string;
  brand: string;
  kcal100g: number;
  protein100g: number;
  carbs100g: number;
  fat100g: number;
  fiber100g: number;
}

interface MealFormData {
  name: string;
  ingredients: string;
  notes: string;
  mealType: string;
  date: string;
  quantityG: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
}

export function SettimanaPage() {
  const { user, isDemo, demoData, showToast, dataVersion } = useApp();
  const [weekStart, setWeekStart] = useState(() => getWeekStart());
  const [meals, setMeals] = useState<PlannedMeal[]>([]);
  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [favorites, setFavorites] = useState<FavoriteMeal[]>([]);
  const [consumedMeals, setConsumedMeals] = useState<HungerSatietyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string>(todayISO());
  const [modal, setModal] = useState<'add_meal' | 'add_shift' | 'favorites' | 'recipe' | null>(null);
  const [editMeal, setEditMeal] = useState<PlannedMeal | null>(null);
  const [mealForm, setMealForm] = useState<MealFormData>({ name: '', ingredients: '', notes: '', mealType: 'lunch', date: todayISO(), quantityG: '100', calories: '', protein: '', carbs: '', fat: '', fiber: '' });
  const [shiftType, setShiftType] = useState<string>('morning');
  const [view, setView] = useState<'plan' | 'register'>('plan');
  const [registerMeal, setRegisterMeal] = useState(false);
  const [foodResults, setFoodResults] = useState<FoodResult[]>([]);
  const [searchingFood, setSearchingFood] = useState(false);
  const [kcalPer100g, setKcalPer100g] = useState<number | null>(null);
  const [macrosPer100g, setMacrosPer100g] = useState({ protein: 0, carbs: 0, fat: 0, fiber: 0 });

  const weekDays = getWeekDays(weekStart);

  useEffect(() => {
    loadData();
  }, [weekStart, isDemo, user, dataVersion]);

  useEffect(() => {
    if (kcalPer100g === null) return;
    const grams = Math.max(1, parseFloat(mealForm.quantityG) || 100);
    setMealForm(prev => ({
      ...prev,
      calories: Math.round(kcalPer100g * grams / 100).toString(),
      protein: (macrosPer100g.protein * grams / 100).toFixed(1),
      carbs: (macrosPer100g.carbs * grams / 100).toFixed(1),
      fat: (macrosPer100g.fat * grams / 100).toFixed(1),
      fiber: (macrosPer100g.fiber * grams / 100).toFixed(1),
    }));
  }, [mealForm.quantityG, kcalPer100g, macrosPer100g]);

  useEffect(() => {
    const normalizedName = mealForm.name.trim().toLocaleLowerCase('it');
    const rememberedMeal = favorites.find(fav => fav.name.trim().toLocaleLowerCase('it') === normalizedName);
    if (!rememberedMeal?.quantity_g || rememberedMeal.calories_kcal === null) return;
    setKcalPer100g(rememberedMeal.calories_kcal * 100 / rememberedMeal.quantity_g);
    setMacrosPer100g({
      protein: rememberedMeal.protein_g !== null ? rememberedMeal.protein_g * 100 / rememberedMeal.quantity_g : 0,
      carbs: rememberedMeal.carbs_g !== null ? rememberedMeal.carbs_g * 100 / rememberedMeal.quantity_g : 0,
      fat: rememberedMeal.fat_g !== null ? rememberedMeal.fat_g * 100 / rememberedMeal.quantity_g : 0,
      fiber: rememberedMeal.fiber_g !== null ? rememberedMeal.fiber_g * 100 / rememberedMeal.quantity_g : 0,
    });
  }, [mealForm.name, favorites]);

  const loadData = async () => {
    setLoading(true);
    const startISO = dateToISO(weekStart);
    const endDate = new Date(weekStart);
    endDate.setDate(endDate.getDate() + 6);
    const endISO = dateToISO(endDate);

    if (isDemo) {
      setMeals([]);
      setConsumedMeals([]);
      setShifts(demoData.workShifts.filter(s => s.date >= startISO && s.date <= endISO));
      setFavorites(demoData.favoriteMeals);
    } else if (user) {
      const nextDay = new Date(endDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const [mealsRes, shiftsRes, favsRes, consumedRes] = await Promise.all([
        supabase.from('planned_meals').select('*').eq('user_id', user.id).gte('plan_date', startISO).lte('plan_date', endISO),
        supabase.from('work_shifts').select('*').eq('user_id', user.id).gte('date', startISO).lte('date', endISO),
        supabase.from('favorite_meals').select('*').eq('user_id', user.id).order('use_count', { ascending: false }),
        supabase.from('hunger_satiety_entries').select('*').eq('user_id', user.id)
          .gte('entry_datetime', new Date(`${startISO}T00:00:00`).toISOString())
          .lt('entry_datetime', new Date(`${dateToISO(nextDay)}T00:00:00`).toISOString())
          .order('entry_datetime', { ascending: false }),
      ]);
      setMeals(mealsRes.data ?? []);
      setShifts(shiftsRes.data ?? []);
      setFavorites(favsRes.data ?? []);
      setConsumedMeals(consumedRes.data ?? []);
    }
    setLoading(false);
  };

  const openAddMeal = (date: string, mealType = 'lunch') => {
    setEditMeal(null);
    setMealForm({ name: '', ingredients: '', notes: '', mealType, date, quantityG: '100', calories: '', protein: '', carbs: '', fat: '', fiber: '' });
    setKcalPer100g(null);
    setFoodResults([]);
    setModal('add_meal');
  };

  const openEditMeal = (meal: PlannedMeal) => {
    setEditMeal(meal);
    setMealForm({
      name: meal.name,
      ingredients: meal.ingredients ?? '',
      notes: meal.notes ?? '',
      mealType: meal.meal_type,
      date: meal.plan_date,
      quantityG: meal.quantity_g?.toString() ?? '100',
      calories: meal.calories_kcal?.toString() ?? '',
      protein: meal.protein_g?.toString() ?? '',
      carbs: meal.carbs_g?.toString() ?? '',
      fat: meal.fat_g?.toString() ?? '',
      fiber: meal.fiber_g?.toString() ?? '',
    });
    setKcalPer100g(meal.calories_kcal !== null && meal.quantity_g ? meal.calories_kcal * 100 / meal.quantity_g : null);
    setMacrosPer100g({
      protein: meal.protein_g !== null && meal.quantity_g ? meal.protein_g * 100 / meal.quantity_g : 0,
      carbs: meal.carbs_g !== null && meal.quantity_g ? meal.carbs_g * 100 / meal.quantity_g : 0,
      fat: meal.fat_g !== null && meal.quantity_g ? meal.fat_g * 100 / meal.quantity_g : 0,
      fiber: meal.fiber_g !== null && meal.quantity_g ? meal.fiber_g * 100 / meal.quantity_g : 0,
    });
    setFoodResults([]);
    setModal('add_meal');
  };

  const searchFood = async () => {
    if (!mealForm.name.trim()) return;
    setSearchingFood(true);
    try {
      const fields = 'product_name,brands,nutriments';
      const url = `https://search.openfoodfacts.org/search?q=${encodeURIComponent(mealForm.name)}&langs=it,en&page_size=8&fields=${fields}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Ricerca non disponibile');
      const result = await response.json() as { hits?: Array<{ product_name?: string; brands?: string[] | string; nutriments?: Record<string, number> }> };
      setFoodResults((result.hits ?? []).flatMap(product => {
        const kcal = product.nutriments?.['energy-kcal_100g']
          ?? (product.nutriments?.energy_100g ? product.nutriments.energy_100g / 4.184 : 0);
        return product.product_name && kcal > 0 ? [{
          name: product.product_name,
          brand: Array.isArray(product.brands) ? product.brands.join(', ') : product.brands ?? '',
          kcal100g: Math.round(kcal),
          protein100g: product.nutriments?.proteins_100g ?? 0,
          carbs100g: product.nutriments?.carbohydrates_100g ?? 0,
          fat100g: product.nutriments?.fat_100g ?? 0,
          fiber100g: product.nutriments?.fiber_100g ?? 0,
        }] : [];
      }));
    } catch {
      showToast('Ricerca alimenti non disponibile. Puoi inserire le calorie manualmente.', 'info');
    }
    setSearchingFood(false);
  };

  const selectFood = (food: FoodResult) => {
    const grams = Math.max(1, parseFloat(mealForm.quantityG) || 100);
    setKcalPer100g(food.kcal100g);
    setMacrosPer100g({ protein: food.protein100g, carbs: food.carbs100g, fat: food.fat100g, fiber: food.fiber100g });
    setMealForm(prev => ({
      ...prev,
      name: food.name,
      calories: Math.round(food.kcal100g * grams / 100).toString(),
    }));
    setFoodResults([]);
  };

  const rememberPlannedMeal = async () => {
    const name = mealForm.name.trim();
    const caloriesValue = mealForm.calories ? parseInt(mealForm.calories) : null;
    if (!user || !name || caloriesValue === null || Number.isNaN(caloriesValue)) return;

    const rememberedMeal = favorites.find(fav => fav.name.trim().toLocaleLowerCase('it') === name.toLocaleLowerCase('it'));
    const values = {
      name,
      meal_type: mealForm.mealType,
      ingredients: mealForm.ingredients || null,
      notes: mealForm.notes || null,
      quantity_g: mealForm.quantityG ? parseFloat(mealForm.quantityG) : null,
      calories_kcal: caloriesValue,
      protein_g: mealForm.protein ? parseFloat(mealForm.protein) : null,
      carbs_g: mealForm.carbs ? parseFloat(mealForm.carbs) : null,
      fat_g: mealForm.fat ? parseFloat(mealForm.fat) : null,
      fiber_g: mealForm.fiber ? parseFloat(mealForm.fiber) : null,
      calories_source: 'manual' as const,
    };

    if (rememberedMeal) {
      const { data } = await supabase.from('favorite_meals').update(values).eq('id', rememberedMeal.id).select().maybeSingle();
      if (data) setFavorites(prev => prev.map(fav => fav.id === data.id ? data : fav));
    } else {
      const { data } = await supabase.from('favorite_meals').insert({ user_id: user.id, ...values, use_count: 0 }).select().maybeSingle();
      if (data) setFavorites(prev => [...prev, data]);
    }
  };

  const saveMeal = async () => {
    if (!mealForm.name.trim()) return;
    if (isDemo) {
      if (editMeal) {
        setMeals(prev => prev.map(m => m.id === editMeal.id ? {
          ...m,
          name: mealForm.name,
          ingredients: mealForm.ingredients || null,
          notes: mealForm.notes || null,
          meal_type: mealForm.mealType as PlannedMeal['meal_type'],
          plan_date: mealForm.date,
          quantity_g: mealForm.quantityG ? parseFloat(mealForm.quantityG) : null,
          calories_kcal: mealForm.calories ? parseInt(mealForm.calories) : null,
          protein_g: mealForm.protein ? parseFloat(mealForm.protein) : null,
          carbs_g: mealForm.carbs ? parseFloat(mealForm.carbs) : null,
          fat_g: mealForm.fat ? parseFloat(mealForm.fat) : null,
          fiber_g: mealForm.fiber ? parseFloat(mealForm.fiber) : null,
        } : m));
      } else {
        const newMeal: PlannedMeal = {
          id: Math.random().toString(36).slice(2),
          user_id: 'demo',
          plan_date: mealForm.date,
          meal_type: mealForm.mealType as PlannedMeal['meal_type'],
          name: mealForm.name,
          ingredients: mealForm.ingredients || null,
          notes: mealForm.notes || null,
          quantity_g: mealForm.quantityG ? parseFloat(mealForm.quantityG) : null,
          calories_kcal: mealForm.calories ? parseInt(mealForm.calories) : null,
          protein_g: mealForm.protein ? parseFloat(mealForm.protein) : null,
          carbs_g: mealForm.carbs ? parseFloat(mealForm.carbs) : null,
          fat_g: mealForm.fat ? parseFloat(mealForm.fat) : null,
          fiber_g: mealForm.fiber ? parseFloat(mealForm.fiber) : null,
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
        quantity_g: mealForm.quantityG ? parseFloat(mealForm.quantityG) : null,
        calories_kcal: mealForm.calories ? parseInt(mealForm.calories) : null,
        protein_g: mealForm.protein ? parseFloat(mealForm.protein) : null,
        carbs_g: mealForm.carbs ? parseFloat(mealForm.carbs) : null,
        fat_g: mealForm.fat ? parseFloat(mealForm.fat) : null,
        fiber_g: mealForm.fiber ? parseFloat(mealForm.fiber) : null,
      }).eq('id', editMeal.id).select().maybeSingle();
      if (data) {
        setMeals(prev => prev.map(m => m.id === editMeal.id ? data : m));
        if (data.is_completed) {
          await supabase.from('hunger_satiety_entries').update({
            meal_type: data.meal_type,
            meal_name: data.name,
            quantity_g: data.quantity_g,
            calories_kcal: data.calories_kcal,
            protein_g: data.protein_g,
            carbs_g: data.carbs_g,
            fat_g: data.fat_g,
            fiber_g: data.fiber_g,
          }).eq('planned_meal_id', data.id);
        }
      }
    } else {
      const { data } = await supabase.from('planned_meals').insert({
        user_id: user.id,
        plan_date: mealForm.date,
        meal_type: mealForm.mealType as PlannedMeal['meal_type'],
        name: mealForm.name,
        ingredients: mealForm.ingredients || null,
        notes: mealForm.notes || null,
        quantity_g: mealForm.quantityG ? parseFloat(mealForm.quantityG) : null,
        calories_kcal: mealForm.calories ? parseInt(mealForm.calories) : null,
        protein_g: mealForm.protein ? parseFloat(mealForm.protein) : null,
        carbs_g: mealForm.carbs ? parseFloat(mealForm.carbs) : null,
        fat_g: mealForm.fat ? parseFloat(mealForm.fat) : null,
        fiber_g: mealForm.fiber ? parseFloat(mealForm.fiber) : null,
      }).select().maybeSingle();
      if (data) setMeals(prev => [...prev, data]);
    }
    await rememberPlannedMeal();
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
    const { error } = await supabase.from('planned_meals').update({ is_completed: newVal }).eq('id', meal.id);
    if (error) {
      showToast(`Pasto non aggiornato: ${error.message}`, 'error');
      return;
    }
    if (newVal) {
      const { error: registerError } = await supabase.from('hunger_satiety_entries').upsert({
        user_id: user.id,
        planned_meal_id: meal.id,
        entry_datetime: new Date(`${meal.plan_date}T12:00:00`).toISOString(),
        meal_type: meal.meal_type,
        meal_name: meal.name,
        quantity_g: meal.quantity_g,
        calories_kcal: meal.calories_kcal,
        protein_g: meal.protein_g,
        carbs_g: meal.carbs_g,
        fat_g: meal.fat_g,
        fiber_g: meal.fiber_g,
        calories_source: meal.calories_kcal !== null ? 'manual' : null,
      }, { onConflict: 'planned_meal_id' });
      if (registerError) {
        await supabase.from('planned_meals').update({ is_completed: false }).eq('id', meal.id);
        showToast(`Pasto non registrato: ${registerError.message}`, 'error');
        return;
      }
    } else {
      await supabase.from('hunger_satiety_entries').delete().eq('planned_meal_id', meal.id);
    }
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
    setMealForm(prev => ({
      ...prev,
      name: fav.name,
      ingredients: fav.ingredients ?? '',
      notes: fav.notes ?? '',
      mealType: fav.meal_type ?? prev.mealType,
      quantityG: fav.quantity_g?.toString() ?? '100',
      calories: fav.calories_kcal?.toString() ?? '',
      protein: fav.protein_g?.toString() ?? '',
      carbs: fav.carbs_g?.toString() ?? '',
      fat: fav.fat_g?.toString() ?? '',
      fiber: fav.fiber_g?.toString() ?? '',
    }));
    setKcalPer100g(fav.calories_kcal !== null && fav.quantity_g ? fav.calories_kcal * 100 / fav.quantity_g : null);
    setMacrosPer100g({
      protein: fav.protein_g !== null && fav.quantity_g ? fav.protein_g * 100 / fav.quantity_g : 0,
      carbs: fav.carbs_g !== null && fav.quantity_g ? fav.carbs_g * 100 / fav.quantity_g : 0,
      fat: fav.fat_g !== null && fav.quantity_g ? fav.fat_g * 100 / fav.quantity_g : 0,
      fiber: fav.fiber_g !== null && fav.quantity_g ? fav.fiber_g * 100 / fav.quantity_g : 0,
    });
    setFoodResults([]);
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
      return {
        user_id: user.id,
        plan_date: dateToISO(newDate),
        meal_type: m.meal_type,
        name: m.name,
        ingredients: m.ingredients,
        notes: m.notes,
        quantity_g: m.quantity_g,
        calories_kcal: m.calories_kcal,
        protein_g: m.protein_g,
        carbs_g: m.carbs_g,
        fat_g: m.fat_g,
        fiber_g: m.fiber_g,
      };
    });

    const { data } = await supabase.from('planned_meals').insert(newMeals).select();
    if (data) setMeals(prev => [...prev, ...data]);
    showToast(`Copiati ${newMeals.length} pasti dalla settimana precedente!`, 'success');
  };

  const generateShoppingList = async () => {
    if (!user) return;
    const ingredients = meals
      .flatMap(meal => (meal.ingredients ?? '').split(','))
      .map(item => item.trim())
      .filter(Boolean);
    const unique = [...new Map(ingredients.map(item => [item.toLowerCase(), item])).values()];
    if (!unique.length) {
      showToast('Aggiungi gli ingredienti ai pasti per creare la lista.', 'info');
      return;
    }
    const { data: list, error } = await supabase.from('shopping_lists').insert({
      user_id: user.id,
      name: `Spesa ${dateToISO(weekStart)}`,
      week_start: dateToISO(weekStart),
    }).select().maybeSingle();
    if (error || !list) {
      showToast(`Lista non creata: ${error?.message ?? 'errore sconosciuto'}`, 'error');
      return;
    }
    const { error: itemsError } = await supabase.from('shopping_list_items').insert(unique.map(name => ({
      user_id: user.id,
      list_id: list.id,
      name,
      category: 'altro',
      is_manual: false,
    })));
    showToast(itemsError ? `Elementi non salvati: ${itemsError.message}` : `Lista della spesa creata con ${unique.length} elementi.`, itemsError ? 'error' : 'success');
  };

  const goToPrevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); };
  const goToNextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); };

  const getMealsForDay = (date: string) => meals.filter(m => m.plan_date === date);
  const getConsumedMealsForDay = (date: string) => consumedMeals.filter(
    meal => dateToISO(new Date(meal.entry_datetime)) === date,
  );
  const getShiftForDay = (date: string) => shifts.find(s => s.date === date);

  const weekLabel = `${formatDateShort(dateToISO(weekStart))} – ${formatDateShort(dateToISO(weekDays[6]))}`;

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="section-title">Pasti e turni</h1>
        <div className="flex gap-2">
          <button onClick={() => setModal('recipe')} className="text-xs text-amber-700 font-medium bg-amber-50 px-3 py-1.5 rounded-lg hover:bg-amber-100">Crea ricetta</button>
          <button onClick={copyPrevWeek} className="text-xs text-sage-600 font-medium hover:underline">Copia settimana prec.</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 bg-warm-gray-100 rounded-xl p-1">
        <button onClick={() => setView('plan')} className={`py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 ${view === 'plan' ? 'bg-white text-sage-700 shadow-sm' : 'text-warm-gray-500'}`}>
          <CalendarDays size={16} /> Pianifica
        </button>
        <button onClick={() => setView('register')} className={`py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 ${view === 'register' ? 'bg-white text-sage-700 shadow-sm' : 'text-warm-gray-500'}`}>
          <ClipboardCheck size={16} /> Registra
        </button>
      </div>

      {view === 'register' && (
        <div className="space-y-4">
          <div className="card bg-amber-50 border-amber-200">
            <h2 className="font-semibold text-warm-gray-800">Registra il pasto consumato</h2>
            <p className="text-sm text-warm-gray-600 mt-1">Puoi confermare il pasto pianificato spuntandolo oppure registrare una variazione.</p>
            <button onClick={() => setRegisterMeal(true)} className="btn-primary w-full mt-4">Registra una variazione</button>
          </div>
          <div className="card">
            <h2 className="font-semibold text-warm-gray-800 mb-3">Pasti consumati oggi</h2>
            {getConsumedMealsForDay(todayISO()).length === 0 ? (
              <p className="text-sm text-warm-gray-400">Nessun pasto consumato registrato oggi.</p>
            ) : getConsumedMealsForDay(todayISO()).map(meal => (
              <div key={meal.id} className="p-3 rounded-xl mb-2 bg-sage-50 border border-sage-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-warm-gray-800">{meal.meal_name || MEAL_TYPE_LABELS[meal.meal_type ?? ''] || 'Pasto'}</p>
                    <p className="text-xs text-warm-gray-500 mt-1">
                      {[
                        meal.pre_hunger !== null && `Fame ${meal.pre_hunger}/10`,
                        meal.post_satiety !== null && `Sazietà ${meal.post_satiety}/10`,
                        meal.post_satisfaction !== null && `Soddisfazione ${meal.post_satisfaction}/10`,
                      ].filter(Boolean).join(' · ') || 'Registrazione parziale'}
                    </p>
                  </div>
                  <span className="text-xs text-sage-700">{MEAL_TYPE_LABELS[meal.meal_type ?? '']}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <h2 className="font-semibold text-warm-gray-800 mb-3">Pasti pianificati oggi</h2>
            {getMealsForDay(todayISO()).length === 0 ? <p className="text-sm text-warm-gray-400">Nessun pasto pianificato oggi.</p> :
              getMealsForDay(todayISO()).map(meal => (
                <button key={meal.id} onClick={() => toggleMealComplete(meal)} className={`w-full flex items-center gap-3 p-3 rounded-xl mb-2 text-left ${meal.is_completed ? 'bg-sage-50' : 'bg-warm-gray-50'}`}>
                  <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${meal.is_completed ? 'bg-sage-600 border-sage-600 text-white' : 'border-warm-gray-300'}`}>{meal.is_completed && <Check size={14} />}</span>
                  <span className="flex-1 text-sm font-medium">{meal.name}</span>
                  <span className="text-xs text-warm-gray-500">{MEAL_TYPE_LABELS[meal.meal_type]}</span>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Week Navigator */}
      {view === 'plan' && <>
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
                          {meal.calories_kcal !== null && <p className="text-xs font-medium text-amber-700 mt-0.5">{meal.calories_kcal} kcal{meal.quantity_g ? ` · ${meal.quantity_g} g` : ''}</p>}
                          {(meal.protein_g !== null || meal.carbs_g !== null || meal.fat_g !== null) && <p className="text-xs text-warm-gray-500 mt-0.5">P {meal.protein_g ?? 0}g · C {meal.carbs_g ?? 0}g · G {meal.fat_g ?? 0}g</p>}
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

      <button onClick={generateShoppingList} className="btn-secondary w-full flex items-center justify-center gap-2">
        <ShoppingCart size={17} /> Genera lista della spesa
      </button>
      </>}

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
              <div className="flex gap-2">
                <input type="text" className="input-field" placeholder="Es. Pasta al pomodoro" value={mealForm.name} onChange={e => {
                  setKcalPer100g(null);
                  setFoodResults([]);
                  setMealForm(p => ({ ...p, name: e.target.value, calories: '', protein: '', carbs: '', fat: '', fiber: '' }));
                }} autoFocus />
                <button type="button" onClick={searchFood} disabled={searchingFood || !mealForm.name.trim()} className="btn-secondary px-3 text-sm">
                  {searchingFood ? 'Cerco...' : 'Cerca calorie'}
                </button>
              </div>
            </div>
            {foodResults.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                <label className="label">Scegli il prodotto corretto</label>
                {foodResults.map((food, index) => (
                  <button key={`${food.name}-${index}`} type="button" onClick={() => selectFood(food)} className="w-full text-left bg-white rounded-xl p-3 border border-amber-200">
                    <p className="text-sm font-semibold text-warm-gray-800">{food.name}</p>
                    <p className="text-xs text-warm-gray-500">{food.brand || 'Marca non indicata'} · {food.kcal100g} kcal/100g · P {food.protein100g}g · C {food.carbs100g}g · G {food.fat100g}g</p>
                  </button>
                ))}
              </div>
            )}
            {favorites.filter(fav => fav.calories_kcal !== null && (!mealForm.name.trim() || fav.name.toLocaleLowerCase('it').includes(mealForm.name.trim().toLocaleLowerCase('it')))).slice(0, 3).length > 0 && (
              <div>
                <label className="label">I tuoi pasti già memorizzati</label>
                <div className="space-y-2">
                  {favorites.filter(fav => fav.calories_kcal !== null && (!mealForm.name.trim() || fav.name.toLocaleLowerCase('it').includes(mealForm.name.trim().toLocaleLowerCase('it')))).slice(0, 3).map(fav => (
                    <button key={fav.id} type="button" onClick={() => addFavoriteMeal(fav)}
                      className="w-full text-left text-xs bg-sage-50 border border-sage-200 rounded-xl p-2 text-sage-900">
                      <span className="font-semibold">{fav.name}</span> · {fav.calories_kcal} kcal{fav.quantity_g ? ` · ${fav.quantity_g} g` : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="label">Suggerimenti coerenti con il tuo percorso</label>
              <div className="grid grid-cols-2 gap-2">
                {MEAL_SUGGESTIONS.map(suggestion => (
                  <button key={suggestion.name} onClick={() => { setKcalPer100g(null); setMealForm(p => ({ ...p, name: suggestion.name, ingredients: suggestion.ingredients, calories: '', protein: '', carbs: '', fat: '', fiber: '' })); }}
                    className="text-left text-xs bg-amber-50 border border-amber-200 rounded-xl p-2 text-amber-900">
                    {suggestion.name}
                  </button>
                ))}
              </div>
              <p className="text-xs text-warm-gray-400 mt-1">Suggerimenti generali dal Second Brain, non prescrizioni nutrizionali.</p>
            </div>
            <div>
              <label className="label">Ingredienti / contenuto (opzionale)</label>
              <textarea className="input-field h-20 resize-none" placeholder="Es. Pasta integrale, pomodoro, basilico..." value={mealForm.ingredients} onChange={e => setMealForm(p => ({ ...p, ingredients: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Quantità (grammi)</label>
                <input type="number" min="1" className="input-field" value={mealForm.quantityG} onChange={e => setMealForm(p => ({ ...p, quantityG: e.target.value }))} />
              </div>
              <div>
                <label className="label">Calorie totali</label>
                <input type="number" min="0" className="input-field" placeholder="Si compilano con la ricerca" value={mealForm.calories} onChange={e => { setKcalPer100g(null); setMealForm(p => ({ ...p, calories: e.target.value })); }} />
              </div>
            </div>
            <div>
              <label className="label">Macronutrienti totali</label>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" min="0" step="0.1" className="input-field" placeholder="Proteine g" value={mealForm.protein} onChange={e => setMealForm(p => ({ ...p, protein: e.target.value }))} />
                <input type="number" min="0" step="0.1" className="input-field" placeholder="Carboidrati g" value={mealForm.carbs} onChange={e => setMealForm(p => ({ ...p, carbs: e.target.value }))} />
                <input type="number" min="0" step="0.1" className="input-field" placeholder="Grassi g" value={mealForm.fat} onChange={e => setMealForm(p => ({ ...p, fat: e.target.value }))} />
                <input type="number" min="0" step="0.1" className="input-field" placeholder="Fibre g" value={mealForm.fiber} onChange={e => setMealForm(p => ({ ...p, fiber: e.target.value }))} />
              </div>
            </div>
            <p className="text-xs text-warm-gray-500">
              Cerca il prodotto e selezionalo: le calorie si aggiornano automaticamente cambiando i grammi. La ricerca usa Open Food Facts; per piatti casalinghi controlla la stima.
            </p>
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
        <Modal isOpen title="Pasti e ricette personali" onClose={() => setModal(null)}>
          <div className="space-y-3">
            {favorites.length === 0 ? (
              <p className="text-sm text-warm-gray-400 text-center py-4">Nessun pasto preferito ancora.</p>
            ) : (
              favorites.map(fav => (
                <button key={fav.id} onClick={() => { addFavoriteMeal(fav); }}
                  className="w-full text-left card-sm hover:bg-sage-50 hover:border-sage-200 transition-all">
                  <p className="font-medium text-warm-gray-800">{fav.name}</p>
                  {fav.ingredients && <p className="text-xs text-warm-gray-500 mt-0.5">{fav.ingredients}</p>}
                  {fav.calories_kcal !== null && <p className="text-xs font-medium text-amber-700 mt-0.5">{fav.calories_kcal} kcal{fav.quantity_g ? ` · ${fav.quantity_g} g` : ''}</p>}
                  {(fav.protein_g !== null || fav.carbs_g !== null || fav.fat_g !== null) && <p className="text-xs text-warm-gray-500 mt-0.5">P {fav.protein_g ?? 0}g · C {fav.carbs_g ?? 0}g · G {fav.fat_g ?? 0}g</p>}
                  <p className="text-xs text-warm-gray-400 mt-1">{MEAL_TYPE_LABELS[fav.meal_type ?? ''] ?? fav.meal_type} · Usato {fav.use_count}x</p>
                </button>
              ))
            )}
          </div>
        </Modal>
      )}
      {registerMeal && <QuickMealModal onClose={() => setRegisterMeal(false)} />}
      {modal === 'recipe' && <RecipeBuilderModal onClose={() => setModal(null)} onSaved={loadData} />}
    </div>
  );
}

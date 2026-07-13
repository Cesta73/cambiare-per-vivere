import { useEffect, useRef, useState } from 'react';
import { Modal } from '../ui/Modal';
import { ScoreButtons } from '../ui/ScoreButtons';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import type { FavoriteMeal } from '../../lib/supabase';
import { MEAL_TYPE_LABELS } from '../../lib/utils';
import { useNutritionPlan } from '../../contexts/NutritionPlanContext';
import { sendJarvisCoreMessage, type NutritionMenuDay } from '../../lib/jarvis-core';

interface Props { onClose: () => void; }

interface FoodResult {
  name: string;
  brand: string;
  kcal100g: number;
  protein100g: number;
  carbs100g: number;
  fat100g: number;
  fiber100g: number;
}

export function QuickMealModal({ onClose }: Props) {
  const { user, showToast, refreshData } = useApp();
  const { plan } = useNutritionPlan();
  const [step, setStep] = useState<'pre' | 'post'>('pre');
  const [mealType, setMealType] = useState(() => suggestedMealType());
  const [preHunger, setPreHunger] = useState<number | null>(null);
  const [preEmotional, setPreEmotional] = useState('');
  const [preReason, setPreReason] = useState('');
  const [preCraving, setPreCraving] = useState('');
  const [postSatiety, setPostSatiety] = useState<number | null>(null);
  const [postSatisfaction, setPostSatisfaction] = useState<number | null>(null);
  const [postCalmly, setPostCalmly] = useState<boolean | null>(null);
  const [postStopped, setPostStopped] = useState<boolean | null>(null);
  const [postNotes, setPostNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [mealName, setMealName] = useState('');
  const [quantityG, setQuantityG] = useState('100');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [calorieSource, setCalorieSource] = useState<'open_food_facts' | 'manual'>('manual');
  const [sourceProduct, setSourceProduct] = useState('');
  const [foodResults, setFoodResults] = useState<FoodResult[]>([]);
  const [searchingFood, setSearchingFood] = useState(false);
  const [favoriteMeals, setFavoriteMeals] = useState<FavoriteMeal[]>([]);
  const [kcalPer100g, setKcalPer100g] = useState<number | null>(null);
  const [macrosPer100g, setMacrosPer100g] = useState({ protein: 0, carbs: 0, fat: 0, fiber: 0 });
  const [jarvisFeedback, setJarvisFeedback] = useState<string | null>(null);
  const [planCompliance, setPlanCompliance] = useState<'plan' | 'different'>('plan');
  const [planSelections, setPlanSelections] = useState<Record<string, string>>({});
  const submissionInFlight = useRef(false);
  const submissionId = useRef(`nutrition-entry-${crypto.randomUUID()}`);

  const planMeal = plan?.meals[mealType];
  const menuSuggestion = plan?.weekly_menu.today?.[mealType as keyof NutritionMenuDay];

  useEffect(() => {
    const rows = plan?.meals[mealType]?.rows ?? [];
    const menu = plan?.weekly_menu.today?.[mealType as keyof NutritionMenuDay] ?? '';
    setPlanSelections(Object.fromEntries(rows.map(row => [
      row.category,
      inferOfficialSelection(row.choose_one, menu, row.category),
    ])));
  }, [mealType, plan]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('favorite_meals')
      .select('*')
      .eq('user_id', user.id)
      .order('use_count', { ascending: false })
      .limit(50)
      .then(({ data }) => setFavoriteMeals(data ?? []));
  }, [user]);

  const normalizedMealName = mealName.trim().toLocaleLowerCase('it');
  const personalMealSuggestions = favoriteMeals
    .filter(meal => meal.calories_kcal !== null && (!normalizedMealName || meal.name.toLocaleLowerCase('it').includes(normalizedMealName)))
    .slice(0, 4);

  useEffect(() => {
    if (kcalPer100g === null) return;
    const grams = Math.max(1, parseFloat(quantityG) || 100);
    setCalories(Math.round(kcalPer100g * grams / 100).toString());
    setProtein((macrosPer100g.protein * grams / 100).toFixed(1));
    setCarbs((macrosPer100g.carbs * grams / 100).toFixed(1));
    setFat((macrosPer100g.fat * grams / 100).toFixed(1));
    setFiber((macrosPer100g.fiber * grams / 100).toFixed(1));
  }, [quantityG, kcalPer100g, macrosPer100g]);

  const searchFood = async () => {
    if (!mealName.trim()) return;
    setSearchingFood(true);
    try {
      const fields = 'product_name,brands,nutriments';
      const url = `https://search.openfoodfacts.org/search?q=${encodeURIComponent(mealName)}&langs=it,en&page_size=8&fields=${fields}`;
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
      showToast('Ricerca alimenti non disponibile. Inserisci le calorie manualmente.', 'info');
    }
    setSearchingFood(false);
  };

  const selectFood = (food: FoodResult) => {
    const grams = Math.max(1, parseFloat(quantityG) || 100);
    setMealName(food.name);
    setCalories(Math.round(food.kcal100g * grams / 100).toString());
    setKcalPer100g(food.kcal100g);
    setMacrosPer100g({ protein: food.protein100g, carbs: food.carbs100g, fat: food.fat100g, fiber: food.fiber100g });
    setCalorieSource('open_food_facts');
    setSourceProduct(`${food.name}${food.brand ? ` - ${food.brand}` : ''} (${food.kcal100g} kcal/100g)`);
    setFoodResults([]);
  };

  const selectFavoriteMeal = (meal: FavoriteMeal) => {
    setMealName(meal.name);
    setMealType(meal.meal_type || mealType);
    setQuantityG(meal.quantity_g?.toString() || '100');
    setCalories(meal.calories_kcal?.toString() || '');
    setKcalPer100g(meal.calories_kcal !== null && meal.quantity_g ? meal.calories_kcal * 100 / meal.quantity_g : null);
    setMacrosPer100g({
      protein: meal.protein_g !== null && meal.quantity_g ? meal.protein_g * 100 / meal.quantity_g : 0,
      carbs: meal.carbs_g !== null && meal.quantity_g ? meal.carbs_g * 100 / meal.quantity_g : 0,
      fat: meal.fat_g !== null && meal.quantity_g ? meal.fat_g * 100 / meal.quantity_g : 0,
      fiber: meal.fiber_g !== null && meal.quantity_g ? meal.fiber_g * 100 / meal.quantity_g : 0,
    });
    setProtein(meal.protein_g?.toString() || '');
    setCarbs(meal.carbs_g?.toString() || '');
    setFat(meal.fat_g?.toString() || '');
    setFiber(meal.fiber_g?.toString() || '');
    setCalorieSource(meal.calories_source === 'open_food_facts' ? 'open_food_facts' : 'manual');
    setSourceProduct(meal.source_product || '');
    setFoodResults([]);
  };

  const rememberMeal = async () => {
    const name = mealName.trim();
    const caloriesValue = calories ? parseInt(calories) : null;
    if (!user || !name || caloriesValue === null || Number.isNaN(caloriesValue)) return;

    const rememberedMeal = favoriteMeals.find(meal => meal.name.trim().toLocaleLowerCase('it') === name.toLocaleLowerCase('it'));
    const rememberedValues = {
      name,
      meal_type: mealType,
      quantity_g: quantityG ? parseFloat(quantityG) : null,
      calories_kcal: caloriesValue,
      protein_g: protein ? parseFloat(protein) : null,
      carbs_g: carbs ? parseFloat(carbs) : null,
      fat_g: fat ? parseFloat(fat) : null,
      fiber_g: fiber ? parseFloat(fiber) : null,
      calories_source: calorieSource,
      source_product: sourceProduct || null,
    };

    if (rememberedMeal) {
      await supabase
        .from('favorite_meals')
        .update({ ...rememberedValues, use_count: rememberedMeal.use_count + 1 })
        .eq('id', rememberedMeal.id);
    } else {
      await supabase.from('favorite_meals').insert({
        user_id: user.id,
        ...rememberedValues,
        use_count: 1,
      });
    }
  };

  const handleSave = async () => {
    if (submissionInFlight.current) return;
    if (!user) {
      showToast('Sessione non disponibile.', 'error');
      return;
    }
    if (preHunger === null || postSatiety === null || postSatisfaction === null) {
      showToast('Completa fame, sazietà e soddisfazione prima di registrare.', 'info');
      return;
    }
    const officialItems = planMeal?.rows.map(row => planSelections[row.category]).filter(Boolean) ?? [];
    if (planCompliance === 'plan' && (!planMeal || officialItems.length !== planMeal.rows.length)) {
      showToast('Scegli un’alternativa del piano per ogni componente del pasto.', 'info');
      return;
    }
    if (planCompliance === 'different' && !mealName.trim()) {
      showToast('Descrivi ciò che hai mangiato.', 'info');
      return;
    }

    submissionInFlight.current = true;
    setLoading(true);
    try {
      const registration = planCompliance === 'plan' ? [
        `Registra ${MEAL_TYPE_LABELS[mealType] || mealType} come pasto conforme al piano ufficiale.`,
        `Scelte effettive: ${officialItems.join('; ')}.`,
        menuSuggestion ? `Piatto del menu: ${menuSuggestion}.` : '',
      ] : [
        `Registra ${MEAL_TYPE_LABELS[mealType] || mealType} come pasto non conforme al piano ufficiale.`,
        `Ho mangiato: ${mealName.trim()}.`,
        quantityG ? `Quantità dichiarata: ${quantityG} g.` : '',
        calories ? `Calorie dichiarate: ${calories} kcal.` : '',
        [protein && `proteine ${protein} g`, carbs && `carboidrati ${carbs} g`, fat && `grassi ${fat} g`, fiber && `fibre ${fiber} g`].filter(Boolean).length
          ? `Macronutrienti dichiarati: ${[protein && `proteine ${protein} g`, carbs && `carboidrati ${carbs} g`, fat && `grassi ${fat} g`, fiber && `fibre ${fiber} g`].filter(Boolean).join(', ')}.`
          : '',
      ];
      const feedback = await sendJarvisCoreMessage([
        ...registration,
        `Fame ${preHunger}/10; sazietà ${postSatiety}/10; soddisfazione ${postSatisfaction}/10.`,
        preEmotional ? `Stato emotivo: ${preEmotional}.` : '',
        preReason ? `Motivo: ${preReason}.` : '',
        preCraving ? `Voglia specifica: ${preCraving}.` : '',
        postCalmly !== null ? `Ho mangiato ${postCalmly ? 'con calma' : 'non con calma'}.` : '',
        postStopped !== null ? `Mi sono ${postStopped ? 'fermato quando ero sazio' : 'fermato oltre la sazietà'}.` : '',
        postNotes ? `Note: ${postNotes}.` : '',
      ].filter(Boolean).join('\n'), `nutrition-app-${todayConversationId()}`, submissionId.current);
      if (planCompliance === 'different' && calories) await rememberMeal();
      refreshData();
      showToast('Pasto calcolato e registrato da Jarvis.', 'success');
      setJarvisFeedback(feedback.answer);
    } catch (cause) {
      showToast(cause instanceof Error ? cause.message : 'Pasto non registrato.', 'error');
    } finally {
      submissionInFlight.current = false;
      setLoading(false);
    }
  };

  return (
    <Modal isOpen title="Registra pasto" onClose={onClose}>
      <div className="space-y-4">
        {jarvisFeedback ? (
          <div className="space-y-4">
            <div className="nutrition-feedback">
              <p className="eyebrow text-amber-200">Lettura di Jarvis</p>
              <p className="mt-3 whitespace-pre-line">{jarvisFeedback}</p>
            </div>
            <button onClick={onClose} className="btn-primary w-full">Chiudi</button>
          </div>
        ) : <>
        <div>
          <label className="label">Tipo di pasto</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(MEAL_TYPE_LABELS).map(([val, label]) => (
              <button key={val} onClick={() => setMealType(val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${mealType === val ? 'bg-amber-500 text-white' : 'bg-warm-gray-100 text-warm-gray-700'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Rispetto al piano</label>
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-warm-gray-100 p-1">
            <button type="button" onClick={() => setPlanCompliance('plan')}
              className={`min-h-10 rounded-md px-3 text-sm font-semibold transition-colors ${planCompliance === 'plan' ? 'bg-white text-sage-800 shadow-sm' : 'text-warm-gray-600'}`}>
              Conforme
            </button>
            <button type="button" onClick={() => setPlanCompliance('different')}
              className={`min-h-10 rounded-md px-3 text-sm font-semibold transition-colors ${planCompliance === 'different' ? 'bg-white text-amber-800 shadow-sm' : 'text-warm-gray-600'}`}>
              Diverso dal piano
            </button>
          </div>
        </div>

        {planCompliance === 'plan' && planMeal?.rows?.length ? (
          <div className="card bg-sage-50 border-sage-200">
            <p className="text-xs font-semibold uppercase text-sage-700">Riferimento del piano</p>
            <p className="text-sm text-warm-gray-700 mt-1">Per questo pasto scegli una voce da ogni riga prevista.</p>
            <div className="mt-3 space-y-2">
              {planMeal.rows.map(row => (
                <div key={row.category} className="text-sm">
                  <strong className="text-warm-gray-800">{planCategoryLabel(row.category)}:</strong>{' '}
                  <span className="text-warm-gray-600">{row.choose_one.slice(0, 2).join(' oppure ')}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex gap-2">
          {(['pre', 'post'] as const).map(s => (
            <button key={s} onClick={() => setStep(s)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${step === s ? 'bg-amber-500 text-white' : 'bg-warm-gray-100 text-warm-gray-600'}`}>
              {s === 'pre' ? 'Prima del pasto' : 'Dopo il pasto'}
            </button>
          ))}
        </div>

        {step === 'pre' && (
          <div className="space-y-4">
            <ScoreButtons label="Fame fisica (0=nessuna, 10=intensa)" value={preHunger} onChange={setPreHunger} min={0} max={10} colorScale />
            <div>
              <label className="label">Stato emotivo</label>
              <input type="text" className="input-field" placeholder="Es. Tranquillo, stressato, annoiato..." value={preEmotional} onChange={e => setPreEmotional(e.target.value)} />
            </div>
            <div>
              <label className="label">Perché sto mangiando?</label>
              <input type="text" className="input-field" placeholder="Es. Fame fisica, orario, noia..." value={preReason} onChange={e => setPreReason(e.target.value)} />
            </div>
            <div>
              <label className="label">Voglia specifica (se presente)</label>
              <input type="text" className="input-field" placeholder="Es. dolci, salato..." value={preCraving} onChange={e => setPreCraving(e.target.value)} />
            </div>
            <button onClick={() => setStep('post')} className="btn-primary w-full">Continua</button>
          </div>
        )}

        {step === 'post' && (
          <div className="space-y-4">
            {planCompliance === 'plan' ? (
              <div className="bg-sage-50 border border-sage-200 rounded-lg p-3 space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-sage-700">Pasto conforme</p>
                  <p className="text-sm font-semibold text-warm-gray-800 mt-1">
                    {menuSuggestion || planMeal?.label || 'Pasto previsto dal piano'}
                  </p>
                  <p className="text-xs text-warm-gray-500 mt-1">Conferma la scelta effettiva per ogni componente. Jarvis userà queste quantità per il calcolo.</p>
                </div>
                {planMeal?.rows.map(row => (
                  <label key={row.category} className="block">
                    <span className="label">{planCategoryLabel(row.category)}</span>
                    <select
                      className="input-field"
                      value={planSelections[row.category] || ''}
                      onChange={event => setPlanSelections(current => ({ ...current, [row.category]: event.target.value }))}
                    >
                      <option value="">Scegli l’alternativa usata</option>
                      {row.choose_one.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </label>
                ))}
              </div>
            ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-3">
              <div>
                <label className="label">Alimento o piatto consumato</label>
                <div className="flex gap-2">
                  <input type="text" className="input-field" placeholder="Es. pasta al pomodoro" value={mealName} onChange={e => {
                    setMealName(e.target.value);
                    setKcalPer100g(null);
                    setCalories('');
                    setProtein('');
                    setCarbs('');
                    setFat('');
                    setFiber('');
                    setCalorieSource('manual');
                    setSourceProduct('');
                    setFoodResults([]);
                  }} />
                  <button type="button" onClick={searchFood} disabled={searchingFood || !mealName.trim()} className="btn-secondary px-3 text-sm">
                    {searchingFood ? 'Cerco...' : 'Cerca'}
                  </button>
                </div>
              </div>
              {personalMealSuggestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">I tuoi pasti</p>
                  {personalMealSuggestions.map(meal => (
                    <button key={meal.id} type="button" onClick={() => selectFavoriteMeal(meal)} className="w-full text-left bg-white rounded-xl p-3 border border-amber-200">
                      <p className="text-sm font-semibold text-warm-gray-800">{meal.name}</p>
                      <p className="text-xs text-warm-gray-500">
                        {meal.calories_kcal} kcal{meal.quantity_g ? ` · ${meal.quantity_g} g` : ''} · usato {meal.use_count} {meal.use_count === 1 ? 'volta' : 'volte'}
                      </p>
                    </button>
                  ))}
                  <p className="text-xs text-warm-gray-500">Tocca un pasto per riutilizzarlo. Puoi sempre correggere quantità e calorie.</p>
                </div>
              )}
              <div>
                <label className="label">Quantità indicativa (grammi)</label>
                <input type="number" min="1" className="input-field" value={quantityG} onChange={e => setQuantityG(e.target.value)} />
              </div>
              {foodResults.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {foodResults.map((food, index) => (
                    <button key={`${food.name}-${index}`} type="button" onClick={() => selectFood(food)} className="w-full text-left bg-white rounded-xl p-3 border border-amber-200">
                      <p className="text-sm font-semibold text-warm-gray-800">{food.name}</p>
                      <p className="text-xs text-warm-gray-500">{food.brand || 'Marca non indicata'} · {food.kcal100g} kcal/100g · P {food.protein100g}g · C {food.carbs100g}g · G {food.fat100g}g</p>
                    </button>
                  ))}
                </div>
              )}
              <div>
                <label className="label">Calorie totali del pasto</label>
                <input type="number" min="0" className="input-field" placeholder="Puoi correggere manualmente la stima" value={calories} onChange={e => { setCalories(e.target.value); setKcalPer100g(null); setCalorieSource('manual'); setSourceProduct(''); }} />
                <p className="text-xs text-warm-gray-500 mt-1">
                  La ricerca usa <a className="underline" href="https://world.openfoodfacts.org" target="_blank" rel="noreferrer">Open Food Facts</a> (dati ODbL).
                  Per piatti casalinghi la stima va controllata e corretta.
                </p>
              </div>
              <div>
                <label className="label">Macronutrienti totali</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" min="0" step="0.1" className="input-field" placeholder="Proteine g" value={protein} onChange={e => setProtein(e.target.value)} />
                  <input type="number" min="0" step="0.1" className="input-field" placeholder="Carboidrati g" value={carbs} onChange={e => setCarbs(e.target.value)} />
                  <input type="number" min="0" step="0.1" className="input-field" placeholder="Grassi g" value={fat} onChange={e => setFat(e.target.value)} />
                  <input type="number" min="0" step="0.1" className="input-field" placeholder="Fibre g" value={fiber} onChange={e => setFiber(e.target.value)} />
                </div>
              </div>
            </div>
            )}
            <ScoreButtons label="Sazietà (0=ancora fame, 10=pieno)" value={postSatiety} onChange={setPostSatiety} min={0} max={10} colorScale />
            <ScoreButtons label="Soddisfazione (0=per nulla, 10=molto)" value={postSatisfaction} onChange={setPostSatisfaction} min={0} max={10} colorScale />
            <div>
              <label className="label">Ho mangiato con calma?</label>
              <div className="flex gap-3">
                {[{ v: true, l: 'Sì' }, { v: false, l: 'No' }].map(({ v, l }) => (
                  <button key={l} onClick={() => setPostCalmly(v)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${postCalmly === v ? 'bg-sage-600 text-white' : 'bg-warm-gray-100 text-warm-gray-600'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Mi sono fermato quando ero sazio?</label>
              <div className="flex gap-3">
                {[{ v: true, l: 'Sì' }, { v: false, l: 'No' }].map(({ v, l }) => (
                  <button key={l} onClick={() => setPostStopped(v)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${postStopped === v ? 'bg-sage-600 text-white' : 'bg-warm-gray-100 text-warm-gray-600'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Note</label>
              <textarea className="input-field h-20 resize-none" value={postNotes} onChange={e => setPostNotes(e.target.value)} placeholder="Opzionale..." />
            </div>
            <button onClick={handleSave} disabled={loading} className="btn-primary w-full">
              {loading ? 'Salvataggio...' : 'Salva registrazione'}
            </button>
          </div>
        )}
        </>}
      </div>
    </Modal>
  );
}

function suggestedMealType() {
  const hour = new Date().getHours();
  if (hour < 10) return 'breakfast';
  if (hour < 12) return 'morning_snack';
  if (hour < 15) return 'lunch';
  if (hour < 18) return 'afternoon_snack';
  return 'dinner';
}

function todayConversationId() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Rome' });
}

function planCategoryLabel(category: string) {
  return ({
    carboidrati: 'Carboidrati', proteine: 'Proteine', proteine_latticini: 'Proteine e latticini',
    grassi: 'Grassi', verdura: 'Verdura', frutta: 'Frutta',
    dolcificante_condimento: 'Condimento',
  } as Record<string, string>)[category] ?? category;
}

function inferOfficialSelection(options: string[], menu: string, category: string) {
  if (options.length === 1) return options[0];
  const value = normalizeFoodText(menu);
  if (!value) return category === 'grassi' ? options[0] : '';

  const aliases: Array<[RegExp, RegExp]> = [
    [/\b(branzino|merluzzo|nasello|orata)\b/, /pesce magro/],
    [/\b(gamber|crostace|mollusch)\b/, /molluschi|crostacei/],
    [/\b(pollo|tacchino|coniglio)\b/, /pollo|tacchino|coniglio/],
    [/\b(ceci|fagioli|lenticchie|piselli)\b/, /legumi/],
    [/\b(fiocchi di latte|ricotta|formaggio fresco)\b/, /formaggio fresco|fiocchi di latte|ricotta/],
    [/\b(uova|frittata)\b/, /uova/],
    [/\bpancake\b/, /farina per pancake/],
  ];
  for (const [menuPattern, optionPattern] of aliases) {
    if (!menuPattern.test(value)) continue;
    const matched = options.filter(option => optionPattern.test(normalizeFoodText(option)));
    if (matched.length === 1) return matched[0];
  }

  if (category === 'frutta') {
    if (/\b(mela|pesca|pera|banana)\b/.test(value)) return options.find(option => /1 frutto grande/.test(normalizeFoodText(option))) || '';
    if (/\b(albicocc|susin|kiwi)\b/.test(value)) return options.find(option => /medio-piccol/.test(normalizeFoodText(option))) || '';
    if (/\b(mirtill|fragol|melone|anguria|macedonia)\b/.test(value)) return options.find(option => /bicchiere/.test(normalizeFoodText(option))) || '';
  }

  const foodKeys = [
    'farro', 'cornflakes', 'avena', 'fette biscottate', 'wasa', 'gallette', 'cous cous',
    'pasta', 'riso', 'gnocchi', 'patate', 'grissini', 'crackers', 'kefir', 'latte',
    'yogurt', 'skyr', 'ricotta', 'fiocchi di latte', 'shake', 'grana', 'miele',
    'marmellata', 'pesto', 'olive', 'avocado', 'olio',
  ];
  const direct = options.filter(option => {
    const normalizedOption = normalizeFoodText(option);
    return foodKeys.some(key => value.includes(key) && normalizedOption.includes(key));
  });
  if (direct.length === 1) return direct[0];
  if (category === 'grassi') return direct[0] || options[0];
  return '';
}

function normalizeFoodText(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('it');
}

import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { ScoreButtons } from '../ui/ScoreButtons';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import { MEAL_TYPE_LABELS } from '../../lib/utils';

interface Props { onClose: () => void; }

interface FoodResult {
  name: string;
  brand: string;
  kcal100g: number;
}

export function QuickMealModal({ onClose }: Props) {
  const { user, showToast } = useApp();
  const [step, setStep] = useState<'pre' | 'post'>('pre');
  const [mealType, setMealType] = useState('lunch');
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
  const [calorieSource, setCalorieSource] = useState<'open_food_facts' | 'manual'>('manual');
  const [sourceProduct, setSourceProduct] = useState('');
  const [foodResults, setFoodResults] = useState<FoodResult[]>([]);
  const [searchingFood, setSearchingFood] = useState(false);

  const searchFood = async () => {
    if (!mealName.trim()) return;
    setSearchingFood(true);
    try {
      const fields = 'product_name,brands,nutriments';
      const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(mealName)}&search_simple=1&action=process&json=1&page_size=8&fields=${fields}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Ricerca non disponibile');
      const result = await response.json() as { products?: Array<{ product_name?: string; brands?: string; nutriments?: Record<string, number> }> };
      setFoodResults((result.products ?? []).flatMap(product => {
        const kcal = product.nutriments?.['energy-kcal_100g']
          ?? (product.nutriments?.energy_100g ? product.nutriments.energy_100g / 4.184 : 0);
        return product.product_name && kcal > 0 ? [{
          name: product.product_name,
          brand: product.brands ?? '',
          kcal100g: Math.round(kcal),
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
    setCalorieSource('open_food_facts');
    setSourceProduct(`${food.name}${food.brand ? ` - ${food.brand}` : ''} (${food.kcal100g} kcal/100g)`);
    setFoodResults([]);
  };

  const handleSave = async () => {
    setLoading(true);
    if (!user) {
      showToast('Sessione non disponibile.', 'error');
      setLoading(false);
      return;
    }
    const { error } = await supabase.from('hunger_satiety_entries').insert({
        user_id: user.id,
        entry_datetime: new Date().toISOString(),
        meal_type: mealType,
        pre_hunger: preHunger,
        pre_emotional_state: preEmotional || null,
        pre_eating_reason: preReason || null,
        pre_craving: preCraving || null,
        post_satiety: postSatiety,
        post_satisfaction: postSatisfaction,
        post_ate_calmly: postCalmly,
        post_stopped_at_right_time: postStopped,
        post_notes: postNotes || null,
        meal_name: mealName || null,
        quantity_g: quantityG ? parseFloat(quantityG) : null,
        calories_kcal: calories ? parseInt(calories) : null,
        calories_source: calories ? calorieSource : null,
        source_product: sourceProduct || null,
    });
    if (error) {
      showToast(`Pasto non registrato: ${error.message}`, 'error');
      setLoading(false);
      return;
    }
    showToast('Registrazione pasto salvata!', 'success');
    setLoading(false);
    onClose();
  };

  return (
    <Modal isOpen title="Registra pasto" onClose={onClose}>
      <div className="space-y-4">
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
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-3">
              <div>
                <label className="label">Alimento o piatto consumato</label>
                <div className="flex gap-2">
                  <input type="text" className="input-field" placeholder="Es. pasta al pomodoro" value={mealName} onChange={e => setMealName(e.target.value)} />
                  <button type="button" onClick={searchFood} disabled={searchingFood || !mealName.trim()} className="btn-secondary px-3 text-sm">
                    {searchingFood ? 'Cerco...' : 'Cerca'}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Quantità indicativa (grammi)</label>
                <input type="number" min="1" className="input-field" value={quantityG} onChange={e => setQuantityG(e.target.value)} />
              </div>
              {foodResults.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {foodResults.map((food, index) => (
                    <button key={`${food.name}-${index}`} type="button" onClick={() => selectFood(food)} className="w-full text-left bg-white rounded-xl p-3 border border-amber-200">
                      <p className="text-sm font-semibold text-warm-gray-800">{food.name}</p>
                      <p className="text-xs text-warm-gray-500">{food.brand || 'Marca non indicata'} · {food.kcal100g} kcal/100g</p>
                    </button>
                  ))}
                </div>
              )}
              <div>
                <label className="label">Calorie totali del pasto</label>
                <input type="number" min="0" className="input-field" placeholder="Puoi correggere manualmente la stima" value={calories} onChange={e => { setCalories(e.target.value); setCalorieSource('manual'); setSourceProduct(''); }} />
                <p className="text-xs text-warm-gray-500 mt-1">
                  La ricerca usa <a className="underline" href="https://world.openfoodfacts.org" target="_blank" rel="noreferrer">Open Food Facts</a> (dati ODbL).
                  Per piatti casalinghi la stima va controllata e corretta.
                </p>
              </div>
            </div>
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
      </div>
    </Modal>
  );
}

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import { Modal } from '../ui/Modal';

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

interface FoodResult {
  name: string;
  brand: string;
  kcal100g: number;
  protein100g: number;
  carbs100g: number;
  fat100g: number;
  fiber100g: number;
}

interface RecipeIngredientDraft extends FoodResult {
  quantityG: number;
}

export function RecipeBuilderModal({ onClose, onSaved }: Props) {
  const { user, showToast } = useApp();
  const [recipeName, setRecipeName] = useState('');
  const [notes, setNotes] = useState('');
  const [ingredientQuery, setIngredientQuery] = useState('');
  const [ingredientQuantity, setIngredientQuantity] = useState('100');
  const [manualKcal, setManualKcal] = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');
  const [manualFat, setManualFat] = useState('');
  const [manualFiber, setManualFiber] = useState('');
  const [results, setResults] = useState<FoodResult[]>([]);
  const [ingredients, setIngredients] = useState<RecipeIngredientDraft[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  const totals = ingredients.reduce((sum, ingredient) => {
    const factor = ingredient.quantityG / 100;
    return {
      weight: sum.weight + ingredient.quantityG,
      calories: sum.calories + ingredient.kcal100g * factor,
      protein: sum.protein + ingredient.protein100g * factor,
      carbs: sum.carbs + ingredient.carbs100g * factor,
      fat: sum.fat + ingredient.fat100g * factor,
      fiber: sum.fiber + ingredient.fiber100g * factor,
    };
  }, { weight: 0, calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

  const finalWeight = Math.max(1, totals.weight || 1);
  const per100 = {
    calories: Math.round(totals.calories * 100 / finalWeight),
    protein: totals.protein * 100 / finalWeight,
    carbs: totals.carbs * 100 / finalWeight,
    fat: totals.fat * 100 / finalWeight,
    fiber: totals.fiber * 100 / finalWeight,
  };

  const searchIngredient = async () => {
    if (!ingredientQuery.trim()) return;
    setSearching(true);
    try {
      const fields = 'product_name,brands,nutriments';
      const url = `https://search.openfoodfacts.org/search?q=${encodeURIComponent(ingredientQuery)}&langs=it,en&page_size=8&fields=${fields}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Ricerca non disponibile');
      const result = await response.json() as { hits?: Array<{ product_name?: string; brands?: string[] | string; nutriments?: Record<string, number> }> };
      setResults((result.hits ?? []).flatMap(product => {
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
      showToast('Ricerca ingrediente non disponibile. Riprova tra poco.', 'info');
    }
    setSearching(false);
  };

  const addIngredient = (food: FoodResult) => {
    const quantityG = Math.max(1, parseFloat(ingredientQuantity) || 100);
    setIngredients(prev => [...prev, { ...food, quantityG }]);
    setIngredientQuery('');
    setIngredientQuantity('100');
    setResults([]);
  };

  const addManualIngredient = () => {
    if (!ingredientQuery.trim() || !manualKcal) return;
    addIngredient({
      name: ingredientQuery.trim(),
      brand: '',
      kcal100g: parseFloat(manualKcal) || 0,
      protein100g: parseFloat(manualProtein) || 0,
      carbs100g: parseFloat(manualCarbs) || 0,
      fat100g: parseFloat(manualFat) || 0,
      fiber100g: parseFloat(manualFiber) || 0,
    });
    setManualKcal('');
    setManualProtein('');
    setManualCarbs('');
    setManualFat('');
    setManualFiber('');
  };

  const saveRecipe = async () => {
    if (!user || !recipeName.trim() || ingredients.length === 0) return;
    setSaving(true);
    const recipeValues = {
      user_id: user.id,
      name: recipeName.trim(),
      finished_weight_g: finalWeight,
      total_calories_kcal: Math.round(totals.calories),
      total_protein_g: +totals.protein.toFixed(1),
      total_carbs_g: +totals.carbs.toFixed(1),
      total_fat_g: +totals.fat.toFixed(1),
      total_fiber_g: +totals.fiber.toFixed(1),
      notes: notes || null,
    };
    const { data: recipe, error } = await supabase.from('recipes').insert(recipeValues).select().maybeSingle();
    if (error || !recipe) {
      showToast(`Ricetta non salvata: ${error?.message ?? 'errore sconosciuto'}`, 'error');
      setSaving(false);
      return;
    }
    const { error: ingredientsError } = await supabase.from('recipe_ingredients').insert(ingredients.map(ingredient => {
      const factor = ingredient.quantityG / 100;
      return {
        recipe_id: recipe.id,
        user_id: user.id,
        name: ingredient.name,
        brand: ingredient.brand || null,
        quantity_g: ingredient.quantityG,
        calories_kcal: Math.round(ingredient.kcal100g * factor),
        protein_g: +(ingredient.protein100g * factor).toFixed(1),
        carbs_g: +(ingredient.carbs100g * factor).toFixed(1),
        fat_g: +(ingredient.fat100g * factor).toFixed(1),
        fiber_g: +(ingredient.fiber100g * factor).toFixed(1),
      };
    }));
    if (ingredientsError) {
      await supabase.from('recipes').delete().eq('id', recipe.id);
      showToast(`Ingredienti non salvati: ${ingredientsError.message}`, 'error');
      setSaving(false);
      return;
    }

    const favoriteValues = {
      name: recipeName.trim(),
      ingredients: ingredients.map(i => `${i.name} ${i.quantityG}g`).join(', '),
      notes: notes || null,
      quantity_g: 100,
      calories_kcal: per100.calories,
      protein_g: +per100.protein.toFixed(1),
      carbs_g: +per100.carbs.toFixed(1),
      fat_g: +per100.fat.toFixed(1),
      fiber_g: +per100.fiber.toFixed(1),
      calories_source: 'manual' as const,
    };
    const { data: existing } = await supabase.from('favorite_meals').select('id').eq('user_id', user.id).ilike('name', recipeName.trim()).limit(1).maybeSingle();
    if (existing) {
      await supabase.from('favorite_meals').update(favoriteValues).eq('id', existing.id);
    } else {
      await supabase.from('favorite_meals').insert({ user_id: user.id, ...favoriteValues, use_count: 0 });
    }

    showToast('Ricetta salvata e pronta da riutilizzare!', 'success');
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Modal isOpen title="Crea ricetta personale" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="label">Nome ricetta *</label>
          <input className="input-field" value={recipeName} onChange={e => setRecipeName(e.target.value)} placeholder="Es. La mia pasta al pomodoro" />
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-3">
          <label className="label">Aggiungi ingrediente</label>
          <div className="flex gap-2">
            <input className="input-field" value={ingredientQuery} onChange={e => setIngredientQuery(e.target.value)} placeholder="Es. pasta Barilla" />
            <input type="number" min="1" className="input-field w-24" value={ingredientQuantity} onChange={e => setIngredientQuantity(e.target.value)} aria-label="Grammi ingrediente" />
          </div>
          <button type="button" onClick={searchIngredient} disabled={searching || !ingredientQuery.trim()} className="btn-secondary w-full">
            {searching ? 'Cerco ingrediente...' : 'Cerca ingrediente'}
          </button>
          {results.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {results.map((food, index) => (
                <button key={`${food.name}-${index}`} type="button" onClick={() => addIngredient(food)} className="w-full text-left bg-white rounded-xl p-3 border border-amber-200">
                  <p className="text-sm font-semibold text-warm-gray-800">{food.name}</p>
                  <p className="text-xs text-warm-gray-500">{food.brand || 'Marca non indicata'} · {food.kcal100g} kcal/100g</p>
                </button>
              ))}
            </div>
          )}
          <details className="bg-white rounded-xl border border-amber-200 p-3">
            <summary className="text-sm font-medium text-amber-800 cursor-pointer">Ingrediente non trovato? Inseriscilo manualmente</summary>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <input type="number" min="0" className="input-field" placeholder="kcal per 100 g *" value={manualKcal} onChange={e => setManualKcal(e.target.value)} />
              <input type="number" min="0" step="0.1" className="input-field" placeholder="Proteine / 100 g" value={manualProtein} onChange={e => setManualProtein(e.target.value)} />
              <input type="number" min="0" step="0.1" className="input-field" placeholder="Carboidrati / 100 g" value={manualCarbs} onChange={e => setManualCarbs(e.target.value)} />
              <input type="number" min="0" step="0.1" className="input-field" placeholder="Grassi / 100 g" value={manualFat} onChange={e => setManualFat(e.target.value)} />
              <input type="number" min="0" step="0.1" className="input-field" placeholder="Fibre / 100 g" value={manualFiber} onChange={e => setManualFiber(e.target.value)} />
            </div>
            <button type="button" onClick={addManualIngredient} disabled={!ingredientQuery.trim() || !manualKcal} className="btn-secondary w-full mt-2">Aggiungi ingrediente manuale</button>
          </details>
        </div>

        <div>
          <label className="label">Ingredienti della ricetta</label>
          {ingredients.length === 0 ? (
            <p className="text-sm text-warm-gray-400 bg-warm-gray-50 rounded-xl p-3">Aggiungi almeno un ingrediente.</p>
          ) : ingredients.map((ingredient, index) => (
            <div key={`${ingredient.name}-${index}`} className="flex items-center gap-2 bg-warm-gray-50 rounded-xl p-3 mb-2">
              <div className="flex-1">
                <p className="text-sm font-medium text-warm-gray-800">{ingredient.name}</p>
                <p className="text-xs text-warm-gray-500">{ingredient.quantityG} g · {Math.round(ingredient.kcal100g * ingredient.quantityG / 100)} kcal</p>
              </div>
              <button type="button" onClick={() => setIngredients(prev => prev.filter((_, i) => i !== index))} className="p-2 text-red-500"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>

        {ingredients.length > 0 && (
          <div className="card-sm bg-sage-50 border-sage-200">
            <p className="font-semibold text-sage-800">Valori della ricetta</p>
            <p className="text-sm text-sage-700 mt-1">Totale: {Math.round(totals.calories)} kcal · dosi complessive {Math.round(finalWeight)} g</p>
            <p className="text-sm text-sage-700">Per 100 g: {per100.calories} kcal · P {per100.protein.toFixed(1)}g · C {per100.carbs.toFixed(1)}g · G {per100.fat.toFixed(1)}g · Fibre {per100.fiber.toFixed(1)}g</p>
            <p className="text-xs text-sage-700 mt-2">Quando mangerai questa ricetta, indica soltanto i grammi della porzione: calorie e nutrienti verranno calcolati automaticamente.</p>
          </div>
        )}

        <div>
          <label className="label">Note</label>
          <input className="input-field" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opzionale..." />
        </div>
        <button onClick={saveRecipe} disabled={saving || !recipeName.trim() || ingredients.length === 0} className="btn-primary w-full flex items-center justify-center gap-2">
          <Plus size={17} /> {saving ? 'Salvataggio...' : 'Salva ricetta'}
        </button>
      </div>
    </Modal>
  );
}

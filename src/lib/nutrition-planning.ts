import type { NutritionMenuDay, NutritionPlanView } from './jarvis-core';
import type { PlannedMeal } from './supabase';

export const NUTRITION_MEAL_TYPES = [
  'breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'night_snack',
] as const;

type NutritionMealType = typeof NUTRITION_MEAL_TYPES[number];

export interface OfficialMealSuggestion {
  plan_date: string;
  meal_type: NutritionMealType;
  name: string;
  ingredients: string;
  notes: string;
}

export interface ShoppingNeed {
  name: string;
  category: string;
  quantity: string | null;
}

const FOOD_CATALOG: Array<{ name: string; category: string; pattern: RegExp }> = [
  { name: 'fette biscottate', category: 'cereali', pattern: /fette biscottate/i },
  { name: 'fiocchi d’avena', category: 'cereali', pattern: /fiocchi d['’]avena|porridge/i },
  { name: 'farro soffiato', category: 'cereali', pattern: /farro soffiato/i },
  { name: 'cous cous', category: 'cereali', pattern: /cous cous/i },
  { name: 'riso basmati', category: 'cereali', pattern: /riso basmati/i },
  { name: 'pasta integrale', category: 'cereali', pattern: /pasta integrale/i },
  { name: 'orecchiette', category: 'cereali', pattern: /orecchiette/i },
  { name: 'gnocchi di patate', category: 'cereali', pattern: /gnocchi/i },
  { name: 'fette Wasa', category: 'cereali', pattern: /\bwasa\b/i },
  { name: 'gallette di mais', category: 'cereali', pattern: /gallette di mais/i },
  { name: 'grissini', category: 'cereali', pattern: /grissini/i },
  { name: 'patate', category: 'cereali', pattern: /\bpatate\b/i },
  { name: 'pane', category: 'cereali', pattern: /pane (?:tostato|fresco)|\bpane\b/i },
  { name: 'pasta', category: 'cereali', pattern: /\bpasta\b(?! integrale)/i },
  { name: 'ricotta light', category: 'latticini', pattern: /ricotta light/i },
  { name: 'fiocchi di latte', category: 'latticini', pattern: /fiocchi di latte/i },
  { name: 'yogurt greco bianco', category: 'latticini', pattern: /yogurt greco/i },
  { name: 'kefir bianco', category: 'latticini', pattern: /kefir/i },
  { name: 'latte parzialmente scremato', category: 'latticini', pattern: /latte parzialmente scremato/i },
  { name: 'grana', category: 'latticini', pattern: /\bgrana\b/i },
  { name: 'uova', category: 'proteine', pattern: /\buova\b|frittata/i },
  { name: 'petto di pollo', category: 'proteine', pattern: /\bpollo\b/i },
  { name: 'fesa di tacchino', category: 'proteine', pattern: /tacchino/i },
  { name: 'fagioli', category: 'proteine', pattern: /fagioli/i },
  { name: 'ceci', category: 'proteine', pattern: /\bceci\b/i },
  { name: 'piselli', category: 'proteine', pattern: /piselli/i },
  { name: 'gamberetti', category: 'proteine', pattern: /gamberetti/i },
  { name: 'filetto di branzino', category: 'proteine', pattern: /branzino/i },
  { name: 'merluzzo', category: 'proteine', pattern: /merluzzo/i },
  { name: 'shake banana-fragola', category: 'proteine', pattern: /shake banana-fragola/i },
  { name: 'mela', category: 'frutta', pattern: /\bmela\b/i },
  { name: 'pesca', category: 'frutta', pattern: /\bpesca\b/i },
  { name: 'mirtilli', category: 'frutta', pattern: /mirtilli/i },
  { name: 'melone', category: 'frutta', pattern: /melone/i },
  { name: 'fragole', category: 'frutta', pattern: /fragole/i },
  { name: 'kiwi', category: 'frutta', pattern: /\bkiwi\b/i },
  { name: 'albicocche', category: 'frutta', pattern: /albicocche/i },
  { name: 'anguria', category: 'frutta', pattern: /anguria/i },
  { name: 'peperoni', category: 'verdura', pattern: /peperoni/i },
  { name: 'insalata', category: 'verdura', pattern: /insalata|radicchio/i },
  { name: 'spinaci', category: 'verdura', pattern: /spinaci/i },
  { name: 'pomodori', category: 'verdura', pattern: /pomodor/i },
  { name: 'carote', category: 'verdura', pattern: /carote/i },
  { name: 'fagiolini', category: 'verdura', pattern: /fagiolini/i },
  { name: 'broccoli', category: 'verdura', pattern: /broccoli/i },
  { name: 'zucchine', category: 'verdura', pattern: /zucchine/i },
  { name: 'cetrioli', category: 'verdura', pattern: /cetrioli/i },
  { name: 'porri', category: 'verdura', pattern: /porri/i },
  { name: 'melanzane', category: 'verdura', pattern: /melanzane/i },
  { name: 'cavolo cappuccio', category: 'verdura', pattern: /cavolo cappuccio/i },
  { name: 'miele', category: 'dispensa', pattern: /miele/i },
  { name: 'marmellata light', category: 'dispensa', pattern: /marmellata light/i },
  { name: 'pesto', category: 'dispensa', pattern: /pesto/i },
  { name: 'olive', category: 'dispensa', pattern: /olive/i },
  { name: 'capperi', category: 'dispensa', pattern: /capperi/i },
  { name: 'erbe aromatiche', category: 'dispensa', pattern: /basilico|origano|timo|salvia/i },
  { name: 'limone', category: 'frutta', pattern: /limone/i },
];

export function weekdayKey(dateISO: string) {
  const keys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return keys[new Date(`${dateISO}T12:00:00`).getDay()];
}

export function officialSuggestionFor(plan: NutritionPlanView | null, dateISO: string, mealType: string) {
  return plan?.weekly_menu.days[weekdayKey(dateISO)]?.[mealType as keyof NutritionMenuDay] ?? null;
}

export function ingredientsForOfficialMeal(name: string, mealType: string) {
  if (/pasto libero/i.test(name)) return '';
  let ingredients = FOOD_CATALOG.filter(item => item.pattern.test(name)).map(item => item.name);
  if (/kefir.*\blatte\b|\blatte\b.*kefir/i.test(name)) {
    ingredients = ingredients.filter(item => !['kefir bianco', 'latte parzialmente scremato'].includes(item));
    ingredients.push('kefir bianco o latte parzialmente scremato');
  }
  if (/pancake/i.test(name)) ingredients.push('farina per pancake', 'albume o uova', 'miele o marmellata light');
  if (mealType === 'lunch' || mealType === 'dinner') {
    if (!/pesto|olive|avocado|olio/i.test(name)) ingredients.push('olio extravergine di oliva');
  }
  if (mealType === 'dinner' && !ingredients.some(item => /^(mela|pesca|mirtilli|melone|fragole|kiwi|albicocche|anguria|frutta fresca)/i.test(item))) {
    ingredients.push('frutta fresca di stagione');
  }
  return [...new Set(ingredients)].join(', ');
}

export function resolvedPlanningShifts(
  plan: NutritionPlanView | null,
  dates: string[],
  localShifts: Array<{ date: string; shift_type: string }> = [],
) {
  return dates.map(date => {
    const local = localShifts.find(shift => shift.date === date);
    return local ?? { date, shift_type: plan?.shift_schedule?.[date]?.type ?? 'rest' };
  });
}

export function buildOfficialMealSuggestions(
  plan: NutritionPlanView | null,
  dates: string[],
  existingMeals: Pick<PlannedMeal, 'plan_date' | 'meal_type'>[] = [],
  options: {
    fromDate?: string;
    shifts?: Array<{ date: string; shift_type: string }>;
  } = {},
) {
  if (!plan) return [];
  const occupied = new Set(existingMeals.map(meal => `${meal.plan_date}:${meal.meal_type}`));
  const suggestions: OfficialMealSuggestion[] = [];
  for (const date of dates) {
    if (options.fromDate && date < options.fromDate) continue;
    const shiftType = options.shifts?.find(shift => shift.date === date)?.shift_type;
    for (const mealType of NUTRITION_MEAL_TYPES) {
      const menuName = officialSuggestionFor(plan, date, mealType);
      if (!menuName || occupied.has(`${date}:${mealType}`)) continue;
      const canteenMeal = (shiftType === 'morning' && mealType === 'lunch')
        || (shiftType === 'afternoon' && mealType === 'dinner');
      const canteen = canteenMeal ? plan.meals[mealType]?.canteen ?? [] : [];
      const name = canteenMeal ? 'Pasto in mensa secondo il piano' : menuName;
      suggestions.push({
        plan_date: date,
        meal_type: mealType,
        name,
        ingredients: canteenMeal ? '' : ingredientsForOfficialMeal(name, mealType),
        notes: canteenMeal
          ? `Adattamento al turno: ${canteen.join(' · ') || plan.shift.rules[shiftType ?? ''] || 'mensa secondo il piano'}`
          : 'Suggerimento flessibile del piano alimentare ufficiale',
      });
    }
  }
  return suggestions;
}

export function shoppingNeedsFromMeals(meals: Array<Pick<PlannedMeal, 'name' | 'ingredients' | 'meal_type'>>) {
  const needs = new Map<string, { name: string; category: string; count: number; unresolved: boolean }>();
  for (const meal of meals) {
    const source = meal.ingredients?.trim() || ingredientsForOfficialMeal(meal.name, meal.meal_type);
    for (const raw of source.split(',').map(item => item.trim()).filter(Boolean)) {
      const key = normalize(raw);
      const current = needs.get(key);
      if (current) current.count += 1;
      else needs.set(key, {
        name: raw,
        category: shoppingCategory(raw),
        count: 1,
        unresolved: /\bo\b/i.test(raw),
      });
    }
  }
  return [...needs.values()].map<ShoppingNeed>(item => ({
    name: item.name,
    category: item.category,
    quantity: [item.unresolved ? 'scelta da confermare' : '', item.count > 1 ? `${item.count} pasti` : '']
      .filter(Boolean).join(' · ') || null,
  }));
}

export function shoppingCategory(name: string) {
  const catalogItem = FOOD_CATALOG.find(item => item.pattern.test(name));
  if (catalogItem) return catalogItem.category;
  const value = normalize(name);
  if (/farina|pane|pasta|riso|cereal|avena|farro|wasa|gallett|grissin|patat|gnocch/.test(value)) return 'cereali';
  if (/latte|yogurt|kefir|ricotta|formaggio|grana/.test(value)) return 'latticini';
  if (/olio|miele|marmellata|pesto|olive|capperi|aromatic/.test(value)) return 'dispensa';
  if (/frutta|mela|pera|banana|pesca|kiwi|melone|anguria|mirtill|fragol|albicocc|limone/.test(value)) return 'frutta';
  if (/verdura|insalata|pomodor|peperon|spinac|zucchin|broccol|carot|cetriol|melanzan|cavol|porri|fagiolin/.test(value)) return 'verdura';
  if (/pollo|tacchin|pesce|branzino|merluzz|gamber|uov|legum|ceci|fagiol|pisell|shake/.test(value)) return 'proteine';
  return 'altro';
}

function normalize(value: string) {
  return value.toLocaleLowerCase('it').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

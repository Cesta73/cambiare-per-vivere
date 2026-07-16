import { supabase } from './supabase';

const jarvisCoreUrl = import.meta.env.VITE_JARVIS_CORE_URL?.replace(/\/$/, '') || '';

export interface NutritionPlanRow {
  category: string;
  choose_one: string[];
}

export interface NutritionMealTemplate {
  label: string;
  rows: NutritionPlanRow[];
  choose_one_once_weekly?: string[];
  canteen?: string[];
}

export interface NutritionMenuDay {
  breakfast?: string;
  morning_snack?: string;
  lunch?: string;
  afternoon_snack?: string;
  dinner?: string;
  night_snack?: string;
}

export interface NutritionPlanView {
  plan: {
    id: string;
    issued_on: string;
    author: string;
    status: string;
    hierarchy: Array<{ document: string; role?: string }>;
  };
  date: string;
  weekday: string;
  daily: {
    water: string;
    drinks: string;
    fruit_vegetables: string;
    main_meal_structure: string[];
  };
  core_rules: string[];
  meals: Record<string, NutritionMealTemplate>;
  weekly_frequencies: Record<string, string>;
  weekly_menu: {
    is_example: boolean;
    days: Record<string, NutritionMenuDay>;
    today: NutritionMenuDay | null;
  };
  shift: {
    type: string | null;
    rule: string | null;
    rules: Record<string, string>;
  };
  shift_schedule?: Record<string, { type: string; label: string; rule: string | null }>;
  education: {
    eating_awareness: unknown;
    reflux: unknown;
    blood_pressure: unknown;
  };
  organization: {
    meal_prep: string[];
    shopping_principles: string[];
    shopping_categories: Record<string, string[]>;
  } | null;
  guardrails: unknown;
  known_source_tensions: Array<{ topic?: string; resolution?: string }>;
}

export interface JarvisCoreMessageResponse {
  ok: true;
  core: 'jarvis-3.0';
  release: {
    id: string;
    releasedAt: string | null;
    environment: string;
  };
  interface: string;
  conversationId: string;
  eventId: string | null;
  answer: string;
  auth: 'core_api_token' | 'supabase_user_session';
  duplicate?: boolean;
  processing?: boolean;
}

export function isJarvisCoreConfigured() {
  return Boolean(jarvisCoreUrl);
}

export async function sendJarvisCoreMessage(
  text: string,
  conversationId: string,
  messageId?: string,
): Promise<JarvisCoreMessageResponse> {
  if (!jarvisCoreUrl) {
    throw new Error('Jarvis Core non configurato.');
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);

  const accessToken = data.session?.access_token;
  if (!accessToken) {
    throw new Error('Sessione non disponibile.');
  }

  const response = await fetch(`${jarvisCoreUrl}/core/message`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      text,
      interface: 'cambiare-per-vivere',
      conversationId,
      messageId,
      receivedAt: new Date().toISOString(),
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) {
    throw new Error(coreErrorLabel(payload?.error, response.status));
  }

  return payload as JarvisCoreMessageResponse;
}

export async function getOfficialNutritionPlan(date: string, shiftType?: string | null): Promise<NutritionPlanView> {
  const accessToken = await getAccessToken();
  const search = new URLSearchParams({ date });
  if (shiftType) search.set('shift', shiftType);
  const response = await fetch(`${jarvisCoreUrl}/core/nutrition-plan?${search}`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok || !payload?.nutritionPlan) {
    throw new Error(coreErrorLabel(payload?.error, response.status));
  }
  return payload.nutritionPlan as NutritionPlanView;
}

export type PantryUnit = 'g' | 'ml' | 'pz';

export interface PantryLot {
  id: string;
  current_quantity: number;
  unit: PantryUnit;
  expires_on: string | null;
  storage_location: 'dispensa' | 'frigorifero' | 'freezer';
}

export interface PantryProduct {
  id: string;
  name: string;
  brand: string | null;
  barcode: string | null;
  category: string;
  default_unit: PantryUnit;
  minimum_quantity: number;
  total_quantity: number;
  is_low: boolean;
  next_expiry: string | null;
  expiry_status: 'none' | 'ok' | 'soon' | 'today' | 'expired';
  lots: PantryLot[];
}

export interface PantryShoppingItem {
  id: string;
  name: string;
  needed_quantity: number | null;
  unit: PantryUnit | null;
  status: string;
  reason: string | null;
}

export interface PantryRecipeIngredient {
  product_id: string | null;
  name: string;
  quantity: number;
  unit: PantryUnit;
  optional: boolean;
}

export interface PantryRecipe {
  id: string;
  name: string;
  base_servings: number;
  meal_types: string[];
  plan_compliant: boolean;
  preparation_minutes: number | null;
  ingredients: PantryRecipeIngredient[];
}

export interface PantrySnapshot {
  household: { id: string; name: string };
  member: { id: string; display_name: string; role: 'owner' | 'editor' | 'viewer' };
  members: Array<{ id: string; display_name: string; role: string }>;
  inventory: PantryProduct[];
  shopping: PantryShoppingItem[];
  recipes: PantryRecipe[];
  summary: { products: number; low_stock: number; expiring_soon: number; expired: number; shopping: number };
}

export interface BarcodeProduct {
  found: boolean;
  barcode: string;
  name?: string;
  brand?: string | null;
  category?: string;
  package_quantity?: number | null;
  unit?: PantryUnit;
  image_url?: string | null;
}

async function pantryRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const accessToken = await getAccessToken();
  const response = await fetch(`${jarvisCoreUrl}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${accessToken}`,
      ...(init?.body ? { 'content-type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) {
    const error = new Error(payload?.message || coreErrorLabel(payload?.error, response.status));
    (error as Error & { code?: string }).code = payload?.error;
    throw error;
  }
  return payload as T;
}

export async function getPantrySnapshot() {
  const payload = await pantryRequest<{ ok: true; pantry: PantrySnapshot }>('/core/pantry');
  return payload.pantry;
}

export async function addPantryStock(input: {
  productId?: string; name?: string; brand?: string; barcode?: string; category?: string;
  quantity: number; unit: PantryUnit; minimumQuantity?: number; storageLocation: string;
  expiresOn?: string; purchasedOn?: string; source?: 'manual' | 'barcode' | 'receipt'; notes?: string;
}) {
  return pantryRequest('/core/pantry/stock', { method: 'POST', body: JSON.stringify(input) });
}

export async function removePantryStock(product: PantryProduct, quantity: number, movementType = 'manual_remove') {
  return pantryRequest('/core/pantry/consume', {
    method: 'POST',
    body: JSON.stringify({
      items: [{ productId: product.id, quantity, unit: product.default_unit }],
      movementType,
      notes: 'Scarico da Cambusa Famiglia',
    }),
  });
}

export async function updatePantryShopping(input: Record<string, unknown>) {
  return pantryRequest('/core/pantry/shopping', { method: 'POST', body: JSON.stringify(input) });
}

export async function getPantryRecommendation(input: { text: string; mealType?: string; servings: number }) {
  const payload = await pantryRequest<{ ok: true; recommendation: { message: string; complete: boolean } }>('/core/pantry/recommend', {
    method: 'POST', body: JSON.stringify(input),
  });
  return payload.recommendation;
}

export async function consumePantryRecipe(recipeId: string, servings: number) {
  return pantryRequest('/core/pantry/consume-recipe', {
    method: 'POST', body: JSON.stringify({ recipeId, servings }),
  });
}

export async function createPantryInvite() {
  const payload = await pantryRequest<{ ok: true; invite: Array<{ code: string; expires_at: string }> | { code: string; expires_at: string } }>('/core/pantry/invite', { method: 'POST' });
  return Array.isArray(payload.invite) ? payload.invite[0] : payload.invite;
}

export async function lookupPantryBarcode(code: string) {
  const payload = await pantryRequest<{ ok: true; product: BarcodeProduct }>(`/core/pantry/barcode/${encodeURIComponent(code)}`);
  return payload.product;
}

async function getAccessToken() {
  if (!jarvisCoreUrl) throw new Error('Jarvis Core non configurato.');
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  const accessToken = data.session?.access_token;
  if (!accessToken) throw new Error('Sessione non disponibile.');
  return accessToken;
}

function coreErrorLabel(error: string | undefined, status: number) {
  if (error === 'unauthorized') return 'Accesso a Jarvis Core non autorizzato.';
  if (error === 'core_api_not_configured') return 'Jarvis Core non configurato in produzione.';
  if (error === 'missing_text') return 'Messaggio vuoto.';
  if (error === 'text_too_long') return 'Messaggio troppo lungo.';
  if (error === 'nutrition_plan_not_available') return 'Piano nutrizionale non disponibile.';
  return `Jarvis Core non disponibile (${status}).`;
}

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
}

export function isJarvisCoreConfigured() {
  return Boolean(jarvisCoreUrl);
}

export async function sendJarvisCoreMessage(text: string, conversationId: string): Promise<JarvisCoreMessageResponse> {
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

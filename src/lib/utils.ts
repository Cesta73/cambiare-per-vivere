import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export function formatDateLong(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}

export function todayISO(): string {
  return dateToISO(new Date());
}

export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

export function dateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export function getDayName(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('it-IT', { weekday: 'long' });
}

export function getDayNameShort(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('it-IT', { weekday: 'short' });
}

export const SHIFT_LABELS: Record<string, string> = {
  morning: 'Turno mattina',
  afternoon: 'Turno pomeriggio',
  night: 'Turno notte',
  rest: 'Riposo',
  custom: 'Personalizzato',
};

export const SHIFT_COLORS: Record<string, string> = {
  morning: 'bg-amber-100 text-amber-800',
  afternoon: 'bg-blue-100 text-blue-800',
  night: 'bg-slate-200 text-slate-800',
  rest: 'bg-green-100 text-green-800',
  custom: 'bg-purple-100 text-purple-800',
};

export const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'Colazione',
  morning_snack: 'Spuntino mattutino',
  lunch: 'Pranzo',
  afternoon_snack: 'Spuntino pomeridiano',
  dinner: 'Cena',
  night_snack: 'Spuntino notturno',
};

export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  walking: 'Camminata',
  aerobic: 'Attività aerobica',
  strength: 'Rinforzo muscolare',
  mobility: 'Mobilità',
  yoga: 'Yoga',
  daily: 'Attività quotidiana',
  other: 'Altra attività',
};

export const CATEGORY_LABELS: Record<string, string> = {
  frutta: 'Frutta',
  verdura: 'Verdura',
  proteine: 'Proteine',
  latticini: 'Latticini',
  cereali: 'Cereali e derivati',
  dispensa: 'Dispensa',
  surgelati: 'Surgelati',
  bevande: 'Bevande',
  altro: 'Altro',
};

export const CATEGORY_ORDER = ['frutta', 'verdura', 'proteine', 'latticini', 'cereali', 'dispensa', 'surgelati', 'bevande', 'altro'];

export const MOTIVATIONAL_PHRASES = [
  'Come il loto cresce dal fango, ogni difficoltà può nutrire il cammino.',
  'Il passo presente è l’unico passo che puoi davvero compiere.',
  'La costanza gentile vale più della perfezione.',
  'Prenderti cura del corpo è anche prenderti cura della mente.',
  'Osserva senza giudicare, poi scegli il prossimo piccolo passo.',
  'Anche il viaggio più lungo è fatto di passi presenti.',
  'La pazienza non è attesa passiva: è continuare con saggezza.',
  'Respira, ascolta, riprendi il cammino.',
  'La mente torna dove la conduci con gentilezza.',
  'Oggi coltiva una causa buona, senza pretendere subito il frutto.',
];

export function getTodayPhrase(): string {
  const idx = new Date().getDate() % MOTIVATIONAL_PHRASES.length;
  return MOTIVATIONAL_PHRASES[idx];
}

export function getGreeting(name: string | null): string {
  const hour = new Date().getHours();
  const nameStr = name ? `, ${name}` : '';
  if (hour < 12) return `Buongiorno${nameStr}!`;
  if (hour < 18) return `Buon pomeriggio${nameStr}!`;
  return `Buona sera${nameStr}!`;
}

export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function pluralize(n: number, singular: string, plural: string): string {
  return n === 1 ? singular : plural;
}

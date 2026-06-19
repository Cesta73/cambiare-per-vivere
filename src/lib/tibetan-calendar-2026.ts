export type TibetanCalendarDay = {
  date: string;
  tibetanMonth: number;
  tibetanDay: number;
  quality: 'favorable' | 'unfavorable' | 'very_unfavorable';
  observances?: string[];
  guidance?: string;
};

const juneDays = [16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,1,3,4,5,6,7,8,9,10,11,12,13,14,15,16];
const juneQuality = ['f','u','f','u','f','f','u','f','f','f','u','u','u','f','f','f','f','f','v','f','f','u','f','u','f','f','u','u','f','u'];
const julyDays = [17,17,18,19,20,21,22,23,24,26,27,28,29,30,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17];
const julyQuality = ['f','u','f','f','u','f','f','f','u','u','u','u','u','u','u','v','v','u','f','u','f','u','f','u','f','u','f','u','f','u','f'];

const special: Record<string, Pick<TibetanCalendarDay, 'observances' | 'guidance'>> = {
  '2026-06-10': { observances: ['Tsog, giorno tibetano 25'], guidance: 'Pratica e offerte secondo la propria tradizione.' },
  '2026-06-14': { observances: ['Puja dei protettori', 'Sojong'], guidance: 'Giornata adatta a protezione, confessione e purificazione.' },
  '2026-06-15': { observances: ['Precetti Mahayana, giorno tibetano 30'], guidance: 'Pratica semplice, intenzione chiara e azioni benefiche.' },
  '2026-06-19': { observances: ['Giorno molto sfavorevole nel calendario astrologico'], guidance: 'Evita nuovi inizi non necessari; privilegia continuità, prudenza e pratica interiore.' },
  '2026-06-22': { observances: ['Tara Puja', 'Medicine Buddha', 'Precetti Mahayana'], guidance: 'Giornata di pratica; le indicazioni non sostituiscono consigli sanitari.' },
  '2026-06-24': { observances: ['Guru Rinpoche', 'Tsog, giorno tibetano 10'], guidance: 'Ricorda il maestro e dedica la pratica al beneficio degli esseri.' },
  '2026-06-29': { observances: ['Sojong', 'Medicine Buddha', 'Precetti Mahayana'], guidance: 'Riflessione, purificazione e dedica dei meriti.' },
  '2026-07-06': { observances: ['91° compleanno di Sua Santità il Dalai Lama'], guidance: 'Coltiva compassione, responsabilità e buon cuore.' },
  '2026-07-13': { observances: ['Puja dei protettori', 'Sojong'], guidance: 'Protezione, confessione e revisione delle intenzioni.' },
  '2026-07-14': { observances: ['Precetti Mahayana, giorno tibetano 30'], guidance: 'Concludi il mese con sobrietà e consapevolezza.' },
  '2026-07-18': { observances: ['Chökhor Düchen — prima ruota del Dharma', 'Precetti Mahayana'], guidance: 'Giorno del Buddha: ascolto, pratica, generosità e dedica.' },
  '2026-07-22': { observances: ['Tara Puja', 'Medicine Buddha', 'Precetti Mahayana'], guidance: 'Pratica di compassione e rimozione degli ostacoli.' },
  '2026-07-24': { observances: ['Tsog, giorno tibetano 10'], guidance: 'Offerte e pratica secondo la propria trasmissione.' },
  '2026-07-28': { observances: ['Sojong'], guidance: 'Confessione, purificazione e ripartenza gentile.' },
  '2026-07-29': { observances: ['Medicine Buddha', 'Precetti Mahayana', 'Anniversario di Gampopa'], guidance: 'Pratica, studio e dedica dei meriti.' },
};

function quality(code: string): TibetanCalendarDay['quality'] {
  return code === 'v' ? 'very_unfavorable' : code === 'u' ? 'unfavorable' : 'favorable';
}

function buildMonth(month: number, days: number[], qualities: string[], firstTibetanMonth: number, changeDay: number) {
  return days.map((tibetanDay, index): TibetanCalendarDay => {
    const day = index + 1;
    const date = `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return {
      date,
      tibetanMonth: day >= changeDay ? firstTibetanMonth + 1 : firstTibetanMonth,
      tibetanDay,
      quality: quality(qualities[index]),
      ...special[date],
    };
  });
}

export const TIBETAN_CALENDAR_2026: TibetanCalendarDay[] = [
  ...buildMonth(6, juneDays, juneQuality, 4, 16),
  ...buildMonth(7, julyDays, julyQuality, 5, 15),
];

export const TIBETAN_CALENDAR_VERIFIED_THROUGH = '2026-07-31';
export const TIBETAN_CALENDAR_SOURCE = 'https://fpmt.org/media/resources/dharma-dates/';

export function getTibetanCalendarDay(date: string): TibetanCalendarDay | null {
  return TIBETAN_CALENDAR_2026.find(day => day.date === date) ?? null;
}

export function getUpcomingTibetanObservances(date: string, limit = 6): TibetanCalendarDay[] {
  return TIBETAN_CALENDAR_2026.filter(day => day.date >= date && day.observances?.length).slice(0, limit);
}

export function qualityLabel(value: TibetanCalendarDay['quality']): string {
  if (value === 'very_unfavorable') return 'molto sfavorevole';
  if (value === 'unfavorable') return 'sfavorevole';
  return 'favorevole';
}

import { ArrowLeft, CalendarDays, ExternalLink } from 'lucide-react';
import {
  getMoonAge,
  getMoonPhaseKey,
  MOON_PHASE_NAMES,
  MOON_PHASE_ICONS,
  EIGHT_PRECEPTS,
  getNextMoonMilestones,
} from '../../lib/contemplative-data';
import { todayISO, formatDateLong } from '../../lib/utils';
import {
  getTibetanCalendarDay,
  getUpcomingTibetanObservances,
  qualityLabel,
  TIBETAN_CALENDAR_SOURCE,
  TIBETAN_CALENDAR_VERIFIED_THROUGH,
} from '../../lib/tibetan-calendar-2026';

interface Props { onBack: () => void; }

const FAVORABLE_PHASES = ['new', 'full', 'first', 'last'] as const;
type FavorablePhase = typeof FAVORABLE_PHASES[number];

const PHASE_DESCRIPTIONS: Record<string, string> = {
  new: 'La luna nuova è considerata un momento favorevole per nuovi inizi, intenzioni e pratiche di purificazione.',
  full: 'La luna piena è tradizionalmente associata alle pratiche di dedica dei meriti e alle puja più importanti.',
  first: 'Il primo quarto è un momento di crescita e di consolidamento della pratica.',
  last: 'L\'ultimo quarto invita alla riflessione, al rilascio e alla gratitudine.',
  waxing: 'Luna crescente — buon momento per pratiche accumulative.',
  gibbousWax: 'Gibbosa crescente — energia in aumento verso la luna piena.',
  waning: 'Luna calante — momento favorevole per lasciar andare abitudini non utili.',
  gibbousWane: 'Gibbosa calante — fase di integrazione e consolidamento.',
};

export function MoonPage({ onBack }: Props) {
  const age = getMoonAge();
  const phaseKey = getMoonPhaseKey(age);
  const phaseName = MOON_PHASE_NAMES[phaseKey];
  const phaseIcon = MOON_PHASE_ICONS[phaseKey];
  const milestones = getNextMoonMilestones();
  const isFavorable = FAVORABLE_PHASES.includes(phaseKey as FavorablePhase);
  const today = todayISO();
  const tibetanToday = getTibetanCalendarDay(today);
  const upcoming = getUpcomingTibetanObservances(today);

  const illumination = Math.round(
    age < 14.76
      ? (age / 14.76) * 100
      : ((29.53 - age) / 14.76) * 100
  );

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-warm-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-warm-gray-700" />
        </button>
        <h1 className="section-title flex-1">Calendario Lunare</h1>
      </div>

      {/* Disclaimer */}
      <div className="bg-warm-gray-50 border border-warm-gray-200 rounded-xl px-4 py-3 text-xs text-warm-gray-500 leading-relaxed">
        Il giorno tibetano e le ricorrenze provengono dal calendario FPMT basato sul Men-Tsee-Khang. Le fasi lunari sottostanti sono stime astronomiche separate. Nessuna indicazione ha valore medico.
      </div>

      {tibetanToday && (
        <div className="card border-amber-200 bg-amber-50">
          <div className="flex items-start gap-3">
            <CalendarDays size={22} className="text-amber-700 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Oggi nel calendario tibetano</p>
              <h2 className="font-bold text-warm-gray-800 mt-1">Mese {tibetanToday.tibetanMonth}, giorno {tibetanToday.tibetanDay}</h2>
              <p className="text-sm text-warm-gray-600 mt-1">Qualità astrologica: {qualityLabel(tibetanToday.quality)}</p>
              {tibetanToday.observances?.map(item => <p key={item} className="text-sm font-medium text-amber-900 mt-2">{item}</p>)}
              {tibetanToday.guidance && <p className="text-xs text-amber-700 mt-2">{tibetanToday.guidance}</p>}
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="font-semibold text-warm-gray-800 mb-3">Prossime ricorrenze verificate</h2>
        {upcoming.length ? (
          <div className="space-y-3">
            {upcoming.map(day => (
              <div key={day.date} className="border-b border-warm-gray-100 last:border-0 pb-3 last:pb-0">
                <p className="text-sm font-semibold text-warm-gray-800 capitalize">{formatDateLong(day.date)}</p>
                <p className="text-xs text-warm-gray-500">Mese {day.tibetanMonth}, giorno {day.tibetanDay}</p>
                <p className="text-sm text-sage-700 mt-1">{day.observances?.join(' · ')}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-warm-gray-500">Nessuna ricorrenza pubblicata nel periodo verificato.</p>
        )}
        <div className="mt-4 pt-3 border-t border-warm-gray-100 text-xs text-warm-gray-500">
          <p>Verificato fino al {TIBETAN_CALENDAR_VERIFIED_THROUGH.split('-').reverse().join('/')}.</p>
          <a href={TIBETAN_CALENDAR_SOURCE} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sage-700 mt-1">
            Fonte FPMT <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Current moon */}
      <div className="card text-center py-8">
        <div className="text-7xl mb-4">{phaseIcon}</div>
        <p className="text-xs font-semibold uppercase tracking-wide text-warm-gray-400 mb-1">Fase astronomica stimata</p>
        <h2 className="text-xl font-bold text-warm-gray-800">{phaseName}</h2>
        <p className="text-sm text-warm-gray-500 mt-1">
          Giorno {Math.floor(age)} del ciclo · Illuminazione ~{illumination}%
        </p>
        {isFavorable && (
          <span className="inline-block mt-3 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
            Giorno favorevole per la pratica
          </span>
        )}
      </div>

      {/* Phase description */}
      <div className="card">
        <p className="text-sm text-warm-gray-600 leading-relaxed">
          {PHASE_DESCRIPTIONS[phaseKey]}
        </p>
      </div>

      {/* Next milestones */}
      <div className="card">
        <h2 className="font-semibold text-warm-gray-800 mb-3">Prossime fasi principali</h2>
        <div className="space-y-3">
          {milestones.map(m => (
            <div key={m.key} className="flex items-center gap-3">
              <span className="text-2xl">{m.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-warm-gray-800">{m.name}</p>
                <p className="text-xs text-warm-gray-400">
                  {m.daysTo < 1
                    ? 'Oggi o domani'
                    : `Tra circa ${Math.round(m.daysTo)} giorni`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Eight precepts — shown on favorable days */}
      {isFavorable && (
        <div className="card border-amber-200 bg-amber-50">
          <h2 className="font-semibold text-amber-800 mb-1">Gli Otto Precetti</h2>
          <p className="text-xs text-amber-600 mb-3 leading-relaxed">
            Nelle giornate di luna nuova, piena e quarti, alcuni praticanti scelgono di osservare gli otto precetti come gesto volontario di impegno spirituale.
          </p>
          <ol className="space-y-1">
            {EIGHT_PRECEPTS.map((p, i) => (
              <li key={i} className="flex gap-2 text-xs text-amber-700">
                <span className="font-bold flex-shrink-0">{i + 1}.</span>
                <span>{p}</span>
              </li>
            ))}
          </ol>
          <p className="text-xs text-amber-500 mt-3 italic">
            L'osservanza è sempre volontaria e personale. Non è richiesta per nessuna pratica dell'app.
          </p>
        </div>
      )}

      {/* Full month visual */}
      <div className="card">
        <h2 className="font-semibold text-warm-gray-800 mb-3">Ciclo del mese lunare</h2>
        <div className="grid grid-cols-8 gap-1">
          {Array.from({ length: 30 }, (_, i) => {
            const dayAge = i + 0.5;
            const key = getMoonPhaseKey(dayAge);
            const icon = MOON_PHASE_ICONS[key];
            const isCurrent = Math.floor(age) === i;
            return (
              <div
                key={i}
                className={`flex flex-col items-center rounded-lg p-1 ${isCurrent ? 'bg-petrol-100 ring-1 ring-petrol-400' : ''}`}
              >
                <span className="text-base">{icon}</span>
                <span className="text-[9px] text-warm-gray-400">{i + 1}</span>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-warm-gray-400 mt-2 text-center">
          Il giorno evidenziato è oggi (giorno {Math.floor(age) + 1} del ciclo)
        </p>
      </div>
    </div>
  );
}

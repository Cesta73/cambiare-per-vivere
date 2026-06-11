// All practice and course data migrated from "Il Sentiero del Dharma" HTML

export interface MantraData {
  pronunciation: string;
  meaning: string;
  pattern: { inhale: number; hold: number; exhale: number };
  instructions: { inhale: string; hold: string; exhale: string };
}

export interface PracticeStep {
  title: string;
  text?: string;
  mantra?: string;
  reps?: number;
}

export interface PracticeTemplate {
  key: string;
  name: string;
  nameLaica?: string;
  durationLabel: string;
  steps: PracticeStep[];
  mode: 'both' | 'secular' | 'spiritual';
  description?: string;
}

export interface CourseModule {
  key: string;
  title: string;
  summary: string;
  content: string;
  externalLinks?: { url: string; label: string; domain: string }[];
}

export interface CourseLevel {
  key: string;
  title: string;
  modules: CourseModule[];
}

export const MANTRA_DB: Record<string, MantraData> = {
  "OM AH HUNG": {
    pattern: { inhale: 4, hold: 2, exhale: 4 },
    instructions: {
      inhale: "Inspira luce bianca dalla sommità del capo (OM).",
      hold: "Trattieni, luce rossa alla gola (AH).",
      exhale: "Espira luce blu dal cuore (HUNG).",
    },
    pronunciation: "om ah hung",
    meaning: "Purifica corpo, parola e mente.",
  },
  "OM MANI PEME HUNG": {
    pattern: { inhale: 4, hold: 1, exhale: 5 },
    instructions: {
      inhale: "Inspira compassione.",
      hold: "Senti il cuore aprirsi.",
      exhale: "Espira amore verso tutti.",
    },
    pronunciation: "om ma-ni pe-me hung",
    meaning: "Compassione universale di Avalokiteshvara (Chenrezig).",
  },
  "NAMO GURU BYE NAMO BUDDHAYA NAMO DHARMAYA NAMO SANGHAYA": {
    pattern: { inhale: 5, hold: 1, exhale: 6 },
    instructions: {
      inhale: "Inspira fiducia.",
      hold: "Riconosci l'intenzione.",
      exhale: "Espira devozione.",
    },
    pronunciation: "nah-moh goo-roo bye, nah-moh bood-dah-yah, nah-moh dhar-mah-yah, nah-moh san-ghah-yah",
    meaning: "Rifugio nel Guru, nel Buddha, nel Dharma e nel Sangha.",
  },
  "OM BODHICITTA HUNG": {
    pattern: { inhale: 4, hold: 2, exhale: 4 },
    instructions: {
      inhale: "Inspira determinazione.",
      hold: "Il cuore si espande.",
      exhale: "Espira la promessa.",
    },
    pronunciation: "om bo-dhi-chit-ta hung",
    meaning: "Risveglia la mente compassionevole per il beneficio di tutti gli esseri.",
  },
  "EH YAM RAM LAM BAM HO SHUDDHE SHUDDHE SOHA": {
    pattern: { inhale: 4, hold: 1, exhale: 5 },
    instructions: {
      inhale: "Inspira energia pura.",
      hold: "Armonizza i cinque elementi.",
      exhale: "Espira le impurità.",
    },
    pronunciation: "e yam ram lam bam ho sciud-de sciud-de so-ha",
    meaning: "Purificazione dei cinque elementi: spazio, aria, fuoco, terra, acqua.",
  },
};

const DEFAULT_PATTERN = { inhale: 3, hold: 1, exhale: 3 };

export function getMantraPattern(mantraKey?: string) {
  if (!mantraKey || !MANTRA_DB[mantraKey]) return DEFAULT_PATTERN;
  return MANTRA_DB[mantraKey].pattern;
}

export function getStepDurationSec(step: PracticeStep): number {
  if (!step.mantra || !step.reps) return 10;
  const p = getMantraPattern(step.mantra);
  return step.reps * (p.inhale + p.hold + p.exhale);
}

export function getPracticeTotalSec(steps: PracticeStep[]): number {
  return steps.reduce((sum, s) => sum + getStepDurationSec(s), 0);
}

export const PRACTICE_TEMPLATES: PracticeTemplate[] = [
  {
    key: 'morningFull',
    name: 'Mattina Tradizionale',
    nameLaica: 'Mattina — Presenza',
    durationLabel: '~10 min',
    mode: 'both',
    description: 'Pratica completa del mattino per iniziare la giornata con intenzione e presenza.',
    steps: [
      {
        title: 'Rifugio / Intenzione',
        text: 'Prendi rifugio nei Tre Gioielli. Porta la tua intenzione per la giornata.\nRicorda: respira naturalmente. Salta qualsiasi passaggio che provochi disagio.',
        mantra: 'NAMO GURU BYE NAMO BUDDHAYA NAMO DHARMAYA NAMO SANGHAYA',
        reps: 3,
      },
      {
        title: 'Bodhicitta / Apertura',
        text: 'Risveglia la mente compassionevole. Senti il cuore espandersi verso tutti gli esseri.',
        mantra: 'OM BODHICITTA HUNG',
        reps: 3,
      },
      {
        title: 'Mantra del Cuore',
        text: 'Apri il cuore alla compassione universale.',
        mantra: 'OM MANI PEME HUNG',
        reps: 21,
      },
      {
        title: 'Dedica',
        text: 'Dedica il merito di questa pratica: "Per il bene di tutti gli esseri, che la mia pratica porti pace, chiarezza e cura. Possano diminuire confusione, paura e sofferenza. Possano aumentare compassione, salute e gioia, per me e per tutti."',
      },
    ],
  },
  {
    key: 'morningRapid',
    name: 'Mattina Veloce',
    nameLaica: 'Pausa mattino (5 min)',
    durationLabel: '~5 min',
    mode: 'both',
    description: 'Versione breve per mattine con poco tempo.',
    steps: [
      {
        title: 'Intenzione',
        text: 'Un respiro, una presenza.',
        mantra: 'NAMO GURU BYE NAMO BUDDHAYA NAMO DHARMAYA NAMO SANGHAYA',
        reps: 1,
      },
      {
        title: 'Apertura',
        mantra: 'OM BODHICITTA HUNG',
        reps: 1,
      },
      {
        title: 'Mantra del Cuore',
        mantra: 'OM MANI PEME HUNG',
        reps: 7,
      },
      {
        title: 'Dedica',
        text: 'Possa ogni mio gesto oggi essere benefico per me e per tutti.',
      },
    ],
  },
  {
    key: 'eveningFull',
    name: 'Sera Tradizionale',
    nameLaica: 'Sera — Rilascio',
    durationLabel: '~10 min',
    mode: 'both',
    description: 'Pratica serale per rilasciare le tensioni della giornata.',
    steps: [
      {
        title: 'Scarico',
        text: 'Lascia andare le tensioni del giorno. Purifica corpo, parola e mente.',
        mantra: 'OM AH HUNG',
        reps: 7,
      },
      {
        title: 'Purificazione degli elementi',
        text: 'Armonizza i cinque elementi interiori.',
        mantra: 'EH YAM RAM LAM BAM HO SHUDDHE SHUDDHE SOHA',
        reps: 5,
      },
      {
        title: 'Mantra del Cuore',
        text: 'Compassione che guarisce la giornata.',
        mantra: 'OM MANI PEME HUNG',
        reps: 21,
      },
      {
        title: 'Dedica',
        text: 'Che questa notte sia riposante e che tutti gli esseri possano trovare pace.',
      },
    ],
  },
  {
    key: 'eveningRapid',
    name: 'Sera Veloce',
    nameLaica: 'Rilascio serale (5 min)',
    durationLabel: '~5 min',
    mode: 'both',
    description: 'Pratica rapida per chiudere la giornata.',
    steps: [
      { title: 'Scarico', mantra: 'OM AH HUNG', reps: 3 },
      { title: 'Purificazione elementi', mantra: 'EH YAM RAM LAM BAM HO SHUDDHE SHUDDHE SOHA', reps: 2 },
      { title: 'Mantra del Cuore', mantra: 'OM MANI PEME HUNG', reps: 7 },
      { title: 'Dedica', text: 'Possa io e tutti gli esseri riposare in pace.' },
    ],
  },
  {
    key: 'emergency1',
    name: 'Scarico rapido — 1 minuto',
    nameLaica: 'Pausa di 1 minuto',
    durationLabel: '~1 min',
    mode: 'both',
    description: 'Una breve pausa per ritrovare il centro in un momento difficile.',
    steps: [
      {
        title: 'Tre respiri',
        text: 'Tre respiri profondi. Inspira raccogliendo, espira lasciando andare.',
        mantra: 'OM AH HUNG',
        reps: 3,
      },
      {
        title: 'Dedica',
        text: 'Che questa pausa porti chiarezza e centratura.',
      },
    ],
  },
  {
    key: 'emergency2',
    name: 'Ritorno al cuore — 2 minuti',
    nameLaica: 'Ritorno alla presenza',
    durationLabel: '~2 min',
    mode: 'both',
    description: 'Due minuti per riaprire il cuore e ritrovare la presenza.',
    steps: [
      {
        title: 'Rifugio / Presenza',
        text: 'Un respiro per tornare qui.',
        mantra: 'NAMO GURU BYE NAMO BUDDHAYA NAMO DHARMAYA NAMO SANGHAYA',
        reps: 1,
      },
      {
        title: 'Apertura del cuore',
        text: 'Sette ripetizioni per riaprire il cuore.',
        mantra: 'OM MANI PEME HUNG',
        reps: 7,
      },
      {
        title: 'Dedica',
        text: 'Che questa breve pratica mi riporti alla presenza amorevole.',
      },
    ],
  },
];

// Secular-only variants (no mantra, just breathing and reflection)
export const SECULAR_STEP_OVERRIDES: Record<string, Partial<PracticeStep>> = {
  'Rifugio / Intenzione': { title: 'Intenzione del mattino', text: 'Porta l\'attenzione al respiro naturale. Qual è la tua intenzione per oggi?', mantra: undefined, reps: 0 },
  'Bodhicitta / Apertura': { title: 'Apertura', text: 'Senti il cuore aprirsi. Lascia spazio a gentilezza e cura di sé.', mantra: undefined, reps: 0 },
  'Mantra del Cuore': { title: 'Respiro consapevole', text: 'Respira naturalmente. Inspira raccogliendo, espira rilasciando.', mantra: undefined, reps: 0 },
  'Scarico': { title: 'Rilascio', text: 'Con ogni espirazione, lascia andare la tensione del giorno.', mantra: undefined, reps: 0 },
  'Purificazione degli elementi': { title: 'Presenza', text: 'Osserva il respiro. Senti il corpo. Sii presente.', mantra: undefined, reps: 0 },
  'Purificazione elementi': { title: 'Presenza', text: 'Osserva il respiro. Senti il corpo. Sii presente.', mantra: undefined, reps: 0 },
  'Tre respiri': { title: 'Tre respiri consapevoli', text: 'Inspira per 4 secondi, espira per 6. Tre volte.', mantra: undefined, reps: 0 },
  'Rifugio / Presenza': { title: 'Torna qui', text: 'Un respiro per tornare al momento presente.', mantra: undefined, reps: 0 },
  'Apertura del cuore': { title: 'Presenza amorevole', text: 'Porta gentilezza verso te stesso. Respira.', mantra: undefined, reps: 0 },
};

export function getStepsForMode(template: PracticeTemplate, mode: 'secular' | 'spiritual'): PracticeStep[] {
  if (mode === 'spiritual') return template.steps;
  return template.steps.map(step => {
    const override = SECULAR_STEP_OVERRIDES[step.title];
    if (override) return { ...step, ...override };
    return step;
  });
}

// Moon phase calculation (from HTML)
export function getMoonAge(): number {
  const synodicMonth = 29.530588853;
  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14, 0);
  const days = (Date.now() - knownNewMoon) / 86400000;
  return ((days % synodicMonth) + synodicMonth) % synodicMonth;
}

export type MoonPhaseKey = 'new' | 'first' | 'full' | 'last' | 'waxing' | 'gibbousWax' | 'waning' | 'gibbousWane';

export function getMoonPhaseKey(age: number): MoonPhaseKey {
  if (age < 1.2 || age >= 28.33) return 'new';
  if (age < 5.54) return 'waxing';
  if (age >= 6.8 && age < 8.2) return 'first';
  if (age < 9.23) return 'waxing';
  if (age < 12.92) return 'gibbousWax';
  if (age >= 13.6 && age < 16) return 'full';
  if (age < 20.30) return 'gibbousWane';
  if (age >= 21 && age < 23) return 'last';
  return 'waning';
}

export const MOON_PHASE_NAMES: Record<MoonPhaseKey, string> = {
  new: 'Luna nuova',
  first: 'Primo quarto',
  full: 'Luna piena',
  last: 'Ultimo quarto',
  waxing: 'Luna crescente',
  gibbousWax: 'Gibbosa crescente',
  waning: 'Luna calante',
  gibbousWane: 'Gibbosa calante',
};

export const MOON_PHASE_ICONS: Record<MoonPhaseKey, string> = {
  new: '🌑', first: '🌓', full: '🌕', last: '🌗',
  waxing: '🌒', gibbousWax: '🌔', waning: '🌘', gibbousWane: '🌖',
};

export const EIGHT_PRECEPTS = [
  'Non uccidere alcun essere vivente',
  'Non rubare',
  'Osservare la castità completa',
  'Non mentire',
  'Non assumere intossicanti',
  'Non mangiare dopo mezzogiorno',
  'Non sedersi su sedie o letti alti o lussuosi',
  'Non usare ornamenti, profumi, musica o spettacoli',
];

export function getNextMoonMilestones() {
  const synodicMonth = 29.530588853;
  const age = getMoonAge();
  const targets = [
    { key: 'new' as MoonPhaseKey, name: 'Luna nuova', icon: '🌑', daysTo: (28.33 - age + synodicMonth) % synodicMonth },
    { key: 'first' as MoonPhaseKey, name: 'Primo quarto', icon: '🌓', daysTo: (7.38 - age + synodicMonth) % synodicMonth },
    { key: 'full' as MoonPhaseKey, name: 'Luna piena', icon: '🌕', daysTo: (14.76 - age + synodicMonth) % synodicMonth },
    { key: 'last' as MoonPhaseKey, name: 'Ultimo quarto', icon: '🌗', daysTo: (22.14 - age + synodicMonth) % synodicMonth },
  ];
  return targets.filter(t => t.daysTo > 0.5).sort((a, b) => a.daysTo - b.daysTo).slice(0, 3);
}

// Full course data from HTML
export const COURSE_DATA: CourseLevel[] = [
  {
    key: 'level1',
    title: '🌱 Livello 1 — Principiante',
    modules: [
      {
        key: 'mod_1_1',
        title: 'Modulo 1.1 – Chi era il Buddha? Storia e Contesto',
        summary: 'Vita di Siddharta Gautama, le quattro uscite, l\'illuminazione.',
        content: `<p><strong>Siddharta Gautama</strong> nacque intorno al 563 a.C. a Lumbini (nell'attuale Nepal) come principe del clan Shakya. A 29 anni, dopo aver visto quattro incontri rivelatori (un anziano, un malato, un morto e un asceta), lasciò il palazzo e la famiglia per cercare la liberazione dalla sofferenza. Dopo anni di ascetismo estremo, trovò la Via di Mezzo e raggiunse l'Illuminazione (Bodhi) a Bodh Gaya, sotto l'albero della Bodhi, all'età di circa 35 anni. Divenne così il <strong>Buddha Shakyamuni</strong> – il 'Risvegliato del clan Shakya'.</p>
        <p><strong>Concetti chiave:</strong></p>
        <ul>
          <li><strong>Samsara</strong>: il ciclo di morti e rinascite, condizionato dall'ignoranza e dal karma</li>
          <li><strong>Nirvana</strong>: la liberazione dal Samsara, fine della sofferenza</li>
          <li><strong>Dharma</strong>: gli insegnamenti del Buddha, la Verità</li>
          <li><strong>Sangha</strong>: la comunità dei praticanti</li>
          <li><strong>Le Tre Gioielli (Triratna)</strong>: Buddha, Dharma, Sangha – i tre rifugi fondamentali</li>
        </ul>`,
        externalLinks: [{ url: 'https://www.youtube.com/watch?v=qxm88FMg33k', label: "L'inizio degli insegnamenti (Lama Michel)", domain: 'youtube.com' }],
      },
      {
        key: 'mod_1_2',
        title: 'Modulo 1.2 – Le Quattro Nobili Verità',
        summary: 'Dukkha, Samudaya, Nirodha, Magga. L\'Ottuplice Sentiero.',
        content: `<p>Le Quattro Nobili Verità sono il primo insegnamento del Buddha dopo l'Illuminazione, esposto nel Parco dei Cervi a Sarnath. Costituiscono la base di tutte le scuole buddhiste.</p>
        <ol>
          <li><strong>DUKKHA</strong> – La Verità della Sofferenza: L'esistenza samsarica è intrinsecamente insoddisfacente.</li>
          <li><strong>SAMUDAYA</strong> – La Verità dell'Origine: La radice è l'ignoranza (avidya), che genera attaccamento, avversione e illusione.</li>
          <li><strong>NIRODHA</strong> – La Verità della Cessazione: È possibile eliminare la sofferenza completamente.</li>
          <li><strong>MAGGA</strong> – La Verità del Sentiero: L'Ottuplice Nobile Sentiero porta alla liberazione.</li>
        </ol>
        <p><strong>L'Ottuplice Nobile Sentiero:</strong></p>
        <ul>
          <li>Saggezza: Retta Visione, Retto Pensiero</li>
          <li>Etica: Retta Parola, Retta Azione, Retti Mezzi di Sussistenza</li>
          <li>Concentrazione: Retto Sforzo, Retta Attenzione, Retta Concentrazione</li>
        </ul>`,
        externalLinks: [{ url: 'https://kunpen.ngalso.org/wp-content/uploads/2016/01/4-nobili-verita.pdf', label: 'Le Quattro Nobili Verità (PDF Kunpen)', domain: 'kunpen.ngalso.org' }],
      },
      {
        key: 'mod_1_3',
        title: 'Modulo 1.3 – Le Tre Caratteristiche dell\'Esistenza',
        summary: 'Anicca (impermanenza), Dukkha (sofferenza), Anatta (non-sé).',
        content: `<p>Tutti i fenomeni condizionati hanno tre caratteristiche fondamentali:</p>
        <ul>
          <li><strong>ANICCA – Impermanenza</strong>: Tutto è soggetto al cambiamento e alla dissoluzione.</li>
          <li><strong>DUKKHA – Insoddisfazione</strong>: Anche le esperienze piacevoli portano sofferenza perché finiscono.</li>
          <li><strong>ANATTA – Non-Sé</strong>: Non esiste un "io" fisso e permanente. Quello che chiamiamo "io" è un aggregato temporaneo di cinque skandha: rupa (forma), vedana (sensazioni), samjna (percezioni), samskara (fattori mentali), vijnana (coscienza).</li>
        </ul>`,
      },
      {
        key: 'mod_1_4',
        title: 'Modulo 1.4 – Karma e Rinascita',
        summary: 'Legge di causa-effetto, i sei regni, la preziosa vita umana.',
        content: `<p><strong>KARMA</strong> (azione): Il principio di causa ed effetto che governa le rinascite nel Samsara. Ogni azione intenzionale lascia un'impronta nella coscienza che matura in risultati futuri.</p>
        <p><strong>I Sei Regni del Samsara:</strong> Deva, Semidei, Essere Umano (regni superiori); Animale, Preta (spiriti affamati), Naraka (inferni) (regni inferiori).</p>
        <p>La <strong>preziosa vita umana</strong>: Nascere umano è considerato estremamente raro e prezioso, perché solo gli umani hanno la capacità di praticare il Dharma.</p>
        <p>Il <strong>Bardo</strong>: Nel Buddismo Tibetano, il periodo tra la morte e la rinascita. Insegnato da Padmasambhava nel Bardo Thodol (Libro Tibetano dei Morti).</p>`,
      },
    ],
  },
  {
    key: 'level2',
    title: '📘 Livello 2 — Intermedio',
    modules: [
      {
        key: 'mod_2_1',
        title: 'Modulo 2.1 – Dal Buddismo Indiano al Tibet',
        summary: 'Prima e seconda diffusione, le quattro scuole principali.',
        content: `<p>Il Buddismo arrivò in Tibet in due ondate principali:</p>
        <p><strong>PRIMA DIFFUSIONE (VII-IX sec.):</strong> Re Songtsen Gampo invitò monaci e costruì i primi templi. Padmasambhava (Guru Rinpoche) portò il Tantra e fondò il monastero di Samye.</p>
        <p><strong>SECONDA DIFFUSIONE (XI sec.):</strong> Atisha (982-1054) compose il 'Bodhipathapradipa', primo testo Lam Rim.</p>
        <p><strong>Le Quattro Scuole:</strong></p>
        <ul>
          <li><strong>NYINGMA</strong> ('Antica') – fondata da Padmasambhava; include il Dzogchen</li>
          <li><strong>KAGYU</strong> ('Trasmissione Orale') – Milarepa, Marpa; include il Mahamudra</li>
          <li><strong>SAKYA</strong> – forte tradizione accademica</li>
          <li><strong>GELUG</strong> ('Virtuosi') – fondata da Je Tsongkhapa; tradizione del Dalai Lama e di Lama Michel Rinpoche</li>
        </ul>`,
        externalLinks: [{ url: 'https://www.youtube.com/playlist?list=PLcDhyIECBMuNRj10QOfYzKhR9PHpxJqSn', label: 'Mercoledì al Kunpen (Lama Michel)', domain: 'youtube.com' }],
      },
      {
        key: 'mod_2_2',
        title: 'Modulo 2.2 – Il Mahayana: Via del Bodhisattva',
        summary: 'Bodhicitta, i Sei Paramita, la figura del Bodhisattva.',
        content: `<p>Il Buddismo Tibetano si basa principalmente sul <strong>Mahayana</strong> ('Grande Veicolo'), con l'obiettivo della Buddità completa per il beneficio di tutti gli esseri senzienti.</p>
        <p><strong>BODHICITTA</strong>: Il desiderio di ottenere la Buddità per liberare tutti gli esseri dalla sofferenza. Aspetto convenzionale (aspirazione) e ultimo (comprensione diretta della vacuità).</p>
        <p><strong>I Sei Paramita (Perfezioni):</strong></p>
        <ol>
          <li>Dana – Generosità</li>
          <li>Sila – Etica/Disciplina morale</li>
          <li>Kshanti – Pazienza</li>
          <li>Virya – Sforzo gioioso</li>
          <li>Dhyana – Concentrazione meditativa</li>
          <li>Prajna – Saggezza (comprensione della vacuità)</li>
        </ol>`,
      },
      {
        key: 'mod_2_3',
        title: 'Modulo 2.3 – Il Lam Rim: Il Sentiero Graduale',
        summary: 'Le tre motivazioni, struttura del Lam Rim di Tsongkhapa.',
        content: `<p>Il <strong>LAM RIM</strong> ('Stadi del Sentiero') è il cuore del Buddismo Tibetano Gelug. Sviluppato da Je Tsongkhapa nel 'Lam Rim Chenmo', oggi insegnato da <strong>Lama Michel Rinpoche</strong> nella tradizione NgalSo.</p>
        <p><strong>Tre Motivazioni:</strong></p>
        <ul>
          <li><strong>Capacità inferiore</strong>: impermanenza, morte, karma virtuoso. Obiettivo: rinascita fortunata.</li>
          <li><strong>Capacità media</strong>: Le Quattro Nobili Verità, liberazione dal Samsara.</li>
          <li><strong>Capacità superiore</strong>: Bodhicitta, vacuità, Buddità per tutti gli esseri.</li>
        </ul>`,
        externalLinks: [{ url: 'https://www.youtube.com/playlist?list=PLcDhyIECBMuPoiTa9V0cXfIIh2QLvBmQc', label: 'Lojong e Lam Rim (Lama Michel)', domain: 'youtube.com' }],
      },
      {
        key: 'mod_2_4',
        title: 'Modulo 2.4 – La Vacuità (Shunyata)',
        summary: 'Madhyamaka, le due verità, meditazione sulla vacuità.',
        content: `<p>La <strong>Shunyata</strong> (vacuità) non significa 'il nulla'. Tutti i fenomeni sono privi di esistenza intrinseca: esistono solo in modo convenzionale, dipendente da cause, condizioni e imputazione mentale.</p>
        <p><strong>Due verità:</strong></p>
        <ul>
          <li><strong>Verità Convenzionale</strong>: Il mondo fenomenico ordinario</li>
          <li><strong>Verità Ultima</strong>: La natura vuota di tutti i fenomeni</li>
        </ul>
        <p><strong>MADHYAMAKA</strong>: La scuola filosofica fondata da Nagarjuna (II sec.). Nel Buddismo Tibetano dominante la Prasangika-Madhyamaka di Chandrakirti.</p>`,
      },
      {
        key: 'mod_2_5',
        title: 'Modulo 2.5 – Meditazione Tibetana: Shamatha e Vipashyana',
        summary: 'Calma mentale e visione profonda. I nove stadi.',
        content: `<p><strong>SHAMATHA</strong> (Calma Mentale): Sviluppare una mente stabile, lucida e priva di distrazione. Tecnica base: concentrazione sul respiro. <strong>I Nove Stadi della Mente:</strong> Posizionamento, Posizionamento Continuo, Ripristino, Stretta posizione, Disciplinare, Pacificare, Completamente Pacificare, Attenzione Unica, Equanimità.</p>
        <p><strong>VIPASHYANA</strong> (Visione Profonda): Comprensione diretta della vacuità e della natura della mente. Richiede come base il Shamatha.</p>
        <p><strong>Postura — Sette Punti di Vairochana:</strong> Gambe incrociate, mani in mudra di equanimità, schiena diritta, spalle aperte, mento abbassato, occhi semi-aperti, punta della lingua al palato.</p>`,
      },
      {
        key: 'mod_2_6',
        title: 'Modulo 2.6 – Le Pratiche Preliminari (Ngondro)',
        summary: 'Le 100.000 ripetizioni per purificare il karma.',
        content: `<p>Il <strong>NGONDRO</strong> sono le pratiche preliminari necessarie prima di ricevere iniziazioni tantriche avanzate. Si completano 100.000 ripetizioni di ciascuna pratica.</p>
        <p><strong>I Quattro Fondamenti:</strong></p>
        <ol>
          <li>PROSTRAZIONI (×100.000) – purifica il karma del corpo</li>
          <li>VAJRASATTVA (×100.000) – purifica il karma</li>
          <li>MANDALA OFFERING (×100.000) – accumulo di merito</li>
          <li>GURU YOGA (×100.000) – meditazione sul maestro</li>
        </ol>
        <p>⚠️ Il Ngondro richiede la guida di un maestro qualificato (Lama). Non si intraprende da soli.</p>`,
        externalLinks: [{ url: 'https://www.youtube.com/playlist?list=PLcDhyIECBMuNxanfTViEvQvc4Mv3EI_vz', label: 'Playlist Autoguarigione NgalSo', domain: 'youtube.com' }],
      },
    ],
  },
  {
    key: 'level3',
    title: '⚡ Livello 3 — Avanzato (Vajrayana)',
    modules: [
      {
        key: 'mod_3_1',
        title: 'Modulo 3.1 – Cos\'è il Vajrayana?',
        summary: 'Il Veicolo del Diamante, le quattro classi di Tantra.',
        content: `<p>Il <strong>VAJRAYANA</strong> ('Veicolo del Diamante') usa metodi speciali per raggiungere la Buddità più velocemente: visualizzazione, mantra, mudra e mandala.</p>
        <p><strong>Le Quattro Classi di Tantra:</strong></p>
        <ol>
          <li>KRIYA TANTRA – Pratiche esterne, rituali di purificazione</li>
          <li>CHARYA TANTRA – Bilanciamento interno ed esterno</li>
          <li>YOGA TANTRA – Enfasi sulla pratica interna</li>
          <li>ANUTTARAYOGA TANTRA – La classe più alta e segreta</li>
        </ol>
        <p>⚠️ Alcune pratiche avanzate richiedono la guida di un maestro qualificato. Questa applicazione non fornisce iniziazioni o istruzioni sostitutive.</p>`,
      },
      {
        key: 'mod_3_2',
        title: 'Modulo 3.2 – L\'Iniziazione e la Relazione Guru-Discepolo',
        summary: 'L\'empowerment tantrico, i quattro tipi di iniziazione.',
        content: `<p>L'<strong>ABHISHEKA</strong> (Iniziazione) è il rito attraverso cui il maestro trasmette il potere e la benedizione di una particolare deità tantrica. Senza iniziazione non si può praticare il Tantra.</p>
        <p><strong>Quattro tipi nell'Anuttarayoga Tantra:</strong></p>
        <ol>
          <li>Iniziazione del Vaso – autorizza la fase di generazione</li>
          <li>Iniziazione Segreta – purifica il karma della parola</li>
          <li>Iniziazione della Saggezza-Consapevolezza – purifica il karma della mente</li>
          <li>Iniziazione della Parola Preziosa – trasmette la comprensione ultima</li>
        </ol>
        <p>⚠️ Alcune pratiche spirituali avanzate richiedono la guida di un maestro qualificato. Questa applicazione non fornisce iniziazioni o istruzioni sostitutive.</p>`,
      },
      {
        key: 'mod_3_3',
        title: 'Modulo 3.3 – Fase di Generazione e Completamento',
        summary: 'Kyerim e Dzogrim, visualizzazione della deità, corpo sottile.',
        content: `<p><strong>FASE DI GENERAZIONE (Kyerim)</strong>: Si 'genera' se stessi come la deità tantrica attraverso la visualizzazione. La visualizzazione purifica la percezione ordinaria.</p>
        <p><strong>FASE DI COMPLETAMENTO (Dzogrim)</strong>: Lavora con il corpo sottile:</p>
        <ul>
          <li>Venti (prana): 5 principali e 5 secondari</li>
          <li>Canali (nadi): centrale (avadhuti), destro (rasana), sinistro (lalana)</li>
          <li>Gocce (bindu/thigle): bianche e rosse nei chakra</li>
        </ul>
        <p>⚠️ Queste pratiche richiedono sempre la guida di un maestro qualificato.</p>`,
      },
      {
        key: 'mod_3_4',
        title: 'Modulo 3.4 – Mantra, Mudra e Mandala',
        summary: 'I suoni sacri, i gesti rituali, le rappresentazioni dell\'universo.',
        content: `<p><strong>MANTRA</strong>: Suoni sacri che invocano la natura illuminata delle deità. Non sono magie ma mezzi per trasformare la mente.</p>
        <p><strong>Mantra fondamentali:</strong></p>
        <ul>
          <li>OM MANI PADME HUM – Compassione di Avalokiteshvara</li>
          <li>OM TARE TUTTARE TURE SVAHA – Tara Verde, protezione</li>
          <li>OM VAJRASATTVA HUM – Purificazione</li>
          <li>OM MUNI MUNI MAHA MUNIYE SVAHA – Buddha Shakyamuni</li>
          <li>OM AH RA PA TSA NA DHI – Manjushri, saggezza</li>
        </ul>
        <p><strong>MUDRA</strong>: Gesti rituali delle mani che simboleggiano aspetti della Buddità.</p>
        <p><strong>MANDALA</strong>: Rappresentazione geometrica sacra dell'universo o di un palazzo del Buddha.</p>`,
      },
    ],
  },
  {
    key: 'level4',
    title: '🔮 Livello 4 — Maestria',
    modules: [
      {
        key: 'mod_4_1',
        title: 'Modulo 4.1 – Il Dzogchen: La Grande Perfezione',
        summary: 'Riconoscimento diretto di Rigpa, Trekcho e Togal.',
        content: `<p>Il <strong>DZOGCHEN</strong> ('Grande Perfezione') è il più alto insegnamento della scuola Nyingma: il riconoscimento diretto della natura autentica della mente.</p>
        <p><strong>Tre Serie:</strong> SEMDE (Serie della Mente), LONGDE (Serie dello Spazio), MENGAGDE (Serie delle Istruzioni Segrete).</p>
        <p><strong>Due pratiche principali:</strong></p>
        <ul>
          <li><strong>TREKCHO</strong> ('Taglio attraverso'): Riconoscimento diretto e mantenimento di Rigpa</li>
          <li><strong>TOGAL</strong> ('Salto diretto'): Pratiche avanzate di visualizzazione luminosa</li>
        </ul>
        <p>⚠️ Il Dzogchen richiede trasmissione diretta (pointing-out instruction) da un maestro realizzato. Questa applicazione non fornisce iniziazioni o istruzioni sostitutive.</p>`,
      },
      {
        key: 'mod_4_2',
        title: 'Modulo 4.2 – Il Mahamudra: Il Grande Sigillo',
        summary: 'Natura della mente, insegnamenti di Milarepa.',
        content: `<p>Il <strong>MAHAMUDRA</strong> è l'insegnamento più alto della scuola Kagyu, tramandato da Tilopa a Naropa a Marpa a Milarepa.</p>
        <p><strong>Tre aspetti:</strong> Sutra Mahamudra, Tantra Mahamudra, Essenza Mahamudra.</p>
        <p>La <strong>natura della mente</strong> ha tre caratteristiche: vuota, chiara (luminosa), priva di ostacoli.</p>
        <p><strong>Milarepa</strong> (1040-1123): Il grande maestro Kagyu. La sua vita di trasformazione è un esempio supremo di pratica intensa.</p>`,
        externalLinks: [{ url: 'https://www.youtube.com/watch?v=7ku7Awx9_T4', label: 'LamRim – Insieme sul Sentiero (Lama Michel)', domain: 'youtube.com' }],
      },
      {
        key: 'mod_4_3',
        title: 'Modulo 4.3 – La Morte, il Bardo e la Rinascita',
        summary: 'Il Libro Tibetano dei Morti, i sei bardo, il phowa.',
        content: `<p>Il <strong>Bardo Thodol</strong> descrive le esperienze della coscienza durante e dopo la morte.</p>
        <p><strong>I Sei Bardo:</strong></p>
        <ol>
          <li>KYENE BARDO – Bardo della vita ordinaria</li>
          <li>MILAM BARDO – Bardo del sogno</li>
          <li>SAMTEN BARDO – Bardo della meditazione</li>
          <li>CHIKHAI BARDO – Bardo del momento della morte</li>
          <li>CHONYID BARDO – Bardo della natura della realtà</li>
          <li>SIDPA BARDO – Bardo del divenire</li>
        </ol>
        <p>Il <strong>PHOWA</strong> (Trasferimento di coscienza): Tecnica per trasferire la coscienza nel momento della morte. Si pratica con la guida di un maestro.</p>
        <p>⚠️ Alcune pratiche spirituali avanzate richiedono la guida di un maestro qualificato.</p>`,
      },
    ],
  },
];

export const CONTEMPLATIVE_STATES_BEFORE = [
  { id: 'calmo', label: '😌 Calmo' },
  { id: 'stanco', label: '😴 Stanco' },
  { id: 'agitato', label: '😤 Agitato' },
  { id: 'pesante', label: '🪨 Pesante' },
  { id: 'triste', label: '😔 Triste' },
  { id: 'sopraffatto', label: '🌊 Sopraffatto' },
  { id: 'presente', label: '🌱 Presente' },
];

export const CONTEMPLATIVE_STATES_AFTER = [
  { id: 'leggero', label: '🕊️ Leggero' },
  { id: 'centrato', label: '🎯 Centrato' },
  { id: 'calmo', label: '😌 Calmo' },
  { id: 'presente', label: '🌱 Presente' },
  { id: 'invariato', label: '➖ Invariato' },
];

export const CONTINUITY_MESSAGES = [
  'Puoi ricominciare da questo momento.',
  'Anche una breve pausa può avere valore.',
  'La costanza non richiede perfezione.',
  'Ogni pratica conta, indipendentemente dalla frequenza.',
  'Tornare è già un atto di cura di sé.',
];

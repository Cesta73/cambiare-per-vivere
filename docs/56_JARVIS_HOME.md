# 56 — Jarvis Home Final Closeout

## Production

- Release Web: `d9a45fd5d0e87a0852c2c3684311fdf15d7fe8df`
- Previous known-good: `71efbfa9bf2eabd0feffad2c9d6893aaf599c8fd`
- GitHub Pages build/deploy: PASS
- Web pubblico: HTTP 200, asset `main-CjzzW3Gx.js`
- OpenJarvis health pubblico: PASS
- Rollback: ridistribuire `71efbfa9bf2eabd0feffad2c9d6893aaf599c8fd` tramite lo stesso workflow Pages; backend e dati non sono coinvolti.

## Daily Briefing e proattività

La Home invia la richiesta read-only `Come sono messo oggi?` al contratto autenticato `/core/message`, con identità Supabase canonica e message ID giornaliero idempotente. Il contenuto mostrato proviene integralmente dall'esistente `daily_briefing` OpenJarvis. La precedente euristica frontend `attentionCount` è stata rimossa: la UI non seleziona più autonomamente cosa sia importante e presenta soltanto l'output approvato dalla Butler policy `relevant_time_sensitive_actionable`.

## Dario

Fonti versionate: `jarvis_canary_routes.py`, `jarvis_agentic_tools.py`, `server.mjs` delle release Wave 7/8 production-equivalent.

- DARIO_PURPOSE: chiave conversazionale che richiede la lettura del contesto familiare canonico.
- DARIO_INPUTS: richiesta naturale read-only che menziona Dario.
- DARIO_OUTPUTS: risultato bounded del tool `family_read`.
- DARIO_DATA_SOURCE: `jarvis.core.family`, endpoint protetto `/core/opj/family`.
- DARIO_USER_FACING_ROLE: contesto familiare read-only; nessuna autorità di mutazione.
- DARIO_WEB_PLACEMENT: Famiglia, senza nuova etichetta o reinterpretazione.

Caleb resta separato e mappato esclusivamente su Agenda/Calendar.

## Test e canary

- TypeScript interessato: PASS
- ESLint su `OggiPage.tsx`: PASS
- GitHub Actions typecheck/lint/build: PASS
- Desktop autenticato: PASS; Home, briefing, conversazione e navigazione renderizzati con identità reale.
- Conversazione read-only: PASS; una richiesta, una risposta, nessun errore e nessuna mutazione.
- Continuità Telegram–Web lightweight: PASS; risposta Web prodotta nello stesso contesto canonico bounded, senza errore o mutazione.
- Mobile autenticato: NOT_TESTED. Il browser autenticato disponibile non espone controllo del viewport e ha mantenuto `1670×889`; non è stata simulata una prova falsa.
- Sicurezza: nessun fallback esplicito, nessuna risposta duplicata, nessuna scrittura e nessun percorso alternativo al core autenticato osservati.

## Gate matrix

OPENJARVIS_DEFAULT = PASS

PERSONAL_BUTLER_CORE = PASS

BUTLER_INTELLIGENCE = PASS

JARVIS_HOME = PASS

JARVIS_VISUALLY_CENTRAL = PASS

TODAY_CONTEXT = PASS

DAILY_BRIEFING_UI = PASS

CONTROLLED_PROACTIVITY_UI = PASS

CONVERSATION = PASS

AGENDA = PASS

CALEB_IS_CALENDAR = PASS

DARIO_SEMANTICS_PRESERVED = PASS

HEALTH = PASS

NUTRITION = PASS

PANTRY = PASS

MOVEMENT = PASS

FAMILY = PASS

MOBILE = NOT_TESTED

CAUSE: Il browser con la sessione reale è rimasto a viewport desktop e il controllo disponibile non consente di ridimensionarlo.
EVIDENCE: Canary autenticato misurato a `1670×889`; tentativi di viewport non hanno modificato `innerWidth`. La navigazione responsive è presente nel codice, ma non sostituisce il canary richiesto.
BLOCKS_PASS_JARVIS_HOME: YES
MINIMAL_FIX: Aprire la Web app già autenticata a larghezza mobile (circa 390 px) e verificare Home, briefing, input, bottom navigation, assenza di overflow e touch target; nessuna modifica codice è richiesta salvo failure reale.

DESKTOP = PASS

CANONICAL_IDENTITY = PASS

CROSS_CHANNEL = PASS

OPJ_INTEGRATION = PASS

SAFE_WRITES = PASS

NO_SAFETY_REGRESSION = PASS

ROLLBACK = PASS

## Decisione

`PARTIAL_PASS`: resta esclusivamente il canary mobile autenticato.

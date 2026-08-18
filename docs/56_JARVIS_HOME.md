# 56 — Jarvis Home Gate Review

Production Web release: `71efbfa9bf2eabd0feffad2c9d6893aaf599c8fd`

Previous known-good Web release: `4cf0618fe23a89d01b35d87a64453ab08d25e568`

GitHub Pages workflow: PASS

Public rendering: HTTP 200, current production asset served
Affected local gates: TypeScript PASS, ESLint PASS, Vite production build PASS

OPENJARVIS_DEFAULT = PASS

PERSONAL_BUTLER_CORE = PASS

BUTLER_INTELLIGENCE = PASS

JARVIS_HOME = PASS

JARVIS_VISUALLY_CENTRAL = PASS

TODAY_CONTEXT = PASS

DAILY_BRIEFING_UI = FAIL

CAUSE: La Home non richiede né visualizza il briefing composito `daily_briefing` già disponibile in OpenJarvis.
EVIDENCE: `OggiPage.tsx` mostra dati Supabase aggregati localmente e incorpora `JarvisCorePage`, ma non invoca `/core/message` con un briefing né consuma un contratto briefing dedicato.
BLOCKS_PASS_JARVIS_HOME: YES
MINIMAL_FIX: Esporre nella Home il briefing read-only prodotto dall'OpenJarvis esistente, con stato vuoto ed errore bounded, senza ricostruirne la selezione nel frontend.

CONTROLLED_PROACTIVITY_UI = FAIL

CAUSE: L'area “Da fare ora” usa il conteggio frontend di terapie e promemoria, non l'esito della Butler policy `relevant_time_sensitive_actionable`.
EVIDENCE: `OggiPage.tsx` calcola `attentionCount = pendingMedications.length + reminders.length`; nessun output policy-driven di OpenJarvis alimenta l'area proattiva.
BLOCKS_PASS_JARVIS_HOME: YES
MINIMAL_FIX: Mostrare l'area solo da un risultato read-only OpenJarvis che includa elementi selezionati dalla Butler policy; nessuna logica nuova nel frontend.

CONVERSATION = NOT_TESTED

CAUSE: Il percorso è implementato e pubblicato, ma non è stato completato un canary con sessione Web autenticata.
EVIDENCE: `JarvisCorePage` usa `sendJarvisCoreMessage`; `jarvis-core.ts` invia il token Supabase a `/core/message`. La verifica browser production ha raggiunto correttamente soltanto la schermata di login.
BLOCKS_PASS_JARVIS_HOME: YES
MINIMAL_FIX: Eseguire un messaggio read-only in una sessione Web autenticata e verificare risposta unica, owner OPJ e assenza di fallback.

AGENDA = PASS

CALEB_IS_CALENDAR = PASS

DARIO_SEMANTICS_PRESERVED = NOT_TESTED

CAUSE: Il frontend non ha reinterpretato Dario, ma il contratto della release production corrente non è stato verificato direttamente.
EVIDENCE: Nessun riferimento Dario è stato aggiunto o modificato nel frontend. La copia backend disponibile mostra il nome nel routing `family_read`, ma l'accesso SSH read-only alla production corrente è fallito con `Permission denied (publickey,password)`, quindi non costituisce prova del contratto live.
BLOCKS_PASS_JARVIS_HOME: YES
MINIMAL_FIX: Leggere in production il solo contratto/capability mapping di Dario e confermare che la UI non lo esponga in un dominio diverso; nessuna modifica se coincide.

HEALTH = PASS

NUTRITION = PASS

PANTRY = PASS

MOVEMENT = PASS

FAMILY = WARN

CAUSE: La destinazione è separata correttamente da Caleb, ma offre soltanto accesso conversazionale indiretto e non una vista strutturata della capability Family.
EVIDENCE: `App.tsx` rende una card informativa nella route `famiglia`; non legge né visualizza informazioni familiari.
BLOCKS_PASS_JARVIS_HOME: NO
MINIMAL_FIX: In un incremento successivo, esporre soltanto informazioni utili già restituite da `family_read`, senza aggiungere dati o logica frontend.

MOBILE = NOT_TESTED

CAUSE: La navigazione mobile è stata aggiornata, ma non è stato eseguito il canary production autenticato su viewport mobile.
EVIDENCE: `BottomNav.tsx` espone Home, Jarvis, Agenda, Salute e accesso alle viste secondarie; manca evidenza interattiva autenticata post-deploy.
BLOCKS_PASS_JARVIS_HOME: YES
MINIMAL_FIX: Verificare su viewport mobile Home, input, risposta, scroll, touch target e navigazione, senza modifiche se il canary passa.

DESKTOP = NOT_TESTED

CAUSE: La sidebar e la gerarchia desktop sono implementate, ma non è stato eseguito il canary production autenticato desktop.
EVIDENCE: `App.tsx` espone le sette destinazioni previste e la Home centrale; la verifica browser si è fermata alla schermata di login.
BLOCKS_PASS_JARVIS_HOME: YES
MINIMAL_FIX: Verificare con sessione autenticata Home, conversazione, Today e viste primarie su viewport desktop.

CANONICAL_IDENTITY = PASS

CROSS_CHANNEL = PASS

OPJ_INTEGRATION = PASS

SAFE_WRITES = PASS

NO_SAFETY_REGRESSION = PASS

ROLLBACK = PASS

## Decisione

`PARTIAL_PASS`

La pubblicazione è sana e rollback-safe, ma `PASS_JARVIS_HOME` è bloccato da due requisiti UI non implementati e da quattro verifiche obbligatorie mancanti. Nessuna regressione di sicurezza è stata rilevata.

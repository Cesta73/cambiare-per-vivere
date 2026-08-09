# WP-017 — Jarvis Design System

## STATUS

COMPLETE — implementazione locale validata.

## FILES

- `src/design-system.css`
- `src/components/design-system/JarvisPrimitives.tsx`
- `src/components/design-system/index.ts`
- `src/components/brand/BrandMark.tsx`
- `src/components/layout/BottomNav.tsx`
- `src/components/oggi/OggiPage.tsx`
- `src/App.tsx`
- `src/components/auth/AuthScreen.tsx`
- `src/components/altro/JarvisCorePage.tsx`
- `src/components/altro/AltroPage.tsx`
- `src/lib/jarvis-core.ts` (solo copy visuale degli errori)
- `public/jarvis-mark.svg`
- `public/manifest.webmanifest`
- `index.html`
- `design-system/JARVIS_DESIGN_SYSTEM.md`

## DESIGN SYSTEM

- Palette light avorio/bianco/grafite/pietra/oro.
- Palette dark antracite/grafite/avorio/grigio caldo/oro.
- Accento unico oro satinato.
- Cormorant Garamond per titoli e Inter per testo.
- Token di spacing, radius, shadow, focus e motion.
- Primitive React per Buttons, Cards, Inputs e Icons.
- Layer di compatibilità che uniforma le schermate esistenti senza cambiarne la
  logica.

## BRAND

- Nome visibile: JARVIS.
- Logo Living Orbit monocromatico oro satinato.
- Centro umano e tre orbite; nessun riferimento a robot, chip o chatbot.
- Animazione lenta di respiro, senza rotazione.
- Favicon e manifest aggiornati al nuovo marchio.

## LAYOUT

- Home completamente ricostruita mobile-first.
- Barra “Parla con Jarvis” immediatamente sotto il saluto.
- Griglia minimale delle nove funzioni.
- Dati e azioni quotidiane preservati nella sezione “Il tuo oggi”.
- Sidebar desktop più sottile e neutra.
- Bottom navigation: Home, Parla, Diario, Agenda, Altro.

## ACCESSIBILITY

- Focus oro visibile.
- Testo e superfici progettati per contrasto WCAG AA.
- Icone monocromatiche Lucide con stroke coerente.
- Supporto `prefers-reduced-motion`.
- Layout responsive mobile, tablet e desktop.

## TESTS

- TypeScript: PASS.
- Diff whitespace: PASS.
- Lint file modificati: PASS, zero errori; 38 warning `any` preesistenti in
  `ReportPage`.
- Production build: PASS, 2.128 moduli trasformati.
- Bundle: PASS; warning non bloccante sul chunk principale già monolitico.
- Verifica statica responsive: PASS per breakpoint mobile, tablet e desktop.
- Preview browser locale: non eseguita perché il sandbox vieta l'apertura di
  URL `file://` e non consente il bind della porta di preview.

## RISKS

- Il layer di compatibilità visuale copre classi legacy diffuse; nuove classi
  colore introdotte in futuro devono usare i token JARVIS.
- Il tema dark segue la preferenza del sistema; non è stato aggiunto un nuovo
  flusso applicativo per un selettore manuale.

## NOTES

- Nessuna API, query, tab, handler, payload o flusso funzionale è stato
  modificato.
- Nessun database, migration, provider AI o modello AI è stato modificato.
- La migration e la cartella `design/` già non tracciate sono state preservate
  e non fanno parte di WP-017.

## PRODUCTION STATUS

Release: pending
Commit: pending
Deploy eseguito: NO
Server: `gianlucacestarollo.com`
Health: non eseguito
Smoke test: non eseguito
Rollback disponibile: da preparare prima del deploy

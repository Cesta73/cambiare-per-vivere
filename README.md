# Cambiare per Vivere

Applicazione personale per monitoraggio del benessere, pianificazione, diario,
Sentiero del Dharma e preparazione al Cammino di Santiago.

## Accesso

L'app e pensata per un solo utente esistente. La registrazione pubblica non e
esposta nell'interfaccia. In Supabase va inoltre disabilitata l'opzione:

`Authentication > Providers > Email > Allow new users to sign up`

## Sviluppo

```bash
npm ci
npm run dev
npm run typecheck
npm run lint
npm run build
```

Le variabili richieste sono `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

## Pubblicazione

Ogni aggiornamento del ramo `main` viene controllato, costruito e pubblicato
automaticamente su GitHub Pages dal workflow `Verifica e pubblica l'app`.
Le variabili Supabase sono conservate come GitHub Actions secrets.

## Pulizia dati

La migrazione `20260614120000_reset_personal_app_data.sql` elimina tutti i dati
applicativi ma conserva l'utente in `auth.users`. Va applicata una sola volta.

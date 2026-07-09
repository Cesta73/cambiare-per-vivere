# Cambiare per Vivere in Jarvis 3.0

Cambiare per Vivere e una interfaccia ufficiale di Jarvis. Non e un Jarvis
separato e non deve diventare un secondo cervello.

## Missione

L'app deve:

- mostrare informazioni;
- raccogliere dati;
- permettere modifiche;
- produrre report;
- visualizzare grafici;
- rendere consultabili memoria e Second Brain quando appropriato;
- rendere i dati condivisi piu facili da ispezionare e correggere.

## Confine

La logica di business complessa appartiene a Jarvis Core.

L'app puo possedere stato di presentazione, validazione dei form, dettagli di
interazione locale e flussi di modifica diretta. Non deve possedere decisioni
di dominio che devono essere disponibili anche a Telegram, voce, smartwatch,
widget, desktop o interfacce future.

Esempi:

- Layout UI e rendering dei grafici appartengono qui.
- Regole sulle calorie, apprendimento, selezione degli agenti, aggiornamenti
  della memoria e decisioni condivise appartengono a Jarvis Core.
- Calcoli temporanei per la visualizzazione sono accettabili solo quando
  rispecchiano un contratto posseduto dal Core o sono chiaramente
  presentazionali.

Quando aggiungi funzioni, preferisci API condivise o contratti dati posseduti
dal Core alla duplicazione della logica dentro l'app.

## Collegamento operativo

La schermata `Altro -> Jarvis Core` chiama:

```text
POST /core/message
```

L'app non contiene un token segreto. Usa la sessione Supabase dell'utente
loggato e lascia al Core la verifica dell'identita.

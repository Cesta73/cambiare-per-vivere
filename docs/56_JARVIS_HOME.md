# 56 — Jarvis Home

## Risultato

La Web app autenticata è stata riorganizzata come casa visiva di OpenJarvis. La conversazione è ora il primo elemento operativo della Home e continua a usare il contratto autenticato `/core/message`, senza duplicare logica di dominio nel frontend.

## Architettura

- Home: identità Jarvis, conversazione, contesto essenziale di oggi e viste specializzate.
- Navigazione primaria: Jarvis, Agenda, Salute, Nutrizione, Cambusa, Movimento, Famiglia.
- Agenda espone in modo inequivocabile `Caleb · Calendar`.
- Famiglia è una destinazione distinta e non presenta Caleb come persona.
- Dario non è ridefinito o reinterpretato dal frontend: il contratto production esistente resta invariato.
- Legacy e viste secondarie restano installate e raggiungibili dai flussi esistenti; non sono state eliminate.

## Autorità e sicurezza

- Le richieste naturali Web attraversano la sessione Supabase autenticata e OpenJarvis.
- Nessun agente, resolver o sistema di memoria è stato ricreato nel frontend.
- Nessuna modifica a schema, RLS, backend, provider o autorità di mutazione.
- Le esclusioni production esistenti restano invariate.

## Verifiche locali

- TypeScript: PASS.
- ESLint: PASS.
- Build Vite production: PASS, 2.128 moduli trasformati.
- Il warning sulla dimensione del bundle è preesistente/non bloccante e non è stato affrontato per evitare refactoring fuori scope.

## Rilascio e rollback

La pubblicazione è affidata al workflow GitHub Pages già presente sul branch `main`. Il rollback consiste nel ridistribuire il commit production precedente attraverso lo stesso workflow; nessun dato utente o schema è coinvolto.

## Canary richiesto

Dopo la pubblicazione devono essere verificati con una sessione Web autenticata: apertura Home, messaggio OpenJarvis, continuità con Telegram, Agenda/Caleb, una lettura innocua, assenza di doppie risposte e persistenza dopo refresh. In mancanza di sessione autenticata disponibile, il rilascio non può essere dichiarato completamente chiuso.

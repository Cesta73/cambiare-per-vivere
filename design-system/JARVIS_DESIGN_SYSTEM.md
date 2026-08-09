# JARVIS Design System

## Identità

JARVIS è una presenza discreta e un compagno di cammino. L'interfaccia usa
spazio, ritmo e gerarchia per orientare senza sembrare un gestionale o un
prodotto tecnologico.

## Living Orbit

Il marchio rappresenta la persona al centro e tre orbite vive. È sempre oro
satinato, monocromatico e privo di riferimenti a robot, chip o chat. Il moto è
un respiro lento, mai una rotazione. Con `prefers-reduced-motion` le animazioni
sono disattivate.

## Token

I token CSS risiedono in `src/design-system.css`.

- Light: avorio caldo, superfici bianche, grafite, grigio pietra, oro satinato.
- Dark: antracite, superfici grafite, avorio, grigio caldo, oro satinato.
- Accento unico: `--jv-gold`.
- Tipografia: Cormorant Garamond per titoli, Inter per testo.
- Spaziatura: scala da `--jv-space-1` a `--jv-space-7`.
- Raggi: `--jv-radius-sm`, `--jv-radius-md`, `--jv-radius-lg`.
- Ombra: un solo livello quasi invisibile, `--jv-shadow`.

## Componenti

- Buttons: primary oro, secondary e ghost neutri.
- Cards: superficie neutra, bordo morbido, ombra minima.
- Inputs: superficie neutra e focus oro WCAG visibile.
- Dialogs: fondo neutro, overlay discreto, layout mobile bottom-sheet.
- Navigation: icone Lucide monocromatiche, stroke 1.45.
- Sidebar: sottile, senza effetti, selezione oro tenue.
- Mobile navigation: Home, Parla, Diario, Agenda, Altro.

Le primitive React sono esportate da
`src/components/design-system/index.ts`. Le classi legacy sono ricondotte agli
stessi token dal layer di compatibilità, senza cambiare logica o contratti.

## Accessibilità

Il testo grafite/avorio mantiene contrasto AA sulle superfici previste. Tutti
gli elementi interattivi hanno focus visibile; animazioni e transizioni
rispettano `prefers-reduced-motion`.

# scrum-trainer

Folder "concept" contains app description and vide-coding instructions

Folder "app" contains in-browser app.

## Scrum Trainer App

Eine reine In-Browser-App (kein Server nötig) zum Üben der Zertifizierungen
**PSM I** und **PSPO I**.

### Funktionen
- Auswahl der Zertifizierung (PSM I oder PSPO I)
- 15 zufällige Fragen aus je 50 pro Durchlauf
- Stoppuhr (MM:SS) ab Quizstart
- Vor-/Zurück-Navigation und direkter Sprung über Frage-Nummern
- Ergebnis mit Trefferquote (Score + %) und benötigter Zeit
- Durchsicht aller Fragen nach dem Quiz: richtig/falsch markiert inkl. Erläuterung
- Erkennt „Choose all that apply"-Fragen automatisch (Mehrfachauswahl)

### Starten
Einfach `app/index.html` im Browser öffnen (Doppelklick genügt – funktioniert
offline ohne Server). Alternativ über einen lokalen Server, z. B.:

```
npx serve app
```

### Aufbau
```
app/
  index.html          UI-Gerüst
  css/styles.css      Styles
  js/app.js           App-Logik (Quiz, Timer, Auswertung)
  data/questions.js   Fragendaten (Single Source of Truth, offline-fähig)
  data/questions.json Identische Fragendaten als reines JSON
```

Die Fragen stammen aus `concept/1a_Übungsfragen PSM I und PSPO I.md`.
`questions.json` wird aus `questions.js` generiert, damit beide nicht
auseinanderlaufen.
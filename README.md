# scrum-trainer

Folder "concept" contains app description and vide-coding instructions

Folder "app" contains in-browser app.

## Scrum Trainer App

Eine reine In-Browser-App (kein Server nötig) zum Üben der Zertifizierungen
**PSM I** und **PSPO I**.

### Funktionen
- Auswahl der Zertifizierung (PSM I oder PSPO I)
- 15 zufällige Fragen aus je 50 pro Durchlauf
- Reihenfolge der Antwortmöglichkeiten wird je Frage zufällig gemischt
- Stoppuhr (MM:SS) ab Quizstart
- Vor-/Zurück-Navigation und direkter Sprung über Frage-Nummern
- Durchsicht vor der Abgabe: alle eigenen Antworten frei durchnavigieren und
  noch ändern (Lösungen erscheinen erst nach der endgültigen Abgabe)
- Ergebnis mit Trefferquote (Score + %), benötigter Zeit und Ø-Zeit pro Frage
  im Vergleich zum Richtwert von 00:45
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
  data/questions.js   Fragendaten als JSON-Objekt (offline-fähig per <script>)
```

Die Fragen stammen aus `concept/1a_Übungsfragen PSM I und PSPO I.md` und liegen in
`questions.js` als strukturiertes JSON-Objekt vor.
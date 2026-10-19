# 1 · Einrichtung im Google-Konto

Mit Claude Code: `/einrichten` übernimmt alle Schritte und liest Firmendaten, Design und Konto
selbst aus Website, Design-Skill und Google-Anmeldung. Diese Seite beschreibt die Schritte für den
Fall, dass du sie selbst gehst oder etwas nachvollziehen willst.

## Voraussetzungen

- Ein Google-Konto. **Für Kundendaten Google Workspace verwenden**, nicht ein privates Gmail-Konto
  (Auftragsverarbeitung, siehe `08-datenschutz.md`).
- Node.js ab Version 20: https://nodejs.org
- clasp, das Kommandozeilenwerkzeug für Apps Script:

```bash
npm install -g @google/clasp
```

- Einmalig die Apps Script API einschalten: https://script.google.com/home/usersettings →
  "Google Apps Script API" auf **An**.

## Schritte

1. **Konfiguration anlegen:** `vorlagen/Konfig.beispiel.gs` nach `apps-script/Konfig.gs`
   kopieren und `STARTWERTE` mit deinen Firmendaten füllen. `KONFIG` bleibt vorerst leer.

2. **Anmelden** (öffnet den Browser):

```bash
clasp login
```

3. **Tabelle mit Skript anlegen** (im Repo-Ordner):

```bash
clasp create-script --type sheets --title "<Firmenname> Upload-Strecke" --rootDir apps-script
```

   clasp überschreibt dabei `apps-script/appsscript.json`. Danach immer `vorlagen/appsscript.json`
   nach `apps-script/appsscript.json` kopieren. Ohne den Block `"webapp"` darin entsteht keine
   öffentliche Kundenseite.

4. **Code hochladen:**

```bash
clasp push -f
```

5. **Ersteinrichtung:** Die Tabelle öffnen (Adresse: `parentId` aus `.clasp.json`, also
   `https://docs.google.com/spreadsheets/d/<parentId>/edit`), neu laden, Menü
   **Upload-Strecke → Ersteinrichtung / Reparatur**. Berechtigungen erteilen. Bei "Google hat
   diese App nicht überprüft": **Erweitert → Weiter zu … (unsicher)**. Das Skript gehört dir,
   die Warnung erscheint bei jedem eigenen Skript. Danach die Ersteinrichtung erneut starten.

   Ergebnis: sechs Blätter, Drive-Ordner "<Firma> Uploads", täglicher Prüflauf 8 Uhr,
   Musterfall Max Mustermann.

6. **Als Web-App bereitstellen:**

```bash
clasp deploy -d "Upload-Strecke"
```

   Die ausgegebene ID (beginnt mit `AKfy`) notieren. In `apps-script/Konfig.gs` eintragen:
   `WEBAPP_URL: 'https://script.google.com/macros/s/<ID>/exec'`. Bei eigener Domain zusätzlich
   `LINK_BASIS` (siehe `02-domain.md`).

7. **Konfiguration nachreichen**, dieselbe ID behalten:

```bash
clasp push -f
```

```bash
clasp deploy -i <ID> -d "Konfiguration"
```

8. In der Tabelle **Upload-Strecke → Links neu aufbauen**, dann **Selbsttest**.

## Nach Codeänderungen

Immer beides: `clasp push -f` und `clasp deploy -i <ID>`. Ohne den zweiten Befehl sieht der
Kunde den alten Stand, die Tabellenmenüs dagegen schon den neuen.

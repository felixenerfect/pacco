# 4 · Checklisten

Die Strecke ist für jede Branche offen. Was der Kunde liefern soll, steht in Checklisten. Je
Leistung eine Vorlage, z. B. "Sanierungsfahrplan (iSFP)" oder "Finanzierung Privatkunde".

## Wie Checklisten entstehen

Mit Claude Code: `/checkliste` (läuft im Setup automatisch mit). Claude

1. übernimmt eure vorhandene Liste (Excel, Word, PDF, Foto, Text) oder
2. erarbeitet einen Entwurf aus euren Leistungen und der Bibliothek in `vorlagen/checklisten/`,
3. prüft ihn (`node tools/checkliste.js --pruefen`), zeigt ihn euch einmal zur Abstimmung
   und übernimmt ihn.

Eure Checklisten liegen als CSV in `checklisten/`. Sie enthalten keine Kundendaten und gehören ins
eigene Repo, so bleiben sie nachvollziehbar und wiederverwendbar.

## Bibliothek

| Datei | Vorlagen |
|---|---|
| `vorlagen/checklisten/energieberatung.csv` | Sanierungsfahrplan (iSFP) · Förderung Einzelmaßnahme · Energieausweis |
| `vorlagen/checklisten/finanzierung.csv` | Finanzierung Privatkunde · Finanzierung Selbstständige |
| `vorlagen/checklisten/allgemein.csv` | Beispiel mit allen Bausteinen |

Die Vorlagen sind Beispiele und vor dem Einsatz fachlich zu prüfen, besonders bei Förder- oder
Behördenvorgaben, die sich ändern.

## Format (CSV, Semikolon, UTF-8)

| Spalte | Pflicht | Inhalt |
|---|---|---|
| `vorlage` | ja | Name der Vorlage, erscheint im Dialog "Neuer Fall" |
| `gruppe` | ja | Abschnitt auf der Kundenseite, z. B. "Gebäude" |
| `gruppe_untertitel` | nein | Überschrift des Abschnitts, z. B. "Zum Gebäude" |
| `titel` | ja | Name der Unterlage aus Kundensicht, wird Teil des Dateinamens |
| `hinweis` | nein | Zeile darunter: wo man es findet, wie es aussehen soll, "Falls vorhanden" |
| `erwartet` | nein | Anzahl Dateien (Vorgabe 1), z. B. 3 für drei Jahresabrechnungen |
| `gehoert_zu` | nein | `titel` einer Elternposition: macht daraus eine Unterposition je Block |
| `frage` | bei Eltern | Ja/Nein-Frage, z. B. "Wurden schon Sanierungen durchgeführt?" |
| `block_name` | bei Eltern | Einzahl dessen, was mehrfach vorkommt: Objekt, Maßnahme, Gesellschafter |
| `block_feld` | bei Eltern | Womit der Kunde den Block benennt: "Adresse des Objekts", "Art der Maßnahme und Jahr" |

Beispiel mit Mehrfach-Block:

```
vorlage;gruppe;gruppe_untertitel;titel;hinweis;erwartet;gehoert_zu;frage;block_name;block_feld
Energieberatung;Bisherige Sanierungen;;Bereits durchgeführte Sanierungen;;1;;Wurden schon Sanierungen durchgeführt?;Maßnahme;Art der Maßnahme und Jahr
Energieberatung;Bisherige Sanierungen;;Rechnung oder Nachweis;;1;Bereits durchgeführte Sanierungen;;;
```

Der Kunde beantwortet die Frage. "Nein" erledigt die Position. Bei "Ja" legt er je Maßnahme einen
Block an ("Maßnahme hinzufügen"), benennt ihn und lädt die Unterpositionen dort hoch. Erledigt ist
die Position, wenn jede Unterposition mindestens eine Datei hat oder ihr sie auf `geprueft` setzt.

## Werkzeuge

```bash
node tools/checkliste.js --pruefen checklisten/meine.csv
```

```bash
node tools/checkliste.js --liste checklisten/meine.csv
```

```bash
node tools/vorschau.js --checkliste checklisten/meine.csv
```

```bash
node tools/checkliste.js checklisten/meine.csv
```

Der letzte Befehl übernimmt die Datei nach `apps-script/Konfig.gs`. Die Ersteinrichtung trägt
die Vorlagen dann ins Blatt **Checklisten** ein. Läuft die Tabelle schon, gibt
`node tools/checkliste.js --tsv checklisten/meine.csv` die Zeilen zum Einfügen aus: im Blatt
**Checklisten** die erste freie Zelle in Spalte A markieren und einfügen.

## Gute Checklisten

- Nur was der Kunde liefern kann, nicht was ihr selbst erstellt.
- Titel so, wie der Kunde das Dokument kennt.
- 2 bis 4 Gruppen, höchstens rund 20 Positionen je Vorlage. Lieber zwei Vorlagen als eine lange.
- Optionales mit "Falls vorhanden" im Hinweis, dann kann der Kunde es als "nicht vorhanden" melden.

## Einzelfall anpassen

Für einen laufenden Fall direkt im Blatt **Positionen** arbeiten: Zeilen mit seiner `fall_id`
auf `entfaellt` setzen oder neue Zeilen ergänzen (`key` eindeutig innerhalb des Falls, z. B.
`p-zusatz-1`, `status` = `offen`, `dateien` = 0). Die Kundenseite zeigt den neuen Stand beim
nächsten Aufruf. Änderungen an einer Vorlage wirken nur auf neue Fälle.

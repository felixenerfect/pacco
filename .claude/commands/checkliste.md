---
description: Checkliste für die Upload-Strecke erstellen, übernehmen oder überarbeiten. Für jede Branche. Läuft im Setup mit, ist aber auch jederzeit allein aufrufbar.
---

# Checklisten-Workstream

Ziel: je Leistung des Nutzers eine Checkliste, die Kunden ohne Rückfrage abarbeiten können.
Ergebnis ist eine CSV-Datei in `checklisten/` (gehört ins Repo des Nutzers, keine Kundendaten),
geprüft mit `tools/checkliste.js` und übernommen in `apps-script/Konfig.gs`.

Gleicher Grundsatz wie im Setup: **erst einfordern und ableiten, dann nur Lücken fragen.**

## 1 · Quelle klären (ohne Frage, wenn schon bekannt)

Was liegt vor? Im Setup kennst du Website, Leistungen und ggf. eine mitgelieferte Liste schon.
- **Vorhandene Checkliste** (Excel, CSV, Word, PDF, Foto, eingefügter Text, alte Kundenmail):
  vollständig lesen und in das Format übertragen (Schritt 3). Nichts weglassen, nichts erfinden.
  Unklare Positionen markieren statt raten.
- **Keine Liste:** Entwurf erarbeiten (Schritt 2).
- Bietet der Nutzer mehrere Leistungen an (Website, Leistungsseite), je Leistung eine Vorlage
  vorschlagen, höchstens die drei wichtigsten. Weitere lassen sich später mit `/checkliste` anlegen.

## 2 · Entwurf erarbeiten (ohne Fragen)

1. **Bibliothek zuerst:** `vorlagen/checklisten/` ansehen (Finanzierung, Energieberatung,
   Allgemein). Passt eine Vorlage zur Branche, als Ausgangspunkt nehmen und an die Leistungen von
   der Website anpassen.
2. **Sonst aus Fachwissen:** Welche Unterlagen braucht der Nutzer typischerweise vom Kunden, um
   diese Leistung zu erbringen? Website-Texte (Leistungen, Ablauf, FAQ) als Hinweis nutzen. Gibt
   es Förder- oder Behördenvorgaben, die Unterlagen verlangen (z. B. Förderprogramme, Anträge),
   diese berücksichtigen, aber als **fachlich prüfen** kennzeichnen, weil sich Vorgaben ändern.
3. **Regeln für jede Position:**
   - Nur Unterlagen, die der **Kunde** liefern kann. Was der Nutzer selbst erstellt (Gutachten,
     Berechnungen, Anträge), gehört nicht hinein.
   - Titel aus Kundensicht, so wie der Kunde das Dokument kennt ("Heizkostenabrechnung", nicht
     "Verbrauchskennwert").
   - Hinweis, wo er es findet oder wie es aussehen soll ("Gut lesbar, mit Baujahr").
   - `erwartet` > 1, wenn mehrere Dateien nötig sind (3 Jahresabrechnungen, 4 Fassadenfotos).
   - "Falls vorhanden" im Hinweis für Optionales. Der Kunde kann es dann als "nicht vorhanden"
     melden.
   - Was es mehrfach geben kann (Objekte, Maßnahmen, Personen, Fahrzeuge): Elternposition mit
     Ja/Nein-`frage`, `block_name` (Einzahl: Objekt, Maßnahme, Gesellschafter) und `block_feld`
     (womit der Kunde den Block benennt: "Adresse des Objekts"), darunter Unterpositionen mit
     `gehoert_zu`.
   - 2 bis 4 Gruppen, höchstens rund 20 Positionen je Vorlage. Lieber zwei Vorlagen als eine zu
     lange.
   - Ansprache wie in den Einstellungen (`ansprache`): "Zu Ihrem Haus" oder "Zu deinem Haus",
     "wir" oder "ich" wie die Website. Die Bibliothek ist in Sie-Form, beim Übernehmen anpassen.
   - Keine Hinweise wie "liegt der Einladung bei": Die Mails haben keine Anhänge. Besser "Die
     Vorlage erhalten Sie von uns".
   - Spätere Projektphasen (z. B. Verwendungsnachweis nach der Umsetzung, Schlussrechnung) als
     eigene Vorlage, die man später als neuen Fall anlegt. Nicht in die erste Liste mischen.
   - Reine Angaben ohne Dokument (Baujahr, Leerstand, Personenzahl) gehören nicht in die
     Checkliste. Sie kommen per Telefon, Termin oder ein ausfüllbares PDF als eigene Position.
4. **Fachlich prüfen:** Alles, was auf Förder-, Rechts- oder Behördenvorgaben beruht oder dir nicht
   sicher ist, im Protokoll `einrichtung.local.md` unter "Fachlich offen" notieren (Vorlage,
   Position, was zu prüfen ist). Die Liste bekommt der Nutzer in der Abstimmung und im Abschluss.

## 3 · In das Format bringen

CSV mit Semikolon, UTF-8, Kopfzeile:

```
vorlage;gruppe;gruppe_untertitel;titel;hinweis;erwartet;gehoert_zu;frage;block_name;block_feld
```

Datei: `checklisten/<branche-oder-leistung>.csv`, mehrere Vorlagen dürfen in einer Datei stehen.
Dann prüfen:

```bash
node tools/checkliste.js --pruefen checklisten/<datei>.csv
```

Fehler beheben, Hinweise (zu viele Positionen, fehlender block_name) bewerten.

## 4 · Mit dem Nutzer abstimmen (eine Runde)

`node tools/checkliste.js --liste checklisten/<datei>.csv` ergibt eine lesbare Übersicht. Zeige
sie kompakt, darunter die Punkte aus "Fachlich offen", und stelle genau eine Frage: "Passt die
Checkliste so? Was fehlt, was ist zu viel?" Nennt der Nutzer Änderungen, einarbeiten, erneut
prüfen und das Ergebnis in einem Satz bestätigen lassen. Ohne Änderungswunsch ist die Liste fertig.

Im Setup läuft diese Abstimmung zusammen mit der Freigabe der Vorschau, keine eigene Runde.
`node tools/vorschau.js --checkliste checklisten/<datei>.csv` zeigt, wie der Kunde sie sieht.

## 5 · Übernehmen

- **Vor der Ersteinrichtung** (im Setup):
  `node tools/checkliste.js checklisten/<datei>.csv [weitere.csv]` schreibt alle Vorlagen nach
  `apps-script/Konfig.gs`. Die Ersteinrichtung trägt sie ins Blatt **Checklisten** ein, der
  Musterfall nutzt die erste Vorlage.
- **Tabelle läuft schon:** `node tools/checkliste.js --tsv checklisten/<datei>.csv` ausgeben, der
  Nutzer markiert im Blatt **Checklisten** die erste freie Zelle in Spalte A und fügt ein.
  Zusätzlich die Datei wie oben nach `Konfig.gs` übernehmen, damit eine spätere Reparatur denselben
  Stand hat. Bestehende Fälle bleiben unverändert, neue Fälle können die Vorlage sofort wählen.
- Danach im Protokoll (`einrichtung.local.md`) vermerken, welche Vorlagen es gibt.

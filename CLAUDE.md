# Upload-Strecke · Anweisung für Claude

Dieses Repo ist eine Unterlagen-Upload-Strecke für Kunden (z. B. Finanzierungsunterlagen),
komplett im Google Workspace: Google-Tabelle als Fallverwaltung, Google Drive als Ablage,
Gmail für Einladungen und Erinnerungen, Apps Script als Kundenseite.

## Erster Start: Einrichtung führen

**Fehlt `apps-script/Konfig.gs`, ist die Strecke noch nicht eingerichtet.** Dann begrüße den
Nutzer in einem Satz und starte `.claude/commands/einrichten.md` (auch als `/einrichten`
aufrufbar). Nicht auf eine Aufforderung warten, die Einrichtung ist der Zweck der ersten Sitzung.

Grundsatz der Einrichtung: erst Website, Design-Skill, vorhandene Checkliste und Google-Anmeldung
einfordern, daraus alles ableiten, dann nur nach dem fragen, was wirklich fehlt. Keine Frage, die
sich selbst beantworten lässt.

Die Strecke ist branchenoffen. Checklisten entstehen mit `.claude/commands/checkliste.md` (auch als
`/checkliste` jederzeit aufrufbar): vorhandene Liste übernehmen oder aus Leistungen und Bibliothek
(`vorlagen/checklisten/`) einen Entwurf erarbeiten.

Existiert `apps-script/Konfig.gs`, aber `einrichtung.local.md` meldet offene Schritte, dort
weitermachen.

## Aufbau

| Pfad | Inhalt |
|---|---|
| `apps-script/Code.gs` | Kundenseite (`doGet`), Upload, Meldung "nicht vorhanden", Tabellenhilfen |
| `apps-script/Verwaltung.gs` | Menü in der Tabelle, Ersteinrichtung, Fälle, Mails, täglicher Prüflauf, Musterdaten |
| `apps-script/Texte.gs` | Wortlaut der Kundenseite in Du- und Sie-Fassung |
| `apps-script/index.html` | Kundenseite (Struktur und Verhalten) |
| `apps-script/Design.html` | Farben, Schrift, Radien, Logogröße. Einzige Stelle für das Aussehen |
| `apps-script/Logo.html` | Logo als https-Adresse oder data:-URI |
| `apps-script/Mail.html` | HTML-Rahmen der Kundenmails, Farben aus Design.html |
| `apps-script/NeuerFall.html` | Dialog "Neuer Fall" in der Tabelle |
| `apps-script/Konfig.gs` | persönlich, nicht im Repo (Web-App-Adresse, Domain, Startwerte) |
| `vorlagen/Konfig.beispiel.gs` | Vorlage dafür |
| `vorlagen/checklisten/` | Bibliothek: Finanzierung, Energieberatung, Allgemein (CSV) |
| `checklisten/` | eigene Checklisten des Nutzers (CSV, gehören ins eigene Repo) |
| `domain/` | Einbettung unter eigener Domain (PHP oder statisch) |
| `docs/` | Anleitungen für Menschen |

## Regeln

- **Keine persönlichen Daten ins Repo.** Namen, Mailadressen, Telefonnummern, Script-IDs,
  Deployment-IDs, Ordner-IDs, Tokens und Kundendaten gehören nur in `apps-script/Konfig.gs`,
  `einrichtung.local.md`, `ausgabe/` oder in die Google-Tabelle. Alle vier sind von git
  ausgeschlossen bzw. liegen nicht im Repo. Vor jedem Commit prüfen.
- **Aussehen nur in `Design.html` und `Logo.html`**, Wortlaut nur in `Texte.gs`. Mailtexte,
  Checklisten und Einstellungen stehen in der Google-Tabelle, nicht im Code.
- Nach jeder Codeänderung: `clasp push -f`, danach `clasp deploy -i <DEPLOYMENT_ID>`, sonst
  sieht der Kunde den alten Stand. Die Deployment-ID steht in `einrichtung.local.md`.
- Das Token ist die einzige Hürde der öffentlichen Seite. Keine Funktion bauen, die Dateien
  auflistet, ausliefert oder löscht.
- Nur PDF und Bilder annehmen. Die Prüfung der ersten Bytes (`magicPasst_`) nicht entfernen.
- Jede Funktion ohne Unterstrich am Namensende ist über die öffentliche Seite aufrufbar. Neue
  Verwaltungsfunktionen beginnen deshalb mit `nurBetreiber_()`, Hilfsfunktionen enden auf `_`.
- Werte für die Tabelle über `anhaengen_`/`schreiben_` schreiben (Formelschutz, nur geänderte Zellen).
- Nach Änderungen: `node tools/test-lokal.js` muss bestehen.

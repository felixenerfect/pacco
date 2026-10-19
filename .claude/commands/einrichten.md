---
description: Upload-Strecke für jede Branche einrichten. Fordert Website, Design-Skill, vorhandene Checkliste und Google-Anmeldung ein, leitet daraus alles ab, fragt nur Lücken nach und richtet Tabelle, Drive, Web-App, Mails und Domain ein.
---

# Einrichtung der Upload-Strecke

Du führst den Nutzer vom leeren Repo zur laufenden Upload-Strecke. Ziel am Ende: eine
Google-Tabelle mit Musterfall, ein funktionierender Kundenlink, ein Testupload im Drive, ein
Testmail-Entwurf und auf Wunsch die eigene Domain.

**Grundsatz: Erst einfordern, dann ableiten, dann nur Lücken fragen.**
- Keine Frage stellen, die sich aus Website, Design-Skill, Google-Konto oder einer Prüfung selbst
  beantworten lässt. Abgeleitetes zeigst du einmal gesammelt zur Bestätigung, nicht einzeln.
- Vorgaben (Fristen, Signatur) werden nicht erfragt, sondern in der Zusammenfassung
  genannt. Wer etwas anders will, sagt es dort.
- Einzige Pflichtentscheidung, die immer ausdrücklich abgefragt wird: der Mailversand.
- Alles sofort in `einrichtung.local.md` protokollieren, je Wert mit Quelle (Website, Skill,
  Konto, Vorgabe, Nutzer). Datei ist von git ausgeschlossen. Bricht die Sitzung ab, geht es dort
  weiter.
- Browser-Schritte macht der Nutzer selbst. Sag genau, wo er klickt, und warte auf "fertig".
- Nichts erfinden. Was weder ableitbar noch Vorgabe ist, gehört in die Lückenfragen.

---

## Schritt 0 · Voraussetzungen (ohne Fragen)

1. `einrichtung.local.md` anlegen: Überschrift, Datum, Checkliste der Schritte 0 bis 9.
2. `node --version` (ab 20) und `clasp --version` (ab 3) ausführen.
   - Fehlt node: Nutzer bittet, Node.js LTS von nodejs.org zu installieren, danach neu prüfen.
   - Fehlt clasp: `npm install -g @google/clasp` selbst ausführen.

## Schritt 1 · Alles auf einmal einfordern

Eine einzige Nachricht an den Nutzer, sinngemäß:

> Damit ich möglichst wenig fragen muss, brauche ich vier Dinge:
> 1. **Eure Website-Adresse.** Daraus lese ich Firmenname, Anschrift, Telefon, Mail, Logo und
>    eure Ansprache (Du oder Sie).
> 2. **Euer Design-Skill oder Styleguide** (Pfad zu SKILL.md, PDF oder Ordner). Daraus übernehme
>    ich Farben, Schrift und Formen. Habt ihr keinen, nehme ich die Farben von der Website.
> 3. **Eure bisherige Unterlagen-Checkliste, falls es eine gibt** (Excel, Word, PDF, Foto oder
>    einfach als Text hier hinein). Gibt es keine, erarbeite ich aus euren Leistungen einen Entwurf.
> 4. **Google-Anmeldung:** Ich öffne gleich ein Anmeldefenster. Melde dich mit dem Google-Konto an,
>    unter dem die Strecke laufen soll (am besten euer Firmenkonto bei Google Workspace).
>
> Wenn du schon weißt, dass etwas anders sein soll (z. B. Du statt Sie, anderer Ansprechpartner),
> schreib es einfach dazu.

Danach sofort `clasp login` im Hintergrund starten. Die Anmeldung läuft, während der Nutzer die
Angaben schreibt.

## Schritt 2 · Ableiten (ohne Fragen)

**Aus dem Google-Konto**
- Nach abgeschlossener Anmeldung `clasp show-authorized-user` → Kontoadresse.
- Endet sie auf gmail.com oder googlemail.com: privates Konto. Dann in der Zusammenfassung den
  Hinweis aus `docs/08-datenschutz.md` geben (keine Auftragsverarbeitung für private Konten).
  Sonst Workspace.
- Apps Script API: Ob sie an ist, zeigt Schritt 5. Nur wenn clasp dort mit "User has not enabled
  the Apps Script API" scheitert, den Nutzer bitten, sie unter
  https://script.google.com/home/usersettings einzuschalten.

**Aus der Website** (Startseite, Impressum, Kontakt, Datenschutz lesen)
- `firma_name` (Name laut Impressum, mit Rechtsform), `adresse`, `telefon`, `email`
  (Kontaktadresse), `website`
- `ansprechpartner`: Geschäftsführer oder Inhaber laut Impressum
- `ansprache`: Duzt oder siezt die Website ihre Besucher? Uneindeutig → Sie.
- `thema` und `thema_artikel`: Wofür sammelt der Nutzer Unterlagen? Ein Wort aus Kundensicht
  (Energieberatung, Baufinanzierung, Steuererklärung, Sanierungsfahrplan) und der passende
  Artikel für "Ihre Unterlagen für die Energieberatung" (die, den, das). Uneindeutig → Beratung, die.
- Leistungen: Welche Leistungen bietet der Nutzer an (Leistungsseite, Startseite)? Grundlage für
  die Checklisten.
- Logo: Der Kopfbereich der Upload-Seite und der Mails ist dunkel (Markenfarbe). Gebraucht wird
  die helle oder weiße Fassung des Logos als https-Adresse. Alle Logo-Bilder der Website (Kopf,
  Fußzeile) prüfen, wenn möglich das Bild ansehen statt nur den Dateinamen zu deuten. Keine helle
  Fassung vorhanden: Schriftzug statt Logo.
- `termin_link`: Steht auf der Website ein Buchungslink (z. B. Calendly, cal.com, Google
  Terminbuchung), übernehmen. Sonst leer.
- Hosting: Antwort-Header der Startseite (`Server`, `X-Powered-By`) und Endungen der Seiten
  prüfen. PHP erkennbar → PHP-Variante. Statischer Hoster (Netlify, Vercel, GitHub Pages,
  Cloudflare Pages) → statische Variante. Baukasten (Wix, Jimdo, Squarespace) → Subdomain-Weg aus
  `docs/02-domain.md`. Nicht erkennbar → statische Variante, die läuft überall.

**Aus dem Design-Skill oder Styleguide** (vollständig lesen; ohne Skill: Farben und Schrift der
Website aus deren CSS)
- Farben, Schrift, Radien und Logo-Regeln nach Schritt 4.
- Ansprache und Tonalität, falls dort festgelegt. Sie haben Vorrang vor der Website.

**Vorgaben ohne Frage** (nur in der Zusammenfassung nennen)
- Linklaufzeit 21 Tage ab Einladung, Erinnerungen Tag 7 und 14, Pause 3 Tage nach einem Upload
- Tagesmeldung morgens: ja
- Absendername: Firmenname · Signatur: automatisch aus Ansprechpartner, Firma, Telefon
- Antworten an: die Kontaktadresse von der Website, wenn sie vom Google-Konto abweicht
- Kopie an: leer · Terminlink: nur wenn auf der Website gefunden
- Checklisten: aus der mitgelieferten Liste, sonst Entwurf je Hauptleistung (höchstens drei)
- Kundenlinks unter der eigenen Website, wenn eine Website da ist

## Schritt 3 · Zusammenfassung, Mailversand und Lücken (eine Nachricht)

1. Tabelle aller Werte mit Quelle, Lücken als **fehlt** markiert. Kurz halten, eine Zeile je Wert.
   Eine Zeile "Checklisten" mit den geplanten Vorlagen (z. B. "Sanierungsfahrplan (iSFP),
   Förderung Einzelmaßnahme: Entwurf aus euren Leistungen" oder "aus eurer Excel-Liste").
2. Darunter genau diese Fragen, nicht mehr:
   - **Immer:** "Wie sollen Einladungen und Erinnerungen rausgehen?"
     [Entwurf (empfohlen): Gmail-Entwurf, du prüfst und sendest]
     [Automatisch senden] [Aus: du verschickst die Links selbst]
   - **Nur für fehlende Werte:** je fehlendem Wert eine kurze Frage.
   - **Abschluss:** "Passt der Rest so? Änderungen einfach nennen."
3. Antworten ins Protokoll, dann ohne weitere Rückfrage weiter.

## Schritt 4 · Konfiguration, Design, Vorschau

1. `vorlagen/Konfig.beispiel.gs` nach `apps-script/Konfig.gs` kopieren, `STARTWERTE` füllen,
   `KONFIG.WEBAPP_URL` und `KONFIG.LINK_BASIS` vorerst leer. Zeilenumbrüche als `\n`.
2. Design in `apps-script/Design.html`:
   - `--marke` (Hauptfarbe), `--marke-dunkel` (rund 25 % dunkler), `--marke-verlauf` und
     `--marke-mittel` (zwei hellere Stufen für den Hero-Verlauf), `--marke-hell` und `--marke-blass`
     (sehr helle Flächen)
   - `--hero-akzent` (hervorgehobenes Wort im Hero): helle Fassung der Akzentfarbe, sonst eine sehr
     helle Stufe der Markenfarbe
   - `--akzent`, `--akzent-hell`, `--light` (Seitenhintergrund)
   - `--schrift` plus passender Google-Fonts-Link oben in der Datei
   - `--rad-gross`, `--rad-mittel`, `--rad-klein`, `--rad-knopf` (eckige Marke: alle 0 bis 6px,
     runde Marke: Knopf 999px), `--logo-hoehe`
   - Ist die Marke grün, `--gruen` (Status "erledigt") deutlich anders wählen.
3. Kontraste nach WCAG ausrechnen, nicht schätzen: Weiß auf `--marke`, Weiß auf `--marke-mittel`
   (Ende des Hero-Verlaufs) und `--marke` auf Weiß je mindestens 4,5 : 1, `--akzent` auf Weiß und auf `--light` mindestens 4,5 : 1,
   `--hero-akzent` auf `--marke` und `--marke-mittel` mindestens 3 : 1. Fällt ein Wert durch,
   Farbe anpassen und dem Nutzer Original, neuen Wert und Grund in einem Satz nennen.
4. Logo in `apps-script/Logo.html`: die https-Adresse der hellen Fassung von der Website. Mails
   zeigen nur PNG oder JPG (Gmail und Outlook blenden SVG und data:-Bilder aus, dann steht dort
   der Schriftzug). Gibt es das Logo nur als SVG, auf der Website nach einer PNG-Fassung suchen
   und sonst den Nutzer in der Zusammenfassung darauf hinweisen.
5. Wortlaut in `Texte.gs` und den Mailtexten (`MUSTER_MAILS` in `Verwaltung.gs`, vor der
   Ersteinrichtung) nur ändern, wenn der Skill den Mustertexten ausdrücklich widerspricht oder die
   Website durchgehend in der Ich-Form spricht (Einzelunternehmer): dann "wir/uns" in "ich/mich"
   umstellen.
6. **Checklisten** nach `.claude/commands/checkliste.md`, Abschnitte 1 bis 3 und 5: mitgelieferte
   Liste übernehmen oder Entwurf aus Bibliothek und Leistungen, als `checklisten/*.csv` speichern,
   prüfen, mit `node tools/checkliste.js checklisten/*.csv` nach `Konfig.gs` übernehmen.
7. `node tools/vorschau.js` (zeigt die erste Checkliste) und `node tools/mailvorschau.js`. Mit
   Browser-Werkzeug öffnen und Screenshots zeigen, sonst Pfade nennen (Doppelklick öffnet sie).
   Dazu die Checklisten-Übersicht aus `node tools/checkliste.js --liste checklisten/*.csv`, Stellen
   mit **fachlich prüfen** markiert. Eine Frage für alles: "So sehen Seite, Mails und Checklisten
   aus. Passt das, oder was fehlt bzw. ist zu viel?"

## Schritt 5 · Google-Projekt anlegen und bereitstellen (ohne Fragen)

Erst bereitstellen, dann die Ersteinrichtung im Browser: So hat der Musterfall sofort seinen Link,
und der Nutzer muss nur einmal in die Tabelle.

1. Gibt es schon eine `.clasp.json` (abgebrochener früherer Versuch), deren `scriptId` und
   `parentId` übernehmen und bei Punkt 2 weitermachen. Sonst:
   `clasp create-script --type sheets --title "<Firmenname> Upload-Strecke" --rootDir apps-script`
   Scheitert das mit "User has not enabled the Apps Script API": Nutzer bitten, sie unter
   https://script.google.com/home/usersettings einzuschalten, dann wiederholen.
2. clasp überschreibt dabei `apps-script/appsscript.json`. Immer danach `vorlagen/appsscript.json`
   nach `apps-script/appsscript.json` kopieren und prüfen, dass der Block `"webapp"` drin ist.
3. `clasp push -f`, dann `clasp deploy -d "Upload-Strecke"`. Deployment-ID (beginnt mit `AKfy`)
   ins Protokoll.
4. In `apps-script/Konfig.gs`: `KONFIG.WEBAPP_URL = 'https://script.google.com/macros/s/<ID>/exec'`.
   `LINK_BASIS` bleibt leer, bis die Domain-Datei nachweislich liegt (Schritt 8). Sonst zeigen
   Links auf eine Adresse, die es noch nicht gibt.
5. `clasp push -f` und `clasp deploy -i <ID> -d "Konfiguration"`. Dieselbe ID behalten.
6. Tabellen-Adresse: `parentId` aus `.clasp.json` → `https://docs.google.com/spreadsheets/d/<parentId>/edit`.

## Schritt 6 · Ersteinrichtung in der Tabelle (einzige Browser-Runde)

Dem Nutzer genau so sagen:
1. Tabelle öffnen (Link), F5 drücken, rund 10 Sekunden warten. Oben neben "Hilfe" erscheint das
   Menü **Upload-Strecke**.
2. **Upload-Strecke → Ersteinrichtung / Reparatur**.
3. Fenster "Autorisierung erforderlich": **Weiter**, Konto wählen. Bei "Google hat diese App nicht
   überprüft": **Erweitert → Weiter zu … (unsicher)**, dann **Zulassen**. Das ist normal für
   eigene Skripte.
4. **Ersteinrichtung** noch einmal starten. Es erscheint "Ersteinrichtung abgeschlossen" mit dem
   Link des Musterfalls Max Mustermann. Den Link bitte hier einfügen.

## Schritt 7 · Selbst prüfen (ohne Fragen)

1. Öffentlich erreichbar?
   `curl -s -o /dev/null -w "%{http_code} %{redirect_url}" "<WEBAPP_URL>?t=pruefung"`
   - `200`: Kunden erreichen die Seite ohne Google-Konto.
   - Weiterleitung auf accounts.google.com oder `401`/`403`: Workspace lässt keine öffentlichen
     Web-Apps zu. Erst jetzt fragen, ob der Nutzer Admin ist, und den fertigen Text für den Admin
     aus `docs/07-fehlerbilder.md` mitgeben. Nach der Freigabe `clasp deploy -i <ID>` und erneut prüfen.
2. Musterfall-Link aus Schritt 6 abrufen: muss `200` liefern.

## Schritt 8 · Domain (nur bei eigener Website)

1. `node tools/domaindatei.js` (PHP) oder `node tools/domaindatei.js --statisch`. Ergebnis in
   `ausgabe/unterlagen/`, zusätzlich `ausgabe/unterlagen.zip` erstellen.
2. Eine Nachricht, keine Frage: "Lade den Ordner `ausgabe/unterlagen` ins Hauptverzeichnis eurer
   Website (FTP oder Dateimanager des Hosters, dort, wo die Startseite liegt), sodass
   <website>/unterlagen/ erreichbar ist. Macht das jemand anderes für euch, gib ihm
   `ausgabe/unterlagen.zip` mit genau diesem Satz. Schreib 'hochgeladen', wenn es erledigt ist."
   Sonderfälle: `docs/02-domain.md`.
3. Selbst prüfen mit einem Test-Schlüssel im gültigen Format (kein echter Fall nötig):
   `curl -s -o /dev/null -w "%{http_code}" "https://<website>/unterlagen/?t=0000000000000000000000000000000000000000"`
   `200` heißt: Datei liegt richtig. `404` heißt: falscher Ordner oder Datei fehlt.
4. Erst bei `200` umstellen: `KONFIG.LINK_BASIS = 'https://<website>/unterlagen/'`, dann
   `clasp push -f` und `clasp deploy -i <ID> -d "Domain"`. Ab jetzt gehen alle Mails mit dem
   Domain-Link raus, die Spalte `link` in der Tabelle zieht der nächste Prüflauf nach. Den
   Musterfall-Link für den Probelauf baust du selbst: `https://<website>/unterlagen/?t=<Token aus
   dem Link von Schritt 6>`.
5. Lädt der Nutzer später hoch: im Protokoll vermerken ("Domain offen"), den Probelauf mit dem
   Google-Link machen und Punkt 3 und 4 nachholen, sobald er "hochgeladen" meldet, auch in einer
   späteren Sitzung.

## Schritt 9 · Probelauf und Abschluss

1. Den Musterfall-Link (nach Schritt 8 mit Domain) im privaten Browserfenster öffnen lassen:
   erste Checkliste, zwei Positionen schon als erledigt markiert.
2. Nutzer lädt eine PDF oder ein Handyfoto bei einer offenen Position hoch: Datei im Drive-Ordner,
   Zeile im Blatt Eingaenge, nach Neuladen zählt sie weiter.
3. Fall-Zeile markieren, **Upload-Strecke → Einladung für markierten Fall**: gestalteter Entwurf
   in Gmail oder Mail im eigenen Postfach, je nach Mailmodus.
4. **Upload-Strecke → Selbsttest**: alles OK.
5. Protokoll vervollständigen, mit dem Abschnitt "Fachlich offen" aus dem Checklisten-Workstream.
   `git status`: `apps-script/Konfig.gs`, `.clasp.json`,
   `einrichtung.local.md` und `ausgabe/` dürfen nicht auftauchen. `Design.html` und `Logo.html`
   sind gewollt geändert.
6. Dem Nutzer in sechs Zeilen sagen, wie er ab jetzt arbeitet: Neuer Fall über das Menü ·
   Eingänge im Drive und morgens die Tagesmeldung · Geprüftes auf `geprueft`, Unnötiges auf
   `entfaellt` · Checklisten und Mailtexte direkt in der Tabelle · Musterfall auf `abgeschlossen` ·
   Datenschutzerklärung der Website um den Upload ergänzen (`docs/08-datenschutz.md`).

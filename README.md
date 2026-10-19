# Upload-Strecke

Kunden laden ihre Unterlagen über einen persönlichen Link hoch, Position für Position nach
einer Checkliste. Für jede Branche: Energieberatung, Finanzierung, Steuerberatung, Hausverwaltung
oder alles andere, wo Unterlagen von Kunden kommen. Du siehst in einer Google-Tabelle, was da
ist und was fehlt. Einladungen und Erinnerungen entstehen automatisch als Gmail-Entwurf oder gehen
direkt raus.

Alles läuft im eigenen Google Workspace. Keine Server, keine Datenbank, keine monatlichen Kosten.

Wie alles zusammenspielt, zeigen die Schaubilder unter [So funktioniert es](#so-funktioniert-es).

## Was drin ist

- **Kundenseite** mit Checkliste, Upload je Position, Foto direkt vom Handy, Meldung "liegt nicht
  vor" mit Grund, Fortschrittsanzeige. Du- oder Sie-Ansprache, eigenes Design und Logo.
- **Google-Tabelle als Fallverwaltung** mit Menü: Neuer Fall, Einladung, Link verlängern, Link
  sperren, Erinnerungen prüfen, Selbsttest.
- **Checklisten für jede Branche:** Claude übernimmt eure vorhandene Liste oder erarbeitet aus
  euren Leistungen einen Entwurf (`/checkliste`). Bibliothek mit Beispielen für Energieberatung,
  Finanzierung und Allgemein in `vorlagen/checklisten/`. Mehrfach-Blöcke für Objekte, Maßnahmen
  oder Personen.
- **Gestaltete HTML-Mails** für Einladung, Erinnerung 1 und letzte Erinnerung, im Design der
  Kundenseite mit Knopf zum Upload, je in Du und Sie, Texte in der Tabelle änderbar.
- **Täglicher Prüflauf**: zählt Offenes, schickt Erinnerungen an Tag 7 und 14, meldet dir Tag 21,
  Tagesmeldung mit neuen Eingängen.
- **Eigene Domain** (optional): `https://www.deine-firma.de/unterlagen/?t=…` statt Google-Adresse.
- **Sicherheit**: Link mit zufälligem Schlüssel (rund 150 Bit), nur PDF und Bilder (Prüfung der
  Dateisignatur), keine Lese- oder Löschfunktion für Kunden, Verwaltungsfunktionen nur aus der Tabelle aufrufbar,
  Kundentexte können keine Tabellenformeln auslösen, Grenzen je Datei und je Fall, Sperre wirkt sofort.

## So funktioniert es

### 1 · Überblick: wer, was, wo

Alles bleibt in deinem Google-Konto. Der Kunde braucht kein Konto, nur seinen Link.

```mermaid
%%{init: {"theme": "base", "themeVariables": {"fontFamily": "Roboto, Arial, sans-serif", "fontSize": "14px", "primaryColor": "#FBF1F1", "primaryBorderColor": "#C89FA0", "primaryTextColor": "#1F2937", "secondaryColor": "#F5DCDC", "tertiaryColor": "#F8F8F7", "lineColor": "#848484", "textColor": "#1F2937", "edgeLabelBackground": "#FFFFFF", "clusterBkg": "#F8F8F7", "clusterBorder": "#E5E7EB", "titleColor": "#4B5563", "actorBkg": "#FBF1F1", "actorBorder": "#862B2C", "actorTextColor": "#1F2937", "actorLineColor": "#C89FA0", "signalColor": "#4B5563", "signalTextColor": "#1F2937", "noteBkgColor": "#F5DCDC", "noteBorderColor": "#BD6564", "noteTextColor": "#1F2937", "sequenceNumberColor": "#FFFFFF", "labelBoxBkgColor": "#FBF1F1", "labelBoxBorderColor": "#C89FA0", "stateBkg": "#FBF1F1", "stateBorder": "#862B2C"}}}%%
flowchart TD
    B(["Du"])
    K(["Kunde<br/>Browser oder Handy"])
    subgraph konto["In deinem Google-Konto"]
        T["Google-Tabelle<br/>Fälle · Checklisten · Mailtexte"]
        G["Gmail<br/>Einladungen und Erinnerungen"]
        S["Kundenseite<br/>unter eurer Domain"]
        D["Google Drive<br/>ein Ordner je Fall"]
        P["Prüflauf<br/>täglich 8 Uhr"]
    end

    B -- "1 · Neuer Fall" --> T
    T -- "2 · Einladung mit Link" --> G
    G -- "3 · Mail mit Knopf" --> K
    K -- "4 · öffnet Link, lädt hoch" --> S
    S -- "5 · Dateien" --> D
    S -- "6 · Eingänge, Status" --> T
    P -. "liest" .-> T
    P -. "Erinnerung" .-> G
    P -. "Tagesmeldung" .-> B

    classDef person fill:#FFFFFF,stroke:#862B2C,stroke-width:2px,color:#862B2C,font-weight:bold
    classDef system fill:#FBF1F1,stroke:#C89FA0,stroke-width:1px,color:#1F2937
    classDef frage fill:#F5DCDC,stroke:#BD6564,stroke-width:1px,color:#1F2937
    classDef ende fill:#FFFFFF,stroke:#862B2C,stroke-width:2px,color:#1F2937,font-weight:bold
    class B,K person
    class T,G,S,D,P system
    style konto fill:#F8F8F7,stroke:#E5E7EB,color:#4B5563
```

### 2 · Ein Fall von Anfang bis Ende

```mermaid
%%{init: {"theme": "base", "themeVariables": {"fontFamily": "Roboto, Arial, sans-serif", "fontSize": "14px", "primaryColor": "#FBF1F1", "primaryBorderColor": "#C89FA0", "primaryTextColor": "#1F2937", "secondaryColor": "#F5DCDC", "tertiaryColor": "#F8F8F7", "lineColor": "#848484", "textColor": "#1F2937", "edgeLabelBackground": "#FFFFFF", "clusterBkg": "#F8F8F7", "clusterBorder": "#E5E7EB", "titleColor": "#4B5563", "actorBkg": "#FBF1F1", "actorBorder": "#862B2C", "actorTextColor": "#1F2937", "actorLineColor": "#C89FA0", "signalColor": "#4B5563", "signalTextColor": "#1F2937", "noteBkgColor": "#F5DCDC", "noteBorderColor": "#BD6564", "noteTextColor": "#1F2937", "sequenceNumberColor": "#FFFFFF", "labelBoxBkgColor": "#FBF1F1", "labelBoxBorderColor": "#C89FA0", "stateBkg": "#FBF1F1", "stateBorder": "#862B2C"}}}%%
sequenceDiagram
    autonumber
    actor B as Du
    participant T as Google-Tabelle
    participant G as Gmail
    actor K as Kunde
    participant S as Kundenseite
    participant D as Drive

    B->>T: Neuer Fall (Name, Mail, Checkliste)
    T->>D: Ordner für den Fall anlegen
    T->>G: Einladung als Entwurf oder direkt gesendet
    G->>K: Mail mit Knopf "Unterlagen hochladen"
    K->>S: öffnet den persönlichen Link
    S->>D: legt jede Datei bei ihrer Position ab
    S->>T: Eingang protokolliert, Position "eingegangen"
    K->>S: meldet "liegt nicht vor" mit Grund
    S->>T: Hinweis landet in der Tabelle
    Note over T: Prüflauf täglich 8 Uhr: Offenes zählen
    T->>G: Erinnerung, wenn noch etwas fehlt
    T->>B: Tagesmeldung mit neuen Eingängen
    B->>T: Geprüftes abhaken, Fall abschließen
```

### 3 · Zeitplan der Erinnerungen

```mermaid
%%{init: {"theme": "base", "themeVariables": {"fontFamily": "Roboto, Arial, sans-serif", "fontSize": "14px", "primaryColor": "#FBF1F1", "primaryBorderColor": "#C89FA0", "primaryTextColor": "#1F2937", "secondaryColor": "#F5DCDC", "tertiaryColor": "#F8F8F7", "lineColor": "#848484", "textColor": "#1F2937", "edgeLabelBackground": "#FFFFFF", "clusterBkg": "#F8F8F7", "clusterBorder": "#E5E7EB", "titleColor": "#4B5563", "actorBkg": "#FBF1F1", "actorBorder": "#862B2C", "actorTextColor": "#1F2937", "actorLineColor": "#C89FA0", "signalColor": "#4B5563", "signalTextColor": "#1F2937", "noteBkgColor": "#F5DCDC", "noteBorderColor": "#BD6564", "noteTextColor": "#1F2937", "sequenceNumberColor": "#FFFFFF", "labelBoxBkgColor": "#FBF1F1", "labelBoxBorderColor": "#C89FA0", "stateBkg": "#FBF1F1", "stateBorder": "#862B2C"}}}%%
flowchart LR
    A["Tag 0<br/>Einladung"] --> B["Tag 7<br/>Erinnerung"]
    B --> C["Tag 14<br/>Letzte Erinnerung<br/>mit offenen Positionen"]
    C --> E["Tag 21<br/>Link schließt<br/>Meldung an dich"]
    X["Alles erledigt"] -.-> V["Status vollständig<br/>keine Erinnerung mehr"]
    U["Upload in den letzten 3 Tagen"] -.-> W["Erinnerung wird verschoben"]

    classDef person fill:#FFFFFF,stroke:#862B2C,stroke-width:2px,color:#862B2C,font-weight:bold
    classDef system fill:#FBF1F1,stroke:#C89FA0,stroke-width:1px,color:#1F2937
    classDef frage fill:#F5DCDC,stroke:#BD6564,stroke-width:1px,color:#1F2937
    classDef ende fill:#FFFFFF,stroke:#862B2C,stroke-width:2px,color:#1F2937,font-weight:bold
    class A,B,C system
    class E ende
    class X,U frage
    class V,W system
```

Fristen, Pause und Linklaufzeit stehen im Blatt **Einstellungen** und lassen sich ändern.

### 4 · Status eines Falls

```mermaid
%%{init: {"theme": "base", "themeVariables": {"fontFamily": "Roboto, Arial, sans-serif", "fontSize": "14px", "primaryColor": "#FBF1F1", "primaryBorderColor": "#C89FA0", "primaryTextColor": "#1F2937", "secondaryColor": "#F5DCDC", "tertiaryColor": "#F8F8F7", "lineColor": "#848484", "textColor": "#1F2937", "edgeLabelBackground": "#FFFFFF", "clusterBkg": "#F8F8F7", "clusterBorder": "#E5E7EB", "titleColor": "#4B5563", "actorBkg": "#FBF1F1", "actorBorder": "#862B2C", "actorTextColor": "#1F2937", "actorLineColor": "#C89FA0", "signalColor": "#4B5563", "signalTextColor": "#1F2937", "noteBkgColor": "#F5DCDC", "noteBorderColor": "#BD6564", "noteTextColor": "#1F2937", "sequenceNumberColor": "#FFFFFF", "labelBoxBkgColor": "#FBF1F1", "labelBoxBorderColor": "#C89FA0", "stateBkg": "#FBF1F1", "stateBorder": "#862B2C"}}}%%
stateDiagram-v2
    [*] --> aktiv: Neuer Fall
    aktiv --> vollstaendig: alles erledigt
    vollstaendig --> aktiv: Position wieder offen
    aktiv --> abgelaufen: Linkende erreicht
    vollstaendig --> abgelaufen: Linkende erreicht
    abgelaufen --> aktiv: Link verlängern
    aktiv --> gesperrt: Link sperren
    gesperrt --> aktiv: Link verlängern
    vollstaendig --> abgeschlossen: von dir beendet
    abgeschlossen --> [*]

    classDef offen fill:#FBF1F1,stroke:#862B2C,stroke-width:2px,color:#1F2937
    classDef zu fill:#F3F4F6,stroke:#848484,color:#4B5563
    class aktiv,vollstaendig offen
    class abgelaufen,gesperrt,abgeschlossen zu
```

Hochladen geht nur bei **aktiv** und **vollständig**. Eine Sperre wirkt sofort, auch für ein
offenes Browserfenster.

### 5 · Einrichtung mit Claude

Claude fragt nur, was es nicht selbst herausfinden kann. In der Regel bleibt eine Frage: wie Mails
rausgehen sollen.

```mermaid
%%{init: {"theme": "base", "themeVariables": {"fontFamily": "Roboto, Arial, sans-serif", "fontSize": "14px", "primaryColor": "#FBF1F1", "primaryBorderColor": "#C89FA0", "primaryTextColor": "#1F2937", "secondaryColor": "#F5DCDC", "tertiaryColor": "#F8F8F7", "lineColor": "#848484", "textColor": "#1F2937", "edgeLabelBackground": "#FFFFFF", "clusterBkg": "#F8F8F7", "clusterBorder": "#E5E7EB", "titleColor": "#4B5563", "actorBkg": "#FBF1F1", "actorBorder": "#862B2C", "actorTextColor": "#1F2937", "actorLineColor": "#C89FA0", "signalColor": "#4B5563", "signalTextColor": "#1F2937", "noteBkgColor": "#F5DCDC", "noteBorderColor": "#BD6564", "noteTextColor": "#1F2937", "sequenceNumberColor": "#FFFFFF", "labelBoxBkgColor": "#FBF1F1", "labelBoxBorderColor": "#C89FA0", "stateBkg": "#FBF1F1", "stateBorder": "#862B2C"}}}%%
flowchart TD
    A["1 · Einfordern<br/>Website · Design-Skill · Checkliste · Google-Anmeldung"]
    B["2 · Ableiten<br/>Firmendaten, Logo, Ansprache, Farben,<br/>Konto, Hosting, Leistungen"]
    C["3 · Zusammenfassung zur Bestätigung<br/>Frage nach dem Mailversand,<br/>nur echte Lücken"]
    D["4 · Konfiguration, Design,<br/>Checklisten, Vorschau"]
    E{"Freigabe"}
    F["5 · Google-Projekt anlegen<br/>und bereitstellen"]
    G["6 · Ersteinrichtung in der Tabelle<br/>einziger Browser-Schritt"]
    H["7 · Selbst prüfen<br/>öffentlich erreichbar?"]
    I{"Eigene<br/>Website?"}
    J["8 · Domain-Datei hochladen,<br/>prüfen, Links umstellen"]
    K["9 · Probelauf und Abschluss"]

    A --> B --> C --> D --> E
    E -- "Änderungen" --> D
    E -- "passt" --> F --> G --> H --> I
    I -- "ja" --> J --> K
    I -- "nein" --> K

    classDef person fill:#FFFFFF,stroke:#862B2C,stroke-width:2px,color:#862B2C,font-weight:bold
    classDef system fill:#FBF1F1,stroke:#C89FA0,stroke-width:1px,color:#1F2937
    classDef frage fill:#F5DCDC,stroke:#BD6564,stroke-width:1px,color:#1F2937
    classDef ende fill:#FFFFFF,stroke:#862B2C,stroke-width:2px,color:#1F2937,font-weight:bold
    class A,B,C,D,F,G,H,J system
    class E,I frage
    class K ende
```

### 6 · Checklisten für jede Branche

```mermaid
%%{init: {"theme": "base", "themeVariables": {"fontFamily": "Roboto, Arial, sans-serif", "fontSize": "14px", "primaryColor": "#FBF1F1", "primaryBorderColor": "#C89FA0", "primaryTextColor": "#1F2937", "secondaryColor": "#F5DCDC", "tertiaryColor": "#F8F8F7", "lineColor": "#848484", "textColor": "#1F2937", "edgeLabelBackground": "#FFFFFF", "clusterBkg": "#F8F8F7", "clusterBorder": "#E5E7EB", "titleColor": "#4B5563", "actorBkg": "#FBF1F1", "actorBorder": "#862B2C", "actorTextColor": "#1F2937", "actorLineColor": "#C89FA0", "signalColor": "#4B5563", "signalTextColor": "#1F2937", "noteBkgColor": "#F5DCDC", "noteBorderColor": "#BD6564", "noteTextColor": "#1F2937", "sequenceNumberColor": "#FFFFFF", "labelBoxBkgColor": "#FBF1F1", "labelBoxBorderColor": "#C89FA0", "stateBkg": "#FBF1F1", "stateBorder": "#862B2C"}}}%%
flowchart TD
    A{"Checkliste<br/>vorhanden?"}
    B["Übernehmen<br/>aus Excel, Word, PDF, Foto oder Text"]
    C["Entwurf erarbeiten<br/>aus den Leistungen der Website<br/>und der Bibliothek"]
    D["Speichern als CSV<br/>in checklisten/"]
    E["Prüfen<br/>tools/checkliste.js"]
    F{"Passt?"}
    G["Übernehmen<br/>Ersteinrichtung trägt sie<br/>in die Tabelle ein"]

    A -- "ja" --> B --> D
    A -- "nein" --> C --> D
    D --> E --> F
    F -- "Änderungen" --> D
    F -- "passt" --> G

    classDef person fill:#FFFFFF,stroke:#862B2C,stroke-width:2px,color:#862B2C,font-weight:bold
    classDef system fill:#FBF1F1,stroke:#C89FA0,stroke-width:1px,color:#1F2937
    classDef frage fill:#F5DCDC,stroke:#BD6564,stroke-width:1px,color:#1F2937
    classDef ende fill:#FFFFFF,stroke:#862B2C,stroke-width:2px,color:#1F2937,font-weight:bold
    class B,C,D,E system
    class A,F frage
    class G ende
```

Je Leistung eine Vorlage, z. B. Sanierungsfahrplan, Förderung Einzelmaßnahme und Energieausweis.
Was mehrfach vorkommt (Objekte, Maßnahmen, Personen), legt der Kunde als eigene Blöcke an.
Neue Checklisten jederzeit mit `/checkliste`.

## Schnellstart mit Claude Code

1. Repo klonen und den Ordner in Claude Code öffnen.
2. Claude erkennt, dass noch nichts eingerichtet ist, und startet die Einrichtung. Alternativ
   `/einrichten` eingeben.
3. Claude fordert vier Dinge ein: eure Website-Adresse, euren Design-Skill oder Styleguide, eure
   bisherige Unterlagen-Checkliste (falls vorhanden) und die Google-Anmeldung. Firmendaten, Logo,
   Ansprache, Farben, Konto und Hosting liest es daraus selbst. Gefragt wird danach nur, was fehlt, und wie Mails rausgehen sollen.
4. Zwei, drei Klicks im Browser (Google-Anmeldung, Berechtigungen). Claude sagt jeweils, wo.
5. Am Ende stehen eine Tabelle mit Musterfall "Max Mustermann", ein funktionierender Link und ein
   Testupload im Drive.

Dauer: rund 30 Minuten, mit eigener Domain etwas mehr.

## Ohne Claude

Die Schritte stehen einzeln in `docs/`:

| Datei | Inhalt |
|---|---|
| [docs/01-einrichtung-google.md](docs/01-einrichtung-google.md) | Google-Konto, clasp, Tabelle, Bereitstellung |
| [docs/02-domain.md](docs/02-domain.md) | Kundenlinks unter der eigenen Domain (Datei per `node tools/domaindatei.js`) |
| [docs/03-faelle-und-schluessel.md](docs/03-faelle-und-schluessel.md) | Fälle, Links, Schlüssel, Status, Ablage |
| [docs/04-checklisten.md](docs/04-checklisten.md) | Checklisten-Vorlagen anlegen und pflegen |
| [docs/05-mails-und-erinnerungen.md](docs/05-mails-und-erinnerungen.md) | Mailmodus, Platzhalter, Zeitplan |
| [docs/06-design.md](docs/06-design.md) | Farben, Schrift, Logo, Vorschau |
| [docs/07-fehlerbilder.md](docs/07-fehlerbilder.md) | Typische Fehler und Lösungen |
| [docs/08-datenschutz.md](docs/08-datenschutz.md) | Was datenschutzrechtlich zu klären ist |

## Lokal prüfen, ohne Google-Konto

```bash
node tools/vorschau.js
```

```bash
node tools/mailvorschau.js
```

```bash
node tools/test-lokal.js
```

Die Vorschauen schreiben `ausgabe/vorschau.html` (Kundenseite mit Musterfall, Uploads simuliert)
und `ausgabe/mail-*.html` (die drei Kundenmails).
Der Testlauf spielt Ersteinrichtung, Uploads, Meldungen, Einladung, Erinnerungen und Sperre gegen
nachgebildete Google-Dienste durch.

## Was nie ins Repo gehört

`apps-script/Konfig.gs`, `.clasp.json`, `einrichtung.local.md` und `ausgabe/` stehen in
`.gitignore`. Dort liegen Web-App-Adresse, Script-ID, Firmendaten und Testausgaben. Kundendaten
liegen ausschließlich in der Google-Tabelle und im Drive.

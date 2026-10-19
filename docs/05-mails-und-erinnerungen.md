# 5 · Mails und Erinnerungen

## Mailmodus (Blatt Einstellungen, `mailmodus`)

| Wert | Verhalten |
|---|---|
| `entwurf` | Einladung und Erinnerungen landen als Entwurf in Gmail. Du prüfst und sendest. Empfohlen. |
| `senden` | Apps Script sendet direkt aus deinem Google-Konto. |
| `aus` | Keine Kundenmails. "Einladung" setzt nur das Datum und zeigt den Link. Die Tagesmeldung nennt fällige Erinnerungen zum selbst Nachfassen. |

Bei `entwurf` zählt das Datum, an dem der Entwurf entstand, als Einladungsdatum. Sende ihn also
zeitnah, sonst kommt die erste Erinnerung zu früh.

Weitere Einstellungen: `absender_name`, `kopie_an`, `antwort_an`, `signatur` (Text, wird unter
jede Kundenmail gesetzt, leer = Grußformel aus Ansprechpartner, Firma und Telefon; Gmail-Signaturen hängt Apps Script nicht an), `termin_link`.

## Zeitplan

| Tag nach Einladung | Was passiert |
|---|---|
| 0 | Einladung mit Link |
| 7 (`erinnerung_1_tag`) | Erinnerung 1, wenn noch etwas offen ist |
| 14 (`erinnerung_2_tag`) | letzte Erinnerung mit Liste der offenen Positionen (bis 5, sonst Hinweis auf die Seite) und Abbruchdatum |
| 21 (`link_laufzeit_tage`, am Wochenende der Montag) | Link schließt, Status `abgelaufen`, keine Kundenmail mehr. Tagesmeldung an dich: verlängern oder abschließen |

Keine Erinnerung geht raus, wenn der Kunde in den letzten `erinnerung_pause_tage` (3) etwas
hochgeladen oder gemeldet hat. Sind alle Positionen erledigt, setzt der Prüflauf den Fall auf
`vollstaendig` und erinnert nicht mehr.

Der Prüflauf läuft täglich um 8 Uhr. Von Hand: **Upload-Strecke → Erinnerungen jetzt prüfen**.

## Gestaltung (HTML-Mail)

Jede Kundenmail geht als gestaltete HTML-Mail raus, mit einfachem Text als Ausweichfassung für
Programme ohne HTML:

- Kopfbereich in der Markenfarbe mit Firmenname oder Logo, Akzentlinie darunter
- der Link als Knopf (Beschriftung: Einstellung `knopf_text`), darunter die Adresse als Ausweichlink
- Aufzählungen mit Akzentpunkten, Signatur abgesetzt, Fußzeile mit Firmendaten

Farben und Schrift kommen aus `apps-script/Design.html`, also genau wie auf der Kundenseite. Den
Rahmen ändert man in `apps-script/Mail.html`. Ein Logo erscheint in der Mail nur als https-Adresse
in `Logo.html`, weil Gmail eingebettete data:-Bilder nicht anzeigt; sonst steht der Firmenname da.

Vorschau ohne Google-Konto:

```bash
node tools/mailvorschau.js
```

Schreibt `ausgabe/mail-einladung.html`, `mail-erinnerung_1.html` und `mail-erinnerung_2.html`.

Regeln für Texte im Blatt Mailtexte, damit die Gestaltung greift: Absätze durch eine Leerzeile
trennen, Aufzählungen mit `- ` beginnen, `{{LINK}}` allein in eine Zeile setzen (wird zum Knopf),
`**fett**` für Hervorhebungen.

## Texte ändern

Blatt **Mailtexte**: je Typ (`einladung`, `erinnerung_1`, `erinnerung_2`) eine Zeile für `sie`
und eine für `du`. Platzhalter in doppelten geschweiften Klammern:

| Platzhalter | Inhalt |
|---|---|
| `{{ANREDE_ZEILE}}` | "Hallo Herr Mustermann," bzw. "Hallo Max," |
| `{{VORNAME}}` `{{NACHNAME}}` | aus dem Fall |
| `{{VORGANG}}` | z. B. Objektadresse |
| `{{THEMA}}` `{{THEMA_ARTIKEL}}` | Einstellungen `thema` und `thema_artikel`, z. B. "Energieberatung" bzw. "die Energieberatung" |
| `{{LINK}}` | persönlicher Link |
| `{{GUELTIG_BIS}}` | Ablaufdatum des Links |
| `{{DATUM_ABBRUCH}}` | Linkende (`gueltig_bis`), genau der Tag, an dem der Link schließt |
| `{{TAGE_SEIT}}` | Tage seit der Einladung |
| `{{LISTE}}` | offene Positionen (nur sinnvoll in `erinnerung_2`) |
| `{{TERMIN_ZEILE}}` | Satz mit `termin_link`, leer wenn keiner gesetzt |
| `{{FIRMA}}` `{{ANSPRECHPARTNER}}` `{{TELEFON}}` `{{EMAIL}}` `{{MAX_MB}}` | aus den Einstellungen |

Ein unbekannter Platzhalter bricht den Versand mit einer Fehlermeldung ab. So geht nie eine Mail
mit `{{…}}` raus.

## Tagesmeldung

Bei `tagesmeldung` = `ja` bekommst du morgens eine Mail, wenn es etwas gibt: neue Eingänge je
Fall, vollständige Fälle, versandte oder fällige Erinnerungen, abgelaufene Links, Fehler.

## Kontingente

Google begrenzt Mails pro Tag (privates Konto rund 100, Workspace rund 1.500 Empfänger). Für eine
Upload-Strecke reicht das weit.

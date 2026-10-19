# 3 · Fälle, Links und Schlüssel

## Neuer Fall

Tabelle → **Upload-Strecke → Neuer Fall …**. Name, Anrede, Ansprache, Mail, Vorgang
(z. B. Objektadresse) und Checkliste eintragen. Das Skript

1. vergibt die Fall-ID (`2026-001`, fortlaufend je Jahr),
2. legt im Drive-Ordner den Unterordner `<Fall-ID> <Nachname>` an,
3. erzeugt den Schlüssel und den Link,
4. kopiert die Checkliste in das Blatt **Positionen**,
5. legt auf Wunsch die Einladung an (Entwurf oder Versand, je nach Mailmodus).

## Schlüssel

Jeder Link trägt einen eigenen Schlüssel aus 40 Hex-Zeichen (rund 150 Bit Zufall). Er steht in
der Spalte `token` und ist die einzige Zugangsprüfung. Wer den Link hat, kann für diesen Fall
hochladen, aber nichts sehen, herunterladen oder löschen. Schlüssel nie in Chats oder Tickets
kopieren, nur in die Mail an den Kunden.

Weitere Schlüssel braucht die Strecke nicht: kein API-Key, kein Passwort. Die Anmeldung an Google
erledigt `clasp login` einmalig, die Berechtigungen erteilst du bei der Ersteinrichtung.

## Status eines Falls (Spalte `status`)

| Status | Bedeutung | Upload möglich |
|---|---|---|
| `aktiv` | läuft | ja |
| `vollstaendig` | nichts mehr offen, setzt der Prüflauf | ja |
| `gesperrt` | von dir gesperrt (Menü oder Hand) | nein |
| `abgelaufen` | `gueltig_bis` überschritten, setzt der Prüflauf und meldet es dir | nein |
| `abgeschlossen` | von dir beendet | nein |

**Laufzeit:** `link_laufzeit_tage` ab Anlage, bei der Einladung ab dem Einladungstag neu. Fällt das
Ende auf ein Wochenende, gilt der Montag. **Verlängern:** Zeile markieren → **Link verlängern**.
Laufzeit beginnt ab heute neu, der Link bleibt gleich. `vollstaendig` und `aktiv` richtet das
Skript selbst aus: Setzt du eine Position zurück auf `offen`, wird der Fall wieder `aktiv`. **Sperren:** **Link sperren**. Wirkt sofort, auch für ein offenes Browserfenster.

## Status einer Position (Blatt Positionen, Spalte `status`)

| Status | Wer setzt | Bedeutung |
|---|---|---|
| `offen` | Anlage | fehlt |
| `eingegangen` | Upload | mindestens eine Datei da |
| `nicht_vorhanden` | Kunde | Kunde sagt, gibt es nicht (Grund in `grund`) |
| `geprueft` | du | liegt vollständig vor, Kunde sieht "Liegt vollständig vor" |
| `entfaellt` | du | wird nicht gebraucht, verschwindet von der Kundenseite |

`erwartet` sagt, wie viele Dateien eine Position braucht (z. B. 3 Kontoauszüge). Bis dahin zeigt
die Seite "1 von 3 Dateien angekommen".

## Wo was liegt

| Was | Wo |
|---|---|
| Dateien | Drive: `<Firma> Uploads/<Fall-ID> <Nachname>/`, Dateiname `<Position> - <Originalname>` |
| Protokoll aller Eingänge | Blatt **Eingaenge** mit Link auf jede Datei |
| Kundenhinweise "nicht vorhanden" | Blatt **Eingaenge**, Art "Nicht vorhanden", und Positionen-Spalte `grund` |
| Fallübersicht | Blatt **Faelle** |

## Grenzen (Blatt Einstellungen)

`max_mb_datei` (50), `max_dateien_fall` (60), `max_mb_fall` (500). Sie schützen vor Missbrauch des
öffentlichen Links. Erlaubt sind nur PDF, JPG, PNG und HEIC, geprüft an den ersten Bytes der Datei.

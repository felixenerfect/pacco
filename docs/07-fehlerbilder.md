# 7 · Fehlerbilder

| Was du siehst | Ursache | Lösung |
|---|---|---|
| clasp: "User has not enabled the Apps Script API" | API-Schalter aus | https://script.google.com/home/usersettings → An, ein paar Minuten warten |
| Kein Menü "Upload-Strecke" in der Tabelle | Code nicht hochgeladen oder Seite nicht neu geladen | `clasp push -f`, Tabelle neu laden, 10 Sekunden warten |
| "Google hat diese App nicht überprüft" | eigenes, nicht veröffentlichtes Skript | Erweitert → Weiter zu … Das Skript gehört dir |
| Kunde sieht Google-Anmeldung statt der Seite (die Einrichtung prüft das selbst mit `curl` auf die Web-App: 200 = in Ordnung) | Workspace-Admin erlaubt keine Freigabe nach außen, dann fehlt beim Bereitstellen die Option "Jeder" | Admin-Konsole → Apps → Google Workspace → Drive und Docs → Freigabeeinstellungen: Freigabe außerhalb der Organisation erlauben, einschließlich Freigabe für jeden mit dem Link. Bezeichnungen ändern sich bei Google gelegentlich; im Zweifel nach "Freigabe außerhalb" suchen. Danach die Web-App neu bereitstellen und im privaten Fenster testen |
| Kunde sieht "Link nicht mehr gültig" | Status nicht `aktiv`/`vollstaendig`, `gueltig_bis` überschritten oder Link unvollständig kopiert | Zeile prüfen, ggf. Link verlängern |
| Fall hat keinen Link | Web-App war bei Anlage noch nicht bereitgestellt | `WEBAPP_URL` in Konfig.gs, push, deploy, dann **Links neu aufbauen** |
| Änderung am Code wirkt nicht beim Kunden | nur gepusht, nicht neu bereitgestellt | `clasp deploy -i <ID>` |
| Domain zeigt leere Fläche | `LINK_BASIS` gesetzt, aber nicht neu bereitgestellt | push und deploy |
| Upload bricht bei großen Dateien ab | Dateigröße über `max_mb_datei` oder schwache Verbindung | Kunde teilt die Datei oder fotografiert seitenweise |
| "Grenze erreicht" | `max_dateien_fall` oder `max_mb_fall` erreicht | Grenze im Blatt Einstellungen erhöhen |
| Keine Erinnerungen | `eingeladen_am` leer (Einladung nie über das Menü erzeugt) oder Mailmodus `aus` | Einladung über das Menü anlegen oder Datum von Hand eintragen |
| Keine Tagesmeldung | Trigger fehlt oder `tagesmeldung` ≠ ja | **Selbsttest**, ggf. **Ersteinrichtung / Reparatur** |
| Zwei Einladungen | Menü zweimal ausgeführt | Entwurf löschen, Datum `eingeladen_am` passt weiterhin |

## Wo Fehler protokolliert werden

- Tabelle: Fehler im Prüflauf stehen in der Tagesmeldung.
- Apps Script: https://script.google.com → Projekt → **Ausführungen**. Dort jede Ausführung mit
  Fehlermeldung.
- `clasp logs` zeigt dieselben Einträge im Terminal (braucht ein verknüpftes Cloud-Projekt).

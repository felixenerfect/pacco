# 2 · Kundenlinks unter der eigenen Domain

Ohne Domain sieht der Kunde `https://script.google.com/macros/s/…/exec?t=…` und oben einen
Google-Hinweisbanner. Mit Domain sieht er `https://www.deine-firma.de/unterlagen/?t=…` und nur
deine Seite.

## Wie es funktioniert

Unter `/unterlagen/` liegt auf deinem Webserver eine kleine Datei. Sie prüft das Format des
Schlüssels und zeigt die Apps-Script-Seite als Vollbild-Rahmen (iframe). Die Datei speichert und
protokolliert nichts. Dateien fließen weiterhin direkt vom Browser zu Google.

## Einrichten

Reihenfolge wichtig: erst die Datei hochladen und prüfen, dann die Links umstellen. Sonst zeigen
Links auf eine Adresse, die es noch nicht gibt.

1. Datei erzeugen (setzt Web-App-Adresse und Firmennamen aus `Konfig.gs` ein):
   - Hoster mit PHP (Strato, IONOS, All-Inkl, WordPress-Hosting): `node tools/domaindatei.js`
   - Ohne PHP (Netlify, GitHub Pages, nginx, statische Seiten): `node tools/domaindatei.js --statisch`
2. Den Ordner `ausgabe/unterlagen` per FTP oder Dateimanager des Hosters ins Hauptverzeichnis der
   Website legen (dort, wo die Startseite liegt). Ohne eigenen Zugang den Ordner gezippt an die
   Agentur geben: "Bitte ins Hauptverzeichnis legen, sodass www.deine-firma.de/unterlagen/
   erreichbar ist."
3. Prüfen: `https://www.deine-firma.de/unterlagen/?t=0000000000000000000000000000000000000000`
   muss die Seite "Link nicht mehr gültig" zeigen (HTTP 200). 404 heißt: falscher Ordner.
4. In `apps-script/Konfig.gs`: `LINK_BASIS: 'https://www.deine-firma.de/unterlagen/'`
   (mit abschließendem Schrägstrich).
5. `clasp push -f` und `clasp deploy -i <ID>`. Erst dann erlaubt die Web-App die Einbettung.
6. Ab jetzt gehen alle Mails mit dem Domain-Link raus. Die Spalte `link` in der Tabelle zieht der
   tägliche Prüflauf nach, sofort geht es mit **Upload-Strecke → Links neu aufbauen**.
7. Test: Link des Musterfalls in einem privaten Fenster öffnen.

## Sonderfälle

- **WordPress:** Den Ordner `unterlagen` per FTP neben `wp-admin` legen. Ein echter Ordner hat
  Vorrang vor den WordPress-Permalinks.
- **Website-Baukasten ohne Dateizugriff** (Wix, Jimdo, Squarespace): Subdomain verwenden, z. B.
  `unterlagen.deine-firma.de`, und die statische Datei dort bei einem kostenlosen Hoster ablegen
  (Netlify, Cloudflare Pages). Beim Domainanbieter einen CNAME-Eintrag auf den Hoster setzen.
  `LINK_BASIS` ist dann `https://unterlagen.deine-firma.de/`.
- **Eigene Website-Regeln:** Setzt der Server `Content-Security-Policy` mit `frame-src`, muss
  `https://script.google.com` und `https://*.googleusercontent.com` erlaubt sein.

## Prüfen

- Leere Seite im Rahmen: Web-App nach dem Setzen von `LINK_BASIS` nicht neu bereitgestellt.
- 404: Schlüssel im Link unvollständig kopiert.
- Google-Anmeldung statt Seite: siehe `07-fehlerbilder.md`, Abschnitt Workspace-Freigabe.

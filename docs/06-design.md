# 6 · Design der Kundenseite

Das Aussehen steht an genau zwei Stellen:

- `apps-script/Design.html`: Farben, Schrift, Radien, Logohöhe als CSS-Variablen
- `apps-script/Logo.html`: Logo als https-Adresse oder data:-URI. Leer = Firmenname als Schriftzug

Struktur und Verhalten (`index.html`) und Wortlaut (`Texte.gs`) bleiben davon unberührt. Die
HTML-Mails (`Mail.html`) lesen dieselben Farben aus `Design.html`, Seite und Mail passen also
automatisch zusammen. Vorschau der Mails: `node tools/mailvorschau.js`.

## Mit einem Design-Skill

Bei der Einrichtung fragt Claude nach einem Design-Skill, Styleguide oder Markenvorgaben (Datei,
Ordner oder Website). Daraus leitet es die Variablen ab, prüft die Kontraste und zeigt eine
Vorschau zur Freigabe. Später jederzeit: "Pass das Design an <Pfad> an."

## Variablen

| Variable | Wirkung |
|---|---|
| `--marke` | Hauptfarbe: Hero, Knöpfe, Links, Fokusring |
| `--marke-dunkel` | Hover der Knöpfe, Schattenton |
| `--marke-verlauf`, `--marke-mittel` | Verlauf im Hero von `--marke` über diese beiden |
| `--marke-hell`, `--marke-blass` | helle Flächen, Eingabefelder |
| `--light` | Seitenhintergrund (Styleguide-Hintergrundfarbe hierhin) |
| `--hero-akzent` | hervorgehobenes Wort im Hero-Titel |
| `--akzent`, `--akzent-hell` | Abschnittsnummern, Fußlinie, Datenschutz-Kasten |
| `--gruen…` | nur Bestätigung "erledigt", nicht als Markenfarbe nutzen |
| `--schrift` | Schriftfamilie, den passenden Google-Fonts-Link oben in der Datei mit anpassen |
| `--rad-gross`, `--rad-mittel`, `--rad-klein` | Eckenradien (0 für eckiges Design) |
| `--rad-knopf` | Knöpfe und Schalter, auch in den Mails (999px = Pille, 0 bis 6px = eckig) |
| `--logo-hoehe` | Höhe des Logos im Hero |

Kontrast (WCAG): Weiß auf `--marke`, `--marke` auf Weiß, `--akzent` auf Weiß und auf `--light`
brauchen je mindestens 4,5 : 1 (`--akzent` ist Textfarbe der Abschnittsnummern).
`--hero-akzent` auf `--marke` und `--marke-mittel` mindestens 3 : 1 (große Schrift).

## Vorschau ohne Google

```bash
node tools/vorschau.js
```

Braucht kein Google-Konto, lädt nur die Schrift von Google Fonts. Die Datei
`ausgabe/vorschau.html` im Browser öffnen. Varianten:
`--du` und `--ungueltig`. Uploads werden dort nur simuliert.

Nach einer Änderung live schalten: `clasp push -f` und `clasp deploy -i <ID>`.

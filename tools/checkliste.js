#!/usr/bin/env node
/**
 * Checklisten prüfen und übernehmen.
 *
 *   node tools/checkliste.js checklisten/meine.csv [weitere.csv ...]
 *       prüft die Dateien und schreibt sie als CHECKLISTEN in apps-script/Konfig.gs.
 *       Die Ersteinrichtung trägt sie dann ins Blatt "Checklisten" ein.
 *   node tools/checkliste.js --pruefen datei.csv      nur prüfen, nichts schreiben
 *   node tools/checkliste.js --tsv datei.csv          Ausgabe zum Einfügen ins Blatt "Checklisten"
 *                                                     einer schon laufenden Tabelle (ab Zeile 2,
 *                                                     unter die vorhandenen Zeilen)
 *   node tools/checkliste.js --liste datei.csv        lesbare Übersicht zum Abstimmen mit dem Nutzer
 *
 * Format: siehe docs/04-checklisten.md und die Bibliothek in vorlagen/checklisten/.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { lesen } = require('./checkliste-lib');

const wurzel = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const modus = args.find((a) => a.startsWith('--')) || '--schreiben';
const dateien = args.filter((a) => !a.startsWith('--'));
if (!dateien.length) {
  console.error('Bitte mindestens eine CSV-Datei angeben, z. B. node tools/checkliste.js checklisten/energieberatung.csv');
  process.exit(1);
}

let alle = [], fehler = [], warnungen = [];
dateien.forEach((d) => {
  const r = lesen(fs.readFileSync(path.resolve(d), 'utf8'), path.basename(d));
  alle = alle.concat(r.zeilen); fehler = fehler.concat(r.fehler); warnungen = warnungen.concat(r.warnungen);
});
const namen = {};
alle.forEach((z) => { namen[z[0]] = (namen[z[0]] || 0) + 1; });

warnungen.forEach((w) => console.log('Hinweis: ' + w));
if (fehler.length) {
  fehler.forEach((f) => console.error('FEHLER: ' + f));
  process.exit(1);
}

if (modus === '--pruefen') {
  console.log('In Ordnung: ' + Object.keys(namen).map((n) => n + ' (' + namen[n] + ' Zeilen)').join(', '));
  process.exit(0);
}

if (modus === '--tsv') {
  alle.forEach((z) => console.log(z.map((v) => String(v).replace(/[\t\n]/g, ' ')).join('\t')));
  process.exit(0);
}

if (modus === '--liste') {
  Object.keys(namen).forEach((v) => {
    console.log('\n## ' + v);
    let gruppe = '';
    alle.filter((z) => z[0] === v).forEach((z) => {
      if (z[1] !== gruppe) { gruppe = z[1]; console.log('\n' + gruppe + (z[2] ? ' (' + z[2] + ')' : '')); }
      const n = z[5] > 1 ? ' [' + z[5] + ' Dateien]' : '';
      if (z[6]) console.log('      - ' + z[3] + n + (z[4] ? ', ' + z[4] : ''));
      else if (z[7]) console.log('  - ' + z[3] + ': Frage "' + z[7] + '", je ' + (z[8] || 'Eintrag') + ' ein Block mit Feld "' + (z[9] || 'Bezeichnung') + '"');
      else console.log('  - ' + z[3] + n + (z[4] ? ', ' + z[4] : ''));
    });
  });
  process.exit(0);
}

// In Konfig.gs schreiben, zwischen festen Markierungen
const konfig = path.join(wurzel, 'apps-script', 'Konfig.gs');
if (!fs.existsSync(konfig)) {
  console.error('apps-script/Konfig.gs fehlt. Erst vorlagen/Konfig.beispiel.gs dorthin kopieren (Einrichtung Schritt 4).');
  process.exit(1);
}
const block = '// CHECKLISTEN-ANFANG (erzeugt von tools/checkliste.js, nicht von Hand ändern)\n'
  + 'var CHECKLISTEN = ' + JSON.stringify(alle, null, 0).replace(/\],\[/g, '],\n  [').replace(/^\[\[/, '[\n  [').replace(/\]\]$/, ']\n]') + ';\n'
  + '// CHECKLISTEN-ENDE';
let text = fs.readFileSync(konfig, 'utf8');
const re = /\/\/ CHECKLISTEN-ANFANG[\s\S]*?\/\/ CHECKLISTEN-ENDE/;
text = re.test(text) ? text.replace(re, block) : text.replace(/\s*$/, '\n\n' + block + '\n');
fs.writeFileSync(konfig, text);
console.log('Übernommen in apps-script/Konfig.gs: ' + Object.keys(namen).map((n) => n + ' (' + namen[n] + ' Zeilen)').join(', '));
console.log('Läuft die Tabelle schon? Dann zusätzlich mit --tsv ausgeben und ins Blatt "Checklisten" einfügen.');

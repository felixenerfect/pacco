#!/usr/bin/env node
/**
 * Erzeugt die Datei für die eigene Domain aus der Vorlage in domain/.
 *   node tools/domaindatei.js             -> ausgabe/unterlagen/index.php   (Hoster mit PHP)
 *   node tools/domaindatei.js --statisch  -> ausgabe/unterlagen/index.html  (Hoster ohne PHP)
 *
 * Liest KONFIG.WEBAPP_URL und STARTWERTE.firma_name aus apps-script/Konfig.gs und setzt beide
 * ein, maskiert für HTML. Bricht ab, solange die Web-App noch nicht bereitgestellt ist.
 * Den Ordner ausgabe/unterlagen lädt der Nutzer ins Hauptverzeichnis seiner Website.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const wurzel = path.resolve(__dirname, '..');
const statisch = process.argv.includes('--statisch');
const konfigDatei = path.join(wurzel, 'apps-script', 'Konfig.gs');
if (!fs.existsSync(konfigDatei)) {
  console.error('apps-script/Konfig.gs fehlt. Erst die Einrichtung bis Schritt 4 durchlaufen.');
  process.exit(1);
}
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(konfigDatei, 'utf8'), ctx);
const url = String((ctx.KONFIG || {}).WEBAPP_URL || '');
const firma = String((ctx.STARTWERTE || {}).firma_name || '');
if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url)) {
  console.error('KONFIG.WEBAPP_URL ist noch leer oder hat nicht die Form https://script.google.com/macros/s/<ID>/exec.');
  console.error('Erst die Web-App bereitstellen (Einrichtung Schritt 5), dann dieses Werkzeug erneut ausführen.');
  process.exit(1);
}
const esc = (x) => x.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const quelle = path.join(wurzel, 'domain', statisch ? 'statisch/index.html' : 'php/index.php');
const text = fs.readFileSync(quelle, 'utf8')
  .split('{{WEBAPP_URL}}').join(url)          // URL ist geprüft: nur sichere Zeichen
  .split('{{FIRMA}}').join(esc(firma));
if (/\{\{[A-Z_]+\}\}/.test(text)) { console.error('Unbekannter Platzhalter in ' + quelle); process.exit(1); }

const ziel = path.join(wurzel, 'ausgabe', 'unterlagen', statisch ? 'index.html' : 'index.php');
fs.mkdirSync(path.dirname(ziel), { recursive: true });
fs.writeFileSync(ziel, text);
console.log('Geschrieben: ' + path.relative(wurzel, ziel));
console.log('Diesen Ordner "unterlagen" ins Hauptverzeichnis der Website hochladen (siehe docs/02-domain.md).');

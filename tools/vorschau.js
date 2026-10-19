#!/usr/bin/env node
/**
 * Lokale Vorschau der Kundenseite ohne Google-Konto.
 *
 *   node tools/vorschau.js            -> ausgabe/vorschau.html (Musterfall, gültiger Link)
 *   node tools/vorschau.js --du       -> dasselbe in Du-Ansprache
 *   node tools/vorschau.js --ungueltig -> Ansicht "Link nicht mehr gültig"
 *   node tools/vorschau.js --checkliste vorlagen/checklisten/energieberatung.csv [--vorlage "Name"]
 *                                      -> Checkliste aus einer CSV-Datei ansehen
 *
 * Liest Design.html, Logo.html, Texte.gs und, falls vorhanden, die STARTWERTE aus Konfig.gs.
 * Uploads werden im Browser nur simuliert, es verlässt nichts den Rechner.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const wurzel = path.resolve(__dirname, '..');
const as = (n) => path.join(wurzel, 'apps-script', n);
const args = process.argv.slice(2);

// Apps-Script-Dateien in einen Sandkasten laden (nur Definitionen, nichts wird ausgeführt)
const ctx = {};
vm.createContext(ctx);
['Texte.gs', 'Verwaltung.gs'].forEach((n) => vm.runInContext(fs.readFileSync(as(n), 'utf8'), ctx, { filename: n }));
if (fs.existsSync(as('Konfig.gs'))) vm.runInContext(fs.readFileSync(as('Konfig.gs'), 'utf8'), ctx, { filename: 'Konfig.gs' });

const einst = {};
ctx.EINSTELLUNGEN_VORGABE.forEach((v) => { einst[v[0]] = v[1]; });
Object.assign(einst, ctx.STARTWERTE || {});

const du = args.includes('--du') || (!args.includes('--sie') && String(einst.ansprache).toLowerCase() === 'du');
const gueltig = !args.includes('--ungueltig');

// Texte wie in doGet aufbereiten
const esc = (x) => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const t = ctx.texte_(du);
const artikel = einst.thema_artikel || 'die';
t.heroTitelHtml = t.heroTitel.replace('{ARTIKEL}', esc(artikel)).replace('{THEMA}', esc(einst.thema));
t.heroTitel = t.heroTitel.replace('{ARTIKEL}', artikel).replace('{THEMA}', einst.thema);
t.vorgangStandard = t.vorgangStandard.replace('{THEMA}', einst.thema);
t.datenschutz = t.datenschutz.replace('{FIRMA}', einst.firma_name || 'uns');
t.firma = einst.firma_name;

// Musterfall aus der ersten Checkliste (Konfig.gs CHECKLISTEN, sonst Beispiel), wie fallAnlegen ihn anlegt.
// Mit --vorlage "Name" lässt sich eine bestimmte Vorlage ansehen.
// Mit --checkliste datei.csv eine Checkliste direkt aus einer CSV-Datei ansehen (ohne Konfig.gs).
let quelle = (ctx.CHECKLISTEN && ctx.CHECKLISTEN.length) ? ctx.CHECKLISTEN : ctx.MUSTER_CHECKLISTE;
if (args.indexOf('--checkliste') > -1) {
  const datei = args[args.indexOf('--checkliste') + 1];
  const r = require('./checkliste-lib').lesen(fs.readFileSync(path.resolve(datei), 'utf8'), datei);
  if (r.fehler.length) { console.error(r.fehler.join('\n')); process.exit(1); }
  quelle = r.zeilen;
}
const wahl = args.indexOf('--vorlage') > -1 ? args[args.indexOf('--vorlage') + 1] : quelle[0][0];
const zeilen = quelle.filter((z) => z[0] === wahl);
if (!zeilen.length) { console.error('Vorlage "' + wahl + '" gibt es nicht.'); process.exit(1); }
const geprueft = zeilen.filter((z) => !z[6] && !z[7]).slice(0, 2).map((z) => z[3]);
const gruppen = [];
const nachGruppe = {};
const nachTitel = {};
let n = 0;
zeilen.forEach(([, gruppe, unter, titel, hinweis, erwartet, gehoertZu, frage, blockName, blockFeld]) => {
  const pos = { key: 'p' + (++n), titel, hinweis, erwartet: Number(erwartet) || 1,
    status: geprueft.includes(titel) ? 'geprueft' : 'offen', dateien: 0, grund: '', frage,
    blockName: blockName || '', blockFeld: blockFeld || '' };
  if (gehoertZu) { const e = nachTitel[gehoertZu]; if (e) (e.kinder = e.kinder || []).push(pos); return; }
  if (!nachGruppe[gruppe]) { nachGruppe[gruppe] = { titel: gruppe, untertitel: unter, positionen: [] }; gruppen.push(nachGruppe[gruppe]); }
  nachGruppe[gruppe].positionen.push(pos);
  nachTitel[titel] = pos;
});
const fall = { vorgang: 'Musterstraße 13, 12345 Musterstadt', gueltig_bis: '30.11.2026',
  gueltig_tage: Number(einst.link_laufzeit_tage) || 21, gruppen };

// Mini-Nachbau von HtmlService-Vorlagen: <? code ?>, <?= escaped ?>, <?!= roh ?>
function datei(n) {
  const p = fs.existsSync(as(n)) ? as(n) : as(n + '.html');
  return fs.readFileSync(p, 'utf8');
}
function rendern(src, daten) {
  let code = 'let __o = "";\n';
  const re = /<\?(!?=)?([\s\S]*?)\?>/g;
  let last = 0, m;
  while ((m = re.exec(src))) {
    code += '__o += ' + JSON.stringify(src.slice(last, m.index)) + ';\n';
    if (m[1] === '=') code += '__o += __esc(' + m[2] + ');\n';
    else if (m[1] === '!=') code += '__o += (' + m[2] + ');\n';
    else code += m[2] + '\n';
    last = re.lastIndex;
  }
  code += '__o += ' + JSON.stringify(src.slice(last)) + ';\nreturn __o;';
  return new Function('__d', '__esc', 'with (__d) {' + code + '}')(daten, esc);
}
const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c');

let html = rendern(datei('index.html'), {
  include: (n) => datei(n + '.html'),
  gueltig, token: gueltig ? 'vorschau' : '', maxMb: Number(einst.max_mb_datei) || 50,
  fallJson: json(gueltig ? fall : null), texteJson: json(t), t,
  firma: { name: einst.firma_name, ansprechpartner: einst.ansprechpartner, telefon: einst.telefon,
           email: einst.email, adresse: einst.adresse, website: einst.website, thema: einst.thema },
  logo: datei('Logo.html').replace(/<!--[\s\S]*?-->/g, '').trim()
});

// google.script.run simulieren: jede Übertragung gelingt nach kurzer Pause
const attrappe = `<script>
window.google = { script: { run: (function mk(ok, fail){
  return new Proxy({}, { get: function(_, name){
    if (name === 'withSuccessHandler') return function(f){ return mk(f, fail); };
    if (name === 'withFailureHandler') return function(f){ return mk(ok, f); };
    return function(){ setTimeout(function(){
      var d = new Date(); var z = function(x){ return ('0'+x).slice(-2); };
      ok && ok({ name: 'vorschau', zeit: z(d.getDate())+'.'+z(d.getMonth()+1)+'.'+d.getFullYear()+', '+z(d.getHours())+':'+z(d.getMinutes())+' Uhr' });
    }, 700); };
  }});
})() } };
</script>`;
html = html.replace('<script>', attrappe + '\n<script>');
html = html.replace('<head>', '<head>\n<meta name="viewport" content="width=device-width, initial-scale=1">');

const ziel = path.join(wurzel, 'ausgabe', gueltig ? 'vorschau.html' : 'vorschau-ungueltig.html');
fs.mkdirSync(path.dirname(ziel), { recursive: true });
fs.writeFileSync(ziel, html);
console.log('Vorschau geschrieben: ' + path.relative(wurzel, ziel) + (du ? ' (Du)' : ' (Sie)'));

#!/usr/bin/env node
/**
 * Lokale Vorschau der Kundenmails als HTML, ohne Google-Konto.
 *   node tools/mailvorschau.js        -> ausgabe/mail-einladung.html, mail-erinnerung_1.html, mail-erinnerung_2.html
 *   Ansprache aus STARTWERTE (Konfig.gs), mit --du oder --sie überschreibbar
 *
 * Gestaltung wie beim Versand: dieselbe Funktion mailHtml_ (Verwaltung.gs), dieselbe Vorlage
 * (Mail.html), dieselben Farben (Design.html). Texte aus MUSTER_MAILS, Werte und Terminlink aus
 * den STARTWERTEN, Link aus KONFIG in Konfig.gs, falls vorhanden. Beispielfall Max Mustermann.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const wurzel = path.resolve(__dirname, '..');
const as = (n) => path.join(wurzel, 'apps-script', n);

function rendern(src, daten) {
  const esc = (x) => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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

const ctx = {
  HtmlService: {
    createHtmlOutputFromFile: (n) => ({ getContent: () => fs.readFileSync(as(n + '.html'), 'utf8') }),
    createTemplateFromFile: (n) => {
      const tpl = { evaluate: () => ({ getContent: () => rendern(fs.readFileSync(as(n + '.html'), 'utf8'), tpl) }) };
      return tpl;
    }
  }
};
vm.createContext(ctx);
['Code.gs', 'Texte.gs', 'Verwaltung.gs'].forEach((n) => vm.runInContext(fs.readFileSync(as(n), 'utf8'), ctx, { filename: n }));
if (fs.existsSync(as('Konfig.gs'))) vm.runInContext(fs.readFileSync(as('Konfig.gs'), 'utf8'), ctx, { filename: 'Konfig.gs' });

const einst = {};
ctx.EINSTELLUNGEN_VORGABE.forEach((v) => { einst[v[0]] = v[1]; });
Object.assign(einst, ctx.STARTWERTE || {});
ctx.einst_ = () => einst;
const du = process.argv.includes('--du') || (!process.argv.includes('--sie') && String(einst.ansprache).toLowerCase() === 'du');
// Offene Positionen für Erinnerung 2 aus der ersten Checkliste (wie beim Musterfall: die ersten zwei gelten als geprüft)
const listen = (ctx.CHECKLISTEN && ctx.CHECKLISTEN.length) ? ctx.CHECKLISTEN : ctx.MUSTER_CHECKLISTE;
const offen = listen.filter((z) => z[0] === listen[0][0] && !z[6] && !z[7]).slice(2, 5).map((z) => '- ' + z[3]);

const k = ctx.KONFIG || {};
const basis = k.LINK_BASIS || k.WEBAPP_URL || 'https://www.example.com/unterlagen/';
const link = basis + (basis.indexOf('?') === -1 ? '?t=' : '&t=') + '0123456789abcdef0123456789abcdef01234567';
const werte = {
  ANREDE_ZEILE: du ? 'Hallo Max,' : 'Hallo Herr Mustermann,', VORNAME: 'Max', NACHNAME: 'Mustermann',
  VORGANG: 'Musterstraße 13, 12345 Musterstadt', THEMA: einst.thema, THEMA_ARTIKEL: (einst.thema_artikel || 'die') + ' ' + einst.thema,
  LINK: link, GUELTIG_BIS: '09.11.2026', DATUM_ABBRUCH: '09.11.2026', TAGE_SEIT: '14',
  LISTE: offen.join('\n'),
  TERMIN_ZEILE: einst.termin_link
    ? '\n\n' + (du ? 'Lieber direkt sprechen? Hier kannst du einen Termin buchen: '
                   : 'Lieber direkt sprechen? Hier können Sie einen Termin buchen: ') + einst.termin_link
    : '',
  FIRMA: einst.firma_name, ANSPRECHPARTNER: einst.ansprechpartner, TELEFON: einst.telefon,
  EMAIL: einst.email, MAX_MB: String(einst.max_mb_datei)
};
const fuellen = (t) => String(t).replace(/\{\{([A-Z_]+)\}\}/g, (a, k) => (k in werte ? werte[k] : a));
const signatur = String(einst.signatur || '').trim()
  || ['Beste Grüße', '', einst.ansprechpartner, [einst.firma_name, einst.telefon].filter(String).join(' · ')].join('\n');

fs.mkdirSync(path.join(wurzel, 'ausgabe'), { recursive: true });
ctx.MUSTER_MAILS.filter((m) => m[1] === (du ? 'du' : 'sie')).forEach(([typ, , betreff, text]) => {
  const html = ctx.mailHtml_(fuellen(betreff), fuellen(text), signatur, link, typ, du);
  const ziel = path.join(wurzel, 'ausgabe', 'mail-' + typ + '.html');
  fs.writeFileSync(ziel, html);
  console.log('Mailvorschau: ' + path.relative(wurzel, ziel) + '  Betreff: ' + fuellen(betreff));
});

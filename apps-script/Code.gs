/**
 * Upload-Strecke · Kundenseite und Upload
 *
 * Token-gesteuerte, öffentliche Upload-Seite ohne Kunden-Login. Alle Daten liegen im
 * Google Workspace des Betreibers:
 *   - Google-Tabelle (an die dieses Skript gebunden ist): Fälle, Checklisten, Positionen,
 *     Eingänge, Mailtexte, Einstellungen
 *   - Google Drive: ein Wurzelordner, darin je Fall ein Unterordner mit den Dateien
 *
 * Der Kunde kann nur hochladen und "nicht vorhanden" melden. Es gibt keine Lese-,
 * Auflist- oder Löschfunktion für den Aufrufer. Das Token wird bei JEDEM Aufruf geprüft,
 * damit ein offenes Fenster nach dem Sperren nichts mehr abliefert.
 *
 * Verwaltung (Menü, Fälle anlegen, Mails, Erinnerungen): Verwaltung.gs
 * Seitentexte in Du- und Sie-Fassung: Texte.gs
 */

/* ------------------------------------------------------------------ Feste Werte */

var BLATT = {
  EINST: 'Einstellungen',
  FAELLE: 'Faelle',
  CHECK: 'Checklisten',
  POS: 'Positionen',
  EING: 'Eingaenge',
  MAIL: 'Mailtexte'
};

/** Nur PDF und Bilder. Keine programmierbaren Dateien (Office, ZIP, EXE ...). */
var ERLAUBT = { pdf: 1, jpg: 1, jpeg: 1, png: 1, heic: 1, heif: 1 };
var MIME = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
             heic: 'image/heic', heif: 'image/heif' };
var HEIC_MARKEN = { heic: 1, heix: 1, hevc: 1, hevx: 1, heim: 1, heis: 1, hevm: 1, hevs: 1, mif1: 1, msf1: 1 };

/** Obergrenze für Dateinamen, damit Pfade in synchronisierten Ordnern nicht zu lang werden. */
var MAX_NAME = 110;

var ZEILENENDE = String.fromCharCode(10);

/* ------------------------------------------------------------------ Konfiguration */

/** Technische Konfiguration aus Konfig.gs (wird bei der Einrichtung erzeugt, nicht im Repo). */
function konfig_() {
  return (typeof KONFIG !== 'undefined' && KONFIG) ? KONFIG : {};
}

function tabelle_() {
  var id = PropertiesService.getScriptProperties().getProperty('TABELLE_ID');
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
}

function wurzel_() {
  var id = PropertiesService.getScriptProperties().getProperty('ORDNER_ID');
  if (!id) throw new Error('Upload-Ordner fehlt. Bitte im Menü "Upload-Strecke > Ersteinrichtung" ausführen.');
  return DriveApp.getFolderById(id);
}

var EINST_CACHE_ = null;

/** Einstellungen aus dem Tabellenblatt, ergänzt um die Vorgaben aus Verwaltung.gs. */
function einst_() {
  if (EINST_CACHE_) return EINST_CACHE_;
  var e = {};
  EINSTELLUNGEN_VORGABE.forEach(function (v) { e[v[0]] = v[1]; });
  var b = tabelle_().getSheetByName(BLATT.EINST);
  if (b && b.getLastRow() > 1) {
    b.getRange(2, 1, b.getLastRow() - 1, 2).getValues().forEach(function (z) {
      var k = String(z[0]).trim();
      if (k) e[k] = (z[1] === '' || z[1] === null) ? e[k] : z[1];
    });
  }
  EINST_CACHE_ = e;
  return e;
}

function zahl_(wert, vorgabe) {
  var n = Number(wert);
  return isFinite(n) && n > 0 ? n : vorgabe;
}

/* ------------------------------------------------------------------ Tabellenhilfen */

function blatt_(name) {
  var b = tabelle_().getSheetByName(name);
  if (!b) throw new Error('Tabellenblatt "' + name + '" fehlt. Bitte im Menü "Upload-Strecke > Ersteinrichtung" ausführen.');
  return b;
}

function kopf_(b) {
  return b.getRange(1, 1, 1, b.getLastColumn()).getValues()[0].map(function (k) { return String(k).trim(); });
}

/** Alle Zeilen eines Blatts als Objekte, Schlüssel = Spaltenkopf, dazu _zeile (1-basiert). */
function lesen_(name) {
  var b = blatt_(name);
  var werte = b.getDataRange().getValues();
  if (werte.length < 2) return [];
  var kopf = werte[0].map(function (k) { return String(k).trim(); });
  var aus = [];
  for (var i = 1; i < werte.length; i++) {
    var o = { _zeile: i + 1, _alt: {} };
    var leer = true;
    for (var j = 0; j < kopf.length; j++) {
      o[kopf[j]] = werte[i][j];
      o._alt[kopf[j]] = werte[i][j];
      if (werte[i][j] !== '' && werte[i][j] !== null) leer = false;
    }
    if (!leer) aus.push(o);
  }
  return aus;
}

/**
 * Schreibt nur die Zellen, die sich seit dem Lesen geändert haben. So überschreibt ein
 * Vorgang nie, was ein anderer (Upload, Prüflauf, Betreiber) inzwischen eingetragen hat.
 */
function schreiben_(name, obj) {
  var b = blatt_(name);
  var kopf = kopf_(b);
  var alt = obj._alt || {};
  for (var j = 0; j < kopf.length; j++) {
    var k = kopf[j];
    if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
    if (obj._alt && gleich_(obj[k], alt[k])) continue;
    b.getRange(obj._zeile, j + 1).setValue(zelle_(obj[k]));
    alt[k] = obj[k];
  }
}

function anhaengen_(name, obj) {
  var b = blatt_(name);
  var kopf = kopf_(b);
  b.appendRow(kopf.map(function (k) { return (obj[k] === undefined || obj[k] === null) ? '' : zelle_(obj[k]); }));
}

function gleich_(a, b) {
  var da = Object.prototype.toString.call(a) === '[object Date]';
  var db = Object.prototype.toString.call(b) === '[object Date]';
  if (da || db) return da && db && a.getTime() === b.getTime();
  return String(a === null || a === undefined ? '' : a) === String(b === null || b === undefined ? '' : b);
}

/** Texte, die mit = + - @ beginnen, als Text speichern. Sonst rechnet die Tabelle
 *  Kundeneingaben als Formel (Formelinjektion). */
function zelle_(v) {
  return (typeof v === 'string' && /^[=+\-@]/.test(v)) ? "'" + v : v;
}

/* ------------------------------------------------------------------ Datum */

function iso_(d) {
  if (!d) return '';
  if (Object.prototype.toString.call(d) === '[object Date]') {
    return Utilities.formatDate(d, 'Europe/Berlin', 'yyyy-MM-dd');
  }
  var s = String(d).trim();
  var m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);          // 08.09.2026
  if (m) return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
  s = s.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';            // unlesbar = kein Datum
}

function deDatum_(d) {
  var s = iso_(d);
  var t = s.split('-');
  return t.length === 3 ? (t[2] + '.' + t[1] + '.' + t[0]) : s;
}

function heute_() {
  return Utilities.formatDate(new Date(), 'Europe/Berlin', 'yyyy-MM-dd');
}

function datumAus_(iso) {
  var t = String(iso).split('-');
  return new Date(Number(t[0]), Number(t[1]) - 1, Number(t[2]), 12, 0, 0);
}

function plusTage_(iso, tage) {
  var d = datumAus_(iso);
  d.setDate(d.getDate() + tage);
  return iso_(d);
}

/** Fällt das Datum auf ein Wochenende, gilt der folgende Montag. */
function werktag_(iso) {
  var tag = datumAus_(iso).getDay();
  if (tag === 6) return plusTage_(iso, 2);
  if (tag === 0) return plusTage_(iso, 1);
  return iso;
}

function tageSeit_(iso) {
  if (!iso) return -1;
  return Math.round((datumAus_(heute_()) - datumAus_(iso)) / 86400000);
}

/* ------------------------------------------------------------------ Fall und Token */

/** Uploads sind erlaubt, solange der Fall aktiv oder vollständig ist und der Link gilt. */
var STATUS_OFFEN = { aktiv: 1, vollstaendig: 1 };

function findFall_(token) {
  token = String(token || '');
  if (!/^[A-Za-z0-9]{24,64}$/.test(token)) return null;
  var faelle = lesen_(BLATT.FAELLE);
  for (var i = 0; i < faelle.length; i++) {
    var f = faelle[i];
    if (String(f.token) !== token) continue;
    if (!STATUS_OFFEN[String(f.status)]) return null;
    var bis = iso_(f.gueltig_bis);
    if (!bis || bis < heute_()) return null;                  // unlesbares Datum sperrt
    return f;
  }
  return null;
}

function fallOrdner_(fall) {
  var url = String(fall.ordner_url || '');
  var m = url.match(/folders\/([A-Za-z0-9_-]+)/);
  if (!m) throw new Error(meld_(fall).ungueltig);
  return DriveApp.getFolderById(m[1]);
}

function duFuer_(fall) {
  var a = String((fall && fall.ansprache) || einst_().ansprache || 'sie').toLowerCase();
  return a === 'du';
}

function meld_(fall) {
  return texte_(duFuer_(fall)).meld;
}

function pruefeFall_(token) {
  var fall = findFall_(token);
  if (!fall) throw new Error(texte_(duFuer_(null)).meld.ungueltig);
  return fall;
}

/* ------------------------------------------------------------------ Seite */

function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

function doGet(e) {
  var token = (e && e.parameter && e.parameter.t) ? String(e.parameter.t) : '';
  var fall = findFall_(token);
  var s = einst_();
  var du = duFuer_(fall);
  var t = texte_(du);
  var thema = String(s.thema || 'Beratung');
  var artikel = String(s.thema_artikel || 'die');
  var firmaName = String(s.firma_name || '');
  t.heroTitelHtml = t.heroTitel.replace('{ARTIKEL}', esc_(artikel)).replace('{THEMA}', esc_(thema));   // <em> gewollt
  t.heroTitel = t.heroTitel.replace('{ARTIKEL}', artikel).replace('{THEMA}', thema);
  t.vorgangStandard = t.vorgangStandard.replace('{THEMA}', thema);
  t.datenschutz = t.datenschutz.replace('{FIRMA}', firmaName || 'uns');
  t.firma = firmaName;

  var tpl = HtmlService.createTemplateFromFile('index');
  tpl.gueltig = fall ? true : false;
  tpl.token = fall ? token : '';
  tpl.maxMb = zahl_(s.max_mb_datei, 50);
  // JSON für den Script-Block: "<" maskieren, weil Kundentexte (Gründe) darin stehen können
  tpl.fallJson = skriptJson_(fall ? seitenDaten_(fall) : null);
  tpl.texteJson = skriptJson_(t);
  tpl.t = t;
  tpl.firma = {
    name: String(s.firma_name || ''),
    ansprechpartner: String(s.ansprechpartner || ''),
    telefon: String(s.telefon || ''),
    email: String(s.email || ''),
    adresse: String(s.adresse || ''),
    website: String(s.website || ''),
    thema: thema
  };
  var logo = include('Logo').replace(/<!--[\s\S]*?-->/g, '').trim();
  if (!/^(https:\/\/|data:image\/)/.test(logo)) logo = '';
  tpl.logo = esc_(logo);                                     // im Template roh (<?!= ?>), daher hier maskiert

  var seite = tpl.evaluate()
    .setTitle((s.firma_name ? s.firma_name + ' · ' : '') + t.seitentitel)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');

  // Einbettung nur zulassen, wenn eine eigene Domain die Seite rahmt (siehe docs/02-domain.md).
  // Ohne Domain bleibt der Standardschutz von Google aktiv.
  if (konfig_().LINK_BASIS) seite.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  return seite;
}

/** Checkliste des Falls für die Seite, aus dem Blatt Positionen. */
function seitenDaten_(fall) {
  var s = einst_();
  var alle = lesen_(BLATT.POS).filter(function (p) { return String(p.fall_id) === String(fall.fall_id); });
  var gruppen = [];
  var nachTitel = {};
  var nachKey = {};

  alle.forEach(function (p) {
    if (String(p.status) === 'entfaellt') return;
    var pos = {
      key: String(p.key),
      titel: String(p.titel),
      hinweis: String(p.hinweis || ''),
      erwartet: zahl_(p.erwartet, 1),
      status: String(p.status || 'offen'),
      dateien: Number(p.dateien) || 0,
      grund: String(p.grund || ''),
      frage: String(p.frage || ''),
      blockName: String(p.block_name || ''),
      blockFeld: String(p.block_feld || '')
    };
    if (p.eltern_key) {
      var eltern = nachKey[String(p.eltern_key)];
      if (eltern) { (eltern.kinder = eltern.kinder || []).push(pos); }
      return;
    }
    var g = String(p.gruppe || 'Unterlagen');
    if (!nachTitel[g]) {
      nachTitel[g] = { titel: g, untertitel: String(p.gruppe_untertitel || ''), positionen: [] };
      gruppen.push(nachTitel[g]);
    }
    nachTitel[g].positionen.push(pos);
    nachKey[pos.key] = pos;
  });

  var offen = {};
  offenePositionen_(fall.fall_id).forEach(function (p) { offen[String(p.key)] = true; });
  Object.keys(nachKey).forEach(function (k) {
    var e = nachKey[k];
    if (!e.kinder) return;
    e.vorDateien = e.kinder.reduce(function (n, c) { return n + c.dateien; }, 0);
    e.erledigt = !offen[k];
  });

  return {
    vorgang: String(fall.vorgang || ''),
    gueltig_bis: deDatum_(fall.gueltig_bis),
    gueltig_tage: zahl_(s.link_laufzeit_tage, 21),
    gruppen: gruppen
  };
}

/* ------------------------------------------------------------------ Upload */

/**
 * Eine Datei je Aufruf.
 * payload = { name, mimeType, bytes(base64), unterlage, key }
 * Rückgabe = { name: '<abgelegter Name>', zeit: '18.08.2026, 14:32 Uhr' }
 */
function uploadFile(token, payload) {
  var fall = pruefeFall_(token);
  var m = meld_(fall);
  var s = einst_();
  var maxMb = zahl_(s.max_mb_datei, 50);
  if (!payload || !payload.bytes) throw new Error(m.unterbrochen);

  var roh = saubererName_(payload.name);
  var end = endung_(roh);
  if (!ERLAUBT[end]) throw new Error(m.format);

  var bytes;
  try { bytes = Utilities.base64Decode(payload.bytes); }
  catch (err) { throw new Error(m.unterbrochen); }

  if (!bytes || !bytes.length) throw new Error(m.leer);
  if (bytes.length > maxMb * 1024 * 1024) throw new Error(m.zugross.replace('{MB}', maxMb));
  if (!magicPasst_(end, bytes)) throw new Error(m.format);     // Endung allein ist keine Prüfung

  grenzePruefen_(fall, bytes.length);

  // Ablage ohne globale Sperre, damit parallele Kunden nicht aufeinander warten
  var unterlage = saubererName_(payload.unterlage);
  var name = kuerzen_(unterlage ? (unterlage + ' - ' + roh) : roh);
  var ordner = fallOrdner_(fall);
  if (ordner.getFilesByName(name).hasNext()) {                    // nie überschreiben
    var ts = Utilities.formatDate(new Date(), 'Europe/Berlin', 'yyyy-MM-dd_HHmmss');
    var p = name.lastIndexOf('.');
    name = kuerzen_(p > -1 ? (name.slice(0, p) + ' (' + ts + ')' + name.slice(p)) : (name + ' (' + ts + ')'));
  }
  var datei = ordner.createFile(Utilities.newBlob(bytes, MIME[end], name));

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    fall = pruefeFall_(token);                                    // frisch lesen, unter Sperre
    var jetzt = new Date();
    anhaengen_(BLATT.EING, {
      zeitpunkt: jetzt,
      fall_id: fall.fall_id,
      art: 'Upload',
      position: unterlage,
      datei: name,
      groesse_kb: Math.round(bytes.length / 1024),
      link: datei.getUrl(),
      grund: ''
    });
    positionZaehlen_(fall, payload.key);

    fall.dateien = (Number(fall.dateien) || 0) + 1;
    fall.volumen_mb = Math.round(((Number(fall.volumen_mb) || 0) + bytes.length / 1048576) * 10) / 10;
    fall.letzter_eingang = jetzt;
    statusNachziehen_(fall);
    schreiben_(BLATT.FAELLE, fall);

    return { name: name, zeit: Utilities.formatDate(jetzt, 'Europe/Berlin', "dd.MM.yyyy', 'HH:mm' Uhr'") };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Der Kunde meldet mit Grund, dass eine Unterlage nicht existiert.
 * Das ist eine Auskunft, keine Entscheidung: ob die Position entfällt, entscheidet der Betreiber
 * in der Tabelle (Status "entfaellt" oder zurück auf "offen").
 */
function meldeNichtVorhanden(token, key, unterlage, grund) {
  var fall = pruefeFall_(token);
  grund = String(grund || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 500);
  if (grund.length < 3) throw new Error(meld_(fall).grund);
  var text = saubererName_(unterlage) || '(ohne Angabe)';

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    fall = pruefeFall_(token);                                    // frisch lesen, unter Sperre
    grenzePruefen_(fall, 0);
    var jetzt = new Date();
    anhaengen_(BLATT.EING, {
      zeitpunkt: jetzt, fall_id: fall.fall_id, art: 'Nicht vorhanden', position: text,
      datei: '', groesse_kb: 0, link: '', grund: grund
    });
    positionSetzen_(fall, key, 'nicht_vorhanden', grund);
    fall.letzter_eingang = jetzt;
    statusNachziehen_(fall);
    schreiben_(BLATT.FAELLE, fall);
    return { zeit: Utilities.formatDate(jetzt, 'Europe/Berlin', "dd.MM.yyyy', 'HH:mm' Uhr'") };
  } finally {
    lock.releaseLock();
  }
}

/** Der Kunde nimmt seine Meldung "nicht vorhanden" zurück. */
function nimmMeldungZurueck(token, key) {
  var fall = pruefeFall_(token);
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    fall = pruefeFall_(token);
    positionSetzen_(fall, key, 'offen', '');
    statusNachziehen_(fall);
    schreiben_(BLATT.FAELLE, fall);
    return true;
  } finally {
    lock.releaseLock();
  }
}

/* ------------------------------------------------------------------ Positionen */

/** Objektblöcke tragen Schlüssel der Form <eltern>--o2--<kind>. Gezählt wird beim Kind. */
function grundKey_(key) {
  var s = String(key || '');
  var i = s.indexOf('--o');
  if (i === -1) return s;
  var rest = s.slice(i + 3);
  var j = rest.indexOf('--');
  return j === -1 ? s.slice(0, i) : rest.slice(j + 2);
}

function positionFinden_(fall, key) {
  var k = grundKey_(key);
  if (!k || k === 'weitere') return null;
  var alle = lesen_(BLATT.POS);
  for (var i = 0; i < alle.length; i++) {
    if (String(alle[i].fall_id) === String(fall.fall_id) && String(alle[i].key) === k) return alle[i];
  }
  return null;
}

function positionZaehlen_(fall, key) {
  var p = positionFinden_(fall, key);
  if (!p) return;
  p.dateien = (Number(p.dateien) || 0) + 1;
  var st = String(p.status || 'offen');
  if (st === 'offen' || st === 'nicht_vorhanden') { p.status = 'eingegangen'; p.grund = ''; }
  schreiben_(BLATT.POS, p);
}

function positionSetzen_(fall, key, status, grund) {
  var p = positionFinden_(fall, key);
  if (!p) return;
  var st = String(p.status || 'offen');
  if (st === 'geprueft' || st === 'entfaellt') return;      // Entscheidungen des Betreibers bleiben
  if (status === 'offen' && (Number(p.dateien) || 0) > 0) status = 'eingegangen';
  p.status = status;
  p.grund = grund;
  schreiben_(BLATT.POS, p);
}

/**
 * Offen ist eine Hauptposition, die weder geprüft, entfallen noch als nicht vorhanden gemeldet
 * ist und zu wenige Dateien hat. Eine Position mit Unterpositionen (je Objekt) ist offen, bis der
 * Kunde "Nein" gemeldet hat oder jede Unterposition mindestens eine Datei hat.
 */
function offeneZaehlen_(fallId) {
  return offenePositionen_(fallId).length;
}

function offenePositionen_(fallId) {
  var alle = lesen_(BLATT.POS).filter(function (p) { return String(p.fall_id) === String(fallId); });
  var kinder = {};
  alle.forEach(function (p) {
    if (p.eltern_key) (kinder[String(p.eltern_key)] = kinder[String(p.eltern_key)] || []).push(p);
  });
  function erledigtStatus(p) {
    var st = String(p.status || 'offen');
    return st === 'geprueft' || st === 'entfaellt' || st === 'nicht_vorhanden';
  }
  return alle.filter(function (p) {
    if (p.eltern_key) return false;
    if (erledigtStatus(p)) return false;
    var k = kinder[String(p.key)];
    if (k) return !k.every(function (c) { return erledigtStatus(c) || (Number(c.dateien) || 0) > 0; });
    return (Number(p.dateien) || 0) < zahl_(p.erwartet, 1);
  });
}

/** Offene Positionen neu zählen und den Fallstatus daran ausrichten. */
function statusNachziehen_(fall) {
  fall.offen = offeneZaehlen_(fall.fall_id);
  var st = String(fall.status);
  if (st === 'aktiv' && fall.offen === 0) fall.status = 'vollstaendig';
  if (st === 'vollstaendig' && fall.offen > 0) fall.status = 'aktiv';
  return fall;
}

/* ------------------------------------------------------------------ Helfer */

function esc_(x) {
  return String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function skriptJson_(obj) {
  // "<" und die Zeilentrenner U+2028/U+2029 maskieren, damit nichts den Script-Block bricht
  var bs = String.fromCharCode(92);
  return JSON.stringify(obj)
    .split('<').join(bs + 'u003c')
    .split(String.fromCharCode(0x2028)).join(bs + 'u2028')
    .split(String.fromCharCode(0x2029)).join(bs + 'u2029');
}

function endung_(name) {
  var p = String(name || '').lastIndexOf('.');        // letzte Endung: "Bescheid.pdf.exe" ist exe
  return p > -1 ? String(name).slice(p + 1).toLowerCase() : '';
}

function saubererName_(s) {
  return String(s || '')
    .replace(/[\\\/:*?"<>|]/g, ' ')
    .replace(/[\x00-\x1F\x7F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Mittig kürzen, die Endung nie verlieren. */
function kuerzen_(name) {
  if (name.length <= MAX_NAME) return name;
  var p = name.lastIndexOf('.');
  var end = p > -1 ? name.slice(p) : '';
  var kern = p > -1 ? name.slice(0, p) : name;
  var platz = MAX_NAME - end.length - 5;
  if (platz < 10) return kern.slice(0, Math.max(1, MAX_NAME - end.length)) + end;
  var halb = Math.floor(platz / 2);
  return kern.slice(0, halb) + ' ... ' + kern.slice(kern.length - (platz - halb)) + end;
}

/** Erste Bytes gegen die Endung. Ein umbenanntes Archiv fällt hier durch. */
function magicPasst_(end, bytes) {
  function b(i) { return bytes.length > i ? (bytes[i] & 0xFF) : -1; }
  if (end === 'pdf') return b(0) === 0x25 && b(1) === 0x50 && b(2) === 0x44 && b(3) === 0x46;
  if (end === 'png') return b(0) === 0x89 && b(1) === 0x50 && b(2) === 0x4E && b(3) === 0x47;
  if (end === 'jpg' || end === 'jpeg') return b(0) === 0xFF && b(1) === 0xD8 && b(2) === 0xFF;
  if (end === 'heic' || end === 'heif') {
    if (!(b(4) === 0x66 && b(5) === 0x74 && b(6) === 0x79 && b(7) === 0x70)) return false;   // "ftyp"
    var marke = String.fromCharCode(b(8), b(9), b(10), b(11));
    return !!HEIC_MARKEN[marke];                                  // ein Video (mp42, isom) fällt durch
  }
  return false;
}

/** Missbrauchsgrenzen je Fall. Der Endpunkt ist öffentlich, das Token die einzige Hürde. */
function grenzePruefen_(fall, zusatzBytes) {
  var s = einst_();
  var maxDateien = zahl_(s.max_dateien_fall, 60);
  var maxMb = zahl_(s.max_mb_fall, 500);
  var anzahl = Number(fall.dateien) || 0;
  var mb = Number(fall.volumen_mb) || 0;
  if (zusatzBytes > 0 && anzahl + 1 > maxDateien) throw new Error(meld_(fall).grenze);
  if (mb + zusatzBytes / 1048576 > maxMb) throw new Error(meld_(fall).grenze);
}

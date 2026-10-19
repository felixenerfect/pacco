/**
 * Upload-Strecke · Verwaltung in der Google-Tabelle
 *
 * Menü "Upload-Strecke", Ersteinrichtung, Fälle anlegen, Links verlängern und sperren,
 * Einladungs- und Erinnerungsmails, täglicher Prüflauf.
 * Alles läuft im Google-Konto des Betreibers. Keine lokale Software nötig.
 */

/* ------------------------------------------------------------------ Aufbau der Tabelle */

var KOPF = {
  Einstellungen: ['schluessel', 'wert', 'erklaerung'],
  Faelle: ['fall_id', 'status', 'vorname', 'nachname', 'anrede', 'ansprache', 'email', 'vorgang',
           'checkliste', 'angelegt_am', 'gueltig_bis', 'eingeladen_am', 'erinnerung_1_am',
           'erinnerung_2_am', 'letzter_eingang', 'dateien', 'volumen_mb',
           'offen', 'link', 'ordner_url', 'token', 'notiz'],
  Checklisten: ['vorlage', 'gruppe', 'gruppe_untertitel', 'titel', 'hinweis', 'erwartet', 'gehoert_zu', 'frage',
                'block_name', 'block_feld'],
  Positionen: ['fall_id', 'gruppe', 'gruppe_untertitel', 'key', 'eltern_key', 'titel', 'hinweis', 'frage', 'block_name', 'block_feld',
               'erwartet', 'status', 'dateien', 'grund'],
  Eingaenge: ['zeitpunkt', 'fall_id', 'art', 'position', 'datei', 'groesse_kb', 'link', 'grund'],
  Mailtexte: ['typ', 'ansprache', 'betreff', 'text']
};

var STATUS_FALL = ['aktiv', 'vollstaendig', 'gesperrt', 'abgelaufen', 'abgeschlossen'];
var STATUS_POS = ['offen', 'eingegangen', 'geprueft', 'entfaellt', 'nicht_vorhanden'];

/** [Schlüssel, Vorgabewert, Erklärung]. Werte sind Platzhalter, die Einrichtung ersetzt sie. */
var EINSTELLUNGEN_VORGABE = [
  ['firma_name', 'Musterfirma GmbH', 'Name, wie er auf der Kundenseite und in Mails erscheint'],
  ['ansprechpartner', 'Max Beispiel', 'Ansprechpartner auf der Kundenseite'],
  ['telefon', '01234 / 567 89 0', 'Telefon für Rückfragen'],
  ['email', 'info@example.com', 'Kontaktadresse auf der Kundenseite'],
  ['adresse', 'Musterstraße 1, 12345 Musterstadt', 'Postanschrift im Seitenfuß'],
  ['website', 'www.example.com', 'Website im Seitenfuß'],
  ['thema', 'Beratung', 'Wofür die Unterlagen sind, ein Wort: z. B. Energieberatung, Finanzierung, Steuererklärung'],
  ['thema_artikel', 'die', 'Artikel zum Thema im Satz "Ihre Unterlagen für die Energieberatung": die, den oder das'],
  ['ansprache', 'sie', 'Standard-Ansprache neuer Fälle: du oder sie'],
  ['link_laufzeit_tage', 21, 'So viele Tage gilt ein Link ab Einladung. Danach keine Erinnerung mehr, nur Meldung an dich'],
  ['erinnerung_1_tag', 7, 'Erste Erinnerung so viele Tage nach der Einladung'],
  ['erinnerung_2_tag', 14, 'Zweite (letzte) Erinnerung so viele Tage nach der Einladung'],
  ['erinnerung_pause_tage', 3, 'Keine Erinnerung, wenn der Kunde in den letzten X Tagen etwas hochgeladen hat'],
  ['mailmodus', 'entwurf', 'entwurf = Gmail-Entwurf, du sendest selbst · senden = automatisch · aus = keine Mails'],
  ['absender_name', '', 'Anzeigename im Absender, leer = firma_name'],
  ['kopie_an', '', 'Kopie jeder Kundenmail an diese Adresse (leer = keine)'],
  ['antwort_an', '', 'Antworten gehen an diese Adresse (leer = an das Google-Konto)'],
  ['signatur', '', 'Wird unter jede Kundenmail gesetzt. Leer = Grußformel mit Ansprechpartner, Firma und Telefon'],
  ['knopf_text', 'Unterlagen hochladen', 'Beschriftung des Knopfs in der HTML-Mail'],
  ['termin_link', '', 'Optional: Link zur Terminbuchung, erscheint in den Erinnerungen'],
  ['tagesmeldung', 'ja', 'ja = du bekommst morgens eine Mail mit neuen Eingängen und fälligen Punkten'],
  ['max_mb_datei', 50, 'Größte erlaubte Datei in MB'],
  ['max_dateien_fall', 60, 'Höchstzahl Dateien je Fall'],
  ['max_mb_fall', 500, 'Höchstvolumen je Fall in MB']
];

/* ------------------------------------------------------------------ Musterdaten */

/**
 * Ersatz-Checkliste, falls die Einrichtung keine eigene liefert. Die eigentlichen Checklisten
 * kommen aus dem Setup (Konfig.gs, Variable CHECKLISTEN, erzeugt mit tools/checkliste.js aus den
 * CSV-Dateien in checklisten/ bzw. der Bibliothek vorlagen/checklisten/).
 * [vorlage, gruppe, untertitel, titel, hinweis, erwartet, gehoert_zu, frage, block_name, block_feld]
 */
var MUSTER_CHECKLISTE = [
  ['Beispiel', 'Allgemeine Unterlagen', 'Zu Ihrer Person', 'Ausweisdokument', 'Vorder- und Rückseite', 1, '', '', '', ''],
  ['Beispiel', 'Allgemeine Unterlagen', 'Zu Ihrer Person', 'Unterschriebene Vollmacht', 'Vorlage liegt der Einladung bei', 1, '', '', '', ''],
  ['Beispiel', 'Allgemeine Unterlagen', 'Zu Ihrer Person', 'Rechnungen des letzten Jahres', 'Je Rechnung eine Datei', 3, '', '', '', ''],
  ['Beispiel', 'Allgemeine Unterlagen', 'Zu Ihrer Person', 'Weitere Objekte', '', 1, '', 'Gibt es weitere Objekte?', 'Objekt', 'Adresse oder Bezeichnung'],
  ['Beispiel', 'Allgemeine Unterlagen', 'Zu Ihrer Person', 'Fotos', '', 1, 'Weitere Objekte', '', '', ''],
  ['Beispiel', 'Allgemeine Unterlagen', 'Zu Ihrer Person', 'Unterlagen zum Objekt', '', 1, 'Weitere Objekte', '', '', ''],
  ['Beispiel', 'Sonstiges', 'Was sonst noch hilft', 'Weitere Nachweise', 'Falls vorhanden', 1, '', '', '', '']
];

/** Checklisten aus der Einrichtung, sonst das Beispiel. Immer 10 Spalten. */
function startChecklisten_() {
  var quelle = (typeof CHECKLISTEN !== 'undefined' && CHECKLISTEN && CHECKLISTEN.length) ? CHECKLISTEN : MUSTER_CHECKLISTE;
  return quelle.map(function (z) {
    var zeile = z.slice(0, 10);
    while (zeile.length < 10) zeile.push('');
    return zeile;
  });
}

/** [typ, ansprache, betreff, text]. Platzhalter in doppelten geschweiften Klammern. */
var MUSTER_MAILS = [
  ['einladung', 'sie', '{{THEMA}} {{VORGANG}} · Unterlagen-Upload',
   '{{ANREDE_ZEILE}}\n\nfür {{THEMA_ARTIKEL}} {{VORGANG}} stellen wir die Unterlagen über eine geschützte Upload-Seite zusammen. Ihr persönlicher Link:\n\n{{LINK}}\n\nSo funktioniert es:\n- Link öffnen. Die Seite zeigt Position für Position, was gebraucht wird und was schon vorliegt.\n- Dateien als PDF oder Foto direkt bei der passenden Position hochladen, maximal {{MAX_MB}} MB je Datei.\n- Zwischenstände sind möglich, der Link gilt bis zum {{GUELTIG_BIS}}.\n- Gibt es eine Unterlage bei Ihnen nicht, melden Sie das mit einem kurzen Grund direkt in der Zeile.\n\nBei Fragen erreichen Sie uns unter {{TELEFON}}.'],
  ['einladung', 'du', '{{THEMA}} {{VORGANG}} · Unterlagen-Upload',
   '{{ANREDE_ZEILE}}\n\nfür {{THEMA_ARTIKEL}} {{VORGANG}} stellen wir die Unterlagen über eine geschützte Upload-Seite zusammen. Dein persönlicher Link:\n\n{{LINK}}\n\nSo funktioniert es:\n- Link öffnen. Die Seite zeigt Position für Position, was gebraucht wird und was schon vorliegt.\n- Dateien als PDF oder Foto direkt bei der passenden Position hochladen, maximal {{MAX_MB}} MB je Datei.\n- Zwischenstände sind möglich, der Link gilt bis zum {{GUELTIG_BIS}}.\n- Gibt es eine Unterlage bei dir nicht, melde das mit einem kurzen Grund direkt in der Zeile.\n\nBei Fragen erreichst du uns unter {{TELEFON}}.'],
  ['erinnerung_1', 'sie', 'Ihre Unterlagen: {{THEMA}} {{VORGANG}}',
   '{{ANREDE_ZEILE}}\n\nvor {{TAGE_SEIT}} Tagen haben wir Ihnen Ihren persönlichen Link geschickt. Bei uns fehlen noch Unterlagen.\n\nWir können mit unserer Arbeit erst starten, wenn alle Unterlagen zur Prüfung vorliegen.\n\nÜber den folgenden Link sehen Sie Ihre Liste mit dem aktuellen Stand und laden jede Unterlage direkt an der passenden Stelle hoch:\n\n{{LINK}}\n\nWenn eine Unterlage schwer zu beschaffen ist oder etwas unklar ist, melden Sie sich kurz unter {{TELEFON}}. Dann klären wir, wie wir es lösen.{{TERMIN_ZEILE}}'],
  ['erinnerung_1', 'du', 'Deine Unterlagen: {{THEMA}} {{VORGANG}}',
   '{{ANREDE_ZEILE}}\n\nvor {{TAGE_SEIT}} Tagen haben wir dir deinen persönlichen Link geschickt. Bei uns fehlen noch Unterlagen.\n\nWir können mit der Prüfung erst starten, wenn die Unterlagen vollständig vorliegen.\n\nÜber den folgenden Link siehst du deine Liste mit dem aktuellen Stand und lädst jede Unterlage direkt an der passenden Stelle hoch:\n\n{{LINK}}\n\nWenn eine Unterlage schwer zu beschaffen ist oder etwas unklar ist, melde dich kurz unter {{TELEFON}}. Dann klären wir, wie wir es lösen.{{TERMIN_ZEILE}}'],
  ['erinnerung_2', 'sie', 'Letzte Erinnerung: Unterlagen {{THEMA}} {{VORGANG}}',
   '{{ANREDE_ZEILE}}\n\nwir haben für Ihren Fall Kapazitäten eingeplant, seit {{TAGE_SEIT}} Tagen fehlen uns aber Unterlagen. Ohne sie können wir die Prüfung nicht abschließen.\n\nDiese Positionen stehen noch aus:\n\n{{LISTE}}\n\nSind die Unterlagen bis {{DATUM_ABBRUCH}} nicht vollständig, schließen wir den Vorgang von unserer Seite.\n\nHochladen können Sie hier:\n\n{{LINK}}\n\nFalls sich Ihre Pläne geändert haben oder Sie an einem Punkt Unterstützung brauchen, genügt eine kurze Rückmeldung unter {{TELEFON}}.{{TERMIN_ZEILE}}'],
  ['erinnerung_2', 'du', 'Letzte Erinnerung: Unterlagen {{THEMA}} {{VORGANG}}',
   '{{ANREDE_ZEILE}}\n\nwir haben für deinen Fall Kapazitäten eingeplant, seit {{TAGE_SEIT}} Tagen fehlen uns aber Unterlagen. Ohne sie können wir die Prüfung nicht abschließen.\n\nDiese Positionen stehen noch aus:\n\n{{LISTE}}\n\nSind die Unterlagen bis {{DATUM_ABBRUCH}} nicht vollständig, schließen wir den Vorgang von unserer Seite.\n\nHochladen kannst du hier:\n\n{{LINK}}\n\nFalls sich deine Pläne geändert haben oder du an einem Punkt Unterstützung brauchst, genügt eine kurze Rückmeldung unter {{TELEFON}}.{{TERMIN_ZEILE}}']
];

/* ------------------------------------------------------------------ Menü */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Upload-Strecke')
    .addItem('Neuer Fall …', 'menueNeuerFall')
    .addItem('Einladung für markierten Fall', 'menueEinladung')
    .addItem('Link verlängern (markierter Fall)', 'menueVerlaengern')
    .addItem('Link sperren (markierter Fall)', 'menueSperren')
    .addSeparator()
    .addItem('Erinnerungen jetzt prüfen', 'menueLaufJetzt')
    .addItem('Links neu aufbauen', 'menueLinksNeu')
    .addSeparator()
    .addItem('Ersteinrichtung / Reparatur', 'ersteinrichtung')
    .addItem('Selbsttest', 'selbsttest')
    .addToUi();
}

/**
 * Zugriffsschutz. Die Kundenseite ist öffentlich, und google.script.run kann jede Funktion
 * ohne Unterstrich aufrufen. Deshalb prüft jede Verwaltungsfunktion, dass sie aus der Tabelle
 * (Menü, Dialog) oder vom eigenen Zeitauslöser kommt. Anonyme Besucher haben keine
 * aktive Nutzeradresse und werden abgewiesen.
 */
function istBetreiber_() {
  var aktiv = '', wirksam = '';
  try { aktiv = Session.getActiveUser().getEmail(); } catch (e) { aktiv = ''; }
  try { wirksam = Session.getEffectiveUser().getEmail(); } catch (e) { wirksam = ''; }
  return !!aktiv && aktiv === wirksam;
}

function nurBetreiber_() {
  if (!istBetreiber_()) throw new Error('Keine Berechtigung.');
}

function vomEigenenAusloeser_(e) {
  if (!e || !e.triggerUid) return false;
  return ScriptApp.getProjectTriggers().some(function (t) { return t.getUniqueId() === String(e.triggerUid); });
}

function hinweis_(text) {
  try { SpreadsheetApp.getUi().alert(text); } catch (e) { Logger.log(text); }
}

function menueNeuerFall() {
  nurBetreiber_();
  var vorlagen = {};
  lesen_(BLATT.CHECK).forEach(function (z) { if (z.vorlage) vorlagen[String(z.vorlage)] = 1; });
  var tpl = HtmlService.createTemplateFromFile('NeuerFall');
  tpl.vorlagen = Object.keys(vorlagen);
  tpl.ansprache = String(einst_().ansprache || 'sie').toLowerCase();
  tpl.mailmodus = String(einst_().mailmodus || 'entwurf').toLowerCase();
  SpreadsheetApp.getUi().showModalDialog(tpl.evaluate().setWidth(460).setHeight(620), 'Neuer Fall');
}

function markierterFall_() {
  var b = SpreadsheetApp.getActiveSheet();
  if (b.getName() !== BLATT.FAELLE) throw new Error('Bitte im Blatt "Faelle" die Zeile des Falls markieren.');
  var zeile = b.getActiveRange().getRow();
  var fall = lesen_(BLATT.FAELLE).filter(function (f) { return f._zeile === zeile; })[0];
  if (!fall) throw new Error('In der markierten Zeile steht kein Fall.');
  return fall;
}

function menueEinladung() {
  nurBetreiber_();
  try {
    var fall = markierterFall_();
    hinweis_(fall.fall_id + ': ' + einladen_(fall));
  } catch (e) { hinweis_(e.message); }
}

function menueVerlaengern() {
  nurBetreiber_();
  try {
    var fall = markierterFall_();
    fall.gueltig_bis = datumAus_(werktag_(plusTage_(heute_(), zahl_(einst_().link_laufzeit_tage, 21))));
    if (!STATUS_OFFEN[String(fall.status)]) fall.status = 'aktiv';
    statusNachziehen_(fall);
    schreiben_(BLATT.FAELLE, fall);
    hinweis_(fall.fall_id + ': Link gilt jetzt bis ' + deDatum_(fall.gueltig_bis) + '.');
  } catch (e) { hinweis_(e.message); }
}

function menueSperren() {
  nurBetreiber_();
  try {
    var fall = markierterFall_();
    fall.status = 'gesperrt';
    schreiben_(BLATT.FAELLE, fall);
    hinweis_(fall.fall_id + ': Link gesperrt. Ein offenes Browserfenster kann ab sofort nichts mehr hochladen.');
  } catch (e) { hinweis_(e.message); }
}

function menueLaufJetzt() {
  nurBetreiber_();
  hinweis_(taeglicherLauf() || 'Nichts zu tun.');
}

function menueLinksNeu() {
  nurBetreiber_();
  var n = 0;
  lesen_(BLATT.FAELLE).forEach(function (f) {
    if (!f.token) return;
    var link = linkFuer_(String(f.token));
    if (link && link !== f.link) { f.link = link; schreiben_(BLATT.FAELLE, f); n++; }
  });
  hinweis_(n ? n + ' Links aktualisiert.' : 'Alle Links sind aktuell (oder die Web-App ist noch nicht bereitgestellt, siehe Selbsttest).');
}

/* ------------------------------------------------------------------ Fall anlegen */

function linkFuer_(token) {
  var k = konfig_();
  var basis = String(k.LINK_BASIS || k.WEBAPP_URL || '');
  if (!basis) return '';
  return basis + (basis.indexOf('?') === -1 ? '?t=' : '&t=') + token;
}

function slug_(s) {
  return String(s).toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
}

function neueFallId_() {
  var jahr = Utilities.formatDate(new Date(), 'Europe/Berlin', 'yyyy');
  var max = 0;
  lesen_(BLATT.FAELLE).forEach(function (f) {
    var m = String(f.fall_id).match(/^(\d{4})-(\d+)$/);
    if (m && m[1] === jahr) max = Math.max(max, Number(m[2]));
  });
  var n = max + 1;
  return jahr + '-' + (n < 1000 ? ('00' + n).slice(-3) : String(n));
}

/** Aufruf aus dem Dialog NeuerFall.html. */
function fallAnlegen(d) {
  nurBetreiber_();
  d = d || {};
  var vorname = String(d.vorname || '').trim();
  var nachname = String(d.nachname || '').trim();
  var email = String(d.email || '').trim();
  if (!vorname || !nachname) throw new Error('Vor- und Nachname fehlen.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('Die E-Mail-Adresse sieht nicht gültig aus.');

  var vorlage = String(d.checkliste || '');
  var zeilen = lesen_(BLATT.CHECK).filter(function (z) { return String(z.vorlage) === vorlage; });
  if (!zeilen.length) throw new Error('Checkliste "' + vorlage + '" gibt es im Blatt Checklisten nicht.');

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var s = einst_();
    var fallId = neueFallId_();
    var ordner = wurzel_().createFolder(fallId + ' ' + nachname);
    var token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '').slice(0, 8);
    var ansprache = String(d.ansprache || s.ansprache || 'sie').toLowerCase() === 'du' ? 'du' : 'sie';

    var fall = {
      fall_id: fallId, status: 'aktiv', vorname: vorname, nachname: nachname,
      anrede: String(d.anrede || ''), ansprache: ansprache, email: email,
      vorgang: String(d.vorgang || '').trim(), checkliste: vorlage,
      angelegt_am: new Date(),
      gueltig_bis: datumAus_(werktag_(plusTage_(heute_(), zahl_(s.link_laufzeit_tage, 21)))),
      dateien: 0, volumen_mb: 0, offen: 0,
      link: linkFuer_(token), ordner_url: ordner.getUrl(), token: token,
      notiz: linkFuer_(token) ? '' : 'Link entsteht nach der Bereitstellung: Menü "Links neu aufbauen"'
    };
    positionenAnlegen_(fallId, zeilen, d.geprueft || []);
    fall.offen = offeneZaehlen_(fallId);
    anhaengen_(BLATT.FAELLE, fall);
  } finally {
    lock.releaseLock();
  }

  var mail = 'keine Einladung';
  if (d.einladen) {
    var neu = lesen_(BLATT.FAELLE).filter(function (f) { return f.fall_id === fallId; })[0];
    mail = einladen_(neu);
  }
  return { fall_id: fallId, link: fall.link, mail: mail };
}

function positionenAnlegen_(fallId, zeilen, geprueft) {
  var keys = {};
  var nachTitel = {};
  var b = blatt_(BLATT.POS);
  var kopf = kopf_(b);
  var neu = [];

  function eindeutig(k) {
    var basis = k, n = 2;
    while (keys[k]) k = basis + '-' + (n++);
    keys[k] = 1;
    return k;
  }

  zeilen.forEach(function (z) {
    if (z.gehoert_zu) return;                          // Kinder erst nach den Eltern
    var key = eindeutig(slug_(String(z.gruppe).slice(0, 1) + '-' + z.titel));
    nachTitel[String(z.titel)] = key;
    neu.push({ fall_id: fallId, gruppe: z.gruppe, gruppe_untertitel: z.gruppe_untertitel, key: key,
               eltern_key: '', titel: z.titel, hinweis: z.hinweis, frage: z.frage,
               block_name: z.block_name, block_feld: z.block_feld,
               erwartet: zahl_(z.erwartet, 1), status: geprueft.indexOf(String(z.titel)) > -1 ? 'geprueft' : 'offen',
               dateien: 0, grund: '' });
  });
  zeilen.forEach(function (z) {
    if (!z.gehoert_zu) return;
    var eltern = nachTitel[String(z.gehoert_zu)];
    if (!eltern) return;
    var key = eindeutig(slug_('k-' + z.titel));
    neu.push({ fall_id: fallId, gruppe: z.gruppe, gruppe_untertitel: z.gruppe_untertitel, key: key,
               eltern_key: eltern, titel: z.titel, hinweis: z.hinweis, frage: '',
               erwartet: zahl_(z.erwartet, 1), status: 'offen', dateien: 0, grund: '' });
  });
  if (!neu.length) return;
  var werte = neu.map(function (o) { return kopf.map(function (k) { return o[k] === undefined ? '' : o[k]; }); });
  b.getRange(b.getLastRow() + 1, 1, werte.length, kopf.length).setValues(werte);
}

/* ------------------------------------------------------------------ Mails */

function einladen_(fall) {
  fall.link = linkFuer_(String(fall.token)) || fall.link;            // immer der aktuelle Link (Domain)
  if (!fall.link) throw new Error('Kein Link vorhanden. Erst die Web-App bereitstellen, dann "Links neu aufbauen".');
  // Laufzeit ab Einladung, damit Erinnerungen und Linkende zusammenpassen
  var bis = werktag_(plusTage_(heute_(), zahl_(einst_().link_laufzeit_tage, 21)));
  if (iso_(fall.gueltig_bis) < bis) fall.gueltig_bis = datumAus_(bis);
  fall.eingeladen_am = new Date();
  var ergebnis = versenden_(fall, mailBauen_('einladung', fall));
  fall.erinnerung_1_am = '';
  fall.erinnerung_2_am = '';
  if (!STATUS_OFFEN[String(fall.status)]) fall.status = 'aktiv';
  statusNachziehen_(fall);
  schreiben_(BLATT.FAELLE, fall);
  return ergebnis === 'kein Versand'
    ? 'Mailmodus "aus": Einladungsdatum gesetzt, bitte den Link selbst senden: ' + fall.link
    : ergebnis;
}

function mailBauen_(typ, fall) {
  var s = einst_();
  var du = duFuer_(fall);
  var anspr = du ? 'du' : 'sie';
  var vorlage = lesen_(BLATT.MAIL).filter(function (m) {
    return String(m.typ) === typ && String(m.ansprache).toLowerCase() === anspr;
  })[0];
  if (!vorlage) throw new Error('Im Blatt Mailtexte fehlt der Text "' + typ + '" für "' + anspr + '".');

  var offen = offenePositionen_(fall.fall_id).map(function (p) { return String(p.titel); });
  var liste = offen.length <= 5
    ? offen.map(function (t) { return '- ' + t; }).join('\n')
    : (du ? 'Was noch offen ist, siehst du in deiner Liste hinter dem Link.'
          : 'Was noch offen ist, sehen Sie in Ihrer Liste hinter dem Link.');

  var anredeZeile = du
    ? 'Hallo ' + fall.vorname + ','
    : (fall.anrede ? 'Hallo ' + fall.anrede + ' ' + fall.nachname + ',' : 'Hallo ' + fall.vorname + ' ' + fall.nachname + ',');
  var termin = s.termin_link
    ? '\n\n' + (du ? 'Lieber direkt sprechen? Hier kannst du einen Termin buchen: '
                   : 'Lieber direkt sprechen? Hier können Sie einen Termin buchen: ') + s.termin_link
    : '';
  var thema = String(s.thema || 'Beratung');

  var ersatz = {
    ANREDE_ZEILE: anredeZeile,
    VORNAME: fall.vorname, NACHNAME: fall.nachname,
    VORGANG: String(fall.vorgang || '').trim(),
    THEMA: thema, THEMA_ARTIKEL: String(s.thema_artikel || 'die') + ' ' + thema,
    LINK: linkFuer_(String(fall.token)) || fall.link, GUELTIG_BIS: deDatum_(fall.gueltig_bis),
    DATUM_ABBRUCH: deDatum_(fall.gueltig_bis),
    TAGE_SEIT: fall.eingeladen_am ? String(tageSeit_(iso_(fall.eingeladen_am))) : '',
    LISTE: liste, TERMIN_ZEILE: termin,
    FIRMA: s.firma_name, ANSPRECHPARTNER: s.ansprechpartner, TELEFON: s.telefon, EMAIL: s.email,
    MAX_MB: String(zahl_(s.max_mb_datei, 50))
  };
  function fuellen(text) {
    return String(text).replace(/\{\{([A-Z_]+)\}\}/g, function (all, k) {
      return Object.prototype.hasOwnProperty.call(ersatz, k) ? String(ersatz[k]) : all;
    }).replace(/ +([,.:])/g, '$1');
  }
  var betreff = fuellen(vorlage.betreff).replace(/\s+/g, ' ').trim();
  var text = fuellen(vorlage.text);
  if (/\{\{[A-Z_]+\}\}/.test(betreff + text)) throw new Error('Unbekannter Platzhalter im Mailtext "' + typ + '".');
  var signatur = String(s.signatur || '').trim()
    || ['Beste Grüße', '', s.ansprechpartner, [s.firma_name, s.telefon].filter(String).join(' · ')].join('\n').trim();
  return {
    betreff: betreff,
    text: text + '\n\n' + signatur,
    html: mailHtml_(betreff, text, signatur, linkFuer_(String(fall.token)) || fall.link, typ, du)
  };
}

/* ------------------------------------------------------------------ HTML-Mail */

/** Farben aus Design.html, damit Mails und Kundenseite gleich aussehen. */
function designFarben_() {
  var css = include('Design');
  function v(name, vorgabe) {
    var m = css.match(new RegExp('--' + name + '\\s*:\\s*(#[0-9a-fA-F]{3,8})'));
    return m ? m[1] : vorgabe;
  }
  var schrift = (css.match(/--schrift\s*:\s*([^;]+);/) || [])[1] || 'Arial, sans-serif';
  var radius = (css.match(/--rad-gross\s*:\s*([0-9.]+px)/) || [])[1] || '14px';
  var knopf = (css.match(/--rad-knopf\s*:\s*([0-9.]+px)/) || [])[1] || '999px';
  return {
    marke: v('marke', '#1f3a4d'), verlauf: v('marke-verlauf', v('marke', '#1f3a4d')),
    mittel: v('marke-mittel', v('marke', '#1f3a4d')), hell: v('marke-hell', '#eaf1f5'),
    akzent: v('akzent', '#c98a3c'), text: v('black', '#111418'), grau: v('gray-500', '#5f6b74'),
    linie: v('gray-200', '#e3e7ea'), flaeche: v('light', '#f3f5f6'),
    schrift: esc_(schrift.split(',')[0].replace(/"/g, "'").trim()) + ', Arial, Helvetica, sans-serif',
    radius: radius, knopfRadius: knopf
  };
}

/**
 * Mailtext aus der Tabelle in gestaltetes HTML:
 *   Leerzeile        -> neuer Absatz
 *   Zeilen mit "- "  -> Aufzählung
 *   Link allein      -> Knopf in der Markenfarbe, darunter die Adresse als Ausweichlink
 *   **fett**         -> fett
 */
function mailHtml_(betreff, text, signatur, link, typ, du) {
  var s = einst_();
  var f = designFarben_();
  var absatz = 'margin:0 0 16px;';

  function inline(t) {
    return esc_(t)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:' + f.marke + '; text-decoration:underline; word-break:break-all;">$1</a>');
  }
  function knopf(url) {
    return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 10px;"><tr>'
      + '<td style="border-radius:' + f.knopfRadius + '; background:' + f.marke + ';">'
      + '<a href="' + esc_(url) + '" style="display:inline-block; padding:14px 28px; font-family:' + f.schrift
      + '; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:' + f.knopfRadius + '; white-space:nowrap;">'
      + esc_(String(s.knopf_text || 'Unterlagen hochladen')) + '&nbsp;&nbsp;&rarr;</a></td></tr></table>'
      + '<p style="margin:0 0 20px; font-size:12px; line-height:1.5; color:' + f.grau + ';">Falls der Knopf nicht funktioniert: '
      + '<a href="' + esc_(url) + '" style="color:' + f.grau + '; word-break:break-all;">' + esc_(url) + '</a></p>';
  }

  var html = String(text).split(/\n\s*\n/).map(function (block) {
    var zeilen = block.split('\n').map(function (z) { return z.replace(/\s+$/, ''); }).filter(String);
    if (!zeilen.length) return '';
    if (zeilen.length === 1 && link && zeilen[0].trim() === String(link)) return knopf(link);
    var aus = '', liste = [], text = [];
    function textRaus() { if (text.length) { aus += '<p style="' + absatz + '">' + text.join('<br>') + '</p>'; text = []; } }
    function listeRaus() {
      if (!liste.length) return;
      aus += '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:-6px 0 18px;">'
        + liste.map(function (li) {
          return '<tr><td valign="top" style="padding:3px 10px 3px 0; color:' + f.akzent + '; font-weight:700;">&#8226;</td>'
            + '<td style="padding:3px 0; font-size:15px; line-height:1.55; color:' + f.text + ';">' + li + '</td></tr>';
        }).join('') + '</table>';
      liste = [];
    }
    zeilen.forEach(function (z) {
      if (/^\s*-\s+/.test(z)) { textRaus(); liste.push(inline(z.replace(/^\s*-\s+/, ''))); }
      else {
        listeRaus();
        // Zeile mit Doppelpunkt am Ende, direkt vor einer Liste: als kleine Überschrift
        text.push(/:\s*$/.test(z) && zeilen.length > 1 ? '<strong>' + inline(z) + '</strong>' : inline(z));
      }
    });
    textRaus(); listeRaus();
    return aus;
  }).join('');

  var sig = String(signatur || '').split('\n');
  var sigHtml = sig.map(function (z, i) {
    if (!z.trim()) return '';
    var erste = sig.slice(0, i).filter(function (x) { return x.trim(); }).length;
    if (erste === 0) return '<div style="margin-bottom:12px;">' + inline(z) + '</div>';           // Grußformel
    if (erste === 1) return '<div style="font-weight:600; color:' + f.text + ';">' + inline(z) + '</div>';   // Name
    return '<div style="font-size:13px; color:' + f.grau + ';">' + inline(z) + '</div>';
  }).join('');

  var logo = include('Logo').replace(/<!--[\s\S]*?-->/g, '').trim();
  var tpl = HtmlService.createTemplateFromFile('Mail');
  tpl.f = f;
  tpl.betreff = betreff;
  var vorschau = String(text).split('\n').filter(String).slice(1, 2).join(' ');   // Vorschauzeile im Posteingang
  tpl.vorschau = vorschau.length > 110 ? vorschau.slice(0, vorschau.lastIndexOf(' ', 110)) + ' …' : vorschau;
  tpl.eyebrow = typ === 'einladung' ? (du ? 'Dein persönlicher Upload-Link' : 'Ihr persönlicher Upload-Link') : 'Erinnerung';
  tpl.inhalt = html;
  tpl.signatur = sigHtml;
  // data:-Logos zeigt Gmail nicht, SVG zeigen Gmail und Outlook nicht: dann Schriftzug
  tpl.logo = (/^https:\/\//.test(logo) && !/\.svg(\?|#|$)/i.test(logo)) ? logo : '';
  tpl.firma = {
    name: String(s.firma_name || ''), adresse: String(s.adresse || ''), telefon: String(s.telefon || ''),
    email: String(s.email || ''), website: String(s.website || '')
  };
  return tpl.evaluate().getContent().replace(/^\s*<!--[\s\S]*?-->\s*/, '');
}

/** Rückgabe: "Entwurf angelegt", "gesendet" oder "kein Versand". */
function versenden_(fall, mail) {
  var s = einst_();
  var modus = String(s.mailmodus || 'entwurf').toLowerCase();
  if (modus === 'aus') return 'kein Versand';
  var opt = { htmlBody: mail.html, name: String(s.absender_name || s.firma_name || '') };
  if (s.kopie_an) opt.cc = String(s.kopie_an);
  if (s.antwort_an) opt.replyTo = String(s.antwort_an);
  if (modus === 'senden') {
    GmailApp.sendEmail(String(fall.email), mail.betreff, mail.text, opt);
    return 'gesendet';
  }
  GmailApp.createDraft(String(fall.email), mail.betreff, mail.text, opt);
  return 'Entwurf angelegt';
}

/* ------------------------------------------------------------------ Täglicher Prüflauf */

/**
 * Läuft jeden Morgen (Trigger aus der Ersteinrichtung) und auf Wunsch über das Menü.
 * Zählt offene Positionen nach, setzt vollständige und abgelaufene Fälle, löst die
 * Erinnerungen aus und schickt dir eine Tagesmeldung.
 */
function taeglicherLauf(e) {
  if (!vomEigenenAusloeser_(e)) nurBetreiber_();
  EINST_CACHE_ = null;
  var s = einst_();
  var e1 = zahl_(s.erinnerung_1_tag, 7);
  var e2 = zahl_(s.erinnerung_2_tag, 14);
  var pause = Number(s.erinnerung_pause_tage);
  if (!isFinite(pause) || pause < 0) pause = 3;
  var modusAus = String(s.mailmodus || '').toLowerCase() === 'aus';
  var b = { neu: {}, vollstaendig: [], erinnert: [], abgelaufen: [], fehler: [] };

  lesen_(BLATT.FAELLE).forEach(function (zeile) {
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      // unter Sperre frisch lesen, damit kein Upload und keine Handänderung verloren geht
      var f = lesen_(BLATT.FAELLE).filter(function (x) { return x._zeile === zeile._zeile; })[0];
      if (!f || String(f.fall_id) !== String(zeile.fall_id)) return;
      var st = String(f.status);
      if (!STATUS_OFFEN[st]) return;
      var name = f.fall_id + ' ' + f.nachname;
      var aktuell = linkFuer_(String(f.token));
      if (aktuell && aktuell !== f.link) f.link = aktuell;            // z. B. nach Umstellung auf die eigene Domain
      var bis = iso_(f.gueltig_bis);
      if (!bis || bis < heute_()) {
        f.status = 'abgelaufen';
        b.abgelaufen.push(name + ' (' + (Number(f.offen) || 0) + ' offen)');
      } else {
        statusNachziehen_(f);
        if (st === 'aktiv' && f.status === 'vollstaendig') b.vollstaendig.push(name);
        if (f.status === 'aktiv' && f.eingeladen_am && f.offen > 0) {
          var tage = tageSeit_(iso_(f.eingeladen_am));
          var kuerzlich = f.letzter_eingang && tageSeit_(iso_(f.letzter_eingang)) < pause;
          var stufe = '';
          if (!kuerzlich && tage >= e2 && f.erinnerung_1_am && !f.erinnerung_2_am
              && tageSeit_(iso_(f.erinnerung_1_am)) >= Math.max(1, e2 - e1)) stufe = 'erinnerung_2';
          else if (!kuerzlich && tage >= e1 && !f.erinnerung_1_am) stufe = 'erinnerung_1';
          if (stufe) {
            var ergebnis = versenden_(f, mailBauen_(stufe, f));
            b.erinnert.push(name + ': ' + (stufe === 'erinnerung_1' ? 'Erinnerung 1 ' : 'Erinnerung 2 ')
              + (modusAus ? 'fällig, Mailmodus "aus": bitte selbst nachfassen' : ergebnis));
            if (stufe === 'erinnerung_1') f.erinnerung_1_am = new Date(); else f.erinnerung_2_am = new Date();
          }
        }
      }
      schreiben_(BLATT.FAELLE, f);
    } catch (err) {
      b.fehler.push(zeile.fall_id + ': ' + err.message);
    } finally {
      lock.releaseLock();
    }
  });

  var props = PropertiesService.getScriptProperties();
  var seit = props.getProperty('LETZTER_LAUF');
  var seitDatum = seit ? new Date(seit) : new Date(0);
  lesen_(BLATT.EING).forEach(function (z) {
    if (Object.prototype.toString.call(z.zeitpunkt) !== '[object Date]' || z.zeitpunkt <= seitDatum) return;
    b.neu[z.fall_id] = (b.neu[z.fall_id] || 0) + 1;
  });
  props.setProperty('LETZTER_LAUF', new Date().toISOString());

  var zeilen = [];
  var neu = Object.keys(b.neu);
  if (neu.length) zeilen.push('Neue Eingänge: ' + neu.map(function (k) { return k + ' (' + b.neu[k] + ')'; }).join(', '));
  if (b.vollstaendig.length) zeilen.push('Vollständig: ' + b.vollstaendig.join(', '));
  if (b.erinnert.length) zeilen.push('Erinnerungen: ' + b.erinnert.join(' · '));
  if (b.abgelaufen.length) zeilen.push('Frist abgelaufen, Link geschlossen. Bitte entscheiden (verlängern oder abschließen): ' + b.abgelaufen.join(', '));
  if (b.fehler.length) zeilen.push('Fehler: ' + b.fehler.join(' · '));
  var bericht = zeilen.join('\n');

  if (bericht && String(s.tagesmeldung).toLowerCase() === 'ja') {
    var an = Session.getEffectiveUser().getEmail();
    if (an) GmailApp.sendEmail(an, 'Upload-Strecke · Tagesmeldung ' + deDatum_(heute_()),
      bericht + '\n\nTabelle: ' + tabelle_().getUrl());
  }
  return bericht;
}

/* ------------------------------------------------------------------ Ersteinrichtung */

function ersteinrichtung() {
  nurBetreiber_();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var props = PropertiesService.getScriptProperties();
  props.setProperty('TABELLE_ID', ss.getId());
  var log = [];
  // Neue Tabellen übernehmen oft die US-Zeitzone des Kontos: Uhrzeiten wären verschoben
  if (ss.getSpreadsheetTimeZone() !== 'Europe/Berlin') {
    ss.setSpreadsheetTimeZone('Europe/Berlin');
    log.push('Zeitzone der Tabelle auf Europe/Berlin gestellt');
  }

  Object.keys(KOPF).forEach(function (name) {
    var b = ss.getSheetByName(name);
    if (!b) { b = ss.insertSheet(name); log.push('Blatt ' + name + ' angelegt'); }
    var vorhanden = b.getLastColumn() ? kopf_(b) : [];
    var fehlt = KOPF[name].filter(function (k) { return vorhanden.indexOf(k) === -1; });
    if (fehlt.length) {
      b.getRange(1, vorhanden.filter(String).length + 1, 1, fehlt.length).setValues([fehlt]);
      if (vorhanden.length) log.push(name + ': Spalten ergänzt (' + fehlt.join(', ') + ')');
    }
    b.getRange(1, 1, 1, b.getLastColumn()).setFontWeight('bold').setBackground('#eef1f5');
    b.setFrozenRows(1);
    textSpalten_(b, TEXTSPALTEN[name] || []);
    var formate = DATUMSSPALTEN[name] || {};
    var kopf = kopf_(b);
    Object.keys(formate).forEach(function (n) {
      var i = kopf.indexOf(n);
      if (i > -1) b.getRange(2, i + 1, Math.max(1, b.getMaxRows() - 1), 1).setNumberFormat(formate[n]);
    });
  });
  ['Tabellenblatt1', 'Sheet1'].forEach(function (n) {
    var b = ss.getSheetByName(n);
    if (b && b.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(b);
  });

  // Einstellungen: fehlende Schlüssel mit Vorgabe ergänzen, vorhandene Werte nie überschreiben
  var be = ss.getSheetByName(BLATT.EINST);
  var da = be.getLastRow() > 1 ? be.getRange(2, 1, be.getLastRow() - 1, 1).getValues().map(function (z) { return String(z[0]); }) : [];
  var start = (typeof STARTWERTE !== 'undefined' && STARTWERTE) ? STARTWERTE : {};
  EINSTELLUNGEN_VORGABE.forEach(function (v) {
    if (da.indexOf(v[0]) !== -1) return;
    be.appendRow([v[0], zelle_(Object.prototype.hasOwnProperty.call(start, v[0]) ? start[v[0]] : v[1]), v[2]]);
  });
  be.setColumnWidth(1, 190); be.setColumnWidth(2, 320); be.setColumnWidth(3, 520);
  EINST_CACHE_ = null;

  var bc = ss.getSheetByName(BLATT.CHECK);
  var listen = startChecklisten_();
  if (bc.getLastRow() < 2) {
    bc.getRange(2, 1, listen.length, 10).setValues(listen.map(function (z) { return z.map(zelle_); }));
    var vorlagen = {};
    listen.forEach(function (z) { vorlagen[z[0]] = 1; });
    log.push('Checklisten eingetragen: ' + Object.keys(vorlagen).join(', '));
  }
  var bm = ss.getSheetByName(BLATT.MAIL);
  if (bm.getLastRow() < 2) {
    bm.getRange(2, 1, MUSTER_MAILS.length, MUSTER_MAILS[0].length).setValues(MUSTER_MAILS);
    bm.getRange(2, 4, MUSTER_MAILS.length, 1).setWrap(true);
    bm.setColumnWidth(3, 300); bm.setColumnWidth(4, 640);
    log.push('Mailtexte eingetragen');
  }

  // Auswahllisten für die Statusspalten
  regel_(ss.getSheetByName(BLATT.FAELLE), 'status', STATUS_FALL);
  regel_(ss.getSheetByName(BLATT.FAELLE), 'ansprache', ['du', 'sie']);
  regel_(ss.getSheetByName(BLATT.POS), 'status', STATUS_POS);

  // Upload-Ordner in Google Drive
  var ordnerOk = false;
  try { wurzel_().getName(); ordnerOk = true; } catch (e) { ordnerOk = false; }
  if (!ordnerOk) {
    var ordner = DriveApp.createFolder(String(einst_().firma_name || 'Upload-Strecke') + ' Uploads');
    props.setProperty('ORDNER_ID', ordner.getId());
    log.push('Upload-Ordner angelegt: ' + ordner.getUrl());
  }

  // Täglicher Prüflauf um 8 Uhr
  var hatTrigger = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'taeglicherLauf'; });
  if (!hatTrigger) {
    ScriptApp.newTrigger('taeglicherLauf').timeBased().everyDays(1).atHour(8).inTimezone('Europe/Berlin').create();
    log.push('Täglicher Prüflauf 8 Uhr eingerichtet');
  }

  // Musterfall, damit sofort ein Ergebnis sichtbar ist
  if (!lesen_(BLATT.FAELLE).length) {
    var r = fallAnlegen({
      vorname: 'Max', nachname: 'Mustermann', anrede: 'Herr', ansprache: String(einst_().ansprache || 'sie'),
      email: Session.getEffectiveUser().getEmail() || 'max.mustermann@example.com',
      vorgang: String((typeof STARTWERTE !== 'undefined' && STARTWERTE.muster_vorgang) || 'Musterstraße 13, 12345 Musterstadt'),
      checkliste: listen[0][0],
      // zwei Positionen als "geprüft" vorbelegen, damit man beide Zustände sieht
      geprueft: listen.filter(function (z) { return z[0] === listen[0][0] && !z[6] && !z[7]; })
                     .slice(0, 2).map(function (z) { return String(z[3]); }),
      einladen: false
    });
    log.push('Musterfall ' + r.fall_id + ' angelegt' + (r.link ? '. Link: ' + r.link : ' (noch ohne Link: Web-App bereitstellen, dann Menü "Links neu aufbauen")'));
  }

  hinweis_('Ersteinrichtung abgeschlossen.\n\n' + (log.length ? log.join('\n') : 'Alles war schon eingerichtet.'));
}

/** Spalten als reinen Text führen: Telefon behält die führende Null, Fall-IDs werden kein Datum. */
var TEXTSPALTEN = {
  Einstellungen: ['schluessel', 'wert'],
  Faelle: ['fall_id', 'status', 'vorname', 'nachname', 'anrede', 'ansprache', 'email', 'vorgang',
           'checkliste', 'link', 'ordner_url', 'token', 'notiz'],
  Checklisten: ['vorlage', 'gruppe', 'gruppe_untertitel', 'titel', 'hinweis', 'gehoert_zu', 'frage', 'block_name', 'block_feld'],
  Positionen: ['fall_id', 'gruppe', 'gruppe_untertitel', 'key', 'eltern_key', 'titel', 'hinweis', 'frage', 'block_name',
               'block_feld', 'status', 'grund'],
  Eingaenge: ['fall_id', 'art', 'position', 'datei', 'link', 'grund'],
  Mailtexte: ['typ', 'ansprache', 'betreff', 'text']
};

var DATUMSSPALTEN = {
  Faelle: { angelegt_am: 'dd.mm.yyyy hh:mm', gueltig_bis: 'dd.mm.yyyy', eingeladen_am: 'dd.mm.yyyy',
            erinnerung_1_am: 'dd.mm.yyyy', erinnerung_2_am: 'dd.mm.yyyy', letzter_eingang: 'dd.mm.yyyy hh:mm' },
  Eingaenge: { zeitpunkt: 'dd.mm.yyyy hh:mm' }
};

function textSpalten_(b, namen) {
  var kopf = kopf_(b);
  namen.forEach(function (n) {
    var i = kopf.indexOf(n);
    if (i > -1) b.getRange(2, i + 1, Math.max(1, b.getMaxRows() - 1), 1).setNumberFormat('@');
  });
}

function regel_(b, spalte, werte) {
  var i = kopf_(b).indexOf(spalte);
  if (i === -1) return;
  var r = SpreadsheetApp.newDataValidation().requireValueInList(werte, true).setAllowInvalid(false).build();
  b.getRange(2, i + 1, Math.max(1, b.getMaxRows() - 1), 1).setDataValidation(r);
}

/* ------------------------------------------------------------------ Selbsttest */

function selbsttest() {
  nurBetreiber_();
  var z = [];
  function ok(bed, text) { z.push((bed ? 'OK    ' : 'FEHLT ') + text); }
  var ss = tabelle_();
  Object.keys(KOPF).forEach(function (n) { ok(!!ss.getSheetByName(n), 'Blatt ' + n); });
  var ordner = null;
  try { ordner = wurzel_(); } catch (e) { ordner = null; }
  ok(!!ordner, 'Upload-Ordner' + (ordner ? ': ' + ordner.getName() : ''));
  ok(ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'taeglicherLauf'; }), 'Täglicher Prüflauf');
  var k = konfig_();
  ok(!!k.WEBAPP_URL, 'Web-App-Adresse in Konfig.gs');
  z.push('INFO  Eigene Domain: ' + (k.LINK_BASIS || 'keine, Links zeigen auf script.google.com'));
  z.push('INFO  Mailmodus: ' + einst_().mailmodus + ' · Ansprache: ' + einst_().ansprache);
  var faelle = lesen_(BLATT.FAELLE);
  z.push('INFO  Fälle: ' + faelle.length + ', davon aktiv ' + faelle.filter(function (f) { return f.status === 'aktiv'; }).length);
  var ohneLink = faelle.filter(function (f) { return !f.link; }).length;
  if (ohneLink) z.push('HINWEIS ' + ohneLink + ' Fälle ohne Link: Menü "Links neu aufbauen"');
  hinweis_(z.join('\n'));
  return z.join('\n');
}

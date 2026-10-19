/**
 * Lesen und Prüfen von Checklisten im CSV-Format (Semikolon, UTF-8, Kopfzeile).
 * Spalten: vorlage;gruppe;gruppe_untertitel;titel;hinweis;erwartet;gehoert_zu;frage;block_name;block_feld
 * Genutzt von tools/checkliste.js, tools/test-lokal.js und tools/vorschau.js.
 */
'use strict';

const SPALTEN = ['vorlage', 'gruppe', 'gruppe_untertitel', 'titel', 'hinweis', 'erwartet',
                 'gehoert_zu', 'frage', 'block_name', 'block_feld'];

/** CSV mit Semikolon, Felder dürfen in "..." stehen (dann auch mit ; und "" darin). */
function zerlegen(text) {
  const zeilen = [];
  let feld = '', zeile = [], inQuote = false;
  text = String(text).replace(/^﻿/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuote) {
      if (c === '"' && text[i + 1] === '"') { feld += '"'; i++; }
      else if (c === '"') inQuote = false;
      else feld += c;
    } else if (c === '"') inQuote = true;
    else if (c === ';') { zeile.push(feld); feld = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      zeile.push(feld); feld = '';
      if (zeile.some((f) => f.trim() !== '')) zeilen.push(zeile);
      zeile = [];
    } else feld += c;
  }
  zeile.push(feld);
  if (zeile.some((f) => f.trim() !== '')) zeilen.push(zeile);
  return zeilen;
}

/**
 * Liefert { zeilen: [[10 Werte], ...], fehler: [...], warnungen: [...] }.
 * Fehler verhindern die Übernahme, Warnungen sind Hinweise.
 */
function lesen(text, quelle) {
  const fehler = [], warnungen = [];
  const roh = zerlegen(text);
  if (!roh.length) return { zeilen: [], fehler: [quelle + ': leer'], warnungen };
  const kopf = roh[0].map((k) => k.trim().toLowerCase());
  const fehlend = SPALTEN.filter((s) => s !== 'block_name' && s !== 'block_feld' && kopf.indexOf(s) === -1);
  if (fehlend.length) return { zeilen: [], fehler: [quelle + ': Spalten fehlen: ' + fehlend.join(', ')], warnungen };

  const zeilen = roh.slice(1).map((z, n) => {
    const o = {};
    SPALTEN.forEach((s) => { const i = kopf.indexOf(s); o[s] = i > -1 ? String(z[i] || '').trim() : ''; });
    o._nr = n + 2;
    return o;
  });

  const jeVorlage = {};
  zeilen.forEach((o) => { (jeVorlage[o.vorlage] = jeVorlage[o.vorlage] || []).push(o); });

  zeilen.forEach((o) => {
    const wo = quelle + ' Zeile ' + o._nr + ': ';
    ['vorlage', 'gruppe', 'titel'].forEach((s) => { if (!o[s]) fehler.push(wo + s + ' fehlt'); });
    if (o.erwartet === '') o.erwartet = '1';
    if (!/^[1-9][0-9]?$/.test(o.erwartet)) fehler.push(wo + 'erwartet muss eine Zahl von 1 bis 99 sein');
    if (o.gehoert_zu) {
      const eltern = (jeVorlage[o.vorlage] || []).find((x) => x.titel === o.gehoert_zu && !x.gehoert_zu);
      if (!eltern) fehler.push(wo + 'gehoert_zu "' + o.gehoert_zu + '" gibt es in dieser Vorlage nicht');
      if (o.frage) warnungen.push(wo + 'frage wird bei Unterpositionen ignoriert');
    }
    if (/^[=+\-@]/.test(o.titel)) warnungen.push(wo + 'Titel beginnt mit Formelzeichen, wird als Text gespeichert');
  });

  Object.keys(jeVorlage).forEach((v) => {
    const liste = jeVorlage[v];
    const titel = {};
    liste.forEach((o) => {
      const k = (o.gehoert_zu || '') + '|' + o.titel;
      if (titel[k]) fehler.push(quelle + ': Vorlage "' + v + '": Titel doppelt: ' + o.titel);
      titel[k] = 1;
    });
    liste.filter((o) => !o.gehoert_zu && liste.some((k) => k.gehoert_zu === o.titel)).forEach((e) => {
      if (!e.frage) fehler.push(quelle + ': Vorlage "' + v + '": "' + e.titel + '" hat Unterpositionen, braucht also eine frage (Ja/Nein)');
      if (!e.block_name) warnungen.push(quelle + ': Vorlage "' + v + '": "' + e.titel + '" ohne block_name, Kunde sieht "Eintrag"');
    });
    const sichtbar = liste.filter((o) => !o.gehoert_zu).length;
    if (sichtbar > 25) warnungen.push(quelle + ': Vorlage "' + v + '" hat ' + sichtbar + ' Positionen. Mehr als 25 überfordern Kunden.');
    const gruppen = new Set(liste.map((o) => o.gruppe)).size;
    if (gruppen > 5) warnungen.push(quelle + ': Vorlage "' + v + '" hat ' + gruppen + ' Gruppen. 2 bis 4 lesen sich am besten.');
  });

  return {
    zeilen: zeilen.map((o) => [o.vorlage, o.gruppe, o.gruppe_untertitel, o.titel, o.hinweis, Number(o.erwartet) || 1,
                               o.gehoert_zu, o.gehoert_zu ? '' : o.frage, o.gehoert_zu ? '' : o.block_name, o.gehoert_zu ? '' : o.block_feld]),
    fehler, warnungen
  };
}

module.exports = { SPALTEN, lesen, zerlegen };

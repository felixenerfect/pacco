/**
 * Persönliche Konfiguration. Die Einrichtung (/einrichten) kopiert diese Datei nach
 * apps-script/Konfig.gs und füllt sie aus. apps-script/Konfig.gs steht in .gitignore und
 * gehört nie ins Repo.
 *
 * KONFIG.WEBAPP_URL  Adresse der Bereitstellung, endet auf /exec (aus "clasp deployments").
 *                    Vor der ersten Bereitstellung leer lassen.
 * KONFIG.LINK_BASIS  Optional: eigene Domain, z. B. https://www.example.com/unterlagen/
 *                    Leer lassen, dann zeigen die Kundenlinks direkt auf script.google.com.
 *
 * STARTWERTE         Werte für das Blatt "Einstellungen". Sie werden nur bei der
 *                    Ersteinrichtung eingetragen, wenn der Schlüssel dort noch fehlt.
 *                    Später ändert man die Einstellungen direkt in der Tabelle.
 */
var KONFIG = {
  WEBAPP_URL: '',
  LINK_BASIS: ''
};

var STARTWERTE = {
  firma_name: 'Musterfirma GmbH',
  ansprechpartner: 'Max Beispiel',
  telefon: '01234 / 567 89 0',
  email: 'info@example.com',
  adresse: 'Musterstraße 1, 12345 Musterstadt',
  website: 'www.example.com',
  thema: 'Beratung',          // ein Wort: Energieberatung, Finanzierung, Steuererklärung ...
  thema_artikel: 'die',       // die, den oder das: "Ihre Unterlagen für die Energieberatung"
  muster_vorgang: 'Musterstraße 13, 12345 Musterstadt',
  ansprache: 'sie',
  mailmodus: 'entwurf',
  absender_name: '',
  kopie_an: '',
  antwort_an: '',
  signatur: '',            // leer = "Beste Grüße", Ansprechpartner, Firma · Telefon
  termin_link: '',
  tagesmeldung: 'ja',
  link_laufzeit_tage: 21,
  erinnerung_1_tag: 7,
  erinnerung_2_tag: 14
};

// CHECKLISTEN-ANFANG (erzeugt von tools/checkliste.js, nicht von Hand ändern)
// Leer = Beispiel-Checkliste. Die Einrichtung füllt das aus checklisten/*.csv.
var CHECKLISTEN = [];
// CHECKLISTEN-ENDE

/**
 * Upload-Strecke · Texte der Kundenseite in Du- und Sie-Fassung
 *
 * Welche Fassung gilt, steht je Fall in der Spalte "ansprache" (du/sie), sonst in der
 * Einstellung "ansprache". Wortlaut hier anpassen, nicht in index.html.
 * Platzhalter: {FIRMA}, {THEMA}, {ARTIKEL}, {BLOCK}, {MB}, {TAGE}, {DATUM}.
 */
function texte_(du) {
  var D = du;
  function w(duText, sieText) { return D ? duText : sieText; }

  return {
    seitentitel: 'Unterlagen hochladen',
    eyebrow: 'Sichere Übermittlung',
    heroTitel: w('Deine Unterlagen für {ARTIKEL} <em>{THEMA}</em>', 'Ihre Unterlagen für {ARTIKEL} <em>{THEMA}</em>'),
    heroLead: w('Lade hier die angeforderten Unterlagen hoch. Wir prüfen jede Datei und melden uns, wenn etwas fehlt.',
                'Laden Sie hier die angeforderten Unterlagen hoch. Wir prüfen jede Datei und melden uns, wenn etwas fehlt.'),
    metaVorgang: 'Vorgang',
    metaAnsprechpartner: w('Dein Kontakt', 'Ihr Kontakt'),
    metaGueltig: 'Link gültig bis',
    vorgangStandard: '{THEMA}',

    ungueltigEyebrow: 'Zugang abgelaufen',
    ungueltigTitel: w('Was du jetzt tun kannst', 'Was Sie jetzt tun können'),
    ungueltigText: w('Wir stellen dir einen neuen Link aus, sobald du dich meldest. Deine bereits übertragenen Unterlagen sind davon nicht betroffen und liegen weiter bei uns.',
                     'Wir stellen Ihnen einen neuen Link aus, sobald Sie sich melden. Ihre bereits übertragenen Unterlagen sind davon nicht betroffen und liegen weiter bei uns.'),
    ungueltigHero: 'Dieser Link ist <em>nicht mehr gültig</em>',
    ungueltigLead: 'Der Upload-Zeitraum für diesen Vorgang ist abgelaufen oder der Zugang wurde zurückgezogen.',
    direkterKontakt: 'Direkter Kontakt',

    jsTitel: w('Bitte aktiviere JavaScript', 'Bitte aktivieren Sie JavaScript'),
    jsText: w('Ohne JavaScript kann diese Seite keine Dateien übertragen. Ruf uns bitte an.',
              'Ohne JavaScript kann diese Seite keine Dateien übertragen. Rufen Sie uns bitte an.'),

    erledigt: 'Unterlagen erledigt',
    nichtsOffen: 'nichts mehr offen',
    offen: 'offen',
    unterbrechen: w('Du kannst jederzeit unterbrechen und diesen Link später erneut öffnen. Bereits übertragene Dateien bleiben erhalten.',
                    'Sie können jederzeit unterbrechen und diesen Link später erneut öffnen. Bereits übertragene Dateien bleiben erhalten.'),
    laufzeit: w('Der Link gilt {TAGE} Tage bis zum {DATUM}. Brauchst du länger, verlängern wir ihn, ein kurzer Anruf genügt.',
                'Der Link gilt {TAGE} Tage bis zum {DATUM}. Brauchen Sie länger, verlängern wir ihn, ein kurzer Anruf genügt.'),

    gruppeHinweis: w('Lege jede Datei bei der passenden Zeile ab. Mehrere Dateien je Zeile sind möglich.',
                     'Legen Sie jede Datei bei der passenden Zeile ab. Mehrere Dateien je Zeile sind möglich.'),
    weitereTitel: 'Weitere Unterlagen',
    weitereH2: 'Etwas, das oben nicht steht',
    weitereText: w('Alles, was du zusätzlich für wichtig hältst. Wir ordnen es zu.',
                   'Alles, was Sie zusätzlich für wichtig halten. Wir ordnen es zu.'),
    zoneTitel: 'Dateien hierher ziehen oder auswählen',
    zoneFormate: 'PDF und Bilder',

    fehlerTitel: 'Bitte noch ergänzen',
    keineAuswahl: 'Keine Datei ausgewählt',
    nichtsOhneBestaetigung: w('Nichts wird übertragen, bevor du es bestätigst.', 'Nichts wird übertragen, bevor Sie es bestätigen.'),
    sicherUebertragen: 'Sicher übertragen',
    fensterOffen: w('Bitte lass das Fenster offen.', 'Bitte lassen Sie das Fenster offen.'),

    datenschutz: w('Die Übertragung ist verschlüsselt. Deine Dateien landen im geschützten Bereich von {FIRMA} und sind über diesen Link nicht abrufbar. Der Link ist nur für dich bestimmt.',
                   'Die Übertragung ist verschlüsselt. Ihre Dateien landen im geschützten Bereich von {FIRMA} und sind über diesen Link nicht abrufbar. Der Link ist nur für Sie bestimmt.'),
    fragen: 'Fragen?',

    /* Mehrfach-Blöcke (je Objekt, je Maßnahme, je Person). {BLOCK} = block_name aus der Checkliste */
    blockStandard: 'Eintrag',
    blockFeldStandard: 'Bezeichnung (z. B. Adresse oder Name)',
    objektHinweis: 'Je {BLOCK} ein eigener Block, damit wir die Unterlagen zuordnen können.',
    objektAdresseFehlt: 'Ohne diese Angabe können wir die Dateien nicht zuordnen.',
    objektAdresseEintragen: w('Bitte trage die fehlende Angabe ein.', 'Bitte tragen Sie die fehlende Angabe ein.'),
    objektWeiteres: '{BLOCK} hinzufügen',
    objektEntfernen: '{BLOCK} entfernen',
    objektErstDateien: 'Bitte zuerst die Dateien in diesem Block entfernen.',
    objektFehltEiner: 'Eine Angabe fehlt. Der Fehlerkasten darunter führt hin.',
    objektFehltMehrere: '{N} Angaben fehlen. Der Fehlerkasten darunter führt hin.',
    objektKeine: 'Keine vorhanden',
    bitteBeantworten: 'Bitte mit Ja oder Nein beantworten.',

    grundPlatzhalter: 'Warum liegt diese Unterlage nicht vor?',
    grundFehlt: 'Bitte einen kurzen Grund angeben, sonst können wir nicht weiterarbeiten.',
    formatAbgelehnt: 'nehmen wir aus Sicherheitsgründen nicht an. Bitte als PDF oder Foto senden.',

    vollstaendigText: w('Alle angeforderten Unterlagen liegen bei uns. Du brauchst nichts weiter zu tun. Wenn etwas fehlt, melden wir uns.',
                        'Alle angeforderten Unterlagen liegen bei uns. Sie brauchen nichts weiter zu tun. Wenn etwas fehlt, melden wir uns.'),
    unterbrochen: w('Die Übertragung wurde unterbrochen. Versuche es bitte noch einmal.',
                    'Die Übertragung wurde unterbrochen. Bitte versuchen Sie es noch einmal.'),

    /* Fehlermeldungen des Servers */
    meld: {
      ungueltig: w('Dieser Link ist nicht mehr gültig. Melde dich bitte bei uns.', 'Dieser Link ist nicht mehr gültig. Bitte melden Sie sich bei uns.'),
      format: w('Diese Datei nehmen wir aus Sicherheitsgründen nicht an. Bitte als PDF oder Foto senden.',
                'Diese Datei nehmen wir aus Sicherheitsgründen nicht an. Bitte als PDF oder Foto senden.'),
      leer: w('Die Datei ist leer. Prüfe sie bitte und sende sie erneut.', 'Die Datei ist leer. Bitte prüfen und erneut senden.'),
      zugross: w('Die Datei ist größer als {MB} MB. Teile sie bitte auf oder ruf uns an.',
                 'Die Datei ist größer als {MB} MB. Bitte teilen Sie sie auf oder rufen Sie uns an.'),
      grenze: w('Grenze erreicht. Ruf uns bitte kurz an.', 'Grenze erreicht. Bitte rufen Sie uns kurz an.'),
      grund: w('Bitte gib einen kurzen Grund an.', 'Bitte geben Sie einen kurzen Grund an.'),
      unterbrochen: w('Die Übertragung wurde unterbrochen. Versuche es bitte noch einmal.',
                      'Die Übertragung wurde unterbrochen. Bitte versuchen Sie es noch einmal.')
    }
  };
}

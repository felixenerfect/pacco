<?php
/**
 * Kundenlink unter der eigenen Domain: https://www.example.com/unterlagen/?t=<Token>
 * Variante für Hoster MIT PHP. Ablage auf dem Webserver: /unterlagen/index.php
 *
 * Rahmt die Apps-Script-Seite unsichtbar ein (Vollbild-iframe). Der Kunde sieht die eigene
 * Domain, und der Google-Hinweisbanner entfällt. Voraussetzung: In apps-script/Konfig.gs ist
 * LINK_BASIS gesetzt und die Web-App danach neu bereitgestellt (sonst blockt Google den Rahmen).
 *
 * Erzeugt mit: node tools/domaindatei.js (setzt Web-App-Adresse und Firmennamen ein).
 * Kein Cookie, keine Protokollierung des Tokens.
 */

$ziel = '{{WEBAPP_URL}}';

header('X-Robots-Tag: noindex, nofollow', true);
header('Referrer-Policy: no-referrer', true);
header('Cache-Control: no-store, no-cache, must-revalidate', true);

$token = isset($_GET['t']) ? (string) $_GET['t'] : '';

// Formal falsch: kaputter oder manipulierter Link -> 404 ohne Inhalt.
// Formal richtig, aber unbekannt: die eingebettete Seite zeigt "Link nicht mehr gültig".
if (preg_match('/^[A-Za-z0-9]{24,64}$/', $token) !== 1) {
    http_response_code(404);
    exit;
}

$src = $ziel . '?t=' . $token;
?>
<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>{{FIRMA}} · Unterlagen hochladen</title>
<style>
  html, body { margin: 0; padding: 0; height: 100%; background: #ffffff; }
  iframe { position: fixed; inset: 0; width: 100%; height: 100%; border: 0; }
</style>
</head>
<body>
<iframe src="<?php echo htmlspecialchars($src, ENT_QUOTES, 'UTF-8'); ?>"
        title="{{FIRMA}} Unterlagen-Upload"
        referrerpolicy="no-referrer"
        allow="camera"></iframe>
</body>
</html>

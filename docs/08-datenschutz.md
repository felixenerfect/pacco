# 8 · Datenschutz

Keine Rechtsberatung. Die Liste zeigt, was vor dem ersten echten Kunden geklärt sein sollte.

## Vor dem Start

1. **Google Workspace statt privatem Konto.** Für Workspace schließt Google eine
   Auftragsverarbeitungsvereinbarung (Admin-Konsole → Konto → Rechtliches und Compliance).
   Für private Gmail-Konten gibt es das nicht.
2. **Datenschutzerklärung ergänzen:** Zweck (Entgegennahme von Unterlagen für den Auftrag),
   Empfänger (Google als Auftragsverarbeiter), Speicherdauer, Hinweis auf den Upload-Link.
   Steht die Strecke unter eigener Domain, gehört der Abschnitt in die Datenschutzerklärung der
   Website.
3. **Löschkonzept:** Wie lange bleiben Dateien im Drive-Ordner? Abgeschlossene Fälle regelmäßig
   in die Kundenakte übernehmen und den Fallordner löschen.
4. **Zugriff:** Den Ordner "<Firma> Uploads" und die Tabelle nur mit Personen teilen, die die
   Fälle bearbeiten.

## Was die Strecke technisch beiträgt

- Kunden brauchen kein Konto. Der Link mit zufälligem Schlüssel ist die einzige Hürde.
- Kunden können nichts lesen, herunterladen oder löschen, auch nicht die eigenen Uploads.
- Gesperrte oder abgelaufene Links nehmen sofort nichts mehr an.
- Nur PDF und Bilder, geprüft an der Dateisignatur. Keine ausführbaren Dateien.
- Die Domain-Datei selbst speichert nichts und setzt `noindex` und `no-referrer`. Die Zugriffsprotokolle
  des Hosters enthalten aber den Link samt Schlüssel: Aufbewahrungsdauer dort prüfen.
- Kein Tracking. Die Seite setzt selbst keine Cookies, Google kann für die Auslieferung technische
  Cookies setzen. Google Fonts wird von Google geladen; wer das
  vermeiden will, stellt in `Design.html` auf eine Systemschrift um und entfernt den Font-Link.

/**
 * Trainingsplaner Auto-Sync – Google Apps Script
 *
 * Empfängt Profil-JSON per POST und speichert es als Datei in Google Drive.
 * Wird als Web-App deployed (Zugriff: "Jeder, auch anonym").
 *
 * Setup: siehe SETUP.md
 */

// ── Konfiguration ──────────────────────────────────────
// ID des Google Drive Ordners für Sync-Daten
// (aus der Drive-URL: https://drive.google.com/drive/folders/DIESE_ID)
var FOLDER_ID = ''; // ← Hier die Ordner-ID eintragen nach dem Setup

// ── POST-Handler ───────────────────────────────────────
function doPost(e) {
  try {
    // Unterstützt sowohl Form-Daten (e.parameter.data) als auch raw JSON (e.postData.contents)
    var raw = (e.parameter && e.parameter.data) ? e.parameter.data : e.postData.contents;
    var data = JSON.parse(raw);
    var profileName = (data.name || 'Unbekannt') + '_' + (data.nachname || '');
    profileName = profileName.replace(/[^a-zA-ZäöüÄÖÜß0-9_\- ]/g, '').trim();

    var fileName = 'Sync_' + profileName + '.json';
    var jsonContent = JSON.stringify(data, null, 2);

    // Ordner holen (oder Root wenn keine ID gesetzt)
    var folder;
    if (FOLDER_ID) {
      folder = DriveApp.getFolderById(FOLDER_ID);
    } else {
      folder = DriveApp.getRootFolder();
    }

    // Bestehende Datei suchen und aktualisieren (statt Duplikate)
    var existing = folder.getFilesByName(fileName);
    if (existing.hasNext()) {
      var file = existing.next();
      file.setContent(jsonContent);
    } else {
      folder.createFile(fileName, jsonContent, 'application/json');
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', file: fileName }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── GET-Handler (Statuscheck) ──────────────────────────
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', service: 'Trainingsplaner Sync', version: '1.0' }))
    .setMimeType(ContentService.MimeType.JSON);
}

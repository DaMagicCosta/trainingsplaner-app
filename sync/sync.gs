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

// ── GET-Handler (Statuscheck + Profil-Abruf) ──────────
function doGet(e) {
  // Profil abrufen: ?name=Demo_Sync oder ?id=p_12345
  var queryName = (e && e.parameter && e.parameter.name) ? e.parameter.name : null;
  var queryId   = (e && e.parameter && e.parameter.id)   ? e.parameter.id   : null;

  if (!queryName && !queryId) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', service: 'Trainingsplaner Sync', version: '2.0' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var folder = FOLDER_ID ? DriveApp.getFolderById(FOLDER_ID) : DriveApp.getRootFolder();

    if (queryName) {
      // Suche nach Dateiname: Sync_{name}.json
      var fileName = 'Sync_' + queryName + '.json';
      var files = folder.getFilesByName(fileName);
      if (files.hasNext()) {
        var content = files.next().getBlob().getDataAsString();
        return ContentService.createTextOutput(content).setMimeType(ContentService.MimeType.JSON);
      }
    }

    if (queryId) {
      // Suche nach Profil-ID in allen Sync-Dateien
      var allFiles = folder.getFiles();
      while (allFiles.hasNext()) {
        var f = allFiles.next();
        if (f.getName().indexOf('Sync_') === 0 && f.getName().indexOf('.json') > 0) {
          var c = f.getBlob().getDataAsString();
          try {
            var d = JSON.parse(c);
            if (d.id === queryId) {
              return ContentService.createTextOutput(c).setMimeType(ContentService.MimeType.JSON);
            }
          } catch(pe) { /* skip invalid files */ }
        }
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'not_found' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

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
    var folder = FOLDER_ID ? DriveApp.getFolderById(FOLDER_ID) : DriveApp.getRootFolder();

    // Pull-Modus: Pläne abrufen (action=pull&name=Demo_Sync)
    if (e.parameter && e.parameter.action === 'pull' && e.parameter.name) {
      var pullName = 'Sync_' + e.parameter.name + '.json';
      var pullFiles = folder.getFilesByName(pullName);
      if (pullFiles.hasNext()) {
        var pullContent = pullFiles.next().getBlob().getDataAsString();
        var html = '<html><body><script>parent.postMessage(' + pullContent + ',"*");<\/script></body></html>';
        return HtmlService.createHtmlOutput(html)
          .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      }
      var html404 = '<html><body><script>parent.postMessage({"status":"not_found"},"*");<\/script></body></html>';
      return HtmlService.createHtmlOutput(html404)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }

    // Sync-Modus: Profil speichern
    var raw = (e.parameter && e.parameter.data) ? e.parameter.data : e.postData.contents;
    var data = JSON.parse(raw);
    var profileName = (data.name || 'Unbekannt') + '_' + (data.nachname || '');
    profileName = profileName.replace(/[^a-zA-ZäöüÄÖÜß0-9_\- ]/g, '').trim();

    var fileName = 'Sync_' + profileName + '.json';
    var jsonContent = JSON.stringify(data, null, 2);

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

// ── GET-Handler (Statuscheck + Profil-Abruf + JSONP) ──
function doGet(e) {
  var queryName = (e && e.parameter && e.parameter.name) ? e.parameter.name : null;
  var queryId   = (e && e.parameter && e.parameter.id)   ? e.parameter.id   : null;
  var callback  = (e && e.parameter && e.parameter.callback) ? e.parameter.callback : null;

  // Hilfsfunktion: JSON, JSONP oder postMessage zurückgeben
  var iframe = (e && e.parameter && e.parameter.iframe) ? true : false;
  function respond(data) {
    var json = (typeof data === 'string') ? data : JSON.stringify(data);
    if (callback) {
      return ContentService.createTextOutput(callback + '(' + json + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    if (iframe) {
      // postMessage-Ansatz: HTML-Seite die Daten an Parent sendet
      var html = '<html><body><script>parent.postMessage(' + json + ',"*");<\/script></body></html>';
      return HtmlService.createHtmlOutput(html)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
    return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
  }

  if (!queryName && !queryId) {
    return respond({ status: 'ok', service: 'Trainingsplaner Sync', version: '2.0' });
  }

  try {
    var folder = FOLDER_ID ? DriveApp.getFolderById(FOLDER_ID) : DriveApp.getRootFolder();

    if (queryName) {
      var fileName = 'Sync_' + queryName + '.json';
      var files = folder.getFilesByName(fileName);
      if (files.hasNext()) {
        var content = files.next().getBlob().getDataAsString();
        return respond(content);
      }
    }

    if (queryId) {
      var allFiles = folder.getFiles();
      while (allFiles.hasNext()) {
        var f = allFiles.next();
        if (f.getName().indexOf('Sync_') === 0 && f.getName().indexOf('.json') > 0) {
          var c = f.getBlob().getDataAsString();
          try {
            var d = JSON.parse(c);
            if (d.id === queryId) { return respond(c); }
          } catch(pe) {}
        }
      }
    }

    return respond({ status: 'not_found' });
  } catch (err) {
    return respond({ status: 'error', message: err.message });
  }
}

# Auto-Sync Setup – Google Apps Script

## Was ist das?
Ein kleines Script auf deinem Google-Konto, das Athleten-Daten automatisch in deinen Google Drive speichert. Der Athlet merkt nichts davon – nach jeder geloggten Einheit werden die Daten im Hintergrund synchronisiert.

## Setup (einmalig, ~5 Minuten)

### 1. Google Drive Ordner erstellen
- Öffne [Google Drive](https://drive.google.com)
- Erstelle einen Ordner: `Trainingsplaner_Sync`
- Öffne den Ordner → kopiere die **Ordner-ID** aus der URL:
  `https://drive.google.com/drive/folders/DIESE_ID_KOPIEREN`

### 2. Apps Script erstellen
- Öffne [script.google.com](https://script.google.com)
- Klick **"Neues Projekt"**
- Lösche den vorhandenen Code
- Kopiere den gesamten Inhalt von `sync.gs` hinein
- Trage die **Ordner-ID** aus Schritt 1 bei `FOLDER_ID` ein:
  ```javascript
  var FOLDER_ID = 'DEINE_ORDNER_ID_HIER';
  ```
- Speichern (Strg+S)
- Benenne das Projekt um: "Trainingsplaner Sync"

### 3. Als Web-App deployen
- Klick oben rechts: **"Bereitstellen"** → **"Neue Bereitstellung"**
- Typ wählen: **Web-App**
- Einstellungen:
  - Beschreibung: `Trainingsplaner Sync v1`
  - Ausführen als: **Ich** (dein Google-Konto)
  - Zugriff: **Jeder** (damit Athleten-Browser darauf zugreifen können)
- Klick **"Bereitstellen"**
- **Zugriff autorisieren** wenn gefragt (dein Google-Konto auswählen → "Erweitert" → "Zu Trainingsplaner Sync wechseln")
- Die **Web-App-URL** wird angezeigt – diese kopieren!
  Format: `https://script.google.com/macros/s/LANGE_ID/exec`

### 4. URL im Trainingsplaner eintragen
- Öffne den Trainingsplaner als Trainer
- Profil bearbeiten → Sync-URL einfügen (wird noch implementiert)
- Alle Athleten-Profile die mit diesem Trainer verknüpft sind, synchen automatisch

## Wie funktioniert der Sync?
1. Athlet loggt eine Trainingseinheit
2. App speichert lokal **und** schickt das Profil-JSON per `fetch()` an die Apps Script URL
3. Das Script speichert/aktualisiert die Datei im Drive-Ordner
4. Du siehst im Ordner `Trainingsplaner_Sync` für jeden Athleten eine JSON-Datei
5. Im Trainingsplaner kannst du die Datei importieren um den Fortschritt zu sehen

## Dateien im Drive
Jeder Athlet bekommt eine Datei:
```
Sync_Max_Mustermann.json
Sync_Thomas_Mueller.json
...
```
Die Datei wird bei jedem Sync **überschrieben** (kein Datei-Spam).

## Sicherheit
- Das Apps Script läuft auf **deinem** Google-Konto
- Nur du hast Zugriff auf den Drive-Ordner
- Die Daten werden per HTTPS übertragen
- Es werden keine Passwörter/PINs übertragen – nur Profil- und Trainingsdaten

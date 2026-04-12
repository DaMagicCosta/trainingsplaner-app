# Trainingsplaner v2 — Changelog

Historisches Protokoll der größeren Entwicklungsschritte seit dem v2-Redesign-Start. Gehört nicht in die `CLAUDE.md`, die das Arbeitsmodell beschreibt — hier steht nur, *was wann kam*.

Für rechtlich relevante Änderungen siehe zusätzlich:
- [`2026-04-10_rechtsaudit-original.md`](2026-04-10_rechtsaudit-original.md)
- [`2026-04-10_rechtsaudit-umsetzung.md`](2026-04-10_rechtsaudit-umsetzung.md) (Nachträge 1–9)
- [`2026-04-11_lexikon-quellen.md`](2026-04-11_lexikon-quellen.md)

---

## 2026-04-12

### Übungs-Tausch im Training (Bau-Etappe 6)
- **Neuer ⟳-Button in der `tp-ex-edit-bar`** neben dem bestehenden ✕-Delete-Button — pro Übung im Bearbeiten-Modus sichtbar, Accent-Hover statt Danger
- **Swap-Modus im Picker**: Klick auf ⟳ öffnet das Picker-Modal mit Titel „[Übungsname] ersetzen durch …", vorgefiltered auf die Lexikon-Kategorie der aktuellen Übung. Die zu tauschende Übung selbst wird aus dem Grid ausgeschlossen
- **In-place Tausch**: Bei Auswahl einer Alternative wird Name und Muskel der Übung im Plan-Array ersetzt, Sätze und Wdh bleiben erhalten, Gewicht wird per `estimateStartWeight()` für die neue Übung neu berechnet (dynamischer Import vermeidet Zirkel)
- **Toast-Feedback**: „Bankdrücken → Kurzhantel-Drücken getauscht"
- **Prereq-Confirm läuft auch im Swap-Modus**: Wenn die Ziel-Übung Voraussetzungen hat, kommt zuerst der Bestätigungs-Dialog
- **Picker-Titel-Reset**: Beim normalen „+ Übung hinzufügen"-Klick wird der Titel zurück auf „Aus dem Lexikon wählen" gesetzt und `_swapTarget` geleert, damit Add- und Swap-Modus nicht kollidieren

### Onboarding-Polish: Mobile-Layout + alter Demo-Banner entfernt
- **Mobile-Layout des Onboarding-Banners überarbeitet**: Unter 720px sind jetzt Padding, Schriftgrößen und die Schritt-Nummer-Größe (24px statt 28px) kompakter. Der Button geht weiterhin in die zweite Zeile, ist aber schmaler und korrekt auf die Nummer-Breite plus Gap eingerückt (`margin-left: 36px`)
- **Alter `cpDemoBanner` komplett entfernt**: Das war der grüne „Leeres Profil — leg los"-Banner mit „Eigenes Profil erstellen" und „Später". Seit dem Onboarding-Kombi-Banner war seine Funktion redundant (Schritt 1 „Profil anlegen" macht genau dasselbe), plus er hatte einen sichtbaren Bug: Beim App-Start wurde er für jede `empty-`-Profil-ID eingeblendet, aber die ID ändert sich nach Profil-Save nicht — nach Abschluss der Onboarding-Schritte erschien er wieder, obwohl inhaltlich überholt
- Aufgeräumt: HTML-Div in `Trainingsplaner.html`, Init-Block in `js/app.js` (inkl. des Reset-Flows für Demo→Eigen-Profil-Übergang, der mit dem heutigen RAM-only-Demo-Modus ohnehin obsolet war), CSS-Block in `css/pages/cockpit.css`, `sessionStorage.removeItem('tpv2_demo_banner_dismissed')` in `js/consent.js`

### Onboarding-Kombi-Banner (Profil + Anamnese + Vereinbarung)
- **Neues Cockpit-Banner `cpOnboardingBanner`** ersetzt die beiden alten Gate-Banner `cpAnamnesisBanner` und `cpAgreementBanner` — nummerierte Checkliste mit den offenen Pflicht-/Empfohlen-Schritten. Erledigte Schritte fallen raus, bei 0 offenen Schritten verschwindet die Card komplett
- **Schrittreihenfolge**: `1. Profil-Stammdaten anlegen` (Empfohlen, keine Tab-Sperre), `2. Gesundheits-Anamnese bestätigen` (Pflicht, sperrt Jahresplan/Trainingsplan/Fortschritt), `3. Trainervereinbarung bestätigen` (nur im Trainer-Modus, Empfohlen)
- **`_getPendingSteps()`** und **`_renderOnboardingBanner()`** in `js/gates.js` berechnen die Liste und rendern sie. Event-Delegation auf `[data-ob-action]` fängt die Schritt-Button-Klicks ab und öffnet die jeweiligen Modale via dynamischem Import
- **`body.onboarding-pending`** unterdrückt den bestehenden `cpDemoBanner` per CSS, solange mindestens ein Schritt offen ist — damit stapeln sich nicht zwei Karten mit ähnlichem Inhalt übereinander
- **Alte `cpAnamnesisOpen`/`cpAgreementOpen`-Handler aus `js/app.js`** entfernt (obsolet durch Event-Delegation in gates.js)
- **Mobile-Anpassung**: Unter 720px wrappt jeder Schritt, der Button rutscht auf eine neue Zeile mit Einrückung auf Höhe der Schritt-Nummer

### Fix: Anamnese-Gate greift auch nach Cache-Löschung
- **`_isEmptyProfile`-Ausnahme in `js/gates.js` entfernt**: Bislang waren leere Profile (`id` startet mit `empty-` + leerer Name) vom Anamnese- und Vereinbarungs-Gate ausgenommen, um Banner-Konflikt mit dem bestehenden „Eigenes Profil erstellen"-Demo-Banner zu vermeiden. Problem: Nach Löschen der Browser-Webseitendaten am Mobilgerät fällt `loadDemoProfile()` auf ein frisches leeres Profil zurück (`anamnesis: null`, `agreement: null`). Die Ausnahme verhinderte, dass das Gate dort greift — DSGVO-Einwilligung wurde neu abgefragt, Anamnese und Trainervereinbarung nicht, obwohl faktisch alle drei gleichzeitig verloren gingen
- **Neues Verhalten**: Das Anamnese-Gate greift jetzt auch auf frischen leeren Profilen. Beim allerersten App-Start (oder nach Cache-Löschung) sind Jahresplan, Trainingsplan und Fortschritt bis zur Anamnese-Bestätigung gesperrt. Demo-Banner und Anamnese-Banner koexistieren im Cockpit — inhaltlich nicht im Konflikt, weil Anamnese unabhängig von Profil-Stammdaten bestätigt werden kann

### Safari-/iOS-Kompatibilität: color-mix Fallbacks
- **Alle 19 `color-mix()`-Regeln** in `css/components.css`, `css/pages/cockpit.css`, `css/pages/lexikon.css`, `css/pages/trainingsplan.css` bekommen eine Token-basierte Fallback-Deklaration davor (`var(--warning-dim)`, `var(--warning-line)`, `var(--danger-dim)`, `var(--danger-line)`). Safari auf iOS < 16.2 parste die color-mix-Zeilen nicht und renderte die Prereq-Badges, Gate-Banner, Lexikon-Prereq-Chips und das Voraussetzungs-Confirm-Modal ohne Hintergrund und ohne Rahmen — progressive Enhancement behebt das, moderne Browser ändern sich nicht
- **Fehlender `-webkit-backdrop-filter`-Prefix** in `.lx-sheet-backdrop` ergänzt (war der einzige `backdrop-filter` in der Codebase ohne Prefix)
- **CLAUDE.md Dauerhafte Regel 9**: Hinweis dass Chrome-DevTools iPhone-Emulation nicht WebKit ist, plus Pflicht-Fallbacks für jede neue `color-mix()`-Zeile dokumentiert

### Pflicht-Gates: Anamnese + Trainervereinbarung
- **Neues Modul `js/gates.js`**: `isAnamnesisGated()`, `isAgreementGated()`, `applyGates()`, `enforceTabGate()` — zentrale Pflicht-Gate-Logik nach dem DSGVO-Consent
- **Anamnese-Gate** (Hard): Solange `anamnesis.confirmedAt` nicht gesetzt ist, sperrt `body.anamnesis-required` via CSS die Sidebar-/Bottom-Nav-Items Jahresplan, Trainingsplan und Fortschritt (inkl. Schloss-Icon). `switchTab()` leitet gesperrte Ziele zusätzlich auf Cockpit um und zeigt einen Toast. Cockpit, Lexikon und Info bleiben frei
- **Vereinbarungs-Gate** (Soft): Nur Banner im Cockpit für Trainer-Modus, keine Tab-Sperre — Multi-Athleten-Verwaltung ist noch Bau-Etappe
- **Zwei neue Cockpit-Banner** (`cpAnamnesisBanner`, `cpAgreementBanner`) direkt unter dem Demo-Banner mit Direkt-Button in das bestehende `openAnamneseEditModal()` / `openAgreementConfirmModal()`
- **Gate-Hooks** in `saveAnamneseEdit`, `confirmAgreement`, `revokeAgreement`, `setRole`, `switchProfile`, `saveProfileEdit`, `_loadDemoAsPreview`, `exitDemoMode` — jede relevante State-Änderung triggert `applyGates()` neu
- **Demo-Modus + leeres Profil ausgenommen**: `state.demoMode !== null` und `empty-`-ID mit leerem Namen unterdrücken das Gate, damit der Demo-Vorschau-Flow und der „Eigenes Profil erstellen"-Flow sauber funktionieren
- **AGB Abschnitt 3** um einen Absatz zur technischen Durchsetzung ergänzt, `AGB_VERSION` auf `2026-04-12` gebumpt, Stand-Datum aktualisiert — bestehende Nutzer werden beim nächsten Reload zur erneuten Einwilligung gebeten

## 2026-04-11

### Voraussetzungs-Check in der Plangestaltung
- **Generator-Pool filtert Prereq-Übungen**: `pickExercises()` in `js/features/generator.js` schließt Übungen mit `voraussetzungen.length > 0` aus dem automatischen Wochenplan aus — Skill-Moves wie Planche oder One-Arm Push-up landen nie unaufgefordert im Plan
- **Picker-Warnbadge**: `tp-picker-card--prereq` + gelbes `⚠ Prereq`-Badge für Übungen mit Voraussetzungen, `tp-picker-card--locked` + rotes `⛔ Level`-Badge für Anfänger/Beginner laut Anamnese
- **Neues `prereqConfirmModal`**: öffnet sich beim Klick auf eine Prereq-Übung, listet alle Voraussetzungen mit Kalym-Regel, bei Anfänger-Level zusätzlich roter „Nicht empfohlen"-Hinweis, Durchbruch via „Trotzdem hinzufügen"
- **Fehlende Imports ergänzt**: `openModal`, `closeModal`, `LX_CATEGORIES` in `js/pages/trainingsplan.js` (liefen bislang über globalen Scope)
- **AGB Abschnitt 2** um konkrete Beschreibung der Voraussetzungs-Logik ergänzt, `AGB_VERSION` → `2026-04-11`, Stand-Datum auf Nutzungsbedingungen-Karte aktualisiert

### Calisthenics-Fokus + Lexikon-Erweiterung
- **Kalym-Ingest**: 26 neue Übungen nach Ashley Kalym, *Calisthenics — Das ultimative Handbuch* (Riva Verlag)
  - 15 Lever/Planche-Progressionen (Planche × 5, Front Lever × 4, Back Lever × 3, Human Flag × 3)
  - 5 Cardio/Kondition-Übungen (Burpee, Bastard-Burpee, Mountain Climbers, Squat Thrust, Bear Crawl)
  - 6 Maximal-Varianten (Klatsch-LS, Einarmiger LS, Typewriter Pull-up, Einarmiger Klimmzug, Shrimp Squat, V-Sit)
- **Neue Kategorien**: `p_skill` (Cyan-Teal `#2FD4C4`) + `p_cardio` (Coral `#E85D5D`) in `LEXIKON_DATA`, `LX_CATEGORIES` und Lexikon-Filter-Chips
- **Neues Lexikon-Schema-Feld `voraussetzungen`** (Array) + Render im Detail-Sheet mit ✓-Liste und Kalym-Goldene-Regel-Hinweis
- **Neues Quellenverweis-System**: `LX_SOURCES` (Kategorie-Default), optionales `quelle:`-Feld pro Übung, `_lxSource()`-Helper, Footer-Block im Detail-Sheet
- **Credits + AGB** um Calisthenics-Systematik-Attribution (Kalym) erweitert
- **Belegspur**: `Notizen/2026-04-11_lexikon-quellen.md` (rechtliche Einordnung, Nutzungs-Matrix, Zitate-Übersicht)
- **Lexikon-Umfang**: 85 → 111 Übungen in 8 Kategorien

### Level-basierte Gewichtsvorschläge
- **Neues Modul `js/data/strength-standards.js`** mit NSCA/ACSM-Ratios (M+F, 5 Level), Übungs-Alias-Map, Anamnese-Level-Mapping
- **`estimateStartWeight(name, reps, profile)`**: Drei-Stufen-Auflösung (Compound → Isolation-Pattern → null), Epley-Umrechnung 1RM → Arbeitsgewicht, Rundung auf 2.5 kg, min 5 kg
- **Iso-Patterns** für ~25 Isolations-/Maschinen-Übungen (Butterfly ≈ 50% Bankdrücken, Beinstrecker ≈ 50% Kniebeuge etc.)
- **Generator** nutzt `estimateStartWeight()` beim Anlegen der Sätze statt `gewicht: null`

### Trainingsort-Hierarchie
- **Reihenfolge in `trainingLocation[]` ist semantisch**: `[0]` = Standard, `[1+]` = Alternativen
- **Profil-Edit**: Numerierte Chips (Klick-Reihenfolge = Order), `data-order`-Attribut, Save sortiert nach Order
- **`state.tpUseHomePerKw`**: Map für KW-spezifische Toggle-Overrides — Klick auf ⟳ setzt nur den Override für die aktuelle KW, andere Wochen behalten den Profil-Default
- **Reset bei Profil-Wechsel und Save**: `tpUseHome = null`, `tpUseHomePerKw = {}` in `_applyProfile` und `saveProfileEdit`
- **Generator-Default-Block-Location**: `_defaultLoc()` aus `trainingLocation[0]`, `block._userLocation`-Flag respektiert explizite User-Wahl bei Re-Renders

### Equipment-Trennung + Squat Rack
- **Filter-Fix**: `.some()` → `.every()` in `generator.js` und `trainingsplan.js` — Kombi-Übungen wie `['Kurzhanteln', 'Hantelbank']` erscheinen jetzt nur, wenn beide verfügbar sind
- **Hantelbank-Chip** auch im Home-Equipment-Edit (vorher nur Studio)
- **Neues Equipment-Item `Squat Rack`** in Studio + Home-Chips, plus in `Kniebeugen mit LH` eq-Array
- **Tote Chips entfernt**: `SZ-Stange` (Studio) und `Kettlebells` (Home) — keine zugehörigen Lexikon-Übungen
- **Lexikon-Fix**: `Rudern eng mit Kurzhantel` jetzt `['Kurzhanteln', 'Hantelbank']` (Beschreibung verlangt explizit eine Bank)
- **Demo-Profile migriert**: Alexander um `Squat Rack` erweitert, Julia vom Legacy-Array-Format auf Objekt-Format mit kanonischen Werten

### Demo-Vorschau-Modus (Etappe E)
- **Konzept-Wechsel**: Demo-Profile sind RAM-only Vorschauen, nicht mehr Profil-Überschreibungen. Das eigene Profil bleibt im localStorage sicher
- **Neue State-Felder**: `demoMode` (`'alexander' | 'julia' | null`), `_savedProfileBackup`
- **`_saveProfile()` im Demo-Modus = No-op** — Mutationen bleiben in RAM, gehen beim Verlassen verloren
- **`_loadDemoAsPreview()` + `exitDemoMode()` + `_renderDemoBanner()`** in `demo-loader.js`
- **Profil-Tab Demo-Showcase-Sektion** mit zwei Tile-Buttons, ein-/ausblendbar via Info → Einstellungen (`tpv2_show_demos`)
- **Globaler Demo-Vorschau-Banner** (sticky oben in `main`) + **Sidebar-Pill** „🔍 Demo-Vorschau"
- **Command Palette**: Neue Gruppe „Demo-Profile", Items „Demo-Vorschau verlassen" + „Aktuelle Demo neu laden" nur sichtbar bei `state.demoMode !== null`

### Etappe B — Trainer-Vereinbarung bestätigen/widerrufen/dokumentieren
- **Neues Modul `js/features/agreement-edit.js`** (~250 Zeilen): Datenmodell, Status-Berechnung (`pending`/`confirmed`/`revoked` aus Timestamps), Confirm-Modal mit Pflicht-Checkbox, Revoke mit Browser-Confirm-Dialog, History-Modal
- **Datenmodell**: `profile.agreement = { version, confirmedAt, revokedAt, agreementVersion }` + `profile.agreementHistory[]`
- **Soft-Lock beim Widerruf**: Trainer-Modus bleibt nutzbar, gelber Warnungs-Banner zeigt den Status
- **DSGVO Art. 7 Abs. 1+3** jetzt vollständig erfüllt (Bestätigung dokumentiert, Widerruf so einfach wie Erteilung)

### Etappe A — Anamnese editierbar + Historie
- **Neues Modul `js/features/anamnese-edit.js`** mit Datenmodell (12 Felder + `confirmedAt`), `getDefaultAnamnesis()`, `renderAnamnese()`, `openAnamneseEditModal()`, `saveAnamneseEdit()`
- **`ANAMNESIS_VERSION = 1`** für Schema-Migrationen
- **Edit-Modal als tp-modal** mit 5 Form-Sektionen + Pflicht-Bestätigungs-Checkbox
- **Historie**: Bei jedem Save wird der alte Stand in `profile.anamnesisHistory[]` gepusht (Spread-Kopie). History-Modal mit chronologischer Liste + Disclosure
- **AGB §6** jetzt vollständig substantiell erfüllt (wahrheitsgemäß + Aktualisierungspflicht + Vorherige Versionen)

### Rechtsaudit-Umsetzung (Hauptarbeit 10.04. abends → 11.04. vormittags)
- **Rechtsaudit vom 10.04.** abgearbeitet, alle 6 🔴-Pflichtpunkte erledigt + 2 Bonus-Items
- **Aktive DSGVO-Einwilligung** (Welcome-Modal mit Pflicht-Checkbox, Versionierung über `DSE_VERSION` / `AGB_VERSION`, Widerrufs-Button in DSE Abschnitt 8, Splash-Skip bei Erstaufruf)
- **v1-Legacy-Cleanup**: `_cleanupLegacyKeys()` in `state.js` entfernt 6 bekannte v1-Schlüssel (PROFILES, ACTIVE, SYNC_URL, VAULT, VERIFY, alter active_tab)
- **Max → Alexander**: Datei `Trainingsplaner_Max_Mustermann_Demo.json` → `Trainingsplaner_Alexander_Demo.json`, alle Code-Stellen angepasst (Inhalt war schon Alexander, nur der Name hat gedriftet)
- **Empty-State Polish**: Hardcoded Julia-Sidebar-Switch entfernt, `renderInfo` Empty-State-Erkennung, Demo-Showcase-Card aufpoliert

---

## 2026-04-10

### Rechtsaudit + DSGVO-Basis
- **Externer Rechtsaudit** (via Ductor/Claude) identifiziert 6 🔴-Pflichtpunkte
- **Google Fonts lokal**: Inter + JetBrains Mono als Variable-Font-WOFF2 unter `css/fonts/`, neue `css/fonts.css`. Keine CDN-Requests mehr → LG München I, Az. 3 O 17493/20 abgedeckt
- **Chart.js lokal**: `js/lib/chart.umd.min.js` (4.4.7), keine jsDelivr-Requests mehr
- **LICENSE** (MIT) im Repo-Root
- **Info → Recht** als neue Sub-Sektion mit 3 Karten: Impressum (§ 25 MedienG / § 5 ECG / § 5 DDG), Datenschutzerklärung (8 Abschnitte, alle `tpv2_*`-Schlüssel transparent, Art. 6/9 DSGVO, Betroffenenrechte), Nutzungsbedingungen + Haftungsausschluss (7 Abschnitte, v1-AGB portiert, ABGB-konformer Vorsatz/Grobe-Fahrlässigkeit-Vorbehalt)

---

## 2026-04-08 / 2026-04-09 — Modularisierung

- **Single-File → 38 Dateien**: HTML (~2.100 Z.) + 11 CSS + 26 JS-Module mit ES `import`/`export`
- **Kein Build-System**, kein npm, kein Bundler — native ES Modules im Browser
- **`Redesign/`-Workflow entfällt**: Quelldateien sind die Deploy-Dateien
- **localStorage-Persistenz** (Auto-Save, Import/Export, Demo-Reset, `tpv2_profile_data` als Key)
- **4 Themes**: Midnight, Ember, Teal, Pastell
- **Samsung Internet Cache-Busting** (`?v=YYYYMMDD`)

## 2026-04-07 — Equipment-System + Splash

- **Equipment pro Trainingsort** mit Drei-Zustand-Chips (off / verfügbar / ausgeschlossen)
- **Datenformat**: `equipment: { studio: { available: [...], excluded: [...] }, ... }`
- **Auto-Migration** von altem Array-Format beim Laden
- **Trainingsort pro Jahresplan-Block**: Jeder Block hat eigenes Trainingsort-Dropdown (saisonale Planung)
- **Ganzjährig-Checkbox** + Quartals-Marker in Block-Timeline
- **Splash-Screen** (Mindmap-Style mit Portrait)
- **Bodyweight-Gewicht**: 22 Übungen mit `bwFactor`, Effektivgewicht = BW × Faktor + Zusatz, `_bwZusatz`-Feld
- **MUSCLE_MAP erweitert** auf ~60 Einträge mit anatomischen Langformen
- **4. Block-Farbe** `.jp-block-aux` (Coral)
- **Fortschritt Dashboard Redesign**: Single-Scroll, Auto-Aggregation (4W→Tage, 12W→Wochen, 1J→Monate)

## 2026-04-06 — Funktionale Kernfeatures

- **Wochenplan-Generator** mit bis zu 4 Blöcken, Regen-Steuerung, Home-Fallback
- **Trainingsplan Bearbeiten-Modus** (Trainer-only) mit Übungspicker
- **Profil-Wechsel** Alexander ↔ Julia
- **Pastell-Theme** „Garten" für Julia
- **Studio/Home-Toggle** im Trainingsplan (⟳-Button)
- **Fortschritt-Views**: Entwicklung | Zeitvergleich | Standards AT
- **Lexikon**: 85+ Übungen inkl. 7 Warm-up + 7 Cooldown
- **Mobile Command Palette** (Bottom Sheet mit Hero-Tiles)
- **Swipe-Navigation** zwischen Tabs
- **Muskel-Balancer** mit `_allGroups()` (zählt alle Muskeln, nicht nur den ersten)
- **Bug-Floater** (🐛 im Dark-Theme, 🦋 im Pastell)

## 2026-04-05 — v2 wird Live

- `Trainingsplaner.html` wird Live-Version auf GitHub Pages
- v1 wird zu `Trainingsplaner_v1_archiv.html`
- Cockpit-Redesign, Linear-inspiriertes Teal-Design

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Siehe auch die übergeordnete [CLAUDE.md](../../CLAUDE.md) für projektübergreifende Arbeitsweise (Sprache, Kontext, Prompt-Vorlagen).

## Wichtigster Kontext vorweg

Seit 05.04.2026 ist **`Trainingsplaner.html` im Repo-Root die v2-Demo** (Cockpit-Redesign, Variante B, RAM-only). Die alte v1 lebt als **`Trainingsplaner_v1_archiv.html`** im selben Ordner weiter — als Referenz für Features, die noch nach v2 portiert werden, aber **nicht mehr als Arbeitsdatei**. Nicht in v1 editieren, außer explizit gewünscht.

Alles, was unter "Arbeitsdatei v2" im nächsten Abschnitt steht, bezieht sich auf die neue v2-Welt. Der v1-Block weiter unten ist nur für Port-Arbeit relevant.

## Repo-Struktur

| Pfad | Rolle |
|------|-------|
| `Trainingsplaner.html` | **Live-Version** (v2) — nur HTML-Markup (~2.100 Zeilen), deployed auf GitHub Pages. |
| `css/` | **CSS-Module** — 11 Dateien (tokens, layout, components, 6 pages, splash, responsive). |
| `js/` | **JS-Module** — 26 Dateien mit ES Modules (`import`/`export`). Einstiegspunkt: `js/app.js`. |
| `js/data/` | Daten-Konstanten (LEXIKON_DATA, MUSCLE_MAP). |
| `js/pages/` | Page-Renderer (cockpit, jahresplan, trainingsplan, fortschritt, lexikon, info). |
| `js/features/` | Feature-Module (readiness, muscle-balance, plan-balance, generator, log-session, profile-edit, bug-report). |
| `Trainingsplaner_v1_archiv.html` | Archiv der alten Version. Reine Lese-Referenz. |
| `*.json` | Demo-Profile (Alexander + Julia). |
| `generate_demo.py` / `generate_demo.js` | Demo-Profil-Generierung. |
| `Redesign/` | **Archiv** — alte Single-File-Quelle + Moodboard + Informationsarchitektur. |
| `Daten/` | Backups, Skripten, Diplomarbeit. |
| `sync/sync.gs` + `sync/SETUP.md` | Google-Apps-Script-Sync aus v1. **In v2 bewusst nicht aktiv**. |
| `Konzept.md` / `Konzept.html` | Präsentationsdoku. |
| `quiz.html` / `quiz.json` | Quiz-Modul aus v1. **In v2 noch nicht eingebunden.** |

## Entwicklungs-Workflow v2 (WICHTIG)

Seit 08.04.2026 ist v2 **modular** — kein Single-File mehr. CSS und JS sind in eigene Dateien aufgeteilt, verbunden über native ES Modules (`import`/`export`).

### Wo editieren?

Direkt in den jeweiligen Dateien:
- **HTML-Markup:** `Trainingsplaner.html`
- **Styling:** `css/*.css` bzw. `css/pages/*.css`
- **Logik:** `js/*.js`, `js/pages/*.js`, `js/features/*.js`, `js/data/*.js`
- **Einstiegspunkt:** `js/app.js` (Import-Orchestrierung + Init-Sequenz)

**Kein Copy-Schritt, kein DEMO_PATH-Fix, kein Sync** — die Quelldateien sind die Deploy-Dateien. `Redesign/Trainingsplaner_v2.html` ist archiviert.

### Deployment

- **Repo:** `DaMagicCosta/trainingsplaner-app` (public, `main`-Branch, Source `/`)
- **Live-URL:** https://damagiccosta.github.io/trainingsplaner-app/Trainingsplaner.html
- **Archiv-URL:** https://damagiccosta.github.io/trainingsplaner-app/Trainingsplaner_v1_archiv.html
- `git push` auf `main` → automatisches Deploy in 1–2 Minuten
- **Kein Build-Step**, kein npm, kein Bundler. Native ES Modules im Browser.

### Lokale Entwicklung

- `Trainingsplaner.html` in VS Code **Live Server** öffnen (Pflicht für Chrome wegen ES Modules)
- `file://`-Zugriff funktioniert nicht mit ES Modules — Live Server ist immer nötig
- Backups vor größeren Umbauten: `Daten/Trainingsplaner_v2_backup_YYYY-MM-DD[_label].html`

## v2 Architektur — Big Picture

### Persistenz-Modell (seit 08.04.2026)

v2 nutzt **localStorage** für Profil-Persistenz:

- Beim Start: `localStorage.getItem('tpv2_profile_data')` → wenn vorhanden, wird das gespeicherte Profil geladen. Sonst Fallback auf Demo-JSON per `fetch()`.
- **Auto-Save:** `_saveProfile()` schreibt nach jeder Mutation (Profil-Edit, Session-Log, Plan-Änderung) automatisch zu localStorage. Key: `tpv2_profile_data`.
- **Import/Export:** Profil als JSON-Datei exportieren/importieren (Info → Daten).
- **Demo-Reset:** `reloadDemoProfile()` löscht localStorage und lädt Demo-JSON neu.
- **Demo-Banner:** Rotes Banner im Cockpit fordert Erstnutzer auf, ein eigenes Profil zu erstellen. Beim Erstellen werden alle Demo-Daten (inkl. Athleten-Fragmente) komplett geleert.
- **UI-State** separat in localStorage: `tpv2_active_tab`, `tpv2_role`, `tpv2_theme`, `tpv2_info_section`, `tpv2_bal_view`, `tpv2_bal_range`, `tpv2_fp_range`, `tpv2_fp_exercise` — alles unter `tpv2_`-Prefix, kollidiert nicht mit v1-Keys.

**Noch nicht implementiert:** AES/PIN-Lock, Drive-Sync (siehe "Ausstehende Bau-Etappen").

### Tab-Struktur

```
Trainer:  [ Cockpit ] [ Jahresplan ] [ Trainingsplan ] [ Fortschritt ] [ Lexikon ] [ Info ]
Athlet:   [ Cockpit ] [ Jahresplan ] [ Trainingsplan ] [ Fortschritt ] [ Lexikon ] [ Info ]
```

Der ehemalige Planungs-Tab ist jetzt im **Jahresplan Bearbeiten-Modus** integriert (Trainer-only). Im Bearbeiten-Modus erscheint der Wochenplan-Generator (bis zu 4 Blöcke, flexible Regen-Steuerung, Trainingsort-Filter).

### Rollensystem

`state.role` ist `'trainer'` oder `'athlete'`, per Sidebar-Dropdown umschaltbar. `setRole()` (um 5180er-Zeile in v2) setzt:

- Body-Klassen `role-trainer` / `role-athlete` (CSS-Sichtbarkeits-Regeln)
- Info-Tab Sub-Section-Fallback bei Rollenwechsel (Anamnese → Athlet, Vereinbarung → Trainer)
- Jahresplan Bearbeiten-Modus wird bei Athlet-Wechsel auf Ansicht zurückgesetzt

Elemente, die rollenbasiert versteckt werden:

| Element | Sichtbar bei |
|---------|--------------|
| `info-athletes-card` (Athleten verwalten im Profil-Tab) | Trainer |
| `.info-section[data-section="vereinbarung"]` + Sub-Nav-Button + Profil-Link | Trainer |
| `.info-section[data-section="anamnese"]` + Sub-Nav-Button + Profil-Link | Athlet |
| Jahresplan `#jpMode` (Ansicht/Bearbeiten Toggle) + `#jpNewBtn` | Trainer |

### State-Modell

Globales `state`-Objekt in `js/state.js`. Wichtige Felder:

- `profile` — das geladene Hauptprofil, wird beim Start aus localStorage oder Demo-JSON befüllt
- `demoAthletes.lisa` — Mock-Daten für die Demo-Athletin Julia (nur RAM, kein eigenes JSON)
- `role`, `activeTab`, `theme`, `infoSection`, `balView`, `balRange`, `fpRange`, `fpExercise` — UI-State, teilweise `localStorage`-persistiert
- `_editTarget` — tracking-Feld für das Profil-Edit-Modal: `'self'` oder `'lisa'`

### Modul-Architektur (seit 08.04.2026)

```
js/app.js                 ← Einstiegspunkt, Init-Sequenz
js/state.js               ← State + localStorage
js/utils.js               ← Toast, Formatter, Datum-Helper
js/themes.js              ← 4 Themes (Midnight, Ember, Teal, Pastell)
js/tabs.js                ← Tab-Navigation + Swipe
js/roles.js               ← Rollen + Profil-Switch
js/command-palette.js     ← Cmd+K / Mobile Bottom Sheet
js/keyboard.js            ← Keyboard Shortcuts
js/demo-loader.js         ← Demo-Profil laden/reset
js/init-handlers.js       ← Event-Handler-Setup (IIFEs)
js/splash.js              ← Splash Screen
js/data/lexikon-data.js   ← 85+ Übungen Datenbank
js/data/muscle-map.js     ← MUSCLE_MAP, Antagonisten
js/pages/*.js             ← Page-Renderer (cockpit, jahresplan, trainingsplan, fortschritt, lexikon, info)
js/features/*.js          ← Feature-Module (readiness, muscle-balance, plan-balance, generator, log-session, profile-edit, bug-report)
```

**Import-Regeln:**
- Dateien in `pages/` und `features/` nutzen `../` für state.js, utils.js etc.
- Keine zirkulären Imports — bei Bedarf Funktionen als Parameter übergeben
- Cache-Busting via `?v=YYYYMMDD` am Script-Tag bei Mobile-Problemen

### Design-System

Cockpit-getriebene Farbpalette mit CSS Custom Properties:

- **Primär:** Teal-Deep `#0F766E` (`--accent`), Emerald `#10B981` (`--success`)
- **Akzent:** Honey `#D4A968` (`--warning`), Coral `#C76A5E` (`--danger`)
- **Text-Hierarchie:** `--text`, `--text-2`, `--text-3`
- **Flächen:** `--surface-1`, `--surface-2`, `--surface-3`
- **Subtle/Strong Borders:** `--border-subtle`, `--border-strong`
- **Dims/Lines:** `--accent-dim`, `--accent-line` (transparente Varianten für Flächen und Konturen)

Typografie: Inter (Sans, Body) + JetBrains Mono (Labels, Badges, Codes).

### Wiederverwendbare UI-Patterns

- **`.tp-modal`** (Backdrop, Panel, Close, Escape, Click-Outside) — aktuell für Profil-Edit (Max + Lisa) benutzt, sollte bei zukünftigen Dialogen wiederverwendet werden. Globaler Handler: `data-modal-close="modalId"`-Attribute schließen automatisch.
- **`.view-switcher`** — Segmented Control mit `.active`-State. Bei mehreren Perspektiven auf dieselben Daten (Muskel-Balancer, zukünftig Fortschritt-Views) bekommen Nicht-Default-Perspektiven einen `.bal-hint` / `.jp-hint`-Untertitel, der ihren diagnostischen Nutzen erklärt (siehe Memory `feedback_explanatory_hints.md`).
- **`.info-legal-section`** — nummerierte Abschnitte mit Kreis-Nummer links, Titel, Fließtext. Aktuell für Anamnese + Trainer-Vereinbarung.
- **`.tp-chip`** — Toggle-Chips für Multi-Select (Tage, Ausrüstung in Profil-Edit).
- **`.cmdk-hero`** — Farbige Action-Tiles im Mobile Bottom Sheet (Command Palette). `--primary` für Hauptaktion (Teal), `--secondary` für Nebenaktionen.
- **`.tp-loc-toggle`** — Kompakter bidirektionaler Toggle-Button mit ⟳-Icon (Studio↔Home). `.home-active` für Teal-Highlight.
- **`_fmtKg(n)`** — Smart-Formatter für Gewichte: ganzzahlig wenn `.0`, sonst 1 Nachkomma (60 → "60", 62.5 → "62.5").
- **`_resolveProfile(key)`** — Löst 'self' → aktives Profil, 'lisa' → Julia-JSON auf. Zentrale Stelle für Edit-Modal und Save.

### Datum-Handling (unverändert seit v1 — häufigste Fehlerquelle)

Session-Daten sind `DD.MM.YYYY` (deutsches Format). KW-Nummern sind **nicht jahresübergreifend eindeutig**.

Zentrale Helper (definiert vor Chart.js-Block):

```
_parseDE(dateStr)     → Timestamp aus DD.MM.YYYY
_yearKwKey(s)         → "2026_14" (eindeutiger KW-Schlüssel)
_fmtKg(n)             → Smart-Gewicht: 60 → "60", 62.5 → "62.5"
_fmtNum(n)            → Ganzzahl mit Tausenderpunkt: 27446 → "27.446"
_allGroups(exercise)  → Set aller kanonischen Muskelgruppen einer Übung
_resolveProfile(key)  → 'self' → aktives Profil, 'lisa' → Julia-JSON
_formatLocations(loc) → ['studio','home'] → "Studio · Zuhause"
_formatEquipment(eq)  → Equipment-Objekt → lesbarer Text pro Ort
_parseLocationString(str) → "Studio + Zuhause" → ['studio','home']
_pickerAvailableEq()  → Equipment-Set für den aktuellen Plan-Block
```

**Regeln:**

- Sortierung: Immer `a._ts - b._ts`, NIE `a.kw - b.kw` (bricht am Jahreswechsel)
- KW-Vergleiche: Immer Jahr mitprüfen (`_sessionYear(s) === curYear`)
- KW-Aggregation: Map-Key `Jahr_KW`, nie nur `KW`

### Wissenschaftliche Formeln

- **1RM (Epley):** `weight × (1 + reps/30)` — siehe `calc1RM()` / `calcBest1RM()`
- **Fatigue/Readiness Score:** 4-Komponenten gewichtet (RPE 35% · Volumen 25% · Frequenz 20% · Stagnation 20%), Baseline 70
- **Muskel-Balance-Schwellen:** <15% Diff = ausgewogen, 15–30% Schieflage, >30% Dysbalance (Master-Views 25% / 40% wegen natürlicher Abweichungen)
- **Periodisierung:** Variable Blöcke (Grundlagen/Muskelaufbau/Maximalkraft), Ganzjährig-Wiederholung, flexible Erholungssteuerung
- **HFmax:** 220 - Alter (Auto-Berechnung im Profil-Edit, manuell überschreibbar)

## Was Stub/Platzhalter ist, was real ist

### Echt funktional in v2

- Cockpit (Readiness-Score, Volumen, Muskel-Balancer mit 4 Views, nächste Einheit)
- Jahresplan (Visualisierung, KW-Aggregation, Block-Farben)
- Trainingsplan (KW-Auswahl, Tag-Wechsel, Übungs-Anzeige, Satz-Daten sichtbar — Edit-Flow folgt)
- Fortschritt (Stats, 1RM-Entwicklung, Top-Übungen, Block-Vergleich)
- Lexikon (71 Übungen: 43 Studio + 28 Calisthenics, Suche, Kategorie- und Trainingsort-Filter, Detail-Sheet)
- Info-Tab: Profil (inkl. Max + Lisa Edit), Anamnese (Read-only Demo-Daten), Vereinbarung (Read-only Text), Einstellungen, Hilfe, Daten, Recht (Impressum + Datenschutz + Nutzungsbedingungen), Über
- Rollen-Switch und rollenbasierte Sichtbarkeit
- Theme-Wechsel (4 Themes: Midnight, Ember, Teal, Pastell — im Sidebar-Fuß + Info > Einstellungen für Mobile)

### Stubs / Toast-Handler (bewusst unfertig)

- **Athleten-Verwalten:** "Neuer Athlet" und "Entfernen" → Toast-Stubs. "Bearbeiten" funktioniert (Modal + Profil-Wechsel)
- **Anamnese-Update / Historie-Ansicht:** Toasts
- **Vereinbarung-Widerruf:** Toast
- **Command Palette:** 12 von 21 Items sind Toast-Stubs (Quiz, Sync, PIN-Lock, etc.)
- **Quiz-Tab:** gar nicht in v2, muss aus v1 portiert werden

### Seit 06.04.2026 voll funktional

- **Wochenplan-Generator** (Jahresplan → Bearbeiten): Bis zu 4 Blöcke, variable Längen, flexible Regen-Steuerung, Trainingsort-Filter, Home-Ausweichplan, Live-Timeline
- **Trainingsplan Bearbeiten** (Trainer-only): Übungspicker aus 85+ Lexikon-Übungen, inline Sätze/Wdh/kg, vergangene KWs geschützt
- **Profil-Wechsel** Alexander ↔ Julia: Eigenes JSON pro Athlet, Auto-Theme, Command Palette für mobil, `_resolveProfile()`-Helper für korrektes Edit-Modal
- **Pastell-Theme** "Garten": Warm-Creme Light-Mode für Julia, Auto-Switch bei Profil-Wechsel, kein Persistieren über Reload (Pastell gehört zu Julia, nicht zu localStorage)
- **Studio/Home-Toggle** im Trainingsplan: Bidirektionaler ⟳-Button direkt bei den Übungen, Teal-Highlight wenn Home aktiv
- **Fortschritt-Views**: Entwicklung | Zeitvergleich (Jahre/Quartale) | Standards AT (NSCA/ACSM, geschlechtsdifferenziert), Sub-Views werden bei Profil-Wechsel automatisch neu gerendert
- **Lexikon**: 85+ Übungen inkl. 7 Warm-up + 7 Cooldown, 8 Kategorie-Farben
- **Mobile Command Palette**: Bottom Sheet mit Hero-Tiles für Quick Actions, Navigation ausgeblendet (Bottom-Nav existiert), direkte Item-Referenzen statt Index-Mapping
- **Swipe-Navigation**: Horizontales Wischen zwischen Tabs auf Mobile via `touch-action: pan-y` auf `.main` (min 60px, max 30° Winkel). Samsung Internet benötigt `touch-action: pan-y` da es sonst horizontale Touch-Events schluckt.
- **Muskel-Balancer**: `_allGroups()` zählt alle Muskeln einer Übung (nicht nur den ersten), erweiterte MUSCLE_MAP mit anatomischen Namen (Deltamuskel, Beinbizeps, etc.), Bauch als Solo-Gruppe. Kein opacity-Trick, kein rAF — direktes `innerHTML = html`, Balken sofort mit Zielbreite.
- **Zahlen-Formatierung**: 1RM ganzzahlig, kg smart via `_fmtKg()` (60 → "60", 62.5 → "62.5"), BW-Ratio 1 Nachkomma
- **Fortschritt-Filter**: Abhängige Filter (4W → Quartale ausgegraut), Sticky Range-Leiste mit Accent-Farbe
- **Bug-Floater**: 🐛 im Dark-Theme, 🦋 im Pastell/Garten-Theme

### Seit 07.04.2026 voll funktional

- **Equipment pro Trainingsort**: Profil-Edit zeigt Equipment-Chips gruppiert nach Studio/Zuhause/Outdoor. Drei-Zustand-Chips: off → verfügbar (teal) → ausgeschlossen (rot/durchgestrichen). Datenformat: `equipment: { studio: { available: [...], excluded: [...] }, ... }`. Auto-Migration von altem Array-Format beim Laden.
- **Equipment-Tags im Lexikon**: Alle 85 Übungen haben `eq`-Array mit standardisierten Equipment-Werten (`Langhantel`, `Maschinen`, `Bodyweight`, etc.)
- **Trainingsort pro Jahresplan-Block**: Jeder Block im Wochenplan-Generator hat ein eigenes Trainingsort-Dropdown. Saisonale Planung: Winter Studio, Frühling Outdoor.
- **Equipment-Filter im Übungspicker**: `_pickerAvailableEq()` liest Block-Ort → Profil-Equipment → filtert Lexikon. `Bodyweight` immer verfügbar, `excluded`-Geräte ausgeblendet.
- **Trainingsort in Jahresplan-Karten**: Location-Icon (◇/⌂/✦) neben KW-Nummer + im Trainingsplan-Header
- **Ganzjährig-Checkbox**: Block-Zyklus wiederholen bis KW 52 (mit Safety-Limit)
- **Periodisierung endKw**: `_calcPeriodization()` stoppt bei `endKw`, kein zyklisches Repeat über den geplanten Bereich hinaus
- **Quartals-Marker in Block-Timeline**: Dünne Trennlinien bei Q2/Q3/Q4 (KW 14, 27, 40)
- **Splash/Welcome Screen**: Mindmap-Style mit Portrait, animierten Concept-Nodes, Teal-Glow. `sessionStorage`-Check: nur einmal pro Session. Nach Dismiss per `.remove()` aus DOM entfernt.
- **Favicon**: Inline SVG (Hantel in Teal auf Dark-Background), kein Extra-File
- **Bottom-Nav**: Cockpit | Plan | [+Log] | Stats | Lexikon. Log-Button: Tap = Einheit, Long-Press = Command Palette
- **Code-Audit 07.04.**: Null-Guards in renderCockpit, XSS-Fix in `_formatEquipment`, Equipment-Migration, State-Deklaration aufgeräumt, toter CSS entfernt
- **Bodyweight-Gewicht**: 22 Übungen im Lexikon mit bwFactor (1.0, 0.85, 0.80, 0.70, 0.65). Effektivgewicht = BW × Faktor + Zusatz. set._bwZusatz speichert Zusatzgewicht. Helper: `_getBwFactor()`, `_effectiveWeight()`. Satz-UI zeigt "Zusatz" statt "kg" + BW-Hint.
- **MUSCLE_MAP erweitert**: ~60 Einträge statt ~20, anatomische Langformen (Deltamuskel-Varianten, Trapezmuskel, Beinbeugemuskulatur etc.)
- **4. Block-Farbe**: `.jp-block-aux` (Coral/--danger), `_blockClass()` mit 4 Einträgen, dynamische Legende
- **Planungs-Balance-Vorschau**: `buildPlanBalance()` zeigt ø Sätze/Woche pro Muskelgruppe nach Plan-Generierung, nur Trainer + Bearbeiten-Modus
- **Fortschritt Dashboard Redesign**: View-Switcher + Aggregation-Toggle entfernt, alles in einem scrollbaren Dashboard. Auto-Aggregation: 4W→Tage, 12W→Wochen, 1J→Monate, Alles→Quartale
- **1RM-Chart adaptiv**: Bei 1J/Alles Monats-Aggregation statt KW, adaptive Punktgröße (>30 → nur Peaks/Dips sichtbar), BW-Kontext in Chart-Subtitle + Tooltip
- **Accordion-Stepper**: Generator-Schritte auf Mobile (<720px) als Accordion, Balance-Preview ebenso
- **Samsung Internet Fixes**: pageIn-Animation entkoppelt, `border: 1px solid transparent` auf Range-Buttons, `-webkit-tap-highlight-color: transparent` global
- **localStorage-Persistenz**: Auto-Save nach jeder Mutation (`_saveProfile()`), localStorage-First beim Laden, Import/Export, Demo-Reset. Key: `tpv2_profile_data`. Variante B (RAM-only) ist abgelöst.
- **Demo-Banner + Profil-Neuanlage**: Rotes Banner im Cockpit fordert zum Erstellen eines eigenen Profils auf. "Erstellen" leert alles komplett (sessions, plans, periodization etc.) und öffnet Profil-Edit.
- **Schnellstart-Anleitung**: 4 Karten im Hilfe-Tab: App installieren (Homescreen), Datenspeicherung erklärt, Backup-Workflow, In 3 Schritten loslegen.

### Seit 08–09.04.2026 voll funktional

- **Modularisierung**: Single-File (12.917 Zeilen) → 38 Dateien (HTML + 11 CSS + 26 JS-Module mit ES `import`/`export`). Kein Build-System. `Redesign/`-Workflow entfällt.
- **Laienverständliche Block-Labels**: "Grundlagen" statt "Akkumulation (GPP)", "Muskelaufbau" statt "Intensifikation (SPP)", "Erholung" statt "Regen"
- **4 Themes**: Midnight (kühl/blau), Ember (warm/kupfer), Teal (premium), Pastell (Garten). Theme-Wechsel auch auf Mobile via Info > Einstellungen.
- **BW-Übungen transparent**: Athletengewicht × Faktor = Basisgewicht überall sichtbar (offene Sätze, Edit, geloggt). "Zusatz" statt "kg" als Label.
- **Widerstandsband-Hint**: "Band" als Label, Stärke-Empfehlung (leicht≈5, mittel≈10, schwer≈20 kg)
- **Letztes Gewicht als Orientierung**: Offene Sätze zeigen letztes geloggtes Gewicht mit "letztes"-Tag wenn kein Plan-Gewicht
- **HFmax Auto-Berechnung**: 220 - Alter, manuell überschreibbar, Hint "(berechnet: X)"
- **Bidirektionaler Trainingsort-Wechsel**: Home↔Studio Toggle funktioniert in beide Richtungen (`_homeFallback` + `_studioFallback`)
- **Equipment-basierte Übungsauswahl**: Generator filtert nach Profil-Equipment pro Ort. Home ohne Equipment → Bodyweight-Fallback.
- **Ganzjährig korrekt**: Blöcke wiederholen sich bis KW 52 in Timeline + Plans
- **Accordion mit Fortschritt**: Mobile Generator-Schritte zeigen "öffnen ▸" / "▾" / "fertig ✓", Auto-Scroll beim Öffnen
- **Command Palette erweitert**: Import/Export als Hero-Tiles, Julia-Items nur bei Demo-Daten, Deep-Links zu Info-Sektionen
- **Solo-Muskelgruppen Mobile**: 2er-Grid mit Karten-Hintergrund statt 3er
- **Perioden-Gegenüberstellung + Kraft-Standards** im Fortschritt-Tab wiederhergestellt
- **Samsung Internet Cache-Busting**: `?v=YYYYMMDD` an Script-Tags, Cache-Control Meta-Tags

### Seit 10.04.2026 voll funktional

- **Rechtsstand v2.7** (Audit + Umsetzung am 10.04.): DSGVO/Lizenzen/Impressum/AGB komplett aufgesetzt. Siehe eigenen Abschnitt „Rechtsstand" weiter unten.
- **Google Fonts lokal**: Inter + JetBrains Mono als Variable-Font-WOFF2 unter `css/fonts/`, eigene `css/fonts.css` mit `@font-face` (latin Subset, ~80 KB total). Keine Requests mehr an `fonts.googleapis.com` / `fonts.gstatic.com` — DSGVO-Konformität (LG München I, Az. 3 O 17493/20).
- **Chart.js lokal**: `js/lib/chart.umd.min.js` (4.4.7, ~206 KB). Keine jsDelivr-Requests mehr.
- **Info → Recht** (neue Sub-Sektion): Impressum nach § 25 MedienG / § 5 ECG / § 5 DDG, Datenschutzerklärung in 8 Abschnitten (Art. 6/9 DSGVO, alle `tpv2_*` localStorage-Schlüssel transparent aufgelistet, Betroffenenrechte mit Verweis auf Export/Reset, Abschnitt 8 zeigt Datum der erteilten Einwilligung + Widerrufs-Button), Nutzungsbedingungen + Haftungsausschluss in 7 Abschnitten (v1-AGB portiert, ABGB-konformer Vorbehalt für Vorsatz/grobe Fahrlässigkeit, Readiness/1RM/Kraft-Standards explizit benannt). Sub-Nav-Button „Recht" zwischen „Daten" und „Über".
- **Aktive DSGVO-Einwilligung** (Welcome-Modal): Beim ersten Aufruf (kein gültiger `tpv2_consent_v1`) erscheint ein blockierendes Modal mit drei Kernpunkten, klappbarem Datenschutz-Detail-Bereich, Pflicht-Checkbox und Akzeptieren-Button (initial disabled). Esc und Click-Outside sind explizit blockiert. Versionierung der Rechtstexte über `DSE_VERSION` / `AGB_VERSION` in `js/consent.js` — bei Änderungen erhöhen, dann erzwingt das Modal eine erneute Akzeptanz. Splash wird beim Erstaufruf übersprungen, damit die zwei Overlays nicht rivalisieren. Modul: `js/consent.js`. Init-Gate: `await initConsent()` in `js/app.js`.
- **LICENSE**: MIT-Lizenz im Repo-Root. GitHub-Pages-Free-Tier zwingt zu public, MIT ist die kleinste Hülle, die zu allen Dependencies (Chart.js MIT, Inter/JetBrains Mono OFL 1.1) passt.
- **Credits aktualisiert**: Im „Über"-Tab sind Chart.js/Inter/JetBrains Mono jetzt als „lokal" markiert, Kraft-Standards-Quelle „NSCA/ACSM" als eigene Zeile ergänzt.

## Rechtsstand (Stand 10.04.2026)

Die App ist seit 10.04.2026 rechtlich grundabgesichert. Die Belegspur dazu ist im Projekt versioniert:

- **Original-Audit:** [`Notizen/2026-04-10_rechtsaudit-original.md`](Notizen/2026-04-10_rechtsaudit-original.md) — vollständiger externer Audit-Bericht (Lizenzen, DSGVO, Impressumspflicht, Haftung, Repo-Status)
- **Umsetzungs-Mitschrift:** [`Notizen/2026-04-10_rechtsaudit-umsetzung.md`](Notizen/2026-04-10_rechtsaudit-umsetzung.md) — was wann warum geändert wurde, mit Quellen (DSGVO-Artikel, ECG/MedienG/DDG, ABGB, KSchG, MDR, LG München, Schrems II), betroffenen Dateien/Zeilen und Verifikations-Checkliste

**Dauerhafte Regel für künftige Sessions:**

- **Keine externen CDN-Requests aus `Trainingsplaner.html`** (oder sonstigen App-Dateien). Alle Schriften, Libraries, Icons müssen lokal liegen oder als Inline-SVG/Data-URI eingebettet werden. Sonst ist die DSGVO-Aufsetzung sofort wieder kaputt.
- **Bei Änderungen an `Info → Recht`**: Stand-Datum am Ende jeder Card aktualisieren UND `DSE_VERSION` bzw. `AGB_VERSION` in `js/consent.js` erhöhen, sonst werden bestehende Nutzer nicht erneut um Einwilligung gebeten und die Belegspur driftet auseinander.
- **Bei neuen Trainings-Features mit gesundheitlicher Wirkung** (z. B. neue Score-Formeln, neue Empfehlungs-Logik): in den Nutzungsbedingungen Abschnitt 2 explizit benennen, sonst greift der Haftungsausschluss nicht für das neue Feature. Danach `AGB_VERSION` bumpen.
- **Bei neuen `localStorage`-Schlüsseln** (mit `tpv2_`-Prefix): in der Datenschutzerklärung Abschnitt 2 nachziehen, dann `DSE_VERSION` bumpen.
- **Bei neuen Dependencies**: Lizenz prüfen, in den Credits („Über"-Tab) aufnehmen, in der Mitschrift ergänzen, im Repo lokal hosten.
- **Bei Init-Sequenz-Änderungen in `js/app.js`**: Der `await initConsent()`-Block muss vor allen Profil-, Tab-, Render- und Demo-Calls bleiben. Sonst läuft App-Code, bevor der Nutzer eingewilligt hat — und die Einwilligung ist nicht mehr „vor der Verarbeitung" erteilt.

## Ausstehende Bau-Etappen (große Richtung)

1. ~~**Persistenz-Layer**~~ — **Erledigt** (08.04.)
2. ~~**Planungs-Tab Umsetzung**~~ — **Erledigt** (07.04.)
3. ~~**Modularisierung**~~ — **Erledigt** (08.04.): 38 Dateien, ES Modules
4. **Onboarding + Anamnese/Vereinbarung** — PFLICHT vor Release. Anamnese + Vereinbarung editierbar machen, als Pflichtschritte im Profil-Erstell-Flow. Progressive Freischaltung (Sektionen eingeklappt bis Daten vorhanden).
5. **Demo als Import statt Pflicht** — App startet leer, Demo-Athleten optional importierbar
6. **Equipment: Bank als eigenes Item** — Kurzhantel ≠ Kurzhantel + Bank. Lexikon-Übungen mit `['Kurzhanteln', 'Hantelbank']` taggen, Filter auf `every` statt `some`.
7. **Level-basierte Gewichtsvorschläge** — Athlet gibt Level an (Anfänger→Elite), Gewichte nach BW-Ratio (NSCA/ExRx)
8. **Command Palette Redesign** — Toast-Stubs entfernen, kontext-sensitiv je Tab, Deep-Links
9. **Urlaub/Krank Planadaption** — KWs markieren, Plan automatisch verschieben
10. **PIN-Lock + AES-256-GCM** — aus v1 portieren
11. **Multi-Profil-Verwaltung** — echte Trainer-Athlet-Beziehung
12. **Übungs-Tausch im Training** — in-session Alternative (gleiche Muskelgruppe + Equipment)
13. **Google Apps Script Sync** — erst wenn Datenstrukturen stabil
14. **Quiz-Tab einbinden** — Modul existiert als `quiz.html` / `quiz.json`

## v1-Archiv: Wann du die Datei öffnen musst

`Trainingsplaner_v1_archiv.html` ist die Referenz für alles, was in v2 noch fehlt. Konkret sind dort die Kern-Implementierungen zu finden, die nach und nach portiert werden:

- **Verschlüsselungs-Flow:** `_lockSubmit()`, `_tpEncrypt()`, `_tpDecrypt()`, Vault-Pattern, XOR-Fallback für `file://`-Kontexte ohne `crypto.subtle`
- **Lock Screen Reset:** `_lockReset()` — muss `localStorage.clear()` + `_memStorage` + interne Variablen (`_appPin`, `_decryptedCache`) leeren
- **Browser-Fallback-Pattern:** `_hasCryptoSubtle`-Check mit echtem `digest()`-Test, `_memStorage` für `localStorage`-Blockade
- **Profilsystem:** `openEditProfileModal()`, `saveProfileModal()`, `applyAccessControl()`
- **Fortschritt-Renderpipeline:** `buildProgressView()`, `buildActiveAnalysis()`, `renderFatigueScore()`, `buildDetailReport()`
- **Drive-Sync:** Apps-Script-Integration, JSONP-Endpunkt, Trainer-Athleten-Transfer

**Beim Portieren Override-Pattern beachten** (siehe Memory `feedback_override_pattern.md`): `getProfiles` / `openEditProfileModal` / `saveProfileModal` existieren in v1 mehrfach mit Override-Chain. Beim Port nach v2 immer ALLE Definitionen prüfen, nicht nur die erste.

## Backup-Konvention

Vor jedem größeren Umbau Backup in `Daten/`. Seit der Modularisierung: kompletter Ordner statt Single-File.

- `Trainingsplaner_v2_backup_2026-04-05_*.html` bis `*-04-08_*.html` — Single-File Backups (vor Modularisierung)
- `backup_modular_2026-04-09/` — Modulare Version (HTML + css/ + js/), 38 Dateien

## Konzept-Dokumentation

`Konzept.md` und `Konzept.html` dokumentieren die App für Präsentationszwecke. Bei strukturellen Feature-Änderungen **beide** aktualisieren:

- `Konzept.md`: Markdown-Referenz (Kapitel 1–9)
- `Konzept.html`: Visuelle HTML-Version mit App-Design-Stil

Beide beschreiben aktuell noch v1-Features. Bei der v2-Dokumentation irgendwann nachziehen — aber erst wenn die Feature-Etappen 1–4 durch sind, sonst ist die Doku ständig stale.

## Wissensbasis

`Wissensbasis/` enthält kuratiertes Fachwissen als Referenz für Entwicklung, Diplomarbeit und Feature-Entscheidungen. Index: `Wissensbasis/WISSEN.md`. Themenfelder:

- **Sportwissenschaft** — Trainingslehre, Periodisierung, Belastungssteuerung (RPE/RIR, Volumen-Landmarks), Regeneration, 1RM-Formeln, HRV, Calisthenics-Progressionen
- **Ernährung** — ISSN-Makro-Empfehlungen, Kalorienbedarf-Formeln, evidenzbasierte Supplemente, Hydration
- **Verletzungsprävention** — Häufige Verletzungen (Studio + Cali), RAMP-Warm-up, Prehab, Red Flags, Return to Training
- **Recht** — DSGVO, Gesundheitsaussagen, MDR-Abgrenzung, BFSG, Impressum, Lizenzen, Versicherung, Urheberrecht
- **Markt & Wettbewerb** — Konkurrenz-Apps, UX Best Practices, Monetarisierung, Trainer-Plattformen, Trends 2025/2026

Bei Feature-Entscheidungen, Formulierung von Readiness-/Fatigue-Texten oder rechtlichen Fragen: zuerst die relevante Wissensbasis-Datei konsultieren.

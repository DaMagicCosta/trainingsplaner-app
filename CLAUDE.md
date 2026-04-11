# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Siehe auch die übergeordnete [CLAUDE.md](../../CLAUDE.md) für projektübergreifende Arbeitsweise (Sprache, Kontext, Prompt-Vorlagen) und [`Notizen/CHANGELOG.md`](Notizen/CHANGELOG.md) für die Entwicklungs-Historie.

## Wichtigster Kontext vorweg

`Trainingsplaner.html` im Repo-Root ist die **v2-Live-Version** (modular, localStorage-Persistenz, DSGVO-konform). Die alte v1 lebt als `Trainingsplaner_v1_archiv.html` als Lese-Referenz für Features, die noch portiert werden. **Nicht in v1 editieren.**

Die App hat **keinen Build-Step** — direkt in HTML/CSS/JS-Modulen editieren, `git push origin main` deployed automatisch auf GitHub Pages.

## Häufig benötigte Commands

| Aktion | Command |
|---|---|
| **Lokal entwickeln** | `Trainingsplaner.html` in VS Code mit **Live Server** öffnen (Pflicht für Chrome wegen ES Modules, `file://` geht nicht) |
| **Deploy** | `git push origin main` → GitHub Pages in 1–2 Min |
| **Demo-Profil regenerieren** | `node generate_demo.js` oder `python generate_demo.py` (produziert Alexander + Julia JSON) |
| **Backup vor Umbau** | `cp -r . Daten/backup_YYYY-MM-DD_label/` |
| **Test-Reset der Persistenz** | Browser DevTools → Application → Storage → Clear site data, dann F5 |

Keine Tests, kein Linter, kein Formatter — die App wird manuell im Browser verifiziert.

## Repo-Struktur

| Pfad | Rolle |
|------|-------|
| `Trainingsplaner.html` | Live-Version (v2) — nur HTML-Markup, deployed auf GitHub Pages |
| `css/` | 11 CSS-Dateien (tokens, layout, components, 6 pages, splash, welcome, fonts, responsive) |
| `css/fonts/` | Lokal gehostete Variable-Fonts (Inter, JetBrains Mono) — **niemals durch CDN-Link ersetzen** |
| `js/` | 28 ES-Module-Dateien, Einstiegspunkt `js/app.js` |
| `js/data/` | Daten-Konstanten: `lexikon-data.js` (111 Übungen), `muscle-map.js`, `strength-standards.js` |
| `js/pages/` | Page-Renderer (cockpit, jahresplan, trainingsplan, fortschritt, lexikon, info) |
| `js/features/` | Feature-Module (readiness, muscle-balance, plan-balance, generator, log-session, profile-edit, anamnese-edit, agreement-edit, bug-report) |
| `js/lib/chart.umd.min.js` | Lokal gehostetes Chart.js 4.4.7 — **niemals durch CDN-Link ersetzen** |
| `Trainingsplaner_v1_archiv.html` | v1-Archiv (Lese-Referenz für noch zu portierende Features) |
| `Trainingsplaner_Alexander_Demo.json` / `Trainingsplaner_Julia_Demo.json` | Demo-Profile (Source of Truth, generate_demo.* ist veraltet) |
| `Notizen/` | Sessions-Notizen + CHANGELOG + Rechts-Belegspur (`2026-04-10_rechtsaudit-*.md`, `2026-04-11_lexikon-quellen.md`) |
| `Wissensbasis/` | Kuratiertes Fachwissen — Sportwissenschaft, Ernährung, Verletzungen, Recht, Markt. Index: `WISSEN.md` |
| `Redesign/` | Archiv der alten Single-File-Quelle — nicht mehr arbeiten |
| `Daten/` | Backups vor größeren Umbauten |
| `sync/` | Apps-Script-Sync aus v1 — **bewusst nicht aktiv** |
| `quiz.html` / `quiz.json` | Quiz-Modul aus v1 — noch nicht in v2 integriert |

## Architektur — Big Picture

### Persistenz-Modell

v2 nutzt **localStorage** für Profil-Persistenz. Alle Schlüssel tragen das `tpv2_`-Prefix:

- `tpv2_profile_data` — Profil (inkl. `anamnesis`, `anamnesisHistory`, `agreement`, `agreementHistory`, `sessions`, `plans`, `equipment`)
- `tpv2_consent_v1` — DSGVO-Einwilligung mit `{ acceptedAt, dseVersion, agbVersion }`
- `tpv2_show_demos` — Sichtbarkeit der Demo-Showcase im Profil-Tab
- `tpv2_active_tab`, `tpv2_role`, `tpv2_theme`, `tpv2_info_section`, `tpv2_bal_view`, `tpv2_bal_range`, `tpv2_fp_range`, `tpv2_fp_exercise` — UI-State

`_saveProfile()` in `js/state.js` schreibt nach jeder Mutation. **Wichtig:** Im Demo-Vorschau-Modus (`state.demoMode !== null`) ist `_saveProfile()` ein No-op — das eigene Profil in `state._savedProfileBackup` ist geschützt.

### Init-Sequenz in `js/app.js`

Die Reihenfolge ist kritisch und **darf nicht umgestellt werden**:

```js
_cleanupLegacyKeys();   // v1-Reste entfernen
applyTheme(state.theme); // Theme anwenden, damit Welcome-Modal im richtigen Look erscheint
(async () => {
  await initConsent();   // GATE — blockiert bis Nutzer akzeptiert hat
  renderConsentInfo();   // DSE Sektion 8 mit Datum füllen
  switchTab(state.activeTab);
  setRole(state.role);
  loadDemoProfile().then(...);  // localStorage laden oder Empty-Profil
})();
```

**Regel**: `await initConsent()` muss **vor** allen Profil-, Tab-, Render- und Demo-Calls stehen. Sonst läuft App-Code bevor der Nutzer eingewilligt hat.

### Tab-Struktur

```
Cockpit · Jahresplan · Trainingsplan · Fortschritt · Lexikon · Info
```

Rollenbasierte Sichtbarkeit via `body.role-trainer` / `body.role-athlete` CSS-Klassen:

| Element | Sichtbar bei |
|---|---|
| `info-athletes-card` (Athleten verwalten) | Trainer |
| Info → Vereinbarung | Trainer |
| Info → Anamnese | Athlet |
| Jahresplan Bearbeiten-Modus | Trainer |

### State-Modell (`js/state.js`)

Wichtige Felder im globalen `state`-Objekt:

- `profile` — aktives Profil (RAM oder localStorage)
- `demoMode` — `'alexander' | 'julia' | null` — aktiver Demo-Vorschau-Modus
- `_savedProfileBackup` — geparktes eigenes Profil während Demo-Vorschau
- `tpUseHome` — globaler Default Studio/Home-Toggle (aus `trainingLocation[0]` abgeleitet)
- `tpUseHomePerKw` — sparse Map `{ kw: boolean }` für KW-spezifische Overrides
- `showDemos` — Sichtbarkeit der Demo-Showcase-Card
- `role`, `activeTab`, `theme`, … — UI-State

### Kritische Daten-Module

Diese Module enthalten domain-spezifisches Wissen, das bei Erweiterungen an **einer** Stelle gepflegt werden muss:

| Modul | Inhalt |
|---|---|
| `js/data/lexikon-data.js` | 111 Übungen in 8 Kategorien, `LX_CATEGORIES`, `LX_SOURCES` (Kategorie-Default-Quellen), `_lxSource()` (Priorität: explizit > Kategorie > null). Jeder Eintrag hat `name`, `muscle`, `secondary`, `antagonist`, `desc`, `eq[]`, optional `location`, `bwFactor`, `isometric`, `voraussetzungen[]`, `quelle` |
| `js/data/muscle-map.js` | `MUSCLE_MAP` mit ~60 anatomischen Langformen, Antagonisten-Mapping, Kategorie-Zuordnung |
| `js/data/strength-standards.js` | NSCA/ACSM-Ratios (M+F, 5 Level), Übungs-Alias-Map, Iso-Patterns, `estimateStartWeight(name, reps, profile)` für Generator-Gewichtsvorschläge |
| `js/consent.js` | `DSE_VERSION` + `AGB_VERSION` — bei Änderung der Rechtstexte bumpen, dann wird beim nächsten Reload eine erneute Akzeptanz erzwungen |

### Design-System

Cockpit-getriebene Farbpalette mit CSS Custom Properties (`--accent`, `--success`, `--warning`, `--danger`, `--text-1..3`, `--surface-1..3`, `--border-subtle/strong`, `--accent-dim/line`). 4 Themes: Midnight, Ember, Teal (default), Pastell.

Typografie: **Inter** (Body) + **JetBrains Mono** (Labels, Badges, Codes). Beide als Variable-Font-WOFF2 lokal in `css/fonts/`.

### Wiederverwendbare UI-Patterns

- **`.tp-modal`** — Backdrop, Panel, Close-Button, Escape + Click-Outside. Globaler Handler: `data-modal-close="modalId"`-Attribute schließen automatisch. Wird für Profil-Edit, Anamnese-Edit, Vereinbarung-Confirm, Anamnese/Vereinbarung-History, Exercise-Picker verwendet.
- **`.welcome-overlay`** (`css/welcome.css`) — blockierendes Overlay mit Pflicht-Checkbox-Pattern. Aktuell nur für das DSGVO-Welcome-Modal, aber das Pattern (Checkbox + Button initial disabled) wird auch im Anamnese- und Vereinbarung-Confirm-Flow genutzt.
- **`.view-switcher`** — Segmented Control für mehrere Perspektiven auf dieselben Daten. Nicht-Default-Perspektiven bekommen einen `.bal-hint`/`.jp-hint`-Untertitel.
- **`.info-legal-section`** — nummerierte Abschnitte mit Kreis-Nummer links. Für Anamnese, Vereinbarung, Datenschutzerklärung.
- **`.tp-chip`** — Toggle-Chips für Multi-Select. Drei-Zustand-Variante für Equipment, Order-Nummern-Variante für Trainingsort-Hierarchie.
- **`.demo-mode-banner` + `.sidebar-demo-pill`** — globaler Indikator für aktive Demo-Vorschau.

### Datum-Handling (häufigste Fehlerquelle — unverändert kritisch)

Session-Daten sind `DD.MM.YYYY` (deutsches Format). KW-Nummern sind **nicht jahresübergreifend eindeutig**.

Zentrale Helper in `js/utils.js`:

```
_parseDE(dateStr)     → Timestamp aus DD.MM.YYYY
_yearKwKey(s)         → "2026_14" (eindeutiger KW-Schlüssel)
_fmtKg(n)             → Smart: 60 → "60", 62.5 → "62.5"
_fmtNum(n)            → Ganzzahl mit Tausenderpunkt
_allGroups(exercise)  → Set aller kanonischen Muskelgruppen
_resolveProfile(key)  → 'self' → aktives Profil, 'lisa' → Julia
_formatLocations(loc) → ['studio','home'] → "Studio · Zuhause"
_formatEquipment(eq)  → Equipment-Objekt → lesbarer Text pro Ort
```

**Regeln (niemals brechen):**
- Sortierung: immer `a._ts - b._ts`, **nie** `a.kw - b.kw` (bricht am Jahreswechsel)
- KW-Vergleiche: Jahr mitprüfen (`_sessionYear(s) === curYear`)
- KW-Aggregation: Map-Key `Jahr_KW`, nie nur `KW`

### Wissenschaftliche Formeln

- **1RM (Epley):** `weight × (1 + reps/30)` — siehe `calc1RM()` / `calcBest1RM()`
- **Arbeitsgewicht aus 1RM (Epley invers):** `1RM / (1 + reps/30)` — in `strength-standards.js`
- **Readiness-Score:** 4-Komponenten gewichtet (RPE 35% · Volumen 25% · Frequenz 20% · Stagnation 20%), Baseline 70
- **Muskel-Balance-Schwellen:** <15% Diff = ausgewogen, 15–30% Schieflage, >30% Dysbalance (Master-Views 25% / 40%)
- **Periodisierung:** Variable Blöcke (Grundlagen/Muskelaufbau/Maximalkraft), Ganzjährig-Wiederholung, flexible Regen-Steuerung
- **HFmax:** 220 − Alter (Auto im Profil-Edit, manuell überschreibbar)

## Rechtsstand (seit 10.04.2026 grundabgesichert)

Die App hat eine vollständige rechtliche Basis: DSGVO, Impressum, Nutzungsbedingungen, LICENSE. **Belegspur** in `Notizen/2026-04-10_rechtsaudit-umsetzung.md` (9 Nachträge), Quellen-Attribution in `Notizen/2026-04-11_lexikon-quellen.md`.

### Dauerhafte Regeln für künftige Sessions

1. **Keine externen CDN-Requests** aus `Trainingsplaner.html` oder sonstigen App-Dateien. Alle Schriften, Libraries, Icons müssen lokal liegen oder als Inline-SVG/Data-URI eingebettet sein. LG-München-Urteil (Az. 3 O 17493/20) macht sonst die DSGVO-Aufsetzung kaputt. Siehe Memory `feedback_keine_externen_cdn.md`.

2. **Bei Änderungen an `Info → Recht`**: Stand-Datum am Ende jeder Card aktualisieren UND `DSE_VERSION` bzw. `AGB_VERSION` in `js/consent.js` erhöhen, sonst werden bestehende Nutzer nicht erneut um Einwilligung gebeten.

3. **Bei neuen Trainings-Features mit gesundheitlicher Wirkung** (z. B. neue Score-Formeln, neue Empfehlungs-Logik): in den Nutzungsbedingungen Abschnitt 2 explizit benennen. Danach `AGB_VERSION` bumpen.

4. **Bei neuen `localStorage`-Schlüsseln** (mit `tpv2_`-Prefix): in der Datenschutzerklärung Abschnitt 2 nachziehen, dann `DSE_VERSION` bumpen.

5. **Bei neuen Dependencies**: Lizenz prüfen, in den Credits („Über"-Tab) aufnehmen, im Repo lokal hosten.

6. **`await initConsent()` in `js/app.js`** muss vor allen Profil-, Tab-, Render- und Demo-Calls bleiben.

7. **Bei neuen Lexikon-Übungen aus externer Quelle**: Beschreibungen **eigen formulieren** (kein Copy-Paste), wörtliche Zitate als solche kennzeichnen, Quelle in Credits + `quelle:`-Feld der Übung nennen. Siehe `Notizen/2026-04-11_lexikon-quellen.md` für die rechtliche Einordnung.

8. **Nach jedem Profil-Edit-Save**: `state.tpUseHome = null` und `state.tpUseHomePerKw = {}` zurücksetzen, damit die nächste `renderTrainingsplan`-Aufruf die neue `trainingLocation`-Hierarchie ableitet.

9. **iOS-/Safari-Kompatibilität**: Chrome-DevTools iPhone-Emulation ist **kein echter Safari-Test** — sie simuliert nur Viewport und User-Agent, die Rendering-Engine bleibt Chromium. Echtes iOS läuft immer auf WebKit (auch Chrome/Firefox auf iOS). Realitätsnahe Tests nur gegen macOS-Safari oder physisches iPhone. Besonders kritisch: `color-mix()` existiert in Safari erst ab iOS 16.2 — jede `color-mix()`-Regel braucht eine **Fallback-Deklaration davor** mit `var(--warning-dim)`/`var(--warning-line)`/`var(--danger-dim)`/`var(--danger-line)` etc., sonst rendern ältere iPhones die Fläche ohne Hintergrund/Border. `backdrop-filter` immer mit `-webkit-backdrop-filter`-Prefix schreiben.

10. **KEINE Cache-Buster-Query-Strings auf ES-Module-Imports**. Falls ein Modul wie `trainingsplan.js` aus mehreren Stellen importiert wird (Quell-Grep: `grep -r "from.*trainingsplan" js/`), erzeugt ein Cache-Buster an **einer** der Import-Stellen zwei unterschiedliche URLs (`foo.js` und `foo.js?v=xyz`) und damit **zwei separate Modul-Instanzen** — jedes mit eigenem Top-Level-IIFE und eigenen Event-Listenern auf denselben DOM-Knoten. Folge: doppelte Handler, Race Conditions, stumme Render-Inkonsistenzen. Pattern vermeiden. Nach Deploy stattdessen manuellen Hard Reload (Strg+Shift+R) machen oder den `<script src="js/app.js">`-Eintrag in `Trainingsplaner.html` mit `?v=...` versehen, damit der Browser den Einstiegspunkt frisch holt — von dort laufen alle child-Imports ohne Query und bleiben konsistent.

## Architektur-Entscheidungen, die nicht offensichtlich sind

### Demo-Vorschau-Modus (RAM-only)

Demo-Profile sind **keine Profil-Übernahme** mehr — sie sind **RAM-only Vorschauen**. Beim Wechsel parkt `_loadDemoAsPreview()` das aktive Profil in `state._savedProfileBackup`, lädt die Demo in `state.profile`, setzt `state.demoMode`, rendert neu. `exitDemoMode()` spielt den Backup zurück. Mutationen am Demo-Profil gehen durch `_saveProfile()` → das prüft `state.demoMode` und ist dann ein No-op → alles bleibt in RAM, geht beim Exit verloren.

### Trainingsort-Hierarchie

`profile.trainingLocation` ist ein Array wie `['studio', 'home']`. Die **Reihenfolge ist semantisch**: `[0]` ist der Standard, `[1+]` sind Alternativen. Im Profil-Edit werden die Chips per Klick nummeriert (`data-order`-Attribut), beim Save sortiert. `state.tpUseHome` wird beim ersten `renderTrainingsplan`-Aufruf aus `trainingLocation[0] === 'home'` abgeleitet. Der Toggle-Button im Trainingsplan setzt nur `state.tpUseHomePerKw[kw]` für die aktuelle Woche — andere Wochen behalten ihren Profil-Default.

### Equipment-Filter strikt (`.every()`)

Übungen mit mehreren benötigten Geräten (z. B. `['Kurzhanteln', 'Hantelbank']`) erscheinen im Picker und Generator nur, wenn **alle** Geräte im Equipment-Set des aktuellen Block-Orts verfügbar sind. `Bodyweight` ist immer implizit verfügbar. Squat Rack ist ein eigenes Item — Langhantel-Kniebeugen brauchen es zwingend.

### Level-basierte Gewichtsvorschläge

`estimateStartWeight()` in `js/data/strength-standards.js` leitet aus dem Anamnese-`experience`-Level + BW + Geschlecht einen Gewichtsvorschlag ab. Drei-Stufen-Auflösung: direkter Compound-Match (Bankdrücken, Kniebeuge, Kreuzheben, Schulterdrücken, Rudern + Aliase), dann Iso-Pattern (Butterfly → 50% Bankdrücken, Beinstrecker → 50% Kniebeuge etc.), dann `null`. Wird im Generator beim Anlegen der Sätze aufgerufen.

## Ausstehende Bau-Etappen

1. **Pflicht-Onboarding-Wizard** vor Release — geführter Flow beim Erst-Profil-Anlegen (Stammdaten → Anamnese → Vereinbarung für Trainer). Anamnese + Vereinbarung sind funktional, aber der Wizard als verbindliche Einstiegs-Sequenz fehlt.
2. **Command Palette Redesign** — Toast-Stubs entfernen, kontext-sensitiv je Tab, Deep-Links.
3. **Urlaub/Krank Planadaption** — KWs markieren, Plan automatisch verschieben.
4. **PIN-Lock + AES-256-GCM** — aus v1 portieren (siehe v1-Archiv-Hinweise unten).
5. **Multi-Profil-Verwaltung** — echte Trainer-Athlet-Beziehung (bisher nur Julia als Mock).
6. **Übungs-Tausch im Training** — in-session Alternative (gleiche Muskelgruppe + Equipment).
7. **Google Apps Script Sync** — erst wenn Datenstrukturen stabil.
8. **Quiz-Tab einbinden** — Modul existiert als `quiz.html` / `quiz.json`.
9. **Kettlebell- und SZ-Stange-Übungen ins Lexikon ergänzen** — beim Equipment-Aufräumen entfernte Chips wieder reinbringen, sobald passende Übungen stehen (Goblet Squat, KB Swing, Turkish Get-up, SZ-Curls, French Press).
10. **`fortschritt.js renderStandards()` Refactor** auf gemeinsame `js/data/strength-standards.js`-Quelle (aktuell noch Kopie der Tabellen).

## v1-Archiv: wann du die Datei öffnen musst

`Trainingsplaner_v1_archiv.html` ist die Referenz für noch nicht portierte Features:

- **Verschlüsselungs-Flow:** `_lockSubmit()`, `_tpEncrypt()`, `_tpDecrypt()`, Vault-Pattern, XOR-Fallback für `file://`-Kontexte ohne `crypto.subtle`
- **Lock Screen Reset:** `_lockReset()` muss `localStorage.clear()` + `_memStorage` + interne Variablen leeren
- **Browser-Fallback-Pattern:** `_hasCryptoSubtle`-Check mit echtem `digest()`-Test
- **Drive-Sync:** Apps-Script-Integration, JSONP-Endpunkt, Trainer-Athleten-Transfer

**Beim Portieren Override-Pattern beachten** (siehe Memory `feedback_override_pattern.md`): `getProfiles` / `openEditProfileModal` / `saveProfileModal` existieren in v1 mehrfach mit Override-Chain — beim Port nach v2 immer ALLE Definitionen prüfen.

## Backup-Konvention

Vor jedem größeren Umbau Backup in `Daten/`. Seit der Modularisierung: kompletter Ordner statt Single-File. Ordner-Name `backup_YYYY-MM-DD_label/`.

## Wissensbasis

`Wissensbasis/` enthält kuratiertes Fachwissen für Entwicklung, Diplomarbeit und Feature-Entscheidungen. Index: `Wissensbasis/WISSEN.md`. Themen: Sportwissenschaft (Trainingslehre, Periodisierung, RPE/RIR, Regeneration, 1RM, HRV, Calisthenics), Ernährung, Verletzungsprävention, Recht (DSGVO, MDR, BFSG), Markt & Wettbewerb. Bei Feature-Entscheidungen oder rechtlichen Fragen zuerst die relevante Wissensbasis-Datei konsultieren.

## Konzept-Dokumentation

`Konzept.md` und `Konzept.html` dokumentieren die App für Präsentationszwecke. Beschreiben aktuell noch v1-Features — bei der v2-Dokumentation irgendwann nachziehen, aber erst wenn die offenen Bau-Etappen 1–3 durch sind.

# Rechtsaudit — Umsetzungs-Mitschrift

**Datum der Umsetzung:** 10.04.2026
**Umgesetzt durch:** Alexander da Costa Amaral, mit Claude Code (Opus 4.6, 1M context)
**Bezug:** Externer Rechtsaudit vom 10.04.2026, durchgeführt durch ChatBot/Ductor (Claude-Subagent)
**Original-Audit-Datei:** [`2026-04-10_rechtsaudit-original.md`](2026-04-10_rechtsaudit-original.md)
**Geprüfte Version:** Trainingsplaner v2.7 (modular, GitHub Pages)
**Repo:** `DaMagicCosta/trainingsplaner-app` (public, kein Build-Step)
**Live-URL:** https://damagiccosta.github.io/trainingsplaner-app/Trainingsplaner.html

---

## Zweck dieses Dokuments

Dieses Dokument ist die **Belegspur** der heutigen Rechts-Compliance-Maßnahmen. Es dient bei Rückfragen — z. B. durch Diplomarbeits-Begutachter, Datenschutzbehörde, Nutzer:innen oder eigene spätere Reviews — dem Nachweis, **was wann warum** geändert wurde, **welche Norm/Quelle** zugrunde lag und **wie verifiziert** wurde.

Das Pendant in der App selbst ist die neue Sektion **Info → Recht** (Impressum, Datenschutzerklärung, Nutzungsbedingungen) — diese Mitschrift erklärt, *wie* es dazu kam.

---

## Auslöser

Am Vormittag des 10.04.2026 hat Alexander einen Rechtsaudit der Trainingsplaner-App über den Telegram-Bot (Ductor / Claude-Subagent) durchgeführt. Der Audit prüfte:

- Urheberrecht / Lizenzen aller verwendeten Schriften, Icons, Bilder, JavaScript-Bibliotheken, CSS-Frameworks, Übungsdatenbank, Audio
- Datenschutz nach DSGVO (verarbeitete Daten, externe Übertragungen, Tracking, Cookies, Datenschutzerklärung)
- Impressumspflicht nach österreichischem Recht (ECG, MedienG) und deutschem Recht (DDG, früher TMG)
- Haftung für Trainingsempfehlungen, Disclaimer/Nutzungsbedingungen
- Open-Source-/Repository-Status (LICENSE-Datei, Lizenzkompatibilität)

Das Audit-Ergebnis sind **6 🔴-Pflichtpunkte** und **3 🟡-Best-Practice-Punkte**. Geschätzter Aufwand laut Audit: ca. 3 Stunden.

Alle 6 Pflichtpunkte sowie 2 von 3 Best-Practice-Punkten wurden am 10.04.2026 zwischen ca. 17:25 und 18:45 umgesetzt.

---

## Punkt 1 — Google Fonts lokal hosten

### Problem laut Audit (Risiko: 🔴 Hoch)

Die Schriften **Inter** (Body) und **JetBrains Mono** (Mono) wurden über die Google-Fonts-CDN geladen:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

Dies löst beim Aufruf der Seite eine Übertragung der **IP-Adresse, des User-Agents und des Referrers** an Google LLC (USA) aus.

### Rechtsgrundlage / Quelle

- **DSGVO Art. 6 Abs. 1** — Verarbeitung personenbezogener Daten (IP) ohne Rechtsgrundlage unzulässig
- **LG München I, Urteil vom 20.01.2022, Az. 3 O 17493/20** — Die Einbindung von Google Fonts über die Google-CDN ohne Einwilligung des Nutzers ist eine Verletzung des Persönlichkeitsrechts und ein DSGVO-Verstoß. Schadenersatz zugesprochen (€ 100). Folge: bundesweite Abmahnwelle 2022/2023.
- **Schrems-II-Entscheidung (EuGH C-311/18, 16.07.2020)** — Datenübertragung in die USA ist generell heikel, auch wenn das EU-US Data Privacy Framework (2023) die Lage entschärft hat.

### Maßnahme

1. Beide Schriften als **Variable-Font WOFF2** vom Google-CDN heruntergeladen, ausschließlich `latin`-Subset (`unicode-range U+0000–00FF` inklusive Umlaute, ausreichend für deutschsprachige App):
   - `css/fonts/inter-latin-var.woff2` — 48 256 Bytes
   - `css/fonts/jetbrains-mono-latin-var.woff2` — 31 432 Bytes
2. Neue Datei `css/fonts.css` mit zwei `@font-face`-Regeln und `font-weight: 400 700` (Variable-Font-Range) erstellt.
3. In `Trainingsplaner.html` die drei Google-Links entfernt und durch `<link rel="stylesheet" href="css/fonts.css">` ersetzt.

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `Trainingsplaner.html` | Zeilen 10–12 entfernt, Zeile 10 neu: `<link rel="stylesheet" href="css/fonts.css">` |
| `css/fonts.css` | **Neu erstellt** — 22 Zeilen, zwei `@font-face`-Regeln |
| `css/fonts/inter-latin-var.woff2` | **Neu** — Inter v20 Variable Font, latin Subset |
| `css/fonts/jetbrains-mono-latin-var.woff2` | **Neu** — JetBrains Mono v24 Variable Font, latin Subset |

### Lizenz der Fonts

Beide Schriften stehen unter der **SIL Open Font License 1.1 (OFL)**. Die OFL erlaubt explizit Embedding, Modifikation und Redistribution — auch in kommerziellen Produkten, mit der Auflage dass Font-Files nicht isoliert verkauft werden. Self-Hosting ist OFL-konform und bedarf keiner separaten Genehmigung.

### Verifikation

- DevTools → Network-Tab: kein Request mehr an `fonts.googleapis.com` oder `fonts.gstatic.com`
- DevTools → Computed Styles: `font-family: Inter, …` wird mit korrekter Schrift gerendert
- Prüfgrep (10.04.2026, 17:35): `Grep "fonts.googleapis|fonts.gstatic" Trainingsplaner.html` → 0 Treffer

---

## Punkt 2 — Chart.js lokal einbinden

### Problem laut Audit (Risiko: 🟡 Mittel)

Chart.js 4.4.7 wurde von jsDelivr-CDN geladen:

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"></script>
```

jsDelivr hat zwar EU-Infrastruktur (Prospect One, Polen) und ein klares Datenschutzdokument, aber die IP-Übertragung beim Laden ist DSGVO-relevant. Außerdem ist ein lokaler Hosting-Status für die Belegbarkeit besser, weil die Datei dann nicht versionsdriften kann (wenn die CDN das File ändern würde).

### Rechtsgrundlage

- **DSGVO Art. 6 Abs. 1** — keine externe Datenübertragung ohne Rechtsgrundlage
- **Lizenzkompatibilität:** Chart.js 4.4.7 steht unter der **MIT-Lizenz**, Self-Hosting ausdrücklich erlaubt

### Maßnahme

1. `chart.umd.min.js` 4.4.7 (205 889 Bytes) von `https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js` heruntergeladen.
2. Als `js/lib/chart.umd.min.js` abgelegt.
3. In `Trainingsplaner.html` Script-Tag umgestellt auf `<script src="js/lib/chart.umd.min.js"></script>`.

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `Trainingsplaner.html` | Zeile 13 (vorher) → Zeile 11 (nachher): lokaler Pfad |
| `js/lib/chart.umd.min.js` | **Neu** — Chart.js 4.4.7 UMD-Build, MIT-Lizenz |

### Verifikation

- DevTools → Network: kein Request an `cdn.jsdelivr.net`
- Charts in Tab „Fortschritt" rendern korrekt (1RM-Verlauf, Volumen, Block-Vergleich)
- Prüfgrep: `Grep "jsdelivr|cdn\." Trainingsplaner.html` → 0 Treffer

---

## Punkt 3 — Datenschutzerklärung

### Problem laut Audit (Risiko: 🔴 Hoch)

In v2 existierte **keine Datenschutzerklärung**. Die App verarbeitet aber personenbezogene Daten (Name, Alter, Gewicht, Größe, HFmax) sowie potenziell Gesundheitsdaten (Anamnese: Vorerkrankungen, Medikamente, Beschwerden). Gesundheitsdaten sind nach **Art. 9 DSGVO** „besondere Kategorien personenbezogener Daten" und benötigen besondere Behandlung.

v1 hatte nur eine knappe Datenspeicherungs-Klausel im Impressum (Trainingsplaner_v1_archiv.html:3371–3373) — nicht ausreichend.

### Rechtsgrundlage

- **DSGVO Art. 13** — Informationspflicht bei Erhebung personenbezogener Daten
- **DSGVO Art. 6 Abs. 1 lit. a** — Einwilligung als Rechtsgrundlage
- **DSGVO Art. 9 Abs. 2 lit. a** — Einwilligung für besondere Datenkategorien (Gesundheit)
- **DSGVO Art. 15–22** — Betroffenenrechte (Auskunft, Berichtigung, Löschung, Datenübertragbarkeit, Widerspruch)
- **DSGVO Art. 77** — Beschwerderecht bei Aufsichtsbehörde

### Maßnahme

Neue Datenschutzerklärung in 7 Abschnitten als Card in der neuen Sub-Sektion `Info → Recht` aufgenommen. Inhalte:

1. **Verantwortlicher** — Name, Sitz, E-Mail
2. **Welche Daten werden verarbeitet?** — Stammdaten, Gesundheitsdaten (explizit als Art.-9-Kategorie markiert), Trainingsdaten, Einstellungen, plus Auflistung *aller* verwendeten `localStorage`-Schlüssel (`tpv2_*`)
3. **Rechtsgrundlage** — Art. 6 Abs. 1 lit. a + Art. 9 Abs. 2 lit. a, Widerruf jederzeit
4. **Externe Dienste & Datenübertragungen** — explizit „Keine" nach Punkt 1+2; Hinweis auf GitHub Pages mit Verweis auf [GitHub Privacy Statement](https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement)
5. **Speicherdauer** — bis zum Löschen durch den Nutzer; keine Server-Speicherung
6. **Deine Rechte** — Auskunft (via Export), Berichtigung, Löschung, Datenübertragbarkeit (JSON), Widerruf, Beschwerde bei [dsb.gv.at](https://dsb.gv.at)
7. **Backup & Datenverlust** — Hinweis auf Browser-Speicher-Risiken (Inkognito, Cache-Löschung), Export-Empfehlung

### Begründung der Formulierung

- **Art. 9 DSGVO explizit benannt** — bei der Anamnese werden Gesundheitsdaten verarbeitet, das ist eine erhöhte Schutzkategorie. Transparenz darüber ist Pflicht.
- **localStorage-Schlüssel aufgeführt** — Audit-Empfehlung „localStorage-Daten auflisten". Die explizite Auflistung erlaubt jedem Nutzer, die Daten z. B. via DevTools selbst einzusehen — das stärkt das Auskunftsrecht (Art. 15).
- **Rechtsgrundlage Einwilligung** — gewählt, weil keine vertragliche Beziehung (kostenlose, nicht-kommerzielle App), kein berechtigtes Interesse über Funktion hinaus.
- **GitHub Pages erwähnt** — beim Aufruf der Seite verarbeitet GitHub kurzzeitig die IP-Adresse aus rein technischen Gründen (Routing). Das ist nach Art. 6 Abs. 1 lit. f DSGVO als berechtigtes Interesse abgedeckt, muss aber transparent gemacht werden.
- **Speicherort:** Die Datenschutzerklärung ist innerhalb der App in `Info → Recht`. Sie ist damit jederzeit aus jedem Tab in maximal zwei Klicks erreichbar. Das erfüllt Art. 12 Abs. 1 DSGVO („leicht zugängliche Form").

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `Trainingsplaner.html` | Neue `<div class="info-section" data-section="recht">` mit Card „Datenschutzerklärung", ca. 100 Zeilen |
| `Trainingsplaner.html` | Sub-Nav: neuer Button `<button data-section="recht">Recht</button>` |

### Verifikation

- App im Live Server geöffnet, Tab Info → Recht → Datenschutzerklärung sichtbar (Screenshot vom 10.04.2026, 18:43)
- Sub-Nav-Switching funktioniert über bestehenden generischen Handler in `js/init-handlers.js` (keine JS-Änderung nötig)

---

## Punkt 4 — Impressum

### Problem laut Audit (Risiko: 🔴 Hoch)

In v2 existierte **kein Impressum**. v1 hatte eines (Trainingsplaner_v1_archiv.html:3347–3378), das beim v2-Redesign nicht portiert wurde.

### Rechtsgrundlage

- **§ 5 ECG (E-Commerce-Gesetz, Österreich)** — Allgemeine Informationspflichten für „Dienste der Informationsgesellschaft". Eine öffentlich erreichbare Web-App auf GitHub Pages fällt darunter, auch wenn sie privat / nicht-kommerziell ist.
- **§ 25 MedienG (Mediengesetz, Österreich)** — Offenlegungspflicht für „periodische Medien". Eine regelmäßig aktualisierte Web-App kann darunter fallen.
- **§ 5 DDG (Digitale-Dienste-Gesetz, Deutschland, seit 14.05.2024)** — Nachfolger des § 5 TMG. Da die App weltweit (auch von Deutschland aus) erreichbar ist, greift dieses Recht für deutsche Nutzer.

### Maßnahme

v1-Impressum nach v2 portiert, dabei modernisiert:
- Verweis auf DDG ergänzt (statt nur TMG, das seit 2024 abgelöst ist)
- Diplomarbeits-Kontext (WIFI Steiermark) explizit erwähnt
- Stand-Datum 10.04.2026 ergänzt
- Strukturierte Form als `info-rows` Card statt Modal-Dialog

### Inhalte

| Feld | Wert |
|---|---|
| Verantwortlich | Alexander da Costa Amaral, Graz, Österreich |
| Kontakt | trainingsplaner@dacostaamaral.at |
| Art des Angebots | Privat, nicht-kommerziell, Diplomarbeits-Tool |
| Haftung Inhalte | Sorgfaltsformulierung, kein Ersatz für ärztliche Beratung |
| Haftung Links | Keine externen Links, keine Datenübertragung |
| Stand | 10.04.2026 |

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `Trainingsplaner.html` | Neue Card „Impressum" in `info-section data-section="recht"` |

---

## Punkt 5 — Nutzungsbedingungen + Haftungsausschluss

### Problem laut Audit (Risiko: 🔴 Hoch)

In v2 fehlten die Nutzungsbedingungen mit Haftungsausschluss. v1 hatte ein ausführliches AGB-Modal (Trainingsplaner_v1_archiv.html:3381–3419) — das wurde beim Redesign nicht portiert.

Begründung des Risikos: Die App gibt **konkrete Trainingsempfehlungen** (Gewichte über letztes-Tag, Übungsauswahl über Generator, Periodisierung, Readiness-Score, Kraft-Standards-Einstufungen). Ohne expliziten Haftungsausschluss besteht ein theoretisches Haftungsrisiko bei Verletzungen.

### Rechtsgrundlage

- **§ 1295 ABGB** (Österreich) — Allgemeine Schadenersatzpflicht
- **§ 1325 ABGB** — Schadenersatz bei Körperverletzung
- **§ 6 Abs. 1 Z 9 KSchG** — Verbot des vollständigen Haftungsausschlusses bei Vorsatz und grober Fahrlässigkeit (= zwingend kein „Total-Disclaimer" möglich, deswegen Klausel „Vorsatz und grobe Fahrlässigkeit bleiben unberührt")
- **§ 1 MPG (Medizinproduktegesetz) / Verordnung (EU) 2017/745 (MDR)** — Abgrenzung „Lifestyle-App" vs. „Medizinprodukt": Die App enthält **keinen diagnostischen Anspruch**, keinen Therapiebezug, keine Behandlung von Krankheiten — sie fällt unter Lifestyle/Wellness und ist **kein** Medizinprodukt im Sinne der MDR. Die Disclaimer-Klausel „kein medizinischer Rat" ist deshalb auch eine **Abgrenzung** gegen die MDR-Geltung.

### Maßnahme

v1-AGB nach v2 portiert mit 7 Abschnitten:

1. **Geltungsbereich** — Akzeptanz durch Nutzung
2. **Kein medizinischer Rat** — explizit ausgenommen, Trainingspläne ersetzen keine Beratung. Erweitert: jetzt auch Readiness-Score, 1RM-Schätzungen und Kraft-Standards-Einstufungen explizit benannt
3. **Eigenverantwortung** — Empfehlung ärztlicher Untersuchung, Anamnesepflicht, Erweiterung um Schwangerschaft und Trainingspause
4. **Haftungsausschluss** — 5-Punkte-Liste (Verletzungen, fehlerhafte Empfehlungen, Datenverlust, Kontraindikationen, Anamnese-Fehler), erweitert um den ABGB-konformen Vorbehalt für Vorsatz/grobe Fahrlässigkeit
5. **Datenspeicherung** — Verweis auf Datenschutzerklärung
6. **Anamnesebogen** — wahrheitsgemäß, Aktualisierungspflicht
7. **Änderungen** — Vorbehalt, Ankündigung wesentlicher Änderungen im Cockpit

### Begründung der Erweiterungen gegenüber v1

- **Vorsatz/Grobe-Fahrlässigkeit-Klausel** — § 6 Abs. 1 Z 9 KSchG verbietet vollständigen Ausschluss; ohne diese Klausel wäre der gesamte Haftungsausschluss laut KSchG nichtig. Die Klausel rettet den Rest.
- **Readiness, 1RM, Kraft-Standards explizit** — diese Features kamen nach v1 dazu (Cockpit-Redesign 2026). Sie sind jetzt namentlich vom Disclaimer abgedeckt.
- **Schwangerschaft und Pause** — typische Risiko-Trigger, die in der Audit-Quelle (Wissensbasis Verletzungsprävention) ausdrücklich erwähnt werden.

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `Trainingsplaner.html` | Neue Card „Nutzungsbedingungen" in `info-section data-section="recht"`, ca. 80 Zeilen |

---

## Punkt 6 — LICENSE-Datei

### Problem laut Audit (Risiko: 🔴 Hoch)

Das Repo `DaMagicCosta/trainingsplaner-app` ist auf GitHub als **public** sichtbar, hatte aber **keine LICENSE-Datei**. Nach GitHub-ToS und Urheberrecht bedeutet das automatisch „All Rights Reserved" — andere dürfen den Code zwar ansehen und forken, aber nicht verwenden, kopieren, modifizieren oder verbreiten. Diese Rechtsunklarheit ist für ein öffentliches Repo problematisch.

### Entscheidungs-Kontext

Zwei Optionen wurden geprüft:

**Option A — Repo auf private stellen**
- Vorteil: Code-Eigentum klar geregelt
- ❌ **Blocker:** GitHub Pages funktioniert auf dem free-Tier ausschließlich mit public-Repos. Für private Repos bräuchte es einen kostenpflichtigen GitHub-Pro-Plan ($4/Monat).
- ❌ Diplomarbeit verlangt öffentliche Demonstrierbarkeit der Live-App — eine private Lösung würde den Showcase-Charakter verlieren.

**Option B — LICENSE-Datei ergänzen**
- Vorteil: Live-App bleibt öffentlich, Lizenzlage ist klar
- Wahl der Lizenz unter mehreren Optionen geprüft:
  - **MIT** — minimal, permissiv, kompatibel mit allen Dependencies (Chart.js MIT, Inter OFL, JetBrains Mono OFL), Standard auf GitHub
  - **Apache 2.0** — wie MIT, plus expliziter Patentschutz; etwas formaler
  - **CC-BY-NC-4.0** — ungeeignet für Code (Creative Commons rät selbst davon ab)
  - **AGPL-3.0** — Copyleft, würde Forks zwingen, ihre Änderungen ebenfalls offenzulegen; für ein Diplomarbeitsprojekt overkill
  - **Custom „Source Available"** — komplex, erhöht Beratungsbedarf

### Entscheidung

**MIT-Lizenz** gewählt aus drei Gründen:
1. **Dependency-Kompatibilität** — alle drei Dependencies sind permissiv (MIT/OFL), MIT ist die kleinste gemeinsame Hülle
2. **Diplomarbeits-Kontext** — Open Source mit MIT ist der Standard für studentische Showcases, signalisiert „Code zum Lernen und Wiederverwenden"
3. **Pragmatismus** — minimaler Text, keine Pflichten außer Copyright-Hinweis und Disclaimer

Zusätzlich wurde unter dem MIT-Text ein **Hinweis-Block** ergänzt, der noch einmal explizit klarstellt, dass die App keine medizinische Beratung darstellt — als „Brücke" zur eigentlichen Nutzungsbedingung in der App.

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `LICENSE` | **Neu erstellt** — MIT-Lizenz, Copyright Alexander da Costa Amaral 2026, plus Trainingshinweis |

### Was tun, falls die Wahl später revidiert werden soll

Die LICENSE-Datei kann jederzeit gegen eine andere Lizenz getauscht werden. Wichtig: **rückwirkend** kann das nicht für bereits geforkte Versionen gelten. Wer den Code bis zur Änderung gepullt hat, behält die alten Rechte. Eine Lizenzänderung wirkt nur ab Commit-Datum.

---

## „SOLLTE"-Punkte aus dem Audit (Best Practice)

### Punkt 7 — Kraft-Standards-Quelle in Credits ✅ erledigt

Im „Über"-Tab wurde im Credits-Block eine neue Zeile ergänzt:

> **Kraft-Standards** — Bewertungs-Ratios basierend auf NSCA/ACSM-Richtwerten (Strength & Conditioning Journal, ACSM Guidelines for Exercise Testing & Prescription)

Damit ist transparent, woher die Bewertungs-Ratios kommen, die im Tab „Fortschritt" für die Standards-AT-Sub-View genutzt werden.

### Punkt 8 — Erste-Nutzung-Hinweis auf Datenspeicherung ⏸ aufgeschoben

Wird gemeinsam mit dem ohnehin geplanten Onboarding-Flow (siehe `CLAUDE.md` „Ausstehende Bau-Etappen", Punkt 4) umgesetzt. Bis dahin ist die Information über die Datenschutzerklärung im Info-Tab erreichbar.

### Punkt 9 — Übungsdatenbank-Herkunft präzisieren ⏸ aufgeschoben

Aktuelle Formulierung: „Studio-Set + Calisthenics-Set aus Original-App portiert". Sollte später um einen Hinweis ergänzt werden, dass die Inhalte aus der WIFI-Ausbildung und der Diplomarbeit Hendrik Tretter stammen — das ist im darüberliegenden Credit „Fachliche Basis" bereits gesagt, könnte aber direkter verknüpft werden.

---

## Zusätzliche Änderungen (außerhalb des Audit-Katalogs)

### Credits im „Über"-Tab — Lokalisierungs-Hinweise

Da die externen Dependencies jetzt lokal eingebunden sind, wurde die Credits-Zeile entsprechend ergänzt:

| Vorher | Nachher |
|---|---|
| `Chart.js (MIT) · Inter (OFL) · JetBrains Mono (OFL)` | `Chart.js 4.4.7 (MIT, lokal) · Inter (OFL 1.1, lokal) · JetBrains Mono (OFL 1.1, lokal)` |

Außerdem im App-Block:

| Vorher | Nachher |
|---|---|
| `Chart.js 4.4.7` | `Chart.js 4.4.7 (lokal eingebunden)` |

Damit ist auch im UI sichtbar, dass keine CDN-Requests stattfinden.

---

## Verifikations-Checkliste

Alle folgenden Tests wurden am 10.04.2026 durchgeführt oder sind durch den User vor Deploy zu wiederholen:

- [x] **Grep-Test:** `Trainingsplaner.html` enthält keine Treffer mehr für `fonts.googleapis|fonts.gstatic|jsdelivr|cdn\.` (10.04.2026, 17:35)
- [ ] **Network-Tab-Test (durch User):** Beim Laden der App im Live Server kein einziger Request an externe CDNs
- [ ] **Schrift-Rendering-Test (durch User):** Inter und JetBrains Mono werden korrekt in allen Weights gerendert (Body, Buttons, Code-Spans)
- [ ] **Charts-Test (durch User):** Im Tab „Fortschritt" rendern alle Charts korrekt (1RM, Volumen, Block-Vergleich)
- [x] **Recht-Sektion-Render-Test:** Sub-Nav „Recht" funktioniert, alle drei Cards (Impressum, Datenschutz, Nutzungsbedingungen) sichtbar — bestätigt durch Screenshot 18:43
- [ ] **Mobile-Test (durch User):** Sub-Nav scrollt horizontal mit 8 Buttons (Profil, Anamnese, Vereinbarung, Einstellungen, Hilfe, Daten, Recht, Über)
- [ ] **Theme-Test (durch User):** Recht-Sektion in allen 4 Themes (Midnight, Ember, Teal, Pastell) korrekt formatiert

---

## Was jetzt im Repo committed gehört

Neue Dateien:
- `LICENSE`
- `css/fonts.css`
- `css/fonts/inter-latin-var.woff2`
- `css/fonts/jetbrains-mono-latin-var.woff2`
- `js/lib/chart.umd.min.js`
- `Notizen/2026-04-10_rechtsaudit-original.md` (Belegspur Original)
- `Notizen/2026-04-10_rechtsaudit-umsetzung.md` (diese Datei)

Geänderte Dateien:
- `Trainingsplaner.html` — Header-Imports umgestellt, Sub-Nav erweitert, Recht-Sektion eingefügt, Credits aktualisiert

Empfohlene Commit-Nachricht:

```
Recht: DSGVO-Compliance + Impressum/Datenschutz/AGB

- Google Fonts und Chart.js lokal hosten (LG München I, 20.01.2022)
- Neue Sub-Sektion Info → Recht mit Impressum, Datenschutzerklärung
  und Nutzungsbedingungen (v1 portiert + DSGVO-konform erweitert)
- LICENSE (MIT) ergänzt
- Credits: lokale Hosting-Hinweise + NSCA/ACSM-Quelle
- Belegspur in Notizen/2026-04-10_rechtsaudit-*.md
```

---

## Quellen-Übersicht (zur Belegung)

### Rechtsnormen
- **DSGVO** (Verordnung (EU) 2016/679) — Art. 6, 7, 9, 12, 13, 15–22, 77
- **§ 5 ECG** — E-Commerce-Gesetz Österreich
- **§ 25 MedienG** — Mediengesetz Österreich
- **§ 5 DDG** — Digitale-Dienste-Gesetz Deutschland (seit 14.05.2024)
- **§§ 1295, 1325 ABGB** — Allgemeines Bürgerliches Gesetzbuch Österreich
- **§ 6 Abs. 1 Z 9 KSchG** — Konsumentenschutzgesetz Österreich
- **MPG / Verordnung (EU) 2017/745 (MDR)** — Medizinprodukte-Abgrenzung

### Urteile / Behörden
- **LG München I, 20.01.2022, Az. 3 O 17493/20** — Google-Fonts-Urteil
- **EuGH C-311/18, 16.07.2020 (Schrems II)** — USA-Datentransfer
- **dsb.gv.at** — Österreichische Datenschutzbehörde (Beschwerdestelle)

### Lizenzen der Dependencies
- **Chart.js 4.4.7** — MIT License — https://github.com/chartjs/Chart.js/blob/master/LICENSE.md
- **Inter** — SIL Open Font License 1.1 — https://github.com/rsms/inter/blob/master/LICENSE.txt
- **JetBrains Mono** — SIL Open Font License 1.1 — https://github.com/JetBrains/JetBrainsMono/blob/master/OFL.txt

### Audit-Bezugsquellen
- **Original-Audit:** [`2026-04-10_rechtsaudit-original.md`](2026-04-10_rechtsaudit-original.md) (Ductor / Claude-Subagent, 10.04.2026)
- **Wissensbasis Trainingsplaner:** `Wissensbasis/recht_*.md` (DSGVO, Impressum, Lizenzen, Medizinprodukt, BFSG, Versicherung, Haftung) — die Vorlage für das Audit-Briefing
- **Wiki-Synthese (geplant):** `08_Obsidian/Alex Wiki/raw/trainingsplaner/recht_*.md`

---

## Verbleibender Backlog (aus dem Audit nicht abgedeckt)

Diese Punkte stehen weiter im Wiki-Todo (`08_Obsidian/Alex Wiki/todos.md`) und in `CLAUDE.md` „Ausstehende Bau-Etappen":

- **Onboarding-Pflicht** — Anamnese + Vereinbarung als Pflichtschritte beim Profil-Anlegen, mit explizitem Einwilligungs-Klick (verbessert die DSGVO-Belegspur „Einwilligung wurde aktiv erteilt")
- **Demo als Import statt Pflicht** — App startet leer, keine Standard-Demo-Daten (verringert die Datenschutz-Reibung beim ersten Start)
- **Anamnese editierbar** — aktuell read-only Demo-Daten, muss bearbeitbar werden für echte Nutzung
- **Vereinbarung-Widerruf-Flow** — aktuell Toast-Stub
- **Cookie-/Speicher-Hinweis-Banner** beim ersten Start — optional, weil keine Cookies und localStorage technisch notwendig ist; aber UX-freundlich

---

## Verantwortlich für die Umsetzung

Alexander da Costa Amaral, mit Unterstützung von Claude Code (Opus 4.6, 1M context) am 10.04.2026 zwischen ca. 17:25 und 18:45 Uhr.

Bei Rückfragen oder Audit-Anforderungen: Diese Datei zusammen mit dem Original-Audit (`2026-04-10_rechtsaudit-original.md`) und den entsprechenden Git-Commits aus dem Repo `DaMagicCosta/trainingsplaner-app` vorlegen.

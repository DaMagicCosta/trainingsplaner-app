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

Alexander da Costa Amaral, mit Unterstützung von Claude Code (Opus 4.6, 1M context) am 10.04.2026 zwischen ca. 17:25 und 18:45 Uhr (Hauptarbeit) sowie 19:00 und 19:45 Uhr (Nachtrag, siehe unten).

Bei Rückfragen oder Audit-Anforderungen: Diese Datei zusammen mit dem Original-Audit (`2026-04-10_rechtsaudit-original.md`) und den entsprechenden Git-Commits aus dem Repo `DaMagicCosta/trainingsplaner-app` vorlegen.

---

## Nachtrag — Aktive DSGVO-Einwilligung (Welcome-Modal)

**Datum:** 10.04.2026, ca. 19:00–19:45 Uhr
**Auslöser:** Nach der Hauptumsetzung wurde erkannt, dass die in der Datenschutzerklärung beschriebene Einwilligung *nur passiv* war („durch Nutzung der App und Anlegen eines Profils"). Bei besonderen Datenkategorien nach **Art. 9 DSGVO** (Anamnese: Vorerkrankungen, Medikamente) ist nach herrschender Meinung eine **ausdrückliche** Einwilligung erforderlich (Art. 9 Abs. 2 lit. a DSGVO). Eine bloße passive Einwilligung wäre angreifbar.

### Maßnahme

Beim ersten App-Aufruf (kein gültiger `tpv2_consent_v1`-Eintrag) wird ein **blockierendes Welcome-Modal** angezeigt. Der Nutzer muss eine Checkbox ankreuzen *und* einen Button klicken — beides ist nötig, um die App freizuschalten. Damit ist die Einwilligung **bewusst, aktiv und dokumentiert**.

### Was im Modal steht

- **Headline:** „Bevor du loslegst — drei Dinge"
- **Drei Punkte (Icons + Kurztext):**
  1. „Alles bleibt auf deinem Gerät" (lokale Speicherung, keine CDNs, keine Cookies)
  2. „Gesundheitsdaten sind besondere Daten" (Art. 9 DSGVO explizit benannt)
  3. „Kein Ersatz für ärztlichen Rat" (Eigenverantwortung, Disclaimer)
- **Klappbarer Detail-Bereich** „Datenschutz im Detail" mit den DSE-Kernpunkten (verarbeitete Daten, Speicherorte, Rechtsgrundlage, externe Dienste = keine, Speicherdauer, Betroffenenrechte, Verweis auf Info → Recht für Volltexte)
- **Pflicht-Checkbox** „Ich habe Datenschutzerklärung und Nutzungsbedingungen gelesen und willige in die lokale Verarbeitung meiner Daten — einschließlich Gesundheitsdaten nach Art. 9 DSGVO — ein."
- **Akzeptieren-Button** (disabled, bis die Checkbox gesetzt ist)
- **Footer:** Stand-Datum der Texte + Hinweis, dass die Einwilligung jederzeit widerrufbar ist

### Datenmodell des Consent-Eintrags

```json
{
  "acceptedAt": "2026-04-10T19:30:00.000Z",
  "dseVersion": "2026-04-10",
  "agbVersion": "2026-04-10"
}
```

Gespeichert unter `localStorage.tpv2_consent_v1`. Die beiden Versionen sind feste Konstanten in `js/consent.js` (`DSE_VERSION`, `AGB_VERSION`). Bei Änderung der Rechtstexte (etwa wenn neue Features in den Disclaimer aufgenommen werden) müssen diese Konstanten erhöht werden — `hasValidConsent()` prüft, ob der gespeicherte Consent zu den aktuellen Versionen passt. Wenn nicht, wird beim nächsten Aufruf das Modal erneut angezeigt — der Nutzer muss die *aktualisierten* Texte nochmals akzeptieren. Das ist die DSGVO-konforme Behandlung von Änderungen an einer einwilligungsbasierten Verarbeitung.

### Widerruf-Mechanismus

In der Datenschutzerklärung wurde Abschnitt **8 „Deine Einwilligung"** ergänzt. Dort steht dynamisch:

- Datum + Uhrzeit der Einwilligung (formatiert „DD.MM.YYYY um HH:MM Uhr")
- Datenschutz-Stand-Version
- Nutzungsbedingungen-Stand-Version
- Button **„Einwilligung zurückziehen"**

Beim Klick auf den Button erscheint eine zweistufige Bestätigung (Browser-`confirm()`):
1. „Einwilligung wirklich zurückziehen?" → ja/nein
2. „Auch alle lokal gespeicherten Trainingsdaten löschen?" → ja/nein

Bei „ja" auf Schritt 2 werden alle `tpv2_*`-Schlüssel aus dem localStorage entfernt (Profil, Sessions, Pläne, Einstellungen, UI-State). Anschließend wird die Seite neu geladen — beim nächsten Init greift `initConsent()` und das Welcome-Modal erscheint erneut.

### Begründung der Implementierungs-Details

- **Checkbox + Button (statt nur Button):** Eine reine Button-Klick-Aktion könnte als „beiläufig" interpretiert werden. Die Checkbox-Pflicht zwingt zu einem zweiten, bewussten Handlungsschritt — das ist der Standard für ausdrückliche Einwilligung im EU-Raum (vgl. Cookie-Banner-Designs nach EuGH C-673/17 „Planet49").
- **Esc und Click-Outside blockiert:** Ein einfaches Wegklicken wäre keine Akzeptanz, sondern ein Umgehen. Der Modal-Handler in `consent.js` blockiert Esc explizit (`addEventListener('keydown', ..., true)` mit `preventDefault()`). Click-Outside ist nicht implementiert (kein Handler auf dem Backdrop). Die einzige Aktion, die das Modal entfernt, ist der Akzeptieren-Button mit gesetzter Checkbox.
- **Versionierung der Texte:** Damit nach Änderungen ein erneuter Consent erzwungen werden kann (siehe oben).
- **Splash-Skip bei Erstaufruf:** Der Splash-Screen (Mindmap-Animation, Portrait, Glow) wird übersprungen, wenn kein Consent vorliegt — sonst rivalisieren zwei Begrüßungs-Overlays. `splash.js` checkt `localStorage.tpv2_consent_v1` und entfernt sich selbst, wenn keiner da ist. Bei späteren Aufrufen (mit Consent) läuft der Splash wieder normal.
- **Theme wird vor Modal angewendet:** `applyTheme()` läuft vor dem `await initConsent()` in der Init-Sequenz, damit das Modal sofort im richtigen Look (Midnight/Ember/Teal/Pastell) erscheint. Sonst würde es im Default-Theme aufblitzen, bevor das gespeicherte Theme greift.

### Betroffene Dateien (Nachtrag)

| Datei | Änderung |
|---|---|
| `js/consent.js` | **Neu** — 130 Zeilen: Konstanten, getConsent, hasValidConsent, setConsent, clearConsent, showWelcomeModal, initConsent, formatConsentDate, renderConsentInfo, revokeConsent |
| `css/welcome.css` | **Neu** — Modal-Styling, blockierender Backdrop, Drei-Punkte-Layout, klappbarer Detail-Bereich, Checkbox-Card, Akzeptieren-Button, Mobile-Anpassungen |
| `Trainingsplaner.html` | Welcome-Modal-Markup direkt nach `<body>`, neue CSS-Einbindung `css/welcome.css`, Datenschutzerklärung Abschnitt 8 „Deine Einwilligung" mit Datum-Anzeige + Widerrufs-Button |
| `js/app.js` | Init-Sequenz in async IIFE gewrappt, `await initConsent()` als Gate vor allen weiteren Inits, `renderConsentInfo()` nach Akzeptanz |
| `js/splash.js` | Skip-Bedingung: wenn kein `tpv2_consent_v1` existiert, Splash überspringen (Welcome übernimmt die Begrüßung) |
| `js/init-handlers.js` | Handler für `consentRevokeBtn`: zweistufige Confirm-Bestätigung → `revokeConsent(alsoData)` |

### Rechtsgrundlagen-Bezug

- **Art. 4 Nr. 11 DSGVO** — Definition „Einwilligung": *„unmissverständlich abgegebene Willensbekundung in Form einer Erklärung oder einer sonstigen eindeutigen bestätigenden Handlung"*. Eine Checkbox + Button-Klick erfüllt das Kriterium der „eindeutigen bestätigenden Handlung".
- **Art. 7 Abs. 1 DSGVO** — *„Beruht die Verarbeitung auf einer Einwilligung, muss der Verantwortliche nachweisen können, dass die betroffene Person in die Verarbeitung […] eingewilligt hat."* → Genau dafür ist der Timestamp im Consent-Eintrag.
- **Art. 7 Abs. 3 DSGVO** — *„Die betroffene Person hat das Recht, ihre Einwilligung jederzeit zu widerrufen. […] Der Widerruf muss so einfach wie die Erteilung sein."* → Der Widerrufs-Button in der DSE-Sektion 8 ist genauso direkt erreichbar wie das Welcome-Modal.
- **Art. 9 Abs. 2 lit. a DSGVO** — *„Die betroffene Person hat in die Verarbeitung der genannten personenbezogenen Daten für einen oder mehrere festgelegte Zwecke ausdrücklich eingewilligt"*. → Die explizite Erwähnung „einschließlich Gesundheitsdaten nach Art. 9 DSGVO" in der Checkbox-Beschriftung deckt diese ausdrückliche Einwilligung ab.
- **EuGH C-673/17 „Planet49"** (01.10.2019) — Klarstellung, dass voreingestellte Häkchen keine wirksame Einwilligung sind. Die Checkbox in unserem Modal ist initial **leer** (`checkbox.checked = false` in `showWelcomeModal()`), der Akzeptieren-Button ist **disabled**, bis der Nutzer aktiv das Häkchen setzt.

### Verifikation

- [ ] **First-Run-Test:** Im Inkognito-Browser oder nach `localStorage.clear()` → App aufrufen → Welcome-Modal erscheint, Akzeptieren-Button initial disabled, nach Checkbox-Aktivierung enabled, nach Klick verschwindet das Modal und der `tpv2_consent_v1`-Eintrag ist im DevTools → Application → Local Storage sichtbar
- [ ] **Reload-Test:** Seite neu laden → kein Modal mehr (gültiger Consent vorhanden), App startet normal
- [ ] **Esc-Block-Test:** Modal offen → Esc drücken → Modal bleibt
- [ ] **Click-Outside-Test:** Modal offen → auf den Backdrop klicken → Modal bleibt
- [ ] **Detail-Klapp-Test:** „Datenschutz im Detail" auf- und zuklappen → funktioniert ohne State-Verlust
- [ ] **DSE-Anzeige-Test:** Tab Info → Recht → Datenschutzerklärung Abschnitt 8 → Datum + Versionen werden korrekt angezeigt
- [ ] **Widerrufs-Test:** Button „Einwilligung zurückziehen" → 1. Confirm „wirklich?" → 2. Confirm „auch Daten löschen?" → Reload → Welcome-Modal erscheint erneut, Daten je nach Wahl gelöscht oder erhalten
- [ ] **Versions-Bump-Test:** In `js/consent.js` `DSE_VERSION` auf `2026-04-11` ändern → Reload → Modal erscheint erneut, weil `hasValidConsent()` die Versionsdiskrepanz erkennt

### Was offen bleibt

- **Kein eigenes Modal für die Bestätigungen:** Aktuell `confirm()` aus dem Browser. Funktional korrekt, aber stilbruch. Für ein späteres Polish sollte ein `tp-modal`-basiertes Bestätigungs-Dialog gebaut werden. Der Inhalt der Confirm-Texte ist aber juristisch ausreichend.
- **Mehrsprachigkeit:** Die App ist deutschsprachig, das Modal ebenfalls. Falls später eine englische Version kommt, müssen DSE/AGB und Modal-Texte separat versioniert werden.
- **Consent-Historie:** Aktuell wird nur der letzte Consent gespeichert. Bei einem späteren Audit könnte interessant sein, *alle* früheren Akzeptanzen zu kennen (z. B. wann der Nutzer eine Versions-Aktualisierung akzeptiert hat). Das wäre ein eigener Schlüssel `tpv2_consent_history_v1: [{...}, {...}]` und kann nachgereicht werden, falls verlangt.

### Commit (geplant)

```
Recht: Aktive DSGVO-Einwilligung via Welcome-Modal

- Neues Modul js/consent.js (Konstanten, Init, Modal-Handler, Widerruf)
- Welcome-Modal mit Pflicht-Checkbox + Button (Art. 4 Nr. 11 / Art. 9
  Abs. 2 lit. a DSGVO — ausdrueckliche Einwilligung)
- Init-Sequenz in app.js: await initConsent() als Gate
- Splash skipt bei Erstaufruf (Welcome uebernimmt)
- DSE Abschnitt 8 "Deine Einwilligung" mit Datum + Widerrufs-Button
- Versionierung der Rechtstexte (DSE_VERSION, AGB_VERSION) — bei
  inhaltlichen Aenderungen erhoehen, dann erzwingt das Modal eine
  erneute Akzeptanz
- Belegspur: Notizen/2026-04-10_rechtsaudit-umsetzung.md (Nachtrag)
```

---

## Nachtrag 2 — v1-Legacy-Cleanup im localStorage

**Datum:** 11.04.2026
**Auslöser:** Beim Verifikations-Test des Welcome-Modals (Punkt 8 der Checkliste, Screenshot 20:09) wurde im DevTools-Local-Storage ein alter Schlüssel `trainings_planer_active_tab` ohne `tpv2_`-Prefix entdeckt. Recherche im v1-Archiv (`Trainingsplaner_v1_archiv.html`) ergab fünf weitere Schlüssel der Vorgängerversion, die im Browser eines früheren v1-Nutzers liegen geblieben sein können.

### Problem

Die Datenschutzerklärung listet in Abschnitt 2 nur Schlüssel mit `tpv2_*`-Prefix als verarbeitete Daten. Wenn im Browser eines Nutzers zusätzlich noch v1-Schlüssel herumliegen, ist die DSE-Liste unvollständig — formal eine Lücke in der Belegspur. Die saubere Lösung ist, diese Schlüssel beim App-Start automatisch zu entfernen.

### Maßnahme

1. Neue Funktion `_cleanupLegacyKeys()` in `js/state.js` mit expliziter Liste von 6 Legacy-Schlüsseln:
   - `trainingsplaner_profiles` (v1 PROFILES_KEY)
   - `trainingsplaner_active` (v1 ACTIVE_PROFILE_KEY)
   - `trainingsplaner_sync_url` (v1 SYNC_URL_KEY, Drive-Sync)
   - `trainingsplaner_vault` (v1 TP_VAULT_KEY, AES-Vault)
   - `trainingsplaner_verify` (v1 TP_VERIFY_KEY, PIN-Hash)
   - `trainings_planer_active_tab` (ältere Variante mit Underscore)
2. Aufruf in `js/app.js` ganz am Anfang der Init-Sequenz, **vor** `applyTheme()` und vor `initConsent()` — damit der Browser-Speicher schon sauber ist, bevor der Nutzer die DSE liest.
3. Logging über `console.log('[Cleanup] v1-Legacy-Schlüssel entfernt: …')` — nur wenn tatsächlich etwas gelöscht wurde, sonst still.
4. **Explizite Liste statt Prefix-Filter:** Ein generischer Filter wie „alle Schlüssel ohne `tpv2_`-Prefix löschen" wäre gefährlich, weil er auch Schlüssel anderer Web-Apps auf derselben Origin treffen würde. Die explizite Liste ist sicher und nachvollziehbar.

### Belegspur in der DSE

Abschnitt 2 der Datenschutzerklärung wurde um folgenden Hinweis ergänzt:

> *„Hinweis: Schlüssel früherer Versionen der App (Präfix `trainingsplaner_*`) werden beim Start automatisch entfernt, damit keine veralteten Daten ohne Erklärung im Browser verbleiben."*

Außerdem wurde `tpv2_consent_v1` in die Liste der Speicherorte aufgenommen — der war bei der ursprünglichen DSE noch nicht erwähnt, weil das Welcome-Modal erst im Nachtrag 1 gebaut wurde.

### Versions-Bump

Da sich die DSE inhaltlich geändert hat (auch wenn nur klarstellend), wurde nach der Dauerhaft-Regel aus `CLAUDE.md` der `DSE_VERSION` in `js/consent.js` von `2026-04-10` auf `2026-04-11` erhöht. Das hat den gewünschten Nebeneffekt, dass beim nächsten Aufruf das Welcome-Modal erneut erscheint und der Nutzer die aktualisierte DSE-Version aktiv akzeptiert. Der Mechanismus ist damit auch praktisch verifiziert.

`AGB_VERSION` bleibt auf `2026-04-10` — die Nutzungsbedingungen sind unverändert.

### Betroffene Dateien (Nachtrag 2)

| Datei | Änderung |
|---|---|
| `js/state.js` | Neue Funktion `_cleanupLegacyKeys()` mit Schlüsselliste, Export ergänzt |
| `js/app.js` | Import `_cleanupLegacyKeys`, Aufruf ganz am Anfang vor `applyTheme()` |
| `Trainingsplaner.html` | DSE Abschnitt 2: `tpv2_consent_v1` in Schlüsselliste, Hinweis-Satz zum v1-Cleanup, Stand-Datum auf 11.04.2026 |
| `js/consent.js` | `DSE_VERSION = '2026-04-11'` |

### Verifikation (durch User, 10.04.2026 abends)

- **Punkt 4 (Esc-Block):** ✅ Modal bleibt
- **Punkt 5 (Click-Outside-Block):** ✅ Modal bleibt
- **Punkt 8 (Local Storage Persistenz):** ✅ `tpv2_consent_v1` mit korrektem JSON sichtbar (Screenshot 20:09)
- **Punkt 9 (DSE Sektion 8 Anzeige):** ✅ Datum + Versionen werden korrekt formatiert (Screenshot 20:09)
- **Punkt 10 (Reload-Test):** ✅ Kein Modal beim normalen Reload
- **Punkt 11 (Widerrufs-Test):** ✅ Beide Confirms erscheinen, Reload, Modal wieder

### Was offen bleibt

Die ToDo-Liste im Wiki (`08_Obsidian/Alex Wiki/todos.md`) führt weiterhin folgende Folge-Items aus dem Audit:

- **🔴 Onboarding + Anamnese/Vereinbarung** — Anamnese als read-only Demo-Daten ist substantiell unvollständig; die AGB-Klausel „Anamnesebogen muss wahrheitsgemäß ausgefüllt werden" ist solange nicht erfüllbar
- **🔴 Demo als Import statt Pflicht** — App startet aktuell mit Alexander-Demo-Profil, sollte leer starten
- **🟡 Vereinbarung-Widerruf-Flow** — aktuell Toast-Stub

---

## Nachtrag 3 — Etappe A: Anamnese editierbar

**Datum:** 11.04.2026
**Auslöser:** Risiko 2 aus der Audit-Folge-Analyse: Die Anamnese-Sektion zeigte statische Demo-Daten („Gut", „Nicht benötigt", „Keine") und die Buttons „Anamnese aktualisieren" / „Vorherige Versionen" waren Toast-Stubs. Die Klausel in den Nutzungsbedingungen Abschnitt 6 verlangt aber: *„Der Anamnesebogen muss bei Profilerstellung wahrheitsgemäß ausgefüllt werden."* — solange kein Eingabe-Mechanismus existiert, ist diese Klausel substantiell leer und ein Tester kann sich bei Rückfragen darauf berufen.

### Maßnahme

Vollständiges Anamnese-Bearbeitungs-System aufgesetzt:

1. **Datenmodell** in `js/features/anamnese-edit.js` definiert: `state.profile.anamnesis = { version, confirmedAt, general, clearance, conditions[], otherConditions, currentPain, painDetails, surgery, surgeryDetails, medication, medicationDetails, experience, restricted }`. Mit `ANAMNESIS_VERSION = 1` für künftige Schema-Migrationen.
2. **Default-Werte** über `getDefaultAnamnesis()` — gibt ein leeres, nicht-bestätigtes Objekt zurück (`confirmedAt: null` markiert „noch nicht ausgefüllt"). Migration: Wenn ein Profil ohne `anamnesis`-Feld geladen wird, wird beim ersten Edit-Open `getDefaultAnamnesis()` zugewiesen.
3. **Anamnese-Edit-Modal** als `tp-modal` analog zum Profil-Edit-Modal. Form-Felder nach `tp-form-group` / `tp-form-grid` / `tp-field`-Pattern: 5 Sektionen entsprechend der read-only-Anzeige. Selects für Enums (Gesundheitszustand, Freigabe, Erfahrungslevel, Ja/Nein), Toggleable Chips für Mehrfach-Vorerkrankungen, Textareas für Freitext-Felder. Unten eine Pflicht-Bestätigungs-Checkbox („Ich bestätige, dass ich diese Angaben wahrheitsgemäß gemacht habe …"), die den Speichern-Button erst aktiviert. Esc und Click-Outside schließen das Modal über das bestehende globale tp-modal-System.
4. **Render-Funktion `renderAnamnese(profile)`** in `js/features/anamnese-edit.js`: Liest `profile.anamnesis` und füllt alle 12 read-only-Anzeige-IDs (`anamGeneral`, `anamClearance`, `anamConditions` …). Bei `confirmedAt: null` wird Status-Badge auf grau („○ Noch nicht ausgefüllt") gesetzt, alle Antwort-Felder zeigen „— noch nicht ausgefüllt", Bestätigungs-Box ist ausgeblendet. Bei vorhandenem Consent: grünes Badge mit formatiertem Datum, Antworten via Label-Maps in lesbare deutsche Form übersetzt, Conditions als `info-chip-muted`-Chips gerendert.
5. **Save-Logik `saveAnamneseEdit()`**: Sammelt alle Form-Werte, schreibt sie zurück nach `state.profile.anamnesis` mit aktuellem `confirmedAt`-Timestamp, ruft `_saveProfile()` zur localStorage-Persistierung auf, ruft anschließend `renderAnamnese()` für sofortiges UI-Refresh, schließt das Modal, zeigt Success-Toast. Wenn die Bestätigungs-Checkbox nicht aktiviert ist: Toast „Bitte die Bestätigungs-Checkbox aktivieren" und kein Save.
6. **Init-Handler in `init-handlers.js`**: Toast-Stub für `anamneseUpdateBtn` durch `openAnamneseEditModal` ersetzt. Conditions-Chips bekommen Click-Toggle für `.active`-Klasse. `aemConfirm`-Checkbox steuert `aemSaveBtn.disabled`. `aemSaveBtn`-Click ruft `saveAnamneseEdit`.
7. **HTML-Restruktur** der Anamnese-Sektion in `Trainingsplaner.html`: Alle 12 Antwort-Felder bekamen IDs, statische Demo-Inhalte wurden durch Platzhalter („—") ersetzt, Status-Zeile bekam dynamische IDs (`anamStatusBadge`, `anamValidUntil`), Bestätigungs-Box ist initial mit `display:none` versteckt und wird nur gezeigt, wenn `confirmedAt` gesetzt ist. Neue CSS-Klasse `.info-pill-muted` (grauer Pill für „noch nicht ausgefüllt") in `info.css` ergänzt.

### Begründung der Einzel-Entscheidungen

- **Pflicht-Bestätigungs-Checkbox im Modal:** Wie beim Welcome-Modal verlangt die Bestätigung einen aktiven, bewussten Klick — kein „aus Versehen Speichern". Das ist insbesondere für die DSGVO-Belegspur wichtig: Bei Gesundheitsdaten nach Art. 9 DSGVO muss die Wahrheitsgemäßheit aktiv erklärt werden. Ein bloßer Speichern-Klick wäre dafür schwächer.
- **Konstanten-basierte Werte (Enums):** Die Felder `general`, `clearance`, `experience`, `currentPain`, `surgery`, `medication` sind Enums mit deutschen Anzeigetexten in Label-Maps. Dadurch ist eine spätere Internationalisierung trivial — nur die Maps austauschen, nicht die Datenwerte.
- **`confirmedAt: null` als „nicht ausgefüllt"-Marker:** Statt eines separaten `isConfirmed`-Booleans nutzt die Logik die Existenz des Timestamps. Das spart ein Feld und verhindert inkonsistente Zustände („confirmed: true, aber confirmedAt: null"). `hasConfirmedAnamnesis(profile)` als Helper.
- **`validUntil` berechnet, nicht gespeichert:** 1 Jahr nach `confirmedAt`, dynamisch berechnet via `calcValidUntil()`. Bei zukünftiger Änderung der Gültigkeitsdauer (z. B. auf 6 Monate) reicht eine Code-Änderung, keine Daten-Migration.
- **Demo-Profile bleiben ohne `anamnesis`:** Die JSON-Demo-Profile (`Trainingsplaner_Max_Mustermann_Demo.json`, `Trainingsplaner_Julia_Demo.json`) haben kein `anamnesis`-Feld. Das ist gewollt: Beim Laden zeigt die App „Noch nicht ausgefüllt", was der korrekte UX-Zustand für ein Tester-Demoprofil ist. Wenn der Tester die Anamnese ausfüllt, wird sie ans Demo-Profil drangehängt — bei einem Demo-Reset ist sie weg, was die saubere Erwartung ist.
- **Versionierung über `ANAMNESIS_VERSION = 1`:** Bei späteren Schema-Änderungen (z. B. wenn ein neues Feld dazukommt oder ein bestehendes Feld umstrukturiert wird) kann die Version erhöht werden, und beim Laden eines alten Profils kann eine Migration laufen. Aktuell noch nicht nötig, aber als Fundament eingebaut.

### Verbindung zur Compliance-Schicht

Mit Etappe A ist die AGB-Klausel **Abschnitt 6 „Anamnesebogen"** erstmals erfüllbar:

> *„Der Anamnesebogen muss bei Profilerstellung wahrheitsgemäß ausgefüllt werden. Bei Änderungen des Gesundheitszustands ist eine Aktualisierung verpflichtend. Vorherige Versionen bleiben zur Dokumentation erhalten."*

- ✅ **Wahrheitsgemäß ausfüllen** — Pflicht-Checkbox mit Wahrheits-Erklärung im Modal
- ✅ **Aktualisierung verpflichtend** — „Aktualisieren"-Button funktional, jeder Save schreibt einen neuen `confirmedAt`-Timestamp
- ⏳ **Vorherige Versionen bleiben erhalten** — *noch nicht implementiert*. Aktuell wird der alte Stand beim Save überschrieben. Eine Historie würde einen separaten Schlüssel `tpv2_anamnesis_history_v1` brauchen, ähnlich wie für den Consent geplant. → Folge-ToDo.

Die Datenschutzerklärung (Abschnitt 2) ist nicht betroffen, da die Anamnese-Daten unter `tpv2_profile_data` verschachtelt persistiert werden — sie sind also bereits Teil des dort erwähnten Profil-Objekts.

### Betroffene Dateien (Nachtrag 3)

| Datei | Änderung |
|---|---|
| `js/features/anamnese-edit.js` | **Neu** — 240 Zeilen: Datenmodell, Label-Maps, getDefaultAnamnesis, hasConfirmedAnamnesis, formatDate, calcValidUntil, renderAnamnese, openAnamneseEditModal, closeAnamneseEditModal, saveAnamneseEdit |
| `Trainingsplaner.html` | Anamnese-Sektion restrukturiert (12 ID-Felder, Platzhalter statt Demo-Inhalte, Status-Badge dynamisch, Bestätigungs-Box `display:none` initial), neues `anamneseEditModal` als tp-modal mit 5 Form-Sektionen + Pflicht-Bestätigungs-Checkbox |
| `js/pages/info.js` | Import `renderAnamnese`, Aufruf in `renderInfo(profile)` |
| `js/init-handlers.js` | Import `openAnamneseEditModal` + `saveAnamneseEdit`, Toast-Stub durch echtes Modal ersetzt, Chip-Toggle-Handler, Confirm-Checkbox-Handler, Save-Button-Handler |
| `css/pages/info.css` | Neue `.info-pill-muted`-Klasse (grauer Pill für „noch nicht ausgefüllt") |

### Verifikation (durch User)

- [ ] **First-Run-Test:** Tab Info → Anamnese → Status zeigt „○ Noch nicht ausgefüllt", alle Antwortfelder zeigen Platzhalter, Bestätigungs-Box ist nicht sichtbar
- [ ] **Edit-Open:** Klick auf „Anamnese aktualisieren" → Modal öffnet sich, Felder enthalten Default-Werte (Gut / Nicht benötigt / Beginner / Nein-Selects), Conditions-Chips alle inaktiv
- [ ] **Conditions-Chips:** Mehrere Chips anklicken → werden teal markiert (`.active`-Klasse)
- [ ] **Save ohne Checkbox:** Speichern-Button bleibt grau (disabled)
- [ ] **Save mit Checkbox:** Checkbox setzen → Speichern-Button wird aktiv → klicken → Modal schließt, Toast „✓ Anamnese gespeichert", Anamnese-Sektion zeigt grünen Status mit Datum, Antwortfelder mit eingegebenen Werten, Conditions als Chips
- [ ] **Persistenz:** F5 → Anamnese bleibt erhalten
- [ ] **Edit-Reopen:** Modal erneut öffnen → vorherige Werte werden geladen, ausgewählte Conditions sind markiert
- [ ] **Esc-Close:** Modal offen → Esc → Modal schließt ohne Save
- [ ] **Backdrop-Close:** Modal offen → außerhalb klicken → Modal schließt ohne Save

### Was offen bleibt (für Etappe B/C/D)

- **Vorherige Versionen** der Anamnese aufbewahren (Historie) — Folge-ToDo, AGB-konforme Vollendung von Abschnitt 6
- **Vereinbarung editierbar** + Bestätigungs-Mechanismus (Etappe B)
- **Onboarding-Wizard** beim Erst-Profilanlegen (Etappe C) — Welcome-Modal → Stammdaten → Anamnese (jetzt verfügbar) → Vereinbarung
- **Demo als Import statt Pflicht** (Etappe D)

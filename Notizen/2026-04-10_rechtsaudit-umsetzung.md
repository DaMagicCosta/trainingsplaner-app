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

- ~~**Vorherige Versionen** der Anamnese aufbewahren (Historie)~~ — **erledigt im Nachtrag 4** (siehe unten)
- **Vereinbarung editierbar** + Bestätigungs-Mechanismus (Etappe B)
- **Onboarding-Wizard** beim Erst-Profilanlegen (Etappe C) — Welcome-Modal → Stammdaten → Anamnese (jetzt verfügbar) → Vereinbarung
- **Demo als Import statt Pflicht** (Etappe D)

---

## Nachtrag 4 — Anamnese-Historie

**Datum:** 11.04.2026
**Auslöser:** Nach Etappe A war die AGB-Klausel Abschnitt 6 zu zwei Dritteln erfüllt: „wahrheitsgemäß ausfüllen" und „Aktualisierungspflicht" funktionierten, aber der dritte Teil — *„Vorherige Versionen bleiben zur Dokumentation erhalten"* — war noch nicht implementiert. Bei jedem Save wurde der alte Stand überschrieben. Das ist ein konkretes offenes Belegproblem: Wenn jemand fragt „Wo ist der ursprüngliche Anamnesestand vom 11.04. dokumentiert, nachdem er heute aktualisiert wurde?", müsstest du antworten: „Nirgends, der wurde überschrieben." — und das widerspricht dem AGB-Text.

### Maßnahme

1. **Datenmodell erweitert:** `state.profile.anamnesisHistory = []` als Array von Snapshot-Objekten. Jedes Snapshot ist eine Vollkopie eines früheren `anamnesis`-Eintrags (samt `confirmedAt`-Timestamp und `version`).
2. **Save-Logik erweitert:** In `saveAnamneseEdit()` wird vor dem Überschreiben geprüft, ob bereits ein bestätigter Stand existiert (`anamnesis.confirmedAt`). Wenn ja, wird er per `{...spread}`-Kopie an `anamnesisHistory` gepusht. Defensive Initialisierung: Wenn das Array fehlt (alte Profile, frische Demo-Profile), wird es neu angelegt.
3. **Render-Funktion `renderAnamneseHistory()`:** Sortiert die Historie absteigend nach `confirmedAt` (neueste zuerst), nummeriert die Einträge aufsteigend von der ältesten (v1, v2, v3 …), rendert jeden als HTML-`<details>`-Disclosure mit:
   - **Kompakter Summary:** Versions-Pill (`v1`, `v2`, …), Datum, Kurz-Meta („3 Vorerkrankungen · Beschwerden · Medikamente" oder „keine Vorerkrankungen · —")
   - **Aufklappbarer Body:** Vollständige Antworten aller 12 Felder im selben `info-form-rows`-Layout wie die Live-Anzeige
4. **History-Modal `#anamneseHistoryModal`:** Neues `tp-modal` mit Erklärtext (Verweis auf AGB Abschnitt 6), Liste-Container `#anamneseHistoryList`, Schließen-Button im Footer.
5. **CSS für `.anam-history-entry`** in `info.css`: Disclosure-Styling im Stil des Welcome-Modal-Detail-Bereichs (Hover, Open-State, rotierender Pfeil, Versions-Pill in Accent-Farbe). Mobile-Anpassung: Summary klappt bei < 640px in zwei Zeilen.
6. **Init-Handler:** Toast-Stub für `anamneseHistoryBtn` durch `openAnamneseHistoryModal` ersetzt. Damit ist der zweite ehemals-Stub-Button im Anamnese-Tab funktional.
7. **Bessere Save-Toast-Rückmeldung:** `saveAnamneseEdit()` zeigt nach dem Speichern jetzt zusätzlich „· N frühere Versionen archiviert" (oder „1 frühere Version archiviert" im Singular), sofern History-Einträge vorhanden sind. Damit sieht der Nutzer sofort, dass die Versionierung greift.

### Sortier- und Nummerierungs-Logik

- **Sortierung:** Absteigend nach `confirmedAt` — neueste Version oben in der Liste, älteste unten.
- **Nummerierung:** Aufsteigend von alt nach neu, also v1 = älteste Version. Das ist die UX-Konvention für Versionierung (v1 < v2 < v3). Da die Liste absteigend sortiert ist, steht die höchste Versionsnummer oben.
- Beispiel: Wenn drei alte Versionen archiviert sind, zeigt die Liste oben „v3" (zweitneueste), darunter „v2", darunter „v1" (älteste). Die *aktuellste* Version steht *nicht* in der History (sie ist live in `state.profile.anamnesis` und in der Anamnese-Sektion sichtbar).

### AGB-Status nach diesem Nachtrag

| AGB §6 Klausel | Status |
|---|---|
| „Anamnesebogen muss wahrheitsgemäß ausgefüllt werden" | ✅ Pflicht-Checkbox im Edit-Modal |
| „Bei Änderungen … ist eine Aktualisierung verpflichtend" | ✅ Aktualisieren-Button + neuer `confirmedAt`-Timestamp |
| „Vorherige Versionen bleiben zur Dokumentation erhalten" | ✅ `anamnesisHistory[]` + History-Modal |

Damit ist Abschnitt 6 der Nutzungsbedingungen **vollständig substantiell erfüllt** — alle drei Teilklauseln haben einen funktionalen Mechanismus.

### Edge Cases und ihre Behandlung

- **Erstes Speichern:** `state.profile.anamnesis` ist `null` → der History-Push wird übersprungen (Bedingung `anamnesis && anamnesis.confirmedAt`). Nach dem ersten Save: leere History, ein bestätigter Live-Stand. Klick auf „Vorherige Versionen" zeigt: „Noch keine vorherigen Versionen — die erste Bestätigung steht oben in der Anamnese-Sektion."
- **Profil ohne `anamnesisHistory`-Feld** (z. B. importierte alte Profile, Demo-Profile): Defensive Init `if (!Array.isArray(state.profile.anamnesisHistory)) state.profile.anamnesisHistory = []`. Kein Crash.
- **Snapshot-Identität:** Verwendung von `{...spread}` für die Kopie statt einer Referenz. Damit ist der archivierte Snapshot unveränderlich, auch wenn das Live-Objekt später mutiert wird.
- **Speicherplatz-Überlegung:** Jeder Snapshot ist ~500 Bytes. Bei jährlichen Aktualisierungen über 20 Jahre wären das ~10 KB pro Profil — vernachlässigbar im Verhältnis zum gesamten `tpv2_profile_data`-Schlüssel (typisch 100 KB+ für ein gewachsenes Profil mit Sessions und Plänen).

### Betroffene Dateien (Nachtrag 4)

| Datei | Änderung |
|---|---|
| `js/features/anamnese-edit.js` | `saveAnamneseEdit()` um History-Push erweitert, neue Funktionen `renderAnamneseHistory()` und `openAnamneseHistoryModal()`, erweiterter Save-Toast mit History-Counter |
| `Trainingsplaner.html` | Neues `anamneseHistoryModal` als tp-modal mit Erklärtext, Liste-Container, Schließen-Button |
| `js/init-handlers.js` | Import `openAnamneseHistoryModal`, Toast-Stub durch Modal-Open ersetzt |
| `css/pages/info.css` | Neue Klassen `.anam-history-entry`, `.anam-history-summary`, `.anam-history-num`, `.anam-history-summary-meta`, `.anam-history-body` mit Mobile-Anpassung |

### Verifikation (durch User)

- [ ] **Erstes Speichern:** Anamnese ausfüllen + speichern → Toast „✓ Anamnese gespeichert" (ohne History-Counter, weil leer)
- [ ] **History-Modal leer:** Klick auf „Vorherige Versionen" → Modal öffnet sich → Hinweis „Noch keine vorherigen Versionen"
- [ ] **Zweites Speichern:** Anamnese erneut ausfüllen (z. B. eine Vorerkrankung anhaken) + speichern → Toast „✓ Anamnese gespeichert · 1 frühere Version archiviert"
- [ ] **History-Modal mit einer alten Version:** Modal öffnen → ein Eintrag „v1 · [altes Datum] · keine Vorerkrankungen · —"
- [ ] **Disclosure aufklappen:** Klick auf den Eintrag → expandiert, zeigt alle 12 Felder mit alten Werten
- [ ] **Drittes Speichern:** Erneute Aktualisierung → History hat zwei Einträge: oben „v2 · [vorletztes Datum]", darunter „v1 · [erstes Datum]"
- [ ] **Persistenz:** F5 → History bleibt erhalten (im `tpv2_profile_data` unter `anamnesisHistory`)
- [ ] **Mobile:** Auf schmalem Viewport (<640px) klappt die Summary in zwei Zeilen, Meta-Text wird linksbündig

---

## Nachtrag 5 — Etappe B: Trainer-Vereinbarung bestätigen, widerrufen, dokumentieren

**Datum:** 11.04.2026
**Auslöser:** Risiko-Folge-Analyse, Etappe B. Im Trainer-Modus zeigte die Vereinbarungs-Sektion read-only Demo-Daten („Bestätigt am 05.04.2026"), und die zwei Aktions-Buttons („Erneut bestätigen", „Widerrufen") waren Toast-Stubs (`init-handlers.js` Zeilen 50–51 vor dem Patch). Damit waren zwei Probleme offen:

1. **DSGVO-Belegspur:** Es gab keinen Nachweis, dass der Trainer die Vereinbarung jemals aktiv akzeptiert hat. Die statische Demo-Anzeige war für einen Audit wertlos.
2. **Kein Widerrufs-Mechanismus:** Auch wenn die DSE/AGB das Widerrufsrecht garantieren, war es technisch nicht möglich. Das widerspricht Art. 7 Abs. 3 DSGVO („Der Widerruf muss so einfach wie die Erteilung sein").

### Maßnahme

1. **Datenmodell** in `js/features/agreement-edit.js`: `state.profile.agreement = { version, confirmedAt, revokedAt, agreementVersion }` plus `state.profile.agreementHistory = [{ type, timestamp, agreementVersion }]`.
2. **Status-Berechnung** über `getAgreementStatus(profile)`: leitet `'pending' | 'confirmed' | 'revoked'` aus den Timestamps ab. Kein redundantes `status`-Feld, das auseinanderlaufen könnte.
3. **Confirm-Modal** als `tp-modal` mit drei Kernpunkten (Fehlermeldepflicht, Meldungsweg, Mitverantwortung — übernommen aus den Sektionen 2, 3, 4 des Vereinbarungs-Texts), Pflicht-Checkbox und Bestätigungs-Button (initial disabled). Optisch im selben Stil wie das Welcome-Modal (`welcome-points` und `welcome-consent` Klassen wiederverwendet — sie passen perfekt für „mehrere Punkte mit Icon plus Pflicht-Checkbox").
4. **Render-Funktion `renderAgreement(profile)`**: Drei Status-Modi mit unterschiedlichem UI:
   - **Pending:** Graues Badge „○ Noch nicht bestätigt", Bestätigungs-Box ausgeblendet, Widerruf-Button ausgeblendet, Hauptbutton-Label „Vereinbarung bestätigen"
   - **Confirmed:** Grünes Badge „● Bestätigt am [Datum]", Bestätigungs-Box mit vollem Timestamp sichtbar, Widerruf-Button sichtbar, Hauptbutton-Label „Erneut bestätigen"
   - **Revoked:** Rotes Badge „⊘ Widerrufen am [Datum]", Warnungs-Box mit Erklärtext sichtbar, Widerruf-Button ausgeblendet (kann nicht erneut widerrufen werden), Hauptbutton-Label „Erneut bestätigen"
5. **Confirm-Funktion `confirmAgreement()`**: Pflicht-Checkbox-Check, History-Push (`type: 'confirm'`), neuer Live-Stand mit aktuellem Timestamp, `revokedAt: null` (überschreibt einen evtl. früheren Widerruf), Save, Render, Modal schließen, Toast.
6. **Widerruf-Funktion `revokeAgreement()`**: Browser-`confirm()`-Dialog mit dreizeiligem Erklärtext (was passiert, dass der Trainer-Modus weiter nutzbar bleibt, dass die Aktion dokumentiert wird). Bei Bestätigung: History-Push (`type: 'revoke'`), `revokedAt`-Timestamp gesetzt (`confirmedAt` bleibt erhalten — wichtig für die Dokumentation der ursprünglichen Bestätigung), Save, Render, Toast.
7. **History-Modal** zeigt eine zeitlich absteigende Liste aller Bestätigungs- und Widerrufs-Aktionen mit:
   - Status-Pill (grün „✓ Bestätigt" oder rot „⊘ Widerrufen")
   - Vollformatiertes Datum/Uhrzeit
   - Versions-Hash der Vereinbarungs-Texte (rechts in monospace, klein)
8. **Soft-Lock statt Hard-Lock:** Beim Widerruf wird der Trainer-Modus *nicht* deaktiviert. Stattdessen erscheint im Vereinbarungs-Tab ein gelber Warnungs-Banner („Du nutzt den Trainer-Modus aktuell ohne aktive Vereinbarung"), und der Status-Badge wechselt auf rot. Begründung: Hard-Lock würde den Nutzer überraschen und ihn aus der App werfen — Soft-Lock macht das Problem sichtbar, ohne Schaden anzurichten. Der Trainer kann die Vereinbarung jederzeit erneut bestätigen, und der Widerruf bleibt in der History dokumentiert.

### Versionierung

- **`AGREEMENT_DATA_VERSION = 1`** — Schema-Version des `agreement`-Objekts (für künftige Migrationen).
- **`AGREEMENT_TEXT_VERSION = '2026-04-10'`** — Inhalts-Version der Vereinbarungs-Texte. Bei inhaltlicher Änderung erhöhen, dann sollte zusätzlich eine UI-Logik dafür sorgen, dass bestehende Bestätigungen *abgewertet* werden (z. B. ein Hinweis „Die Vereinbarung wurde aktualisiert — bitte erneut bestätigen"). Aktuell noch nicht implementiert, aber das Datenmodell ist vorbereitet.

### AGB-Klausel-Bezug

| Klausel | Vorher | Jetzt |
|---|---|---|
| Vereinbarung muss aktiv bestätigt werden | nicht möglich (Toast-Stub) | ✅ Confirm-Modal mit Pflicht-Checkbox |
| Widerruf jederzeit möglich (Art. 7 Abs. 3 DSGVO) | nicht möglich (Toast-Stub) | ✅ Widerrufs-Button mit Browser-Confirm |
| Dokumentation aller Aktionen (Art. 7 Abs. 1 DSGVO Nachweispflicht) | gar nicht | ✅ `agreementHistory[]` mit Timestamps |
| Versionierung der Texte | gar nicht | ✅ `AGREEMENT_TEXT_VERSION`-Konstante |

### Edge Cases und ihre Behandlung

- **Widerruf ohne vorherige Bestätigung:** `revokeAgreement()` prüft den Status; wenn nicht `confirmed`, kommt ein Toast „Vereinbarung ist aktuell nicht bestätigt" und keine Aktion. Verhindert, dass der Widerruf-Button im Pending-Status irgendwas anrichtet.
- **Erneute Bestätigung nach Widerruf:** Beim Confirm wird `revokedAt: null` explizit gesetzt — der Widerruf wird also „aufgehoben". Trotzdem bleibt der alte Widerruf in der History dokumentiert. Der Status springt auf `confirmed`, der rote Banner verschwindet.
- **Mehrfache Widerrufe:** Theoretisch nicht möglich, weil der Widerruf-Button im Revoked-Status ausgeblendet ist. Falls doch (z. B. durch direkten DOM-Zugriff): Der zweite Widerruf überschreibt den `revokedAt`-Timestamp einfach, History wächst weiter.
- **Kein agreement-Feld im Profil:** Defensive Init in beiden Funktionen — `if (!profile.agreement) profile.agreement = getDefaultAgreement()`. Kein Crash beim ersten Aufruf.
- **Demo-Profile (Alexander, Julia):** Haben kein `agreement`-Feld. Beim Render zeigt das den Pending-Zustand. Trainer kann die Vereinbarung dann bestätigen, und sie wird ans Demo-Profil drangehängt.

### Betroffene Dateien (Nachtrag 5)

| Datei | Änderung |
|---|---|
| `js/features/agreement-edit.js` | **Neu** — 250 Zeilen: Datenmodell, Status-Berechnung, Render, Confirm-Modal, Revoke mit Confirm-Dialog, History-Modal |
| `Trainingsplaner.html` | Vereinbarungs-Sektion restrukturiert (IDs für Status, Validity, ConfirmBox, RevokedBox, ButtonLabel), neue Buttons: „Verlauf"-Button zwischen Bestätigen und Widerruf, Widerruf-Hinweis-Box `info-notice` initial versteckt. Neue Modals `agreementConfirmModal` (mit drei `welcome-point`-Karten + Pflicht-Checkbox) und `agreementHistoryModal` (mit Liste-Container) |
| `js/pages/info.js` | Import `renderAgreement`, Aufruf in `renderInfo(profile)` |
| `js/init-handlers.js` | Imports der vier Agreement-Funktionen, Toast-Stubs für `vereinbarungReconfirmBtn` und `vereinbarungRevokeBtn` durch echte Handler ersetzt, neuer Handler für `verHistoryBtn`, Confirm-Checkbox-Handler für `agrConfirmCheck` |

### Verifikation (durch User)

- [ ] **Pending-Initial:** Tab Info → Vereinbarung → Status zeigt graues „○ Noch nicht bestätigt", Bestätigungs-Box unsichtbar, Widerruf-Button unsichtbar, Hauptbutton heißt „Vereinbarung bestätigen"
- [ ] **Confirm-Modal-Open:** Klick auf „Vereinbarung bestätigen" → Modal öffnet sich, drei Punkte sichtbar, Bestätigen-Button grau (disabled)
- [ ] **Checkbox + Button:** Checkbox setzen → Button wird teal/aktiv → klicken → Modal schließt, Toast „✓ Trainer-Vereinbarung bestätigt", Status-Badge wird grün mit Datum, Bestätigungs-Box sichtbar mit vollem Timestamp, Widerruf-Button erscheint, Hauptbutton-Label wechselt auf „Erneut bestätigen"
- [ ] **History nach 1. Confirm:** Klick auf „Verlauf" → History-Modal zeigt einen Eintrag mit grünem „✓ Bestätigt"-Pill und vollformatierten Timestamp
- [ ] **Widerruf:** Klick auf „Widerrufen" → Browser-Confirm „wirklich?" → OK → Status-Badge wird rot „⊘ Widerrufen am [Datum]", Warnungs-Banner erscheint, Widerruf-Button verschwindet, Hauptbutton bleibt „Erneut bestätigen"
- [ ] **History nach Widerruf:** „Verlauf" → zwei Einträge, oben rotes „⊘ Widerrufen", darunter grünes „✓ Bestätigt"
- [ ] **Erneute Bestätigung nach Widerruf:** Klick „Erneut bestätigen" → Modal → Checkbox + Button → Status zurück auf grün, Warnungs-Banner verschwindet, History hat jetzt drei Einträge
- [ ] **Persistenz:** F5 → Status, Bestätigungs-Box und History bleiben erhalten
- [ ] **Athlet-Modus:** In den Athlet-Modus wechseln → Vereinbarungs-Tab ist gar nicht sichtbar (rollenbasierte CSS-Sichtbarkeit)
- [ ] **Esc-Close + Backdrop-Close:** Confirm-Modal und History-Modal lassen sich beide mit Esc und Click-Outside schließen

---

## Nachtrag 6 — Etappe D: Demo als Import statt Pflicht

**Datum:** 11.04.2026
**Auslöser:** Risiko 3 aus der Audit-Folge-Analyse. Bisher lud die App beim Erstaufruf automatisch das Max-Mustermann-Demo (430 Sessions, 3 Jahre Trainingsdaten). Das hatte zwei Probleme:

1. **UX:** Tester sahen sofort fremde Trainingsdaten und mussten sich aktiv durch die Demo-Banner-Logik klicken, um ein eigenes Profil anzulegen. Verwirrung war vorprogrammiert.
2. **DSGVO-Belegspur:** Auch wenn die Demo-Daten technisch unter dem Profil-Schlüssel des Nutzers landeten, war die DSE in Abschnitt 2 schwer zu erfüllen — sie listet die verarbeiteten Daten transparent, aber bei Demo-Daten ist „verarbeitete Daten" eine fragwürdige Kategorie. Sauberer ist: App startet leer, Demo-Profile sind explizite Import-Optionen.

### Maßnahme

1. **`getEmptyProfile()` Helper** in `js/state.js`: Liefert ein vollständiges Profil-Objekt mit allen Pflichtfeldern (id `empty-{timestamp}`, leere Strings für Stammdaten, leere Arrays für `tage`/`sessions`, leeres `equipment.studio`-Objekt, `null` für `anamnesis`/`agreement`, leere History-Arrays). Damit crashen die Render-Funktionen nicht — sie können mit dem leeren Profil normal durchlaufen und zeigen leere Cockpits, leere Charts, leere Listen.

2. **`loadDemoProfile()` umgebaut** in `js/demo-loader.js`: Das war bisher die Auto-Lade-Funktion für die Init-Sequenz. Neue Logik:
   - **Wenn `tpv2_profile_data` im localStorage existiert** → laden (wie bisher)
   - **Sonst** → `applyEmptyProfile()` aufrufen, das ein leeres Profil über `getEmptyProfile()` erzeugt und durch `_applyProfile()` rendert
   
   Kein Auto-Fetch des Demo-JSONs mehr.

3. **Zwei neue Funktionen `loadDemoMax()` und `loadDemoJulia()`** in `demo-loader.js`:
   - Wenn bereits ein Profil im localStorage existiert: Browser-`confirm()` mit Warnung, dass das aktuelle Profil überschrieben wird, plus Hinweis auf den Export
   - Bei Bestätigung (oder leerem localStorage): `_clearSavedProfile()`, dann fetch über `_loadDemoFromPath()`, dann `_applyProfile()`, dann `_saveProfile()` und `location.reload()` für sauberen Zustand
4. **Demo-Banner im Cockpit** umgebaut: zeigt sich jetzt nur noch bei *leerem* Profil (id beginnt mit `'empty-'`). Text: „Leeres Profil — leg los, indem du dein eigenes Profil erstellst, oder importiere ein Demo-Profil zum Ausprobieren." Vier Buttons: „Eigenes Profil erstellen" (bestehender Mechanismus), „Demo Max laden", „Demo Julia laden", „Später" (Banner ausblenden für die Session).
5. **Command Palette** um eine neue Gruppe „Demo-Profile" mit drei Items erweitert: Demo Max, Demo Julia, Aktuelles Demo zurücksetzen. Die alte Quick-Action „Demo-Profil neu laden" ist in die neue Gruppe gewandert (sie war als Quick Action auf der Startseite verwirrend, weil sie nur dann sinnvoll ist, wenn man weiß, dass man ein Demo-Profil hat).
6. **Info → Daten** Sektion erweitert: Statt einer einzigen „Zurücksetzen"-Karte gibt es jetzt drei Karten:
   - **Demo Max** mit Beschreibung „Studio · 430 Sessions · Calisthenics-Erfahrung" und „Demo Max laden"-Button
   - **Demo Julia** mit Beschreibung „Studio + Cardio · weibliches Profil" und „Demo Julia laden"-Button
   - **Demo zurücksetzen** mit Hinweis, dass dies das aktuell aktive Demo neu lädt (alte Mutationen verwirft)
   
   Die alte „Sync nicht aktiv im Prototyp"-Karte ist weggefallen — sie war redundant mit dem CLAUDE.md-Hinweis.

### Edge Cases und ihre Behandlung

- **Erstaufruf nach Welcome-Modal-Akzeptanz:** Welcome-Modal akzeptiert → `loadDemoProfile()` → kein gespeichertes Profil → leeres Profil → Cockpit rendert mit `sessions: []`, Demo-Banner erscheint im Cockpit. Kein Auto-Demo mehr.
- **Bestehende Nutzer mit gespeichertem Profil:** Beim Reload greift `_loadSavedProfile()` und lädt wie bisher das eigene Profil. Banner erscheint nicht. Kein Bruch für Wiederkehrer.
- **Demo-Profile haben kein `agreement`/`anamnesis`:** Nach dem Laden zeigt der Trainer-Modus „Vereinbarung noch nicht bestätigt" — was korrekt ist, weil ein importiertes Demo-Profil aus DSGVO-Sicht eine eigene Bestätigung braucht (alte Bestätigungen aus dem ursprünglichen Demo-Snapshot wären für den jetzigen Nutzer nicht rechtsgültig).
- **`_applyProfile()` mit Source `'Empty'`:** Der Toast „Profil geladen · 0 Einheiten" wäre verwirrend bei einem leeren Profil. Er bleibt aber drin, weil `_applyProfile()` von vielen Stellen aufgerufen wird und Sonderfälle die Funktion komplizierter machen würden. Pragmatisch: Tester sieht „leeres Profil geladen", versteht den Zustand und nutzt den Banner.
- **Banner-Button „Eigenes Profil erstellen"-Mechanismus:** Der bestehende Code in `app.js` setzt alle Profil-Felder auf leer und öffnet das Profil-Edit-Modal. Mit dem neuen leeren Profil ist das semantisch identisch — nur, dass das Profil schon leer ist, also der „Reset"-Schritt eigentlich überflüssig wäre. Bleibt drin, weil er auch funktioniert wenn man von einem geladenen Demo aus startet.

### Bonus: Defensive Init für anamnesis/agreement

In `getEmptyProfile()` werden `anamnesis: null` und `agreement: null` plus leere History-Arrays gesetzt. Damit funktioniert der Render-Code aus Etappe A und B sofort (er prüft beide Felder defensive). Auch beim Demo-Import sind diese Felder dann sauber initialisiert, falls die Demo-JSONs sie nicht enthalten — was sie nicht tun.

### Betroffene Dateien (Nachtrag 6)

| Datei | Änderung |
|---|---|
| `js/state.js` | Neue Funktion `getEmptyProfile()` mit allen Pflichtfeldern, Export ergänzt |
| `js/demo-loader.js` | Import `getEmptyProfile`, neue Konstante `DEMO_PATH_JULIA`, neue Funktionen `applyEmptyProfile`, `loadDemoMax`, `loadDemoJulia`, generische `_loadDemoFromPath`. `loadDemoProfile()` lädt bei fehlendem Saved-Profile ein leeres statt Auto-Demo. `reloadDemoProfile()` jetzt mit `location.reload()` für sauberen Zustand |
| `Trainingsplaner.html` | Demo-Banner: Text + zwei neue Buttons (Demo Max / Demo Julia laden). Info → Daten: drei neue Karten (Demo Max / Demo Julia / Demo zurücksetzen), alte Sync-Karte entfernt |
| `js/app.js` | Banner-Anzeige-Logik: zeigt nur bei `id.startsWith('empty-')`, nicht mehr bei „kein Saved-Profile". Imports `loadDemoMax`, `loadDemoJulia`. Banner-Button-Handler für die zwei neuen Buttons |
| `js/init-handlers.js` | Imports `loadDemoMax`, `loadDemoJulia`. Handler für `infoLoadDemoMaxBtn`, `infoLoadDemoJuliaBtn` |
| `js/command-palette.js` | Neue Gruppe „Demo-Profile" mit drei Items. Alte Quick-Action „Demo-Profil neu laden" verschoben |

### Verifikation (durch User)

- [ ] **Erstaufruf simulieren:** localStorage komplett leeren (DevTools → Application → Clear site data) → F5 → Welcome-Modal → akzeptieren → Cockpit zeigt jetzt **leeren Zustand** (Readiness 100/100 oder ähnlich, weil keine Sessions, keine Charts), Demo-Banner ist sichtbar mit den drei Lade-Buttons
- [ ] **Demo Max via Banner:** Klick „Demo Max laden" → Confirm-Dialog (weil das leere Profil bereits gespeichert ist?) **Hmm**, das könnte unerwartet sein — siehe Fix-Hinweis unten. Wenn ja: Bestätigen → Profil lädt → Reload → Cockpit zeigt Alex' Daten, Banner ist weg
- [ ] **Demo Julia via Command Palette:** Cmd+K → „Demo Julia laden" → Confirm → Profil wechselt zu Julia
- [ ] **Demo via Info → Daten:** Tab Info → Daten → Karte „Demo Julia" → Klick → Confirm → Profil wechselt
- [ ] **Persistenz nach Demo-Wechsel:** F5 → das geladene Demo bleibt
- [ ] **„Eigenes Profil erstellen"-Button:** Im leeren Zustand klicken → öffnet Profil-Edit-Modal mit leeren Feldern, bekannter Mechanismus

### Bekannter UX-Punkt (im Nachtrag 7 behoben)

Wenn der User im leeren Zustand auf „Demo Max laden" klickt, fragt der Confirm-Dialog „aktuelles Profil überschreiben?". Das ist semantisch korrekt (das leere Profil ist *technisch* schon im localStorage), aber UX-mäßig irritierend („ich hab doch noch gar nichts"). Eine Verbesserung wäre: Im `loadDemoMax`/`loadDemoJulia`-Code prüfen, ob das gespeicherte Profil leer ist (z. B. `id.startsWith('empty-')` oder `sessions.length === 0`) und nur dann den Confirm überspringen. → Folge-Polish (15 Min), nicht kritisch.

→ **Behoben** im selben Commit über `_isRealProfile()`-Helper, der `id.startsWith('empty-')` prüft. Kein Confirm bei leerem Profil.

---

## Nachtrag 7 — Demo-Naming vereinheitlicht (Max → Alexander)

**Datum:** 11.04.2026
**Auslöser:** Bei der Sichtprüfung der Etappe-D-Buttons fiel auf, dass die App den Demo-Athleten an verschiedenen Stellen unterschiedlich benennt: Die JSON-Datei hieß `Trainingsplaner_Max_Mustermann_Demo.json`, die Code-Strings nannten ihn „Demo Max", aber der **tatsächliche Inhalt** der JSON ist **Alexander da Costa Amaral** (id `p_demo_alexander`, name „Alexander", nachname „da Costa Amaral"). Die Buttons hießen also „Demo Max laden", luden aber Alexander. Klassischer Datei-Namen-Drift.

### Maßnahme

Komplette Vereinheitlichung auf **Alexander** in allen Live-Code-Stellen:

1. **JSON-Datei umbenannt** via `git mv Trainingsplaner_Max_Mustermann_Demo.json Trainingsplaner_Alexander_Demo.json`. Inhalt unverändert.
2. **`js/demo-loader.js`**: `DEMO_PATH` aktualisiert, Funktion `loadDemoMax()` → `loadDemoAlexander()`, alle Log/Toast-Strings „Demo Max" → „Demo Alexander", JSDoc-Kommentar angepasst, Confirm-Dialog-Text „Max Mustermann" → „Alexander".
3. **`js/init-handlers.js`**: Import + Variable `loadMaxBtn` → `loadAlexBtn`, Element-ID `infoLoadDemoMaxBtn` → `infoLoadDemoAlexanderBtn`.
4. **`js/command-palette.js`**: Import + Item-Label „Demo Max laden" → „Demo Alexander laden".
5. **`js/app.js`**: Import + Banner-Variable `loadMaxBtn` → `loadAlexBtn`, Element-ID `cpDemoLoadMax` → `cpDemoLoadAlexander`.
6. **`Trainingsplaner.html`**: 
   - Banner-Button-ID `cpDemoLoadMax` → `cpDemoLoadAlexander`, Label „Demo Max laden" → „Demo Alexander laden"
   - Info → Daten Card-Label „Demo Max" → „Demo Alexander", Sub-Text „Studio · 430 Sessions" → „Studio + Home · 430 Sessions · Calisthenics-Erfahrung" (das passt besser zum tatsächlichen Profil-Inhalt mit `trainingLocation: ['studio', 'home']`)
   - Button-ID `infoLoadDemoMaxBtn` → `infoLoadDemoAlexanderBtn`
7. **`generate_demo.js`**: Header-Kommentar + `filename`-Konstante auf `Trainingsplaner_Alexander_Demo.json`.
8. **`generate_demo.py`**: `f1`-Pfad analog.

### Was nicht angefasst wurde (bewusst)

- **`Notizen/2026-04-10_rechtsaudit-umsetzung.md` Nachträge 1–6**: Historische Doku. Die alten Texte beschreiben den Zustand zum Zeitpunkt der Umsetzung („Demo Max") — sie sollen dokumentieren *was war*, nicht *was jetzt ist*. Nachtrag 7 (dieser hier) erklärt die Umbenennung.
- **`Daten/*` Backups**: Reine Snapshots, irrelevant für die laufende App.
- **`Redesign/Trainingsplaner_v2.html`**: Single-File-Archiv aus der v2-Anfangszeit, nicht mehr in Nutzung.
- **`sync/SETUP.md`**: Sync ist im Prototyp deaktiviert, der Filename-Hinweis ist Doku-Altlast.

### Verifikations-Grep

`Grep "Max_Mustermann|loadDemoMax|Demo Max|MaxBtn|cpDemoLoadMax|infoLoadDemoMaxBtn"` im Live-Code (`js/`, `Trainingsplaner.html`, `generate_demo.*`) → **0 Treffer**. Restliche Treffer nur in `Notizen/`, `Daten/`, `Redesign/`, `sync/`.

### Betroffene Dateien (Nachtrag 7)

| Datei | Änderung |
|---|---|
| `Trainingsplaner_Max_Mustermann_Demo.json` → `Trainingsplaner_Alexander_Demo.json` | git mv (Inhalt unverändert) |
| `js/demo-loader.js` | DEMO_PATH, Funktionsname, Strings, JSDoc, Confirm-Text |
| `js/init-handlers.js` | Import, Variable, Element-ID |
| `js/command-palette.js` | Import, Item-Label |
| `js/app.js` | Import, Variable, Element-ID |
| `Trainingsplaner.html` | Zwei IDs, drei Labels, Sub-Text |
| `generate_demo.js` | Header-Kommentar, filename-Konstante |
| `generate_demo.py` | f1-Pfad |

---

## Nachtrag 8 — Demo als Vorschau-Modus statt Übernahme (Etappe E)

**Datum:** 11.04.2026
**Auslöser:** UX-Frage des Users zum Demo-Wechsel-Pfad. Aktuell überschrieb „Demo Alexander laden" das eigene Profil im localStorage komplett — der Rückweg zum eigenen Profil war nur über mehrere Klicks (Recht-Tab → Einwilligung widerrufen → Daten löschen → Reload) erreichbar. Vorgeschlagen wurde ein **Vorschau-Modus**, in dem das Demo nur in RAM lädt und das eigene Profil unangetastet bleibt. User-Bestätigung mit Variante B (Mutationen erlaubt aber RAM-only), Banner + Sidebar-Pill als Modus-Anzeige, Toggle default an, alte Karten in Info → Daten entfernen.

### Konzept

Statt „Demo überschreibt eigenes Profil" jetzt: **Demo ist eine RAM-only Vorschau**. Das eigene Profil bleibt unter `tpv2_profile_data` im localStorage liegen, beim Wechsel in den Demo-Modus wird es nur in einer State-Variable geparkt. Ein „Zurück zu meinem Profil"-Button im Demo-Banner spielt es zurück, ohne dass die Persistierungsschicht angefasst wurde.

### Datenmodell-Erweiterung

Neue Felder in `state` (in `js/state.js`):

```js
demoMode: null,            // 'alexander' | 'julia' | null
_savedProfileBackup: null, // das eigene Profil während Demo-Vorschau
showDemos: localStorage.getItem('tpv2_show_demos') !== 'false'  // default true
```

Plus neuer Storage-Key `STORAGE_KEYS.showDemos = 'tpv2_show_demos'`.

### Schreib-Schutz im Demo-Modus

`_saveProfile()` in `js/state.js` bekommt eine Frühe-Rückgabe:

```js
if (state.demoMode) {
  console.log('[Persist] Demo-Modus aktiv (' + state.demoMode + ') — kein Save');
  return;
}
```

Damit gehen alle Mutationen am Demo-Profil (Anamnese ausfüllen, Vereinbarung bestätigen, Sessions loggen, Plan ändern) **nur in RAM**. Beim Verlassen der Vorschau wird der Backup zurückgespielt — alle Demo-Mutationen sind weg. Das ist Variante B des UX-Vorschlags: Mutationen erlaubt, RAM-only, Banner-Hinweis sagt es dem User vorher.

### Vorschau-Loader (RAM-only)

`loadDemoAlexander()` und `loadDemoJulia()` in `js/demo-loader.js` rufen jetzt die neue interne Funktion `_loadDemoAsPreview(path, label, modeKey)` auf, die:

1. **Doppel-Vorschau-Schutz:** Wenn bereits eine Demo aktiv ist, wird der Backup wiederhergestellt, bevor die neue geladen wird (sonst würde der Backup mit dem ersten Demo überschrieben).
2. **Backup parken:** `state._savedProfileBackup = state.profile`
3. **Demo fetchen** über `fetch(path)`
4. **`state.demoMode = modeKey`** *vor* `_applyProfile()` setzen, damit bei einem zufälligen `_saveProfile()`-Aufruf der Schutz schon greift
5. **`_applyProfile(profile, label)`** rendert das Demo
6. **Banner + Sidebar-Pill aktivieren** über `_renderDemoBanner()`
7. **Toast** „Demo-Vorschau: Alexander · Änderungen werden nicht gespeichert"
8. **Bei Fehler:** Backup wiederherstellen, demoMode zurücksetzen, kein Schaden

`exitDemoMode()`:
- Liest den Backup
- Setzt `demoMode = null`, `_savedProfileBackup = null`
- Spielt das eigene Profil zurück über `_applyProfile(backup, 'Persist')` (oder fällt auf `applyEmptyProfile()` zurück, wenn vorher gar nichts da war)
- Banner + Pill ausblenden
- Toast „Zurück zu deinem Profil"

`_renderDemoBanner()` aktualisiert die DOM-Elemente:
- `#demoModeBanner` (display flex/none)
- `#demoModeBannerLabel` Text mit „Alexander" oder „Julia"
- `#sidebarDemoPill` (display flex/none)

### UI-Änderungen

**Profil-Tab — neue Card „Demo-Profile zum Ausprobieren"** zwischen „Profil" und „Athleten verwalten":

- Sub-Text: *„Vorschau-Modus · Änderungen werden nicht gespeichert"*
- Erklärtext: *„Mit den Beispiel-Profilen kannst du alle Charts, Pläne und Auswertungen erkunden, ohne dein eigenes Profil anzufassen. Dein Profil bleibt sicher im Hintergrund — über den Banner oben kommst du jederzeit zurück."*
- 2-Spalten-Grid mit zwei Tile-Buttons:
  - **◉ Alexander** — *„Studio + Home · 430 Sessions · Calisthenics-Erfahrung"*
  - **◉ Julia** — *„Studio + Cardio · weibliches Profil · Kraftausdauer"*
- Hover-Effekt: Border accent, Background `--accent-dim`, Pfeil rückt nach rechts
- Footer-Hint: „Sektion ein-/ausblenden über Info → Einstellungen"
- CSS-Klasse `.demo-showcase-card` mit gestricheltem Border (deutet „nicht permanent" an)

**Globaler Vorschau-Banner** in `<main id="mainArea">`, oberhalb aller Tab-Sections:

- Sticky oben (z-index 100), Linear-Gradient `warning-dim → accent-dim`, Backdrop-Blur
- Icon 🔍 + zweizeiliger Text (fett: „Demo-Vorschau aktiv", normal: dynamischer Label-Text)
- Rechts: Button „Zurück zu meinem Profil"
- Mobile: wrapping in zwei Zeilen, Button auf voller Breite

**Sidebar-Pill** unter `#roleName` und `#roleMode`:

- Initial `display:none`
- Wenn aktiv: kleines orange Pill „🔍 Demo-Vorschau" (warning-Farbe, monospace, uppercase)

**Info → Einstellungen — neuer Toggle**:

- Zeile „Demo-Profile anzeigen" mit Checkbox + Label „Demo-Sektion im Profil-Tab sichtbar"
- Default: an (`tpv2_show_demos !== 'false'`)
- Setzt `state.showDemos`, persistiert in localStorage, blendet `#demoShowcaseCard` ein/aus

**Info → Daten** — alte Karten entfernt:

- ❌ „Demo Alexander" (große Karte) — gelöscht
- ❌ „Demo Julia" (große Karte) — gelöscht
- ❌ „Demo zurücksetzen" — gelöscht
- ✅ Neu: eine schlanke Hinweis-Karte „🔍 Demo-Profile" mit Verweis auf den Profil-Tab

**Empty-Banner** in `<div id="cpDemoBanner">` — schlanker:

- Vorher: 4 Buttons (Profil erstellen / Demo Alexander / Demo Julia / Später)
- Nachher: 2 Buttons (Profil erstellen / Später) — Demo-Buttons sind weg, weil sie jetzt im Profil-Tab leben
- Text-Hinweis am Ende: *„Demo-Profile zum Ausprobieren findest du im Profil-Tab"*

**Command Palette — Demo-Profile-Gruppe aktualisiert**:

- ✅ „Vorschau: Demo Alexander (…)" mit 🔍-Icon
- ✅ „Vorschau: Demo Julia (…)" mit 🔍-Icon
- ✅ „Demo-Vorschau verlassen" — nur sichtbar wenn `state.demoMode !== null`
- ✅ „Aktuelle Demo neu laden (Mutationen verwerfen)" — nur sichtbar wenn `state.demoMode !== null`

### Verhalten in Edge Cases

| Szenario | Verhalten |
|---|---|
| Demo Alexander → Profil bearbeiten + speichern | Edits in RAM, `_saveProfile()` no-op (Console-Log), bei Exit verloren |
| Demo Alexander → Demo Julia | Erst Backup wiederherstellen (lokal), dann Julia laden, Backup neu setzen |
| Demo aktiv → Tab-Wechsel | Pages rendern Demo-Daten normal, Banner bleibt sichtbar |
| Demo aktiv → Theme wechseln | Theme-Wechsel wirkt sofort, kein localStorage-Save (`tpv2_theme` ist eigener Key, kein Profil) |
| Demo aktiv → Reload (F5) | Demo-Modus geht verloren, eigenes Profil wird normal geladen |
| Demo aktiv → Welcome-Modal-Widerruf | Funktioniert wie immer (Consent ist eigener Key) |
| Erstes-Mal-Nutzer → leeres Profil → Demo Alexander | Backup ist leeres Profil, Exit kehrt dorthin zurück |

### Was sich semantisch ändert

- **„Demo laden" heißt jetzt „Demo erkunden"** — keine Übernahme, keine Vermischung mit eigenen Daten
- **Mutationen am Demo sind ein „weiches Sandboxing"** — der Tester darf Buttons drücken, sieht das Verhalten, aber nichts persistiert
- **Eigenes Profil ist immer sicher** — kein „Profil überschreiben?"-Confirm mehr, weil es keinen Überschreib-Pfad mehr gibt
- **Demo-Sektion ist optional** — nach dem ersten Erkunden kann der reguläre Nutzer sie ausblenden, der Diplomarbeits-Vorführer behält sie

### Betroffene Dateien (Nachtrag 8)

| Datei | Änderung |
|---|---|
| `js/state.js` | Neue Felder `demoMode`, `_savedProfileBackup`, `showDemos`, neuer Storage-Key. `_saveProfile()` mit Demo-Schutz |
| `js/demo-loader.js` | Neue interne `_loadDemoAsPreview()`, neue exportierte `exitDemoMode()`, Helper `_renderDemoBanner()`. `loadDemoAlexander()` und `loadDemoJulia()` rufen jetzt nur noch `_loadDemoAsPreview()` auf. Alte Confirm-Dialoge entfernt. `reloadDemoProfile()` lädt aktive Vorschau neu. Neue Export-Liste mit `exitDemoMode` |
| `js/pages/info.js` | Toter Code (zweite `reloadDemoProfile`-Funktion + Import) entfernt. `renderInfo()` setzt Demo-Sektion-Sichtbarkeit |
| `js/init-handlers.js` | Import `exitDemoMode`, Handler für `demoShowcaseAlexBtn`, `demoShowcaseJuliaBtn`, `demoModeExitBtn`, `settingsShowDemos`-Toggle |
| `js/app.js` | Imports `loadDemoAlexander/loadDemoJulia` entfernt (gehören jetzt zu Profil-Tab und Command Palette), alte Banner-Button-Handler entfernt |
| `js/command-palette.js` | Import `exitDemoMode`, Demo-Items umgelabelt zu „Vorschau", zwei neue Items mit `visible: () => !!state.demoMode` |
| `Trainingsplaner.html` | Sidebar: neuer `#sidebarDemoPill`. Main: neuer `#demoModeBanner`. Empty-Banner: zwei Demo-Buttons entfernt, Text aktualisiert. Profil-Tab: neue Card `#demoShowcaseCard` mit zwei Tiles. Info → Einstellungen: neuer Toggle `#settingsShowDemos`. Info → Daten: alte Demo-Karten durch eine schlanke Hinweis-Karte ersetzt |
| `css/pages/info.css` | Neue Klassen `.demo-mode-banner`, `.sidebar-demo-pill`, `.demo-showcase-card`, `.demo-showcase-grid`, `.demo-showcase-tile`, `.demo-showcase-icon`, `.demo-showcase-body`, `.demo-showcase-name`, `.demo-showcase-meta`, `.demo-showcase-arrow`, `.settings-toggle`. Mobile-Anpassungen |

### Verifikation (durch User)

- [ ] **Empty-State:** localStorage leeren → F5 → Welcome → akzeptieren → Cockpit zeigt Empty-Banner mit nur „Eigenes Profil erstellen" und „Später", **keine** Demo-Buttons mehr im Banner
- [ ] **Demo-Sektion sichtbar:** Profil-Tab → eine neue Card „Demo-Profile zum Ausprobieren" mit zwei Tile-Buttons (Alexander, Julia)
- [ ] **Vorschau starten:** Klick „Alexander" → Demo lädt sofort (kein Confirm-Dialog mehr), Toast „Demo-Vorschau: Alexander · Änderungen werden nicht gespeichert", oben erscheint orange/teal Banner „🔍 Demo-Vorschau aktiv … Du erkundest …", in der Sidebar erscheint kleines „🔍 DEMO-VORSCHAU"-Pill unter dem Namen
- [ ] **Cockpit-Daten:** Charts, Readiness, alle Tabs zeigen Alexander-Daten
- [ ] **Mutation-Test:** In der Vorschau Anamnese ausfüllen + speichern → Toast „✓ Anamnese gespeichert", DevTools Console zeigt `[Persist] Demo-Modus aktiv (alexander) — kein Save`. Nach „Zurück" → eigenes Profil hat keine Anamnese
- [ ] **Demo-Wechsel:** Klick Profil-Tab → Julia → wechselt zu Julia, Banner bleibt sichtbar, Backup bleibt erhalten
- [ ] **Exit:** Klick „Zurück zu meinem Profil" im Banner → eigenes (leeres oder volles) Profil ist wieder da, Banner und Pill sind weg
- [ ] **Toggle:** Info → Einstellungen → „Demo-Profile anzeigen" abhaken → Profil-Tab Demo-Card verschwindet, Refresh des Profil-Tabs → bleibt versteckt
- [ ] **Persistenz Toggle:** F5 → Toggle bleibt deaktiviert
- [ ] **Command Palette:** Cmd+K → „Vorschau: Demo …" sichtbar; bei aktiver Vorschau zusätzlich „Demo-Vorschau verlassen" und „Aktuelle Demo neu laden"
- [ ] **Info → Daten:** Nur noch eine schlanke Hinweis-Karte „Demo-Profile" statt der drei großen Karten
- [ ] **Mobile:** Banner wrapping in zwei Zeilen, Demo-Tiles in 1-Spalten-Grid, Button auf voller Breite

---

## Nachtrag 9 — Equipment-Trennung: Bank, Squat Rack, Filter `every`

**Datum:** 11.04.2026
**Auslöser:** User-Beobachtung beim Test des Übungspickers — bei Heim-Übungen mit `eq: ['Kurzhanteln']` wurden Übungen vorgeschlagen, die laut Beschreibung explizit eine Bank brauchen („Rudern eng mit Kurzhantel" → *„Freie Hand auf der Bank abstellen"*). Plus: Kurzhantel-Bankdrücken hatte zwar schon `['Kurzhanteln', 'Hantelbank']`, aber der Filter nutzte `.some()` — die Übung wurde also auch dann angezeigt, wenn nur Kurzhanteln verfügbar waren. Klassisches Off-by-Logic-Problem.

### Maßnahme

**Phase 1 — Filter umgestellt von `.some()` auf `.every()`** in beiden Stellen:

- `js/features/generator.js:286` — Wochenplan-Generator
- `js/pages/trainingsplan.js:676` — Übungspicker im Trainingsplan-Edit

Bedeutung: Eine Übung mit `['Kurzhanteln', 'Hantelbank']` erscheint jetzt nur, wenn das Athleten-Equipment für den Trainingsort *beide* Items als verfügbar markiert hat.

**Phase 2 — Hantelbank-Chip im Home-Equipment ergänzt** und Equipment-Liste aufgeräumt:

- Studio-Chips: `Langhantel · Kurzhanteln · Hantelbank · Squat Rack · Kabelzug · Maschinen · Klimmzugstange · Dip-Station` (SZ-Stange entfernt)
- Home-Chips: `Kurzhanteln · Langhantel · Hantelbank · Squat Rack · Klimmzugstange · Dip-Station · Widerstandsbänder · Gymnastikmatte · Ab Wheel` (Kettlebells entfernt)
- Outdoor-Chips: unverändert (`Klimmzugstange · Dip-Barren · Parallettes · Ringe · Widerstandsbänder`)

**Phase 3a — Lexikon: bestehende Bug-Übung gefixt**

| Übung | Vorher | Nachher | Begründung |
|---|---|---|---|
| Rudern eng mit Kurzhantel | `['Kurzhanteln']` | `['Kurzhanteln', 'Hantelbank']` | Beschreibung sagt explizit „Freie Hand auf der Bank abstellen" |

**Phase 3b — Squat Rack als neues Equipment-Item eingeführt**

Begründung: Eine schwere Langhantel-Kniebeuge braucht ein Power Rack zum Auflegen — ohne Rack ist sie gefährlich (kein Spotter, kein Sicherheitssystem). Wer zu Hause ohne Rack trainiert, soll die Übung nicht mehr im Picker sehen.

| Übung | Vorher | Nachher |
|---|---|---|
| Kniebeugen mit LH | `['Langhantel']` | `['Langhantel', 'Squat Rack']` |

Beschreibung der Übung wurde um den Hinweis ergänzt: *„Schwere Sätze nur mit Squat Rack und Sicherheitsablagen."*

**Hinweis:** Kreuzheben bleibt `['Langhantel']` — Kreuzheben startet vom Boden, kein Rack nötig.

**Phase 3c — SZ-Stange + Kettlebells entfernt (vorerst)**

Beide Equipment-Items waren als Chips im Profil-Edit verfügbar, aber keine einzige Übung im Lexikon nutzte sie. Tester konnten den Chip aktivieren und es passierte nichts. Pragmatisch entfernt.

**Folge-ToDo** im Wiki unter „Trainingsplaner: Lexikon um Kettlebell- und SZ-Stange-Übungen erweitern" — wenn passende Übungen ergänzt werden (Goblet Squat, Kettlebell Swing, Turkish Get-up, SZ-Curls, French Press), kommen die Chips wieder rein.

### Demo-Profile migriert

Beide Demo-JSONs mussten an das neue Equipment-Schema angepasst werden, sonst würden Tester nach dem Demo-Wechsel keine Langhantel-Kniebeugen mehr im Picker sehen (Squat Rack fehlte).

| Datei | Vorher | Nachher |
|---|---|---|
| `Trainingsplaner_Alexander_Demo.json` (Studio) | `["Langhantel", "Kurzhanteln", "Kabelzug", "Maschinen", "Klimmzugstange", "Hantelbank", "Dip-Barren"]` | `["Langhantel", "Kurzhanteln", "Hantelbank", "Squat Rack", "Kabelzug", "Maschinen", "Klimmzugstange", "Dip-Barren"]` |
| `Trainingsplaner_Julia_Demo.json` | Altes Array-Format mit Kleinbuchstaben (`langhantel, beinpresse, latzug ...`) | Neues Objekt-Format `{ studio: { available: [...] } }` mit kanonischen Werten |

Julia hatte zusätzlich noch das Legacy-Array-Format aus v1, das durch die Auto-Migration in `_applyProfile` umgewandelt wurde — aber mit *kleingeschriebenen* Werten, die im Lexikon-Filter nicht griffen. Migration jetzt direkt im JSON. Nebeneffekt: Das alte Array enthielt unbekannte Items wie `beinpresse`, `latzug`, `brustpresse` — die sind im neuen Lexikon-Schema nicht gültig (sie sind alle `Maschinen`). Im neuen Format steht jetzt nur `Maschinen` als Sammel-Item.

### `generate_demo.js` Hinweis

Der Generator entspricht ohnehin nicht mehr dem Live-Stand der Demo-JSONs — er produziert Alexander mit `outdoor` + Calisthenics-Equipment, während die echte JSON `studio + home` mit ganz anderem Setup hat. Header-Kommentar ergänzt, dass die JSONs jetzt Source of Truth sind und Re-Generationen manuell nachgepflegt werden müssen.

### Betroffene Dateien (Nachtrag 9)

| Datei | Änderung |
|---|---|
| `js/features/generator.js` | `.some()` → `.every()` |
| `js/pages/trainingsplan.js` | `.some()` → `.every()` |
| `js/data/lexikon-data.js` | „Rudern eng mit Kurzhantel" + „Kniebeugen mit LH" eq-Arrays |
| `Trainingsplaner.html` | Studio-Chips: SZ-Stange raus, Squat Rack rein, Reorder. Home-Chips: Kettlebells raus, Hantelbank + Langhantel + Squat Rack rein |
| `Trainingsplaner_Alexander_Demo.json` | Studio-Equipment um Squat Rack ergänzt + Reorder |
| `Trainingsplaner_Julia_Demo.json` | Komplette Migration auf Objekt-Format mit kanonischen Equipment-Werten |
| `generate_demo.js` | Header-Hinweis, dass JSONs Source of Truth sind |
| `08_Obsidian/Alex Wiki/todos.md` | Bank-Item als erledigt markiert, neues ToDo „Kettlebell + SZ-Stange Lexikon-Übungen ergänzen" |

### Verifikation (durch User)

- [ ] **Empty-State, Equipment-Edit Home:** Hantelbank, Squat Rack, Langhantel sind als Chips verfügbar, Kettlebells sind weg
- [ ] **Empty-State, Equipment-Edit Studio:** Squat Rack ist neu sichtbar, SZ-Stange ist weg
- [ ] **Demo Alexander Vorschau:** Profil-Edit → Equipment Studio → Squat Rack ist als „verfügbar" (teal) markiert
- [ ] **Demo Julia Vorschau:** Equipment-Liste ist sauber im neuen Format
- [ ] **Übungspicker-Test (Studio):** Kniebeuge mit LH erscheint nur, wenn Squat Rack im Profil ist
- [ ] **Übungspicker-Test (Home ohne Bank):** Kurzhantel-Bankdrücken erscheint nicht mehr, Rudern eng mit Kurzhantel auch nicht
- [ ] **Übungspicker-Test (Home mit Bank):** Beide o. g. Übungen erscheinen wieder
- [ ] **Generator-Test:** Wochenplan mit Heim-Block ohne Bank → keine Bank-pflichtigen Übungen im Plan

# Rechtlicher Audit — Trainingsplaner v2

**Datum:** 10.04.2026  
**Geprüfte Version:** v2.7 (modular, GitHub Pages)  
**Repo:** `DaMagicCosta/trainingsplaner-app` (public, kein Build-Step)  
**Live-URL:** https://damagiccosta.github.io/trainingsplaner-app/Trainingsplaner.html

---

## 1. Urheberrecht / Lizenzen

### 1.1 Schriften (Fonts)

| Fund | Datei / Zeile | Risiko |
|------|---------------|--------|
| **Inter** (Body-Font) über Google Fonts CDN geladen | `Trainingsplaner.html:12` | 🟢 Niedrig (Lizenz) |
| **JetBrains Mono** (Code-Font) über Google Fonts CDN geladen | `Trainingsplaner.html:12` | 🟢 Niedrig (Lizenz) |

**Lizenzstatus:** Beide Fonts stehen unter der **SIL Open Font License (OFL)** — kommerzielle und nicht-kommerzielle Nutzung erlaubt, Redistribution erlaubt. Korrekt im Credits-Bereich (`Trainingsplaner.html:1847`) als "Inter (OFL) · JetBrains Mono (OFL)" attributiert.

**Handlungsbedarf:** Keiner hinsichtlich Lizenz. DSGVO-Problem siehe Abschnitt 2.

### 1.2 Icons / Symbole

| Fund | Details | Risiko |
|------|---------|--------|
| Ausschließlich **Unicode-Zeichen und Emojis** verwendet | ◆, ◇, ⌂, ✦, ◉, ⟳, ✕, 🐛, 🦋 etc. | 🟢 Niedrig |
| **Inline-SVG-Favicon** (Hantel-Icon) | `Trainingsplaner.html:9` — eigenes SVG als Data-URI | 🟢 Niedrig |

**Handlungsbedarf:** Keiner. Keine externen Icon-Libraries (kein FontAwesome, kein Material Icons).

### 1.3 Bilder / Grafiken

| Fund | Details | Risiko |
|------|---------|--------|
| **Splash-Portrait** als Base64-JPEG eingebettet | `Trainingsplaner.html:31` — eigenes Portraitfoto von Alexander da Costa Amaral | 🟢 Niedrig |
| `alexander-portrait.jpg` im Repo-Root | Selbes Bild als Datei | 🟢 Niedrig |

**Handlungsbedarf:** Keiner. Eigenes Foto, keine Drittanbieter-Bilder. Keine Stock-Fotos.

### 1.4 JavaScript-Bibliotheken

| Library | Version | Quelle | Lizenz | Datei / Zeile | Risiko |
|---------|---------|--------|--------|---------------|--------|
| **Chart.js** | 4.4.7 | `cdn.jsdelivr.net` (CDN) | **MIT** | `Trainingsplaner.html:13` | 🟢 Niedrig (Lizenz) |

**Handlungsbedarf:** MIT-Lizenz erlaubt alles. Korrekt in Credits attributiert (`Trainingsplaner.html:1847`). DSGVO-Problem durch CDN-Einbindung siehe Abschnitt 2.

### 1.5 CSS-Frameworks

**Keine externen CSS-Frameworks.** Alle 11 CSS-Dateien (`css/tokens.css`, `css/layout.css`, `css/components.css`, 6 Page-CSS, `css/splash.css`, `css/responsive.css`) sind komplett eigener Code.

**Handlungsbedarf:** Keiner.

### 1.6 Übungsdatenbank

| Fund | Details | Risiko |
|------|---------|--------|
| **85+ Übungen** in `js/data/lexikon-data.js` (609 Zeilen) | Eigene deutsche Beschreibungen mit Muskel-, Sekundär-, Antagonist-Angaben | 🟢 Niedrig |
| Übungsnamen sind **generische Bezeichnungen** | "Flachbankdrücken mit der Langhantel", "Kniebeuge", "Liegestütze" etc. | 🟢 Niedrig |
| **NSCA/ACSM-basierte Kraft-Standards** | `js/pages/fortschritt.js:516–531` — BW-Ratios für 5 Grundübungen | 🟡 Mittel |
| Credits: "Sportwissenschaftliche Grundlagen aus WIFI-Ausbildung & Diplomarbeit" | `Trainingsplaner.html:1839` | 🟢 Niedrig |

**Bewertung:** Übungsnamen wie "Bankdrücken" oder "Kniebeuge" sind generische, nicht schützbare Bezeichnungen. Die Beschreibungen sind eigene Formulierungen, keine Kopien aus NSCA/ExRx-Datenbanken. Die Kraft-Standards-Ratios (z.B. 1.0×BW für Bankdrücken bei Fortgeschrittenen) sind allgemein bekanntes sportwissenschaftliches Wissen und nicht urheberrechtlich geschützt.

**Handlungsbedarf:** Die Quelle der Kraft-Standards sollte im Credits-Bereich ergänzt werden: "Kraft-Standards basierend auf NSCA/ACSM-Richtwerten". Das schützt vor Vorwürfen und erhöht die Glaubwürdigkeit.

### 1.7 Sounds / Audio

**Keine Audio-Dateien vorhanden.** Keine `<audio>`-Elemente, keine `.mp3`/`.wav`/`.ogg`-Dateien.

**Handlungsbedarf:** Keiner.

---

## 2. Datenschutz (DSGVO)

### 2.1 Personenbezogene Daten

| Datentyp | Speicherort | Risiko |
|----------|-------------|--------|
| **Name, Nachname** | localStorage (`tpv2_profile_data`) | 🟡 Mittel |
| **Alter, Gewicht, Größe, Geschlecht** | localStorage | 🟡 Mittel |
| **HFmax (Herzfrequenz)** | localStorage | 🟡 Mittel |
| **Anamnese-Daten** (Gesundheitszustand) | localStorage (aktuell nur Demo-Daten, aber geplant als echte Eingabe) | 🔴 Hoch |
| **Trainingshistorie** (Sessions, Gewichte, Wiederholungen) | localStorage | 🟡 Mittel |
| **Trainingseinstellungen** (Tage, Ziele, Equipment) | localStorage | 🟢 Niedrig |

**Bewertung:** Die App verarbeitet **Gesundheitsdaten** (Anamnese, Körpermaße, HFmax) — das sind nach Art. 9 DSGVO **besondere Kategorien personenbezogener Daten**. Obwohl alle Daten rein lokal bleiben (kein Server, kein Cloud-Upload), entsteht durch die **externe CDN-Einbindung** (Google Fonts, jsdelivr) eine Datenübertragung.

### 2.2 Externe Datenübertragungen

| Dienst | Was wird übertragen? | Wohin? | Datei / Zeile | Risiko |
|--------|---------------------|--------|---------------|--------|
| **Google Fonts** (fonts.googleapis.com + fonts.gstatic.com) | IP-Adresse, User-Agent, Referrer | Google LLC, USA | `Trainingsplaner.html:10–12` | 🔴 Hoch |
| **jsDelivr CDN** (cdn.jsdelivr.net) | IP-Adresse, User-Agent, Referrer | Prospect One (EU/US-Infrastruktur) | `Trainingsplaner.html:13` | 🟡 Mittel |

**Bewertung Google Fonts:** Das LG München hat am 20.01.2022 (Az. 3 O 17493/20) entschieden, dass die Einbindung von Google Fonts über die Google-Server ohne Einwilligung des Nutzers eine Verletzung des Persönlichkeitsrechts darstellt und gegen die DSGVO verstößt. Die IP-Adresse wird an Google in die USA übermittelt. **Das ist der schwerwiegendste Fund dieses Audits.**

**Bewertung jsDelivr:** jsDelivr hat EU-Infrastruktur und eine klare Datenschutzrichtlinie. Das Risiko ist geringer als bei Google Fonts, aber die IP-Übertragung ist DSGVO-relevant.

### 2.3 Tracking / Analytics

**Kein Tracking vorhanden.** Kein Google Analytics, kein Matomo, kein Facebook Pixel, kein Hotjar. Keine Cookies.

**Handlungsbedarf:** Keiner.

### 2.4 Cookie-Banner

**Nicht nötig.** Die App verwendet keine Cookies. localStorage und sessionStorage fallen nicht unter die Cookie-Richtlinie (ePrivacy), da sie technisch notwendig sind.

### 2.5 Datenschutzerklärung

| Fund | Risiko |
|------|--------|
| **Keine Datenschutzerklärung in v2 vorhanden** | 🔴 Hoch |
| v1 hatte eine rudimentäre Datenspeicherungsklausel im Impressum (`Trainingsplaner_v1_archiv.html:3371–3373`) | — |

**Handlungsbedarf:** Eine Datenschutzerklärung ist **Pflicht**, sobald personenbezogene Daten verarbeitet werden — und die App verarbeitet Name, Körperdaten und potenziell Gesundheitsdaten. Die Erklärung muss umfassen:
- Verantwortlicher (Name, Adresse, E-Mail)
- Welche Daten werden verarbeitet (localStorage-Daten auflisten)
- Rechtsgrundlage (Art. 6 Abs. 1 lit. a DSGVO — Einwilligung durch Nutzung)
- Externe Dienste (Google Fonts, jsDelivr) mit IP-Übertragung
- Betroffenenrechte (Auskunft, Löschung, Widerspruch)
- Hinweis auf rein lokale Speicherung

---

## 3. Impressumspflicht

### 3.1 Status

| Fund | Risiko |
|------|--------|
| **Kein Impressum in v2 vorhanden** | 🔴 Hoch |
| v1 hatte ein vollständiges Impressum nach § 25 MedienG (AT) | `Trainingsplaner_v1_archiv.html:3347–3378` |

### 3.2 Rechtliche Einordnung

**Österreichisches Recht (ECG + MedienG):**
- § 5 ECG: Impressumspflicht für alle "Dienste der Informationsgesellschaft" — eine öffentlich zugängliche Web-App auf GitHub Pages fällt darunter.
- § 25 MedienG: Offenlegungspflicht für "periodische Medien" — eine regelmäßig aktualisierte Web-App kann darunter fallen.
- Die App ist als "privat, nicht-kommerziell" deklariert (v1-Impressum), was die Anforderungen leicht reduziert, aber **nicht aufhebt**.

**Deutsches Recht (TMG/DDG):**
- § 5 TMG (bzw. DDG seit 2024): Ebenfalls Impressumspflicht für öffentlich erreichbare Telemedien.
- Da die App unter einer `.github.io`-Domain weltweit erreichbar ist, greift auch deutsches Recht für deutsche Nutzer.

### 3.3 Handlungsbedarf

Das v1-Impressum war gut formuliert und sollte nach v2 portiert werden. Es enthielt:
- Verantwortlicher: Alexander da Costa Amaral, Graz, Österreich
- E-Mail: trainingsplaner@dacostaamaral.at
- Art des Angebots: Privat, nicht-kommerziell
- Haftung für Inhalte
- Datenspeicherungshinweis

**→ MUSS vor Release portiert werden.**

---

## 4. Haftung

### 4.1 Trainingsempfehlungen

| Fund | Details | Risiko |
|------|---------|--------|
| **Gewichtsvorschläge** basierend auf letztem Training | `js/pages/trainingsplan.js` — "letztes"-Tag bei offenen Sätzen | 🟡 Mittel |
| **Readiness-Score** bewertet Trainingsbereitschaft | `js/features/readiness.js` — 4-Komponenten-Formel | 🟡 Mittel |
| **Kraft-Standards** vergleichen Nutzer mit NSCA/ACSM-Normen | `js/pages/fortschritt.js:516ff` — Einstufung Anfänger bis Elite | 🟡 Mittel |
| **Wochenplan-Generator** erstellt automatisch Trainingspläne | `js/features/generator.js` — bis 4 Blöcke, Equipment-Filter | 🟡 Mittel |
| **1RM-Berechnung** (Epley-Formel) | Formel ist wissenschaftlich anerkannt, aber Schätzung | 🟢 Niedrig |
| **HFmax-Berechnung** (220 - Alter) | Grobe Schätzformel, individuell ungenau | 🟡 Mittel |

### 4.2 Haftungsausschluss / Disclaimer

| Fund | Risiko |
|------|--------|
| **Kein Haftungsausschluss in v2 vorhanden** | 🔴 Hoch |
| v1 hatte ausführliche Nutzungsbedingungen + Haftungsausschluss | `Trainingsplaner_v1_archiv.html:3381–3419` |

**Bewertung:** Die App gibt konkrete Trainingsempfehlungen (Gewichte, Übungsauswahl, Periodisierung, Readiness-Bewertung). Ohne Haftungsausschluss besteht ein theoretisches Haftungsrisiko, falls sich jemand bei der Befolgung der Empfehlungen verletzt.

Das v1-AGB-Modal war sehr gut aufgebaut mit:
1. Geltungsbereich
2. Kein medizinischer Rat
3. Eigenverantwortung
4. Haftungsausschluss (Verletzungen, Empfehlungen, Datenverlust, Kontraindikationen)
5. Datenspeicherung
6. Anamnesebogen-Pflicht
7. Änderungsvorbehalt

**→ MUSS vor Release portiert werden.**

---

## 5. Open Source / Repository

### 5.1 Repo-Status

| Fund | Details | Risiko |
|------|---------|--------|
| **Repo ist public** | `DaMagicCosta/trainingsplaner-app`, Visibility: public | 🟡 Mittel |
| **Keine LICENSE-Datei** im Repo | GitHub zeigt "No license" | 🔴 Hoch |

### 5.2 Bewertung

Ein **öffentliches Repository ohne Lizenz** bedeutet nach GitHub-ToS und geltendem Urheberrecht:
- Andere dürfen den Code **ansehen** und **forken** (GitHub-ToS erlauben das).
- Andere dürfen den Code **nicht verwenden, kopieren, modifizieren oder verbreiten** — es gilt automatisch "All Rights Reserved".
- Das ist vermutlich nicht die Absicht. Wenn der Code privat bleiben soll, sollte das Repo auf "private" gestellt werden. Wenn Open Source gewünscht ist, braucht es eine Lizenz.

### 5.3 Lizenzkompatibilität der Dependencies

| Dependency | Lizenz | Kompatibel mit MIT? | Kompatibel mit Proprietary? |
|------------|--------|--------------------|-----------------------------|
| Chart.js 4.4.7 | MIT | ✅ | ✅ |
| Inter Font | OFL 1.1 | ✅ | ✅ |
| JetBrains Mono | OFL 1.1 | ✅ | ✅ |

**Handlungsbedarf:** 
- Entweder eine `LICENSE`-Datei hinzufügen (z.B. MIT, Apache 2.0) ODER das Repo auf "private" stellen.
- Bei MIT-Lizenz: Alle Dependencies sind kompatibel.

---

## 6. Zusammenfassung — Handlungsbedarf vor Release

### 🔴 MUSS erledigt werden (Rechtsrisiko)

| # | Was | Warum | Aufwand |
|---|-----|-------|---------|
| 1 | **Google Fonts lokal hosten** | DSGVO-Verstoß durch IP-Übertragung an Google (LG München 2022). Fonts herunterladen und aus `css/fonts/` laden. | 30 Min |
| 2 | **Chart.js lokal einbinden** | IP-Übertragung an jsdelivr CDN vermeiden. `chart.umd.min.js` herunterladen und aus `js/lib/` laden. | 15 Min |
| 3 | **Impressum in v2 einbauen** | Pflicht nach ECG § 5 / MedienG § 25 (AT) bzw. DDG § 5 (DE). v1-Text portieren. | 30 Min |
| 4 | **Datenschutzerklärung erstellen** | DSGVO-Pflicht. Muss Datenverarbeitung (localStorage), externe Dienste und Betroffenenrechte abdecken. | 1 Std |
| 5 | **Nutzungsbedingungen + Haftungsausschluss portieren** | Haftungsrisiko bei Trainingsempfehlungen. v1-AGB-Modal portieren. | 30 Min |
| 6 | **LICENSE-Datei hinzufügen oder Repo auf private stellen** | Public Repo ohne Lizenz = unklar für andere. Bewusste Entscheidung treffen. | 5 Min |

### 🟡 SOLLTE erledigt werden (Best Practice)

| # | Was | Warum |
|---|-----|-------|
| 7 | Kraft-Standards-Quelle im Credits ergänzen | "Basierend auf NSCA/ACSM-Richtwerten" — Transparenz und Glaubwürdigkeit |
| 8 | Erste-Nutzung-Hinweis auf Datenspeicherung | Beim Profil-Erstellen kurzer Hinweis: "Alle Daten bleiben auf deinem Gerät" |
| 9 | Übungsdatenbank-Herkunft in Credits präzisieren | Aktuell: "aus Original-App portiert" — Quelle (eigene WIFI-Ausbildung) klarer benennen |

### 🟢 Kein Handlungsbedarf

- Keine externen Icon-Libraries → keine Lizenzprobleme
- Keine Audio-Dateien → kein Lizenzproblem
- Keine CSS-Frameworks → kein Lizenzproblem
- Kein Tracking/Analytics → kein DSGVO-Problem
- Keine Cookies → kein Banner nötig
- Übungsnamen sind generisch → nicht urheberrechtlich schützbar
- Portrait ist eigenes Foto → kein Bildrechtsproblem
- Favicon ist eigenes SVG → kein Problem

---

## Fazit

Die Trainingsplaner-App ist in Bezug auf verwendete Libraries und Assets **sauber aufgestellt** — nur drei externe Dependencies (Chart.js, Inter, JetBrains Mono), alle mit permissiven Lizenzen und korrekt attributiert.

Das Hauptproblem ist die **fehlende rechtliche Infrastruktur in v2**: Impressum, Datenschutzerklärung und Nutzungsbedingungen waren in v1 vorhanden und gut formuliert, wurden aber beim v2-Redesign nicht portiert. Dazu kommt die **DSGVO-kritische Einbindung von Google Fonts über CDN** und das **fehlende Lizenzmodell** für das öffentliche Repository.

**Geschätzter Gesamtaufwand für alle Pflichtmaßnahmen: ca. 3 Stunden.**

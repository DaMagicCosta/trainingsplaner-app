// Demo-Profil Generator: Alexander (Cali) + Julia (Studio)
// Ausführen: node generate_demo.js
// Erzeugt: Trainingsplaner_Alexander_Demo.json (Hauptprofil)
//
// HINWEIS (11.04.2026): Die Demo-JSONs werden mittlerweile manuell
// gepflegt — der Generator entspricht nicht mehr dem Live-Stand
// (Equipment-Format, Squat Rack, anamnesis/agreement-Felder etc.).
// Bei einer Neugeneration musst du die Equipment-Listen und Profil-
// Felder anschließend von Hand auf den aktuellen Stand bringen.
//          + Julia-Daten werden in die v2-HTML eingebettet

const fs = require('fs');

// --- Hilfsfunktionen ---
function getISOWeek(d) {
  const date = new Date(d.getTime());
  date.setHours(0,0,0,0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

function rand(min, max) { return Math.round((Math.random() * (max - min) + min) * 2) / 2; }

// --- Alexanders Calisthenics-Übungen ---
const caliExercises = {
  // Push
  'Liegestütze (klassisch)':       { muscle:'Großer Brustmuskel, Trizeps, Deltamuskel', start:0, max:0, group:'push', isBodyweight:true, bwReps:true },
  'Archer Liegestütze':            { muscle:'Großer Brustmuskel, Trizeps', start:0, max:0, group:'push', isBodyweight:true, bwReps:true },
  'Pseudo Planche Push-ups':       { muscle:'Großer Brustmuskel, Deltamuskel, Trizeps', start:0, max:0, group:'push', isBodyweight:true, bwReps:true },
  'Dips am Barren':                { muscle:'Trizeps, Brustmuskel', start:0, max:25, group:'push', isBodyweight:true },
  'Pike Push-ups':                 { muscle:'Deltamuskel, Trizeps', start:0, max:0, group:'push', isBodyweight:true, bwReps:true },
  'Handstand Push-ups (Wand)':     { muscle:'Deltamuskel, Trizeps, Trapezmuskel', start:0, max:0, group:'push', isBodyweight:true, bwReps:true },
  // Pull
  'Klimmzug (überhand)':           { muscle:'Breiter Rückenmuskel, Bizeps', start:0, max:20, group:'pull', isBodyweight:true },
  'Klimmzug (unterhand)':          { muscle:'Bizeps, Breiter Rückenmuskel', start:0, max:15, group:'pull', isBodyweight:true },
  'Muscle-Up (Stange)':            { muscle:'Breiter Rückenmuskel, Trizeps, Deltamuskel', start:0, max:0, group:'pull', isBodyweight:true, bwReps:true },
  'Australian Pull-ups':           { muscle:'Breiter Rückenmuskel, Bizeps, Rautenmuskeln', start:0, max:0, group:'pull', isBodyweight:true, bwReps:true },
  'Front Lever Rows':              { muscle:'Breiter Rückenmuskel, Gerader Bauchmuskel', start:0, max:0, group:'pull', isBodyweight:true, bwReps:true },
  // Legs
  'Pistol Squats':                 { muscle:'Quadrizeps, Gesäßmuskel', start:0, max:10, group:'legs', isBodyweight:true },
  'Bulgarische Split-Kniebeuge':   { muscle:'Quadrizeps, Gesäßmuskel, Hüftbeuger', start:0, max:20, group:'legs', isBodyweight:true },
  'Nordische Beinbeuger':          { muscle:'Beinbizeps', start:0, max:0, group:'legs', isBodyweight:true, bwReps:true },
  'Step-Ups (erhöht)':             { muscle:'Quadrizeps, Gesäßmuskel', start:0, max:15, group:'legs', isBodyweight:true },
  'Wadenheben (einbeinig)':        { muscle:'Wadenmuskel', start:0, max:0, group:'legs', isBodyweight:true, bwReps:true },
  // Core
  'Dragon Flag':                   { muscle:'Gerader Bauchmuskel, Querer Bauchmuskel', start:0, max:0, group:'core', isBodyweight:true, bwReps:true },
  'L-Sit (Parallettes)':          { muscle:'Gerader Bauchmuskel, Hüftbeuger', start:0, max:0, group:'core', isometric:true },
  'Plank (Unterarmstütz)':         { muscle:'Gerader Bauchmuskel, Rumpf', start:0, max:0, isometric:true, group:'core' },
  'Hanging Leg Raises':            { muscle:'Gerader Bauchmuskel, Hüftbeuger', start:0, max:0, group:'core', isBodyweight:true, bwReps:true },
};

// --- Julias Studio-Übungen (angepasste Gewichte für Frauen) ---
const studioExercises = {
  'Chest Press – Bankdrückmaschine': { muscle:'Großer Brustmuskel, Trizeps', start:15, max:40, group:'push' },
  'Butterfly (Maschine)':          { muscle:'Großer Brustmuskel', start:10, max:30, group:'push' },
  'Schulterdrücken (Maschine)':    { muscle:'Deltamuskel, Trizeps', start:10, max:27.5, group:'push' },
  'Seitenheben':                   { muscle:'Mittlerer Deltamuskel', start:3, max:8, group:'push' },
  'Trizepsdrücken (Kabel)':        { muscle:'Trizeps', start:7.5, max:20, group:'push' },
  'Latzug zur Brust':              { muscle:'Breiter Rückenmuskel, Bizeps', start:20, max:45, group:'pull' },
  'Cable Row (sitzend)':           { muscle:'Breiter Rückenmuskel, Rautenmuskeln', start:17.5, max:40, group:'pull' },
  'Face Pulls (Kabel)':            { muscle:'Hinterer Deltamuskel, Trapezmuskel', start:7.5, max:17.5, group:'pull' },
  'Bizeps-Curls (Kurzhantel)':     { muscle:'Bizeps', start:4, max:10, group:'pull' },
  'Beinpresse':                    { muscle:'Quadrizeps, Gesäßmuskel', start:40, max:120, group:'legs' },
  'Rumänisches Kreuzheben':        { muscle:'Beinbizeps, Gesäßmuskel', start:20, max:55, group:'legs' },
  'Beinstrecker':                  { muscle:'Quadrizeps', start:15, max:40, group:'legs' },
  'Beinbeuger':                    { muscle:'Beinbizeps', start:12.5, max:32.5, group:'legs' },
  'Hip Thrust (Langhantel)':       { muscle:'Großer Gesäßmuskel, Beinbizeps', start:30, max:80, group:'legs' },
  'Wadenheben (stehend)':          { muscle:'Wadenmuskel', start:20, max:50, group:'legs' },
  'Plank (Unterarmstütz)':         { muscle:'Gerader Bauchmuskel, Rumpf', start:0, max:0, isometric:true, group:'core' },
  'Russian Twist':                 { muscle:'Schräge Bauchmuskulatur', start:3, max:8, group:'core' },
};

// --- Block-Templates ---
const caliBlocks = {
  akkumulation: { saetze:3, wdh:15, days: [
    { label:'Mo', exercises:['Liegestütze (klassisch)','Archer Liegestütze','Pike Push-ups','Dips am Barren','Hanging Leg Raises'] },
    { label:'Mi', exercises:['Pistol Squats','Bulgarische Split-Kniebeuge','Nordische Beinbeuger','Step-Ups (erhöht)','Wadenheben (einbeinig)'] },
    { label:'Fr', exercises:['Klimmzug (überhand)','Australian Pull-ups','Klimmzug (unterhand)','Dragon Flag','Plank (Unterarmstütz)'] },
  ]},
  intensifikation: { saetze:4, wdh:10, days: [
    { label:'Mo', exercises:['Pseudo Planche Push-ups','Dips am Barren','Handstand Push-ups (Wand)','Pike Push-ups','Hanging Leg Raises'] },
    { label:'Mi', exercises:['Pistol Squats','Bulgarische Split-Kniebeuge','Nordische Beinbeuger','Wadenheben (einbeinig)','L-Sit (Parallettes)'] },
    { label:'Fr', exercises:['Muscle-Up (Stange)','Klimmzug (überhand)','Front Lever Rows','Klimmzug (unterhand)','Dragon Flag'] },
  ]},
  peak: { saetze:5, wdh:5, days: [
    { label:'Mo', exercises:['Pseudo Planche Push-ups','Dips am Barren','Handstand Push-ups (Wand)','Archer Liegestütze'] },
    { label:'Mi', exercises:['Pistol Squats','Nordische Beinbeuger','Bulgarische Split-Kniebeuge','Plank (Unterarmstütz)'] },
    { label:'Fr', exercises:['Muscle-Up (Stange)','Klimmzug (überhand)','Front Lever Rows','Dragon Flag'] },
  ]}
};

const studioBlocks = {
  akkumulation: { saetze:3, wdh:20, days: [
    { label:'Mo', exercises:['Chest Press – Bankdrückmaschine','Butterfly (Maschine)','Schulterdrücken (Maschine)','Seitenheben','Trizepsdrücken (Kabel)'] },
    { label:'Mi', exercises:['Beinpresse','Rumänisches Kreuzheben','Hip Thrust (Langhantel)','Beinstrecker','Wadenheben (stehend)'] },
    { label:'Fr', exercises:['Latzug zur Brust','Cable Row (sitzend)','Face Pulls (Kabel)','Bizeps-Curls (Kurzhantel)','Plank (Unterarmstütz)'] },
  ]},
  intensifikation: { saetze:4, wdh:10, days: [
    { label:'Mo', exercises:['Chest Press – Bankdrückmaschine','Butterfly (Maschine)','Schulterdrücken (Maschine)','Seitenheben','Trizepsdrücken (Kabel)'] },
    { label:'Mi', exercises:['Beinpresse','Hip Thrust (Langhantel)','Rumänisches Kreuzheben','Beinbeuger','Wadenheben (stehend)','Russian Twist'] },
    { label:'Fr', exercises:['Latzug zur Brust','Cable Row (sitzend)','Face Pulls (Kabel)','Bizeps-Curls (Kurzhantel)','Plank (Unterarmstütz)'] },
  ]},
  peak: { saetze:4, wdh:6, days: [
    { label:'Mo', exercises:['Chest Press – Bankdrückmaschine','Schulterdrücken (Maschine)','Butterfly (Maschine)','Trizepsdrücken (Kabel)'] },
    { label:'Mi', exercises:['Beinpresse','Hip Thrust (Langhantel)','Rumänisches Kreuzheben','Beinbeuger','Plank (Unterarmstütz)'] },
    { label:'Fr', exercises:['Latzug zur Brust','Cable Row (sitzend)','Face Pulls (Kabel)','Bizeps-Curls (Kurzhantel)','Russian Twist'] },
  ]}
};

const blockCycle = ['akkumulation','intensifikation','peak'];
const blockLength = 4;
const regenInterval = 13;

// --- Gewichtsprogression ---
function getWeight(exDef, weekIndex, totalWeeks) {
  if (!exDef || exDef.isometric) return null;
  if (exDef.bwReps) return null; // reine Bodyweight-Übung, nur Wdh variieren
  if (exDef.isBodyweight) {
    const progress = Math.min(weekIndex / totalWeeks, 1);
    return Math.round(exDef.max * Math.pow(progress, 0.6) * 2) / 2;
  }
  const range = exDef.max - exDef.start;
  const progress = Math.min(weekIndex / totalWeeks, 1);
  const base = exDef.start + range * Math.pow(progress, 0.55);
  const variance = (Math.random() - 0.5) * 5;
  return Math.max(exDef.start, Math.round((base + variance) * 2) / 2);
}

function getRepVariation(baseWdh, exDef, setIdx, totalSets, weekIndex, totalWeeks) {
  if (exDef && exDef.isometric) return Math.round(30 + Math.random() * 30);
  if (exDef && exDef.bwReps) {
    // BW-Übungen: Wdh steigen mit der Zeit
    const progress = Math.min(weekIndex / totalWeeks, 1);
    const baseReps = Math.round(5 + progress * 15);
    const variance = Math.round((Math.random() - 0.5) * 4);
    if (setIdx >= totalSets - 1) return Math.max(1, baseReps + variance - 2);
    return Math.max(1, baseReps + variance);
  }
  const wdh = Math.max(1, baseWdh + Math.round((Math.random() - 0.5) * 4));
  if (setIdx >= totalSets - 1) return Math.max(1, wdh - Math.floor(Math.random() * 3));
  return wdh;
}

// --- Profil generieren ---
function generateProfile(name, nachname, alter, gewicht, groesse, hfmax, goal, exerciseDefs, blockDefs, location, equipment) {
  const startDate = new Date(2023, 0, 2);
  const endDate   = new Date(2026, 3, 5);
  const totalWeeks = Math.floor((endDate - startDate) / (7 * 86400000));

  const profile = {
    id: 'p_demo_' + Date.now() + '_' + name.toLowerCase(),
    name, nachname, alter, gewicht, groesse, hfmax, goal,
    tage: ['Mo','Mi','Fr'],
    trainingLocation: location,
    equipment,
    role: 'athlete',
    pin: '',
    plans: {},
    sessions: [],
    regenConfig: { interval: regenInterval, athleteCanSetRegen: true, maxAthleteRegen: 2, regenBetween: false },
    athleteRegenWeeks: [],
    periodization: {
      active: true, startKw: 1, blockLength,
      blocks: [
        { label:'Akkumulation (GPP)', color:'#4cc9f0', goal:'kraftausdauer', length:4 },
        { label:'Intensifikation (SPP)', color:'#f4a261', goal:'hypertrophie', length:4 },
        { label:'Peak / Skills', color:'#9b5de5', goal:'maximalkraft', length:4 },
      ]
    },
    createdAt: startDate.toISOString(),
    createdBy: 'demo',
    onboarding: { status: 'complete' }
  };

  const regenWeeks = [];
  for (let r = regenInterval; r <= totalWeeks; r += regenInterval) regenWeeks.push(r);

  const allSessions = [];

  // Dips/Tiefs einbauen: ~3-4 Wochen mit deutlich schlechteren Werten
  const dipWeeks = new Set();
  for (let i = 0; i < 6; i++) {
    const dipStart = Math.floor(Math.random() * (totalWeeks - 4)) + 10;
    for (let d = 0; d < Math.floor(Math.random() * 3) + 2; d++) dipWeeks.add(dipStart + d);
  }

  for (let w = 0; w < totalWeeks; w++) {
    const weekDate = new Date(startDate.getTime() + w * 7 * 86400000);
    const kw = getISOWeek(weekDate);
    const kwKey = 'w' + kw;
    const isRegen = regenWeeks.includes(w + 1);
    if (isRegen) continue;
    if (Math.random() < 0.05) continue; // Ausfälle

    const cycleWeek = w % (blockLength * 3);
    const blockIdx = Math.floor(cycleWeek / blockLength);
    const blockName = blockCycle[blockIdx];
    const template = blockDefs[blockName];
    const isDip = dipWeeks.has(w);

    const planDays = template.days.map(dayTemplate => ({
      label: dayTemplate.label,
      exercises: dayTemplate.exercises.map(exName => {
        const ex = exerciseDefs[exName];
        let kg = getWeight(ex, w, totalWeeks);
        if (isDip && kg) kg = Math.max((ex?.start || 0), kg * rand(0.7, 0.85));
        return {
          name: exName,
          muscle: ex ? ex.muscle : '',
          saetze: template.saetze,
          wdh: ex && ex.isometric ? 30 : template.wdh,
          gewicht: kg != null ? Math.round(kg * 2) / 2 : ''
        };
      })
    }));

    profile.plans[kwKey] = {
      name: template.saetze + '×' + template.wdh + ' ' + blockName.charAt(0).toUpperCase() + blockName.slice(1),
      goal: blockName === 'akkumulation' ? 'kraftausdauer' : (blockName === 'intensifikation' ? 'hypertrophie' : 'maximalkraft'),
      _source: 'auto', _block: blockIdx, days: planDays
    };

    const trainDays = Math.random() < 0.15 ? 2 : 3;
    for (let d = 0; d < trainDays && d < planDays.length; d++) {
      const dayData = planDays[d];
      const sessionDate = new Date(weekDate.getTime() + (d === 0 ? 0 : d === 1 ? 2 : 4) * 86400000);

      const sessionExercises = dayData.exercises.map(planEx => {
        const ex = exerciseDefs[planEx.name];
        const sets = [];
        for (let s = 0; s < template.saetze; s++) {
          let wdh = getRepVariation(planEx.wdh || template.wdh, ex, s, template.saetze, w, totalWeeks);
          let gewicht = planEx.gewicht || null;
          if (gewicht && typeof gewicht === 'number') {
            gewicht = Math.max(0, gewicht + (Math.random() - 0.4) * 5);
            gewicht = Math.round(gewicht * 2) / 2;
            if (isDip) gewicht = Math.max(0, gewicht * rand(0.75, 0.9));
          }
          const rpe = isDip ? rand(8, 10) : rand(6, 9.5);
          sets.push({ wdh, gewicht, rpe });
        }
        return { name: planEx.name, muscle: planEx.muscle, isometric: !!(ex && ex.isometric), sets };
      });

      allSessions.push({
        id: 's_' + Date.now() + '_' + w + '_' + d,
        date: sessionDate.toLocaleDateString('de-DE'),
        kw, dayIdx: d,
        exercises: sessionExercises
      });
    }
  }

  allSessions.sort((a, b) => {
    const da = a.date.split('.').reverse().join('');
    const db = b.date.split('.').reverse().join('');
    return db.localeCompare(da);
  });
  profile.sessions = allSessions;
  return profile;
}

// --- Alexander: Calisthenics ---
const alexander = generateProfile(
  'Alexander', 'da Costa Amaral', 39, 82, 180, 181, 'hypertrophie',
  caliExercises, caliBlocks, 'outdoor',
  ['klimmzugstange','dip_barren','parallettes','ringe','baender']
);

// --- Julia: Studio ---
const julia = generateProfile(
  'Julia', 'da Costa Amaral', 38, 62, 168, 182, 'kraftausdauer',
  studioExercises, studioBlocks, 'studio',
  ['langhantel','kurzhantel','kabelzug','beinpresse','latzug','brustpresse','beinstrecker','beinbeuger']
);

// --- Speichern ---
const filename = 'Trainingsplaner_Alexander_Demo.json';
fs.writeFileSync(filename, JSON.stringify(alexander, null, 2), 'utf-8');

const juliaFilename = 'Trainingsplaner_Julia_Demo.json';
fs.writeFileSync(juliaFilename, JSON.stringify(julia, null, 2), 'utf-8');

console.log('=== Alexander (Cali) ===');
console.log('Sessions: ' + alexander.sessions.length);
console.log('Pläne: ' + Object.keys(alexander.plans).length);
console.log('Datei: ' + filename + ' (' + (fs.statSync(filename).size / 1024).toFixed(0) + ' KB)');
console.log('');
console.log('=== Julia (Studio) ===');
console.log('Sessions: ' + julia.sessions.length);
console.log('Pläne: ' + Object.keys(julia.plans).length);
console.log('Datei: ' + juliaFilename + ' (' + (fs.statSync(juliaFilename).size / 1024).toFixed(0) + ' KB)');

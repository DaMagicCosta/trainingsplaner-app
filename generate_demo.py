"""Demo-Profil Generator: Alexander (Cali) + Julia (Studio) — Python-Version"""
import json, random, math, os
from datetime import datetime, timedelta

def iso_week(d):
    return d.isocalendar()[1]

def rand_half(lo, hi):
    return round(random.uniform(lo, hi) * 2) / 2

def fmt_de(d):
    return f"{d.day:02d}.{d.month:02d}.{d.year}"

# ── Calisthenics-Übungen (Alexander) ──
cali = {
    'Liegestütze (klassisch)':    {'muscle':'Großer Brustmuskel, Trizeps, Deltamuskel','start':0,'max':0,'group':'push','bw':True},
    'Archer Liegestütze':         {'muscle':'Großer Brustmuskel, Trizeps','start':0,'max':0,'group':'push','bw':True},
    'Pseudo Planche Push-ups':    {'muscle':'Großer Brustmuskel, Deltamuskel, Trizeps','start':0,'max':0,'group':'push','bw':True},
    'Dips am Barren':             {'muscle':'Trizeps, Brustmuskel','start':0,'max':25,'group':'push','weighted':True},
    'Pike Push-ups':              {'muscle':'Deltamuskel, Trizeps','start':0,'max':0,'group':'push','bw':True},
    'Handstand Push-ups (Wand)':  {'muscle':'Deltamuskel, Trizeps, Trapezmuskel','start':0,'max':0,'group':'push','bw':True},
    'Klimmzug (überhand)':        {'muscle':'Breiter Rückenmuskel, Bizeps','start':0,'max':20,'group':'pull','weighted':True},
    'Klimmzug (unterhand)':       {'muscle':'Bizeps, Breiter Rückenmuskel','start':0,'max':15,'group':'pull','weighted':True},
    'Muscle-Up (Stange)':         {'muscle':'Breiter Rückenmuskel, Trizeps, Deltamuskel','start':0,'max':0,'group':'pull','bw':True},
    'Australian Pull-ups':        {'muscle':'Breiter Rückenmuskel, Bizeps, Rautenmuskeln','start':0,'max':0,'group':'pull','bw':True},
    'Front Lever Rows':           {'muscle':'Breiter Rückenmuskel, Gerader Bauchmuskel','start':0,'max':0,'group':'pull','bw':True},
    'Pistol Squats':              {'muscle':'Quadrizeps, Gesäßmuskel','start':0,'max':10,'group':'legs','weighted':True},
    'Bulgarische Split-Kniebeuge':{'muscle':'Quadrizeps, Gesäßmuskel, Hüftbeuger','start':0,'max':20,'group':'legs','weighted':True},
    'Nordische Beinbeuger':       {'muscle':'Beinbizeps','start':0,'max':0,'group':'legs','bw':True},
    'Step-Ups (erhöht)':          {'muscle':'Quadrizeps, Gesäßmuskel','start':0,'max':15,'group':'legs','weighted':True},
    'Wadenheben (einbeinig)':     {'muscle':'Wadenmuskel','start':0,'max':0,'group':'legs','bw':True},
    'Dragon Flag':                {'muscle':'Gerader Bauchmuskel, Querer Bauchmuskel','start':0,'max':0,'group':'core','bw':True},
    'L-Sit (Parallettes)':       {'muscle':'Gerader Bauchmuskel, Hüftbeuger','start':0,'max':0,'group':'core','iso':True},
    'Plank (Unterarmstütz)':      {'muscle':'Gerader Bauchmuskel, Rumpf','start':0,'max':0,'group':'core','iso':True},
    'Hanging Leg Raises':         {'muscle':'Gerader Bauchmuskel, Hüftbeuger','start':0,'max':0,'group':'core','bw':True},
}

# ── Studio-Übungen (Julia, Frauen-Gewichte) ──
studio = {
    'Chest Press – Bankdrückmaschine':{'muscle':'Großer Brustmuskel, Trizeps','start':15,'max':40,'group':'push'},
    'Butterfly (Maschine)':           {'muscle':'Großer Brustmuskel','start':10,'max':30,'group':'push'},
    'Schulterdrücken (Maschine)':     {'muscle':'Deltamuskel, Trizeps','start':10,'max':27.5,'group':'push'},
    'Seitenheben':                    {'muscle':'Mittlerer Deltamuskel','start':3,'max':8,'group':'push'},
    'Trizepsdrücken (Kabel)':         {'muscle':'Trizeps','start':7.5,'max':20,'group':'push'},
    'Latzug zur Brust':               {'muscle':'Breiter Rückenmuskel, Bizeps','start':20,'max':45,'group':'pull'},
    'Cable Row (sitzend)':            {'muscle':'Breiter Rückenmuskel, Rautenmuskeln','start':17.5,'max':40,'group':'pull'},
    'Face Pulls (Kabel)':             {'muscle':'Hinterer Deltamuskel, Trapezmuskel','start':7.5,'max':17.5,'group':'pull'},
    'Bizeps-Curls (Kurzhantel)':      {'muscle':'Bizeps','start':4,'max':10,'group':'pull'},
    'Beinpresse':                     {'muscle':'Quadrizeps, Gesäßmuskel','start':40,'max':120,'group':'legs'},
    'Rumänisches Kreuzheben':         {'muscle':'Beinbizeps, Gesäßmuskel','start':20,'max':55,'group':'legs'},
    'Beinstrecker':                   {'muscle':'Quadrizeps','start':15,'max':40,'group':'legs'},
    'Beinbeuger':                     {'muscle':'Beinbizeps','start':12.5,'max':32.5,'group':'legs'},
    'Hip Thrust (Langhantel)':        {'muscle':'Großer Gesäßmuskel, Beinbizeps','start':30,'max':80,'group':'legs'},
    'Wadenheben (stehend)':           {'muscle':'Wadenmuskel','start':20,'max':50,'group':'legs'},
    'Plank (Unterarmstütz)':          {'muscle':'Gerader Bauchmuskel, Rumpf','start':0,'max':0,'group':'core','iso':True},
    'Russian Twist':                  {'muscle':'Schräge Bauchmuskulatur','start':3,'max':8,'group':'core'},
}

# ── Block-Templates ──
cali_blocks = {
    'akkumulation': {'saetze':3,'wdh':15,'days':[
        {'label':'Mo','ex':['Liegestütze (klassisch)','Archer Liegestütze','Pike Push-ups','Dips am Barren','Hanging Leg Raises']},
        {'label':'Mi','ex':['Pistol Squats','Bulgarische Split-Kniebeuge','Nordische Beinbeuger','Step-Ups (erhöht)','Wadenheben (einbeinig)']},
        {'label':'Fr','ex':['Klimmzug (überhand)','Australian Pull-ups','Klimmzug (unterhand)','Dragon Flag','Plank (Unterarmstütz)']},
    ]},
    'intensifikation': {'saetze':4,'wdh':10,'days':[
        {'label':'Mo','ex':['Pseudo Planche Push-ups','Dips am Barren','Handstand Push-ups (Wand)','Pike Push-ups','Hanging Leg Raises']},
        {'label':'Mi','ex':['Pistol Squats','Bulgarische Split-Kniebeuge','Nordische Beinbeuger','Wadenheben (einbeinig)','L-Sit (Parallettes)']},
        {'label':'Fr','ex':['Muscle-Up (Stange)','Klimmzug (überhand)','Front Lever Rows','Klimmzug (unterhand)','Dragon Flag']},
    ]},
    'peak': {'saetze':5,'wdh':5,'days':[
        {'label':'Mo','ex':['Pseudo Planche Push-ups','Dips am Barren','Handstand Push-ups (Wand)','Archer Liegestütze']},
        {'label':'Mi','ex':['Pistol Squats','Nordische Beinbeuger','Bulgarische Split-Kniebeuge','Plank (Unterarmstütz)']},
        {'label':'Fr','ex':['Muscle-Up (Stange)','Klimmzug (überhand)','Front Lever Rows','Dragon Flag']},
    ]}
}

studio_blocks = {
    'akkumulation': {'saetze':3,'wdh':20,'days':[
        {'label':'Mo','ex':['Chest Press – Bankdrückmaschine','Butterfly (Maschine)','Schulterdrücken (Maschine)','Seitenheben','Trizepsdrücken (Kabel)']},
        {'label':'Mi','ex':['Beinpresse','Rumänisches Kreuzheben','Hip Thrust (Langhantel)','Beinstrecker','Wadenheben (stehend)']},
        {'label':'Fr','ex':['Latzug zur Brust','Cable Row (sitzend)','Face Pulls (Kabel)','Bizeps-Curls (Kurzhantel)','Plank (Unterarmstütz)']},
    ]},
    'intensifikation': {'saetze':4,'wdh':10,'days':[
        {'label':'Mo','ex':['Chest Press – Bankdrückmaschine','Butterfly (Maschine)','Schulterdrücken (Maschine)','Seitenheben','Trizepsdrücken (Kabel)']},
        {'label':'Mi','ex':['Beinpresse','Hip Thrust (Langhantel)','Rumänisches Kreuzheben','Beinbeuger','Wadenheben (stehend)','Russian Twist']},
        {'label':'Fr','ex':['Latzug zur Brust','Cable Row (sitzend)','Face Pulls (Kabel)','Bizeps-Curls (Kurzhantel)','Plank (Unterarmstütz)']},
    ]},
    'peak': {'saetze':4,'wdh':6,'days':[
        {'label':'Mo','ex':['Chest Press – Bankdrückmaschine','Schulterdrücken (Maschine)','Butterfly (Maschine)','Trizepsdrücken (Kabel)']},
        {'label':'Mi','ex':['Beinpresse','Hip Thrust (Langhantel)','Rumänisches Kreuzheben','Beinbeuger','Plank (Unterarmstütz)']},
        {'label':'Fr','ex':['Latzug zur Brust','Cable Row (sitzend)','Face Pulls (Kabel)','Bizeps-Curls (Kurzhantel)','Russian Twist']},
    ]}
}

BLOCK_CYCLE = ['akkumulation','intensifikation','peak']
BLOCK_LEN = 4
REGEN_INTERVAL = 13

def get_weight(ex_def, week_idx, total_weeks):
    if not ex_def or ex_def.get('iso') or ex_def.get('bw'):
        return None
    if ex_def.get('weighted'):
        progress = min(week_idx / total_weeks, 1)
        return round(ex_def['max'] * (progress ** 0.6) * 2) / 2
    rng = ex_def['max'] - ex_def['start']
    progress = min(week_idx / total_weeks, 1)
    base = ex_def['start'] + rng * (progress ** 0.55)
    variance = (random.random() - 0.5) * 5
    return max(ex_def['start'], round((base + variance) * 2) / 2)

def get_reps(base_wdh, ex_def, set_idx, total_sets, week_idx, total_weeks):
    if ex_def and ex_def.get('iso'):
        return round(30 + random.random() * 30)
    if ex_def and ex_def.get('bw'):
        progress = min(week_idx / total_weeks, 1)
        base = round(5 + progress * 15)
        v = round((random.random() - 0.5) * 4)
        r = max(1, base + v)
        if set_idx >= total_sets - 1: r = max(1, r - random.randint(0, 2))
        return r
    wdh = max(1, base_wdh + round((random.random() - 0.5) * 4))
    if set_idx >= total_sets - 1: wdh = max(1, wdh - random.randint(0, 2))
    return wdh

def generate(name, nachname, alter, gewicht, groesse, hfmax, goal, ex_defs, block_defs, location, equipment, geschlecht=''):
    start = datetime(2023, 1, 2)
    end = datetime(2026, 4, 5)
    total_weeks = (end - start).days // 7

    profile = {
        'id': f'p_demo_{name.lower()}',
        'name': name, 'nachname': nachname, 'alter': alter,
        'gewicht': gewicht, 'groesse': groesse, 'hfmax': hfmax, 'goal': goal,
        'tage': ['Mo','Mi','Fr'], 'trainingLocation': location, 'equipment': equipment,
        'role': 'athlete', 'pin': '', 'plans': {}, 'sessions': [],
        'regenConfig': {'interval': REGEN_INTERVAL, 'athleteCanSetRegen': True, 'maxAthleteRegen': 2, 'regenBetween': False},
        'athleteRegenWeeks': [],
        'periodization': {
            'active': True, 'startKw': 1, 'blockLength': BLOCK_LEN,
            'blocks': [
                {'label':'Akkumulation (GPP)','color':'#4cc9f0','goal':'kraftausdauer','length':4},
                {'label':'Intensifikation (SPP)','color':'#f4a261','goal':'hypertrophie','length':4},
                {'label':'Peak / Skills','color':'#9b5de5','goal':'maximalkraft','length':4},
            ]
        },
        'createdAt': start.isoformat() + 'Z', 'createdBy': 'demo',
        'onboarding': {'status': 'complete'}
    }
    if geschlecht:
        profile['geschlecht'] = geschlecht

    regen_weeks = set(range(REGEN_INTERVAL, total_weeks + 1, REGEN_INTERVAL))

    # Dip-Phasen (schlechtere Leistung)
    dip_weeks = set()
    for _ in range(6):
        ds = random.randint(10, total_weeks - 5)
        for dd in range(random.randint(2, 4)):
            dip_weeks.add(ds + dd)

    sessions = []
    for w in range(total_weeks):
        week_date = start + timedelta(weeks=w)
        kw = iso_week(week_date)
        if (w + 1) in regen_weeks:
            continue
        if random.random() < 0.05:
            continue

        cycle_w = w % (BLOCK_LEN * 3)
        block_idx = cycle_w // BLOCK_LEN
        block_name = BLOCK_CYCLE[block_idx]
        tpl = block_defs[block_name]
        is_dip = w in dip_weeks

        plan_days = []
        for day_tpl in tpl['days']:
            exercises = []
            for ex_name in day_tpl['ex']:
                ex = ex_defs.get(ex_name, {})
                kg = get_weight(ex, w, total_weeks)
                if is_dip and kg:
                    kg = max(ex.get('start', 0), kg * rand_half(0.7, 0.85))
                exercises.append({
                    'name': ex_name,
                    'muscle': ex.get('muscle', ''),
                    'saetze': tpl['saetze'],
                    'wdh': 30 if ex.get('iso') else tpl['wdh'],
                    'gewicht': round(kg * 2) / 2 if kg is not None else ''
                })
            plan_days.append({'label': day_tpl['label'], 'exercises': exercises})

        goal_map = {'akkumulation':'kraftausdauer','intensifikation':'hypertrophie','peak':'maximalkraft'}
        profile['plans'][f'w{kw}'] = {
            'name': f"{tpl['saetze']}×{tpl['wdh']} {block_name.capitalize()}",
            'goal': goal_map[block_name], '_source': 'auto', '_block': block_idx,
            'days': plan_days
        }

        train_days = 2 if random.random() < 0.15 else 3
        for d in range(min(train_days, len(plan_days))):
            day_data = plan_days[d]
            session_date = week_date + timedelta(days=[0, 2, 4][d])
            session_ex = []
            for plan_ex in day_data['exercises']:
                ex = ex_defs.get(plan_ex['name'], {})
                sets = []
                for s in range(tpl['saetze']):
                    wdh = get_reps(plan_ex.get('wdh', tpl['wdh']), ex, s, tpl['saetze'], w, total_weeks)
                    kg = plan_ex.get('gewicht')
                    if kg and isinstance(kg, (int, float)) and kg > 0:
                        kg = max(0, kg + (random.random() - 0.4) * 5)
                        kg = round(kg * 2) / 2
                        if is_dip: kg = max(0, kg * rand_half(0.75, 0.9))
                    else:
                        kg = None
                    rpe = rand_half(8, 10) if is_dip else rand_half(6, 9.5)
                    sets.append({'wdh': wdh, 'gewicht': kg, 'rpe': rpe})
                session_ex.append({
                    'name': plan_ex['name'], 'muscle': plan_ex['muscle'],
                    'isometric': bool(ex.get('iso')), 'sets': sets
                })
            sessions.append({
                'id': f's_{name.lower()}_{w}_{d}',
                'date': fmt_de(session_date),
                'kw': kw, 'dayIdx': d,
                'exercises': session_ex
            })

    sessions.sort(key=lambda s: s['date'].split('.')[::-1], reverse=True)
    profile['sessions'] = sessions
    return profile

# ── Generate ──
alexander = generate('Alexander','da Costa Amaral',39,82,180,181,'hypertrophie',
    cali, cali_blocks, 'outdoor',
    ['klimmzugstange','dip_barren','parallettes','ringe','baender'])

julia = generate('Julia','da Costa Amaral',38,62,168,182,'kraftausdauer',
    studio, studio_blocks, 'studio',
    ['langhantel','kurzhantel','kabelzug','beinpresse','latzug','brustpresse','beinstrecker','beinbeuger'],
    geschlecht='weiblich')

# ── Save ──
script_dir = os.path.dirname(os.path.abspath(__file__))

f1 = os.path.join(script_dir, 'Trainingsplaner_Max_Mustermann_Demo.json')
with open(f1, 'w', encoding='utf-8') as f:
    json.dump(alexander, f, indent=2, ensure_ascii=False)

f2 = os.path.join(script_dir, 'Trainingsplaner_Julia_Demo.json')
with open(f2, 'w', encoding='utf-8') as f:
    json.dump(julia, f, indent=2, ensure_ascii=False)

print(f"=== Alexander (Cali) ===")
print(f"Sessions: {len(alexander['sessions'])}")
print(f"Pläne: {len(alexander['plans'])}")
print(f"Datei: {f1} ({os.path.getsize(f1)//1024} KB)")
print()
print(f"=== Julia (Studio) ===")
print(f"Sessions: {len(julia['sessions'])}")
print(f"Pläne: {len(julia['plans'])}")
print(f"Datei: {f2} ({os.path.getsize(f2)//1024} KB)")

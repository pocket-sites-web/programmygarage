"""Statistics for programmygarage.com/statistics/.

Usage: python3 scripts/stats/garage_stats.py NEISS_DIR RECS_CSV
  NEISS_DIR: neiss2015.tsv ... neiss2024.tsv (CPSC NEISS public files)
  RECS_CSV: recs2020_public_v7.csv (EIA 2020 RECS public microdata)
Writes src/data/stats/*.json and public/data/*.csv.
"""
import sys, os, json, csv
import numpy as np
import pandas as pd
sys.path.insert(0, os.path.dirname(__file__))
import neiss_lib as N

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
OUT = os.path.join(ROOT, 'src', 'data', 'stats'); os.makedirs(OUT, exist_ok=True)
PUB = os.path.join(ROOT, 'public', 'data'); os.makedirs(PUB, exist_ok=True)
NEISS_DIR, RECS = sys.argv[1], sys.argv[2]
def dump(name, obj):
    with open(os.path.join(OUT, name), 'w') as f: json.dump(obj, f, indent=1)

# ---------- Garage door injuries (NEISS) ----------
YEARS = list(range(2015, 2025))
df = N.load(NEISS_DIR, YEARS)
auto = N.has_product(df, [138]); door = N.has_product(df, [1886]); G = auto | door
age = df['age_years']; nar = df['Narrative_1']
inj = {'years': [YEARS[0], YEARS[-1]], 'total': N.estimate(df, G), 'automatic': N.estimate(df, auto), 'door': N.estimate(df, door), 'by_year': {}}
for y in YEARS:
    m = df['year'] == y; inj['by_year'][y] = N.estimate(df[m], G[m])
DX = {59: 'Cuts (lacerations)', 57: 'Fractures', 62: 'Internal injuries (incl. head)', 53: 'Bruises and abrasions', 64: 'Strains and sprains', 54: 'Crushing injuries', 52: 'Concussions', 72: 'Avulsions (torn skin or nail)', 50: 'Amputations', 58: 'Hematomas'}
inj['by_diagnosis'] = {v: N.estimate(df, G & (df['Diagnosis'] == k)) for k, v in DX.items()}
BP = {92: 'Fingers', 75: 'Head', 82: 'Hand', 76: 'Face', 79: 'Lower trunk', 31: 'Upper trunk', 30: 'Shoulder', 34: 'Wrist', 83: 'Foot', 36: 'Lower leg'}
inj['by_body_part'] = {v: N.estimate(df, G & (df['Body_Part'] == k)) for k, v in BP.items()}
bands = [('Under 5', 0, 5), ('5 to 14', 5, 15), ('15 to 24', 15, 25), ('25 to 44', 25, 45), ('45 to 64', 45, 65), ('65 and over', 65, 200)]
inj['by_age'] = {lab: N.estimate(df, G & (age >= a) & (age < b)) for lab, a, b in bands}
inj['under15'] = N.estimate(df, G & (age < 15))
inj['finger_hand'] = N.share(df, df['Body_Part'].isin([92, 82]), G)
inj['finger_amputation'] = N.estimate(df, G & (df['Diagnosis'] == 50) & (df['Body_Part'] == 92))
inj['admitted'] = N.share(df, df['Disposition'].isin([2, 4, 5]), G)
inj['male'] = N.share(df, df['Sex'] == 1, G)
inj['pinched'] = N.estimate(df, G & nar.str.contains(r'PINCH|CAUGHT|SMASH|JAMMED|CRUSH', regex=True))
inj['struck'] = N.estimate(df, G & nar.str.contains(r'(?:DOOR|IT) (?:CAME|CLOSED|FELL|CAME DOWN) (?:DOWN )?ON|STRUCK BY|HIT BY|CLOSED ON|FELL ON|CAME DOWN ON', regex=True))
inj['spring'] = N.estimate(df, G & nar.str.contains('SPRING'))
inj['ladder'] = N.estimate(df, G & nar.str.contains('LADDER'))
dump('garage-door-injuries.json', inj)
with open(os.path.join(PUB, 'garage-door-injuries-by-year.csv'), 'w', newline='') as f:
    w = csv.writer(f); w.writerow(['year', 'estimated_er_visits', 'standard_error', 'sample_cases', 'reliable'])
    for y, e in inj['by_year'].items(): w.writerow([y, e['est'], e['se'], e['n'], 'yes' if e['ok'] else 'no'])

# ---------- Attached garages (RECS 2020) ----------
r = pd.read_csv(RECS, low_memory=False)
R = 60; W = 'NWEIGHT'; REPS = [f'NWEIGHT{i}' for i in range(1, R + 1)]
def est(num, den):
    a = r.loc[num & den, [W] + REPS].sum(); b = r.loc[den, [W] + REPS].sum()
    p = a[W] / b[W]; reps = a[REPS].values / b[REPS].values
    se = np.sqrt((R - 1) / R * ((reps - p) ** 2).sum())
    ok = int(den.sum()) >= 30 and (p == 0 or se / p <= 0.30)
    return {'pct': round(100 * p, 1), 'se': round(100 * se, 1), 'homes_m': round(a[W] / 1e6, 2), 'n_base': int(den.sum()), 'ok': bool(ok)}
allh = r[W] > 0; g = r['PRKGPLC1'] == 1; sf = r['TYPEHUQ'].isin([2, 3])
gar = {'total_homes_m': round(r[W].sum() / 1e6, 2), 'all': est(g, allh), 'single_family': est(g, sf), 'detached': est(g, r['TYPEHUQ'] == 2), 'attached_house': est(g, r['TYPEHUQ'] == 3),
       'size': {lab: est(r['SIZEOFGARAGE'] == k, g) for k, lab in [(1, 'One-car'), (2, 'Two-car'), (3, 'Three-car or larger')]},
       'heated': est(r['GARGHEAT'] == 1, g), 'cooled': est(r['GARGCOOL'] == 1, g),
       'owners': est(g, r['KOWNRENT'] == 1), 'renters': est(g, r['KOWNRENT'] != 1),
       'ev': est(g, r['ELECVEH'] == 1), 'non_ev': est(g, r['ELECVEH'] == 0),
       'ev_charge_home_garage': est(r['EVCHRGHOME'] == 1, (r['ELECVEH'] == 1) & g)}
gar['by_region'] = {x.title(): est(g, r['REGIONC'] == x) for x in ['NORTHEAST', 'MIDWEST', 'SOUTH', 'WEST']}
YM = {1: 'Before 1950', 2: '1950s', 3: '1960s', 4: '1970s', 5: '1980s', 6: '1990s', 7: '2000s', 8: '2010 to 2015', 9: '2016 to 2020'}
gar['by_yearmade'] = {lab: est(g, r['YEARMADERANGE'] == k) for k, lab in YM.items()}
gar['threecar_by_yearmade'] = {lab: est(r['SIZEOFGARAGE'] == 3, g & (r['YEARMADERANGE'] == k)) for k, lab in YM.items()}
gar['by_state'] = {st: {'all': est(g, r['state_name'] == st), 'single_family': est(g, sf & (r['state_name'] == st)), 'two_plus': est(r['SIZEOFGARAGE'] >= 2, g & (r['state_name'] == st))} for st in sorted(r['state_name'].unique())}
dump('garages.json', gar)
with open(os.path.join(PUB, 'attached-garages-by-state.csv'), 'w', newline='') as f:
    w = csv.writer(f); w.writerow(['state', 'pct_all_homes_with_attached_garage', 'se', 'pct_single_family_homes_with_attached_garage', 'se_sf', 'pct_garages_two_car_or_larger', 'se_2plus', 'sampled_homes', 'all_estimates_reliable'])
    for st, v in gar['by_state'].items():
        ok = v['all']['ok'] and v['single_family']['ok'] and v['two_plus']['ok']
        w.writerow([st, v['all']['pct'], v['all']['se'], v['single_family']['pct'], v['single_family']['se'], v['two_plus']['pct'], v['two_plus']['se'], v['all']['n_base'], 'yes' if ok else 'no'])
print('done')

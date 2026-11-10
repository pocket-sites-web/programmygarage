#!/usr/bin/env python3
"""Clean the scraper's garage.json export into data/garage.json for the site.

Usage: python scripts/prepare-data.py path/to/export/garage.json

- repairs mojibake (UTF-8 read as Windows-1252, e.g. "3â€“4")
- drops duplicate ids (keeps the record with the most steps)
- adds a display colour to each learn button
- normalises remote kinds to remote / keypad / universal and tidies Genie names
- prints a summary
"""
import json, re, sys, collections

COLORS = {
    'white': '#f4f4f2', 'yellow': '#f2c200', 'purple': '#7b3fb5', 'red-orange': '#d9481c', 'green': '#2f9a46',
    'blue': '#2563c9', 'dip': '#9aa0a6', 'genie-intellicode': '#1d5fb4', 'genie-dip': '#9aa0a6',
}


# Genie lists some accessories by description rather than a model code.
NAMES = {
    '2-BUTTON-UNIVERSAL': '2-Button Universal Remote', '4-BUTTON-UNIVERSAL': '4-Button Universal Remote',
    'CLOSED-CONFIRM': 'Closed Confirm Remote', 'GENIE-GARAGE-DOOR-OPENER': 'Garage Door Opener Remote',
    'INTELLICODE': 'Intellicode Keypad', 'INTELLICODE-GK2': 'Intellicode Keypad GK2', 'KEP-1-WIRED': 'KEP-1 Wired Keypad',
    'UNIVERSAL': 'Universal Keypad', 'UNIVERSAL-GUK2': 'Universal Keypad GUK2',
}


def fix(s):
    if isinstance(s, str) and re.search('[ÂÃâ][\u0080-ſ‐-›€™]', s):
        try:
            return s.encode('cp1252').decode('utf8')
        except (UnicodeEncodeError, UnicodeDecodeError):
            return s
    return s


def walk(x):
    if isinstance(x, dict):
        return {k: walk(v) for k, v in x.items()}
    if isinstance(x, list):
        return [walk(v) for v in x]
    return fix(x)


def nsteps(o):
    st = o.get('steps')
    if isinstance(st, dict):
        return sum(len(v or []) for v in st.values())
    return len(st or [])


def dedupe(rows, label):
    best = {}
    for r in rows:
        if r['id'] not in best or nsteps(r) > nsteps(best[r['id']]):
            best[r['id']] = r
    if len(best) != len(rows):
        print(f'{label}: dropped {len(rows) - len(best)} duplicate id(s)')
    return list(best.values())


d = walk(json.load(open(sys.argv[1], encoding='utf-8')))
for l in d['learn_buttons']:
    l['color'] = COLORS.get(l['id'], '#9aa0a6')
d['openers'] = dedupe(d['openers'], 'openers')
d['remotes'] = dedupe(d['remotes'], 'remotes')
for r in d['remotes']:
    k = (r.get('kind') or 'remote').lower()
    r['kind'] = 'keypad' if 'keypad' in k else 'universal' if 'universal' in k else 'remote'
    m = r['model']
    r['model'] = NAMES.get(m, m)
d.pop('notes', None)
json.dump(d, open('data/garage.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('openers', len(d['openers']), dict(collections.Counter(o['brand'] for o in d['openers'])))
print('remotes', len(d['remotes']), dict(collections.Counter(r['kind'] for r in d['remotes'])))
print('learn buttons', len(d['learn_buttons']), 'cars', len(d['cars']))

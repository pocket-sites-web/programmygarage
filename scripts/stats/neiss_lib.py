"""Helpers for national estimates from CPSC NEISS public data files (neissYYYY.tsv).

Estimates are sums of the case weights. Standard errors use Taylor linearisation for a
stratified sample of hospitals (PSUs), treating PSUs as sampled with replacement within strata,
the same design CPSC uses (strata = Stratum, clusters = PSU). Following CPSC's rule, an estimate
is flagged unreliable when it rests on fewer than 20 cases, is below 1,200, or has a
coefficient of variation above 33%.
"""
import os
import numpy as np
import pandas as pd

COLS = ['CPSC_Case_Number', 'Treatment_Date', 'Age', 'Sex', 'Body_Part', 'Diagnosis', 'Body_Part_2', 'Diagnosis_2',
        'Disposition', 'Location', 'Product_1', 'Product_2', 'Product_3', 'Narrative_1', 'Stratum', 'PSU', 'Weight']

def load(folder, years):
    out = []
    for y in years:
        d = pd.read_csv(os.path.join(folder, f'neiss{y}.tsv'), sep='\t', usecols=COLS, low_memory=False, encoding='latin-1',
                        dtype={'Stratum': str, 'Narrative_1': str})
        d['year'] = y
        out.append(d)
    df = pd.concat(out, ignore_index=True)
    df['Narrative_1'] = df['Narrative_1'].fillna('').str.upper()
    age = df['Age'].astype(float)
    df['age_years'] = np.where(age >= 200, (age - 200) / 12.0, age)
    return df

def has_product(df, codes):
    codes = set(codes)
    return df['Product_1'].isin(codes) | df['Product_2'].isin(codes) | df['Product_3'].isin(codes)

def has_diag(df, codes):
    codes = set(codes)
    return df['Diagnosis'].isin(codes) | df['Diagnosis_2'].isin(codes)

def estimate(df, mask, year_col='year'):
    """National estimate (sum of weights) with design-based SE, per survey year pooled as separate strata."""
    y = np.where(mask, df['Weight'].values, 0.0)
    g = pd.DataFrame({'h': df[year_col].astype(str) + '|' + df['Stratum'].astype(str), 'psu': df['PSU'].values, 'y': y})
    psu = g.groupby(['h', 'psu'])['y'].sum().reset_index()
    var = 0.0
    for h, grp in psu.groupby('h'):
        n = len(grp)
        if n > 1:
            z = grp['y'].values
            var += n / (n - 1) * ((z - z.mean()) ** 2).sum()
    est = float(y.sum())
    se = float(np.sqrt(var))
    n = int(mask.sum())
    cv = se / est if est else 0
    return {'est': round(est), 'se': round(se), 'n': n, 'cv': round(cv, 3), 'ok': bool(n >= 20 and est >= 1200 and cv <= 0.33)}

def share(df, num_mask, den_mask):
    a = estimate(df, num_mask & den_mask); b = estimate(df, den_mask)
    return {'pct': round(100 * a['est'] / b['est'], 1) if b['est'] else 0, 'num': a, 'den': b, 'ok': a['ok'] and b['ok']}

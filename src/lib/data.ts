import fs from 'node:fs';
import path from 'node:path';

// Shapes match the scraper export (data/garage.json). Rows with "sample": true are placeholders.
export type TaskKey = 'remote' | 'keypad' | 'car' | 'erase';
export type Steps = Partial<Record<TaskKey, string[] | null>>;

export interface LearnButton {
  id: string;
  brand_family: string;
  label: string;
  color?: string | null;
  technology: string | null;
  frequencies_mhz: number[] | null;
  years: string | null;
  compatible_remote_ids: string[];
  compatible_keypad_ids: string[];
  needs_homelink_bridge_for_older_cars: boolean | null;
  source_url: string | null;
  sample?: boolean;
}

export interface Opener {
  id: string;
  brand: string;
  model: string;
  also_sold_as: string[] | null;
  type: string | null;
  years: string | null;
  learn_button: string | null;
  learn_button_location: string | null;
  myq: boolean | null;
  battery_backup: boolean | null;
  steps: Steps | null;
  manual_url: string | null;
  source_url: string | null;
  sample?: boolean;
}

export interface Remote {
  id: string;
  brand: string;
  model: string;
  kind: 'remote' | 'keypad' | 'universal';
  buttons: number | null;
  battery: string | null;
  works_with_learn_buttons: string[];
  works_with_brands: string[];
  steps: string[] | null;
  source_url: string | null;
  sample?: boolean;
}

export interface CarRow {
  make: string;
  model: string;
  year: number;
  system: string | null;
  steps: string[];
  rolling_code_note: string | null;
  manual_source: string | null;
  sample?: boolean;
}

export interface CarGroup {
  years: number[];
  system: string | null;
  steps: string[];
  rolling_code_note: string | null;
  manual_source: string | null;
  sample: boolean;
}

export interface CarModel {
  make: string;
  makeSlug: string;
  model: string;
  modelSlug: string;
  groups: CarGroup[]; // identical steps across years merged, newest first
  firstYear: number;
  lastYear: number;
  sample: boolean;
}

export const slugify = (s: string) =>
  s.toLowerCase().replace(/&/g, 'and').replace(/\+/g, '-plus').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/garage.json'), 'utf8')) as {
  learn_buttons: LearnButton[];
  openers: Opener[];
  remotes: Remote[];
  cars: CarRow[];
};

export const learnButtons = raw.learn_buttons;
export const openers = raw.openers.filter((o) => o.brand && o.model);
export const remotes = raw.remotes.filter((r) => r.brand && r.model);
const cars = raw.cars.filter((c) => c.make && c.model && c.year && c.steps?.length);

export const anySample = [...learnButtons, ...openers, ...remotes, ...cars].some((x) => x.sample);

export const getLearnButton = (id: string | null) => learnButtons.find((l) => l.id === id);
export const getRemote = (id: string) => remotes.find((r) => r.id === id);

export const openerSlug = (o: Opener) => slugify(o.model);
export const openerHref = (o: Opener) => `/${slugify(o.brand)}/${openerSlug(o)}/`;
export const remoteHref = (r: Remote) => `/remotes/${r.id}/`;
export const learnHref = (l: LearnButton) => `/learn-button/${l.id}/`;

export const openersFor = (brand: string) =>
  openers.filter((o) => slugify(o.brand) === slugify(brand)).sort((a, b) => a.model.localeCompare(b.model, 'en', { numeric: true }));
export const openersWithButton = (id: string) => openers.filter((o) => o.learn_button === id);
export const remotesForButton = (l: LearnButton) => {
  const ids = new Set([...l.compatible_remote_ids, ...l.compatible_keypad_ids]);
  return remotes.filter((r) => ids.has(r.id) || r.works_with_learn_buttons.includes(l.id));
};
export const remotesForOpener = (o: Opener) => {
  const l = getLearnButton(o.learn_button);
  return l ? remotesForButton(l) : [];
};

export function getCarModels(): CarModel[] {
  const by = new Map<string, CarRow[]>();
  for (const c of cars) {
    const k = `${c.make}|${c.model}`;
    by.set(k, [...(by.get(k) ?? []), c]);
  }
  return [...by.values()]
    .map((rows) => {
      rows.sort((a, b) => b.year - a.year);
      const groups: CarGroup[] = [];
      for (const r of rows) {
        const key = JSON.stringify(r.steps);
        const g = groups.find((x) => JSON.stringify(x.steps) === key);
        if (g) g.years.push(r.year);
        else groups.push({ years: [r.year], system: r.system, steps: r.steps, rolling_code_note: r.rolling_code_note, manual_source: r.manual_source, sample: !!r.sample });
      }
      const years = rows.map((r) => r.year);
      return {
        make: rows[0].make,
        makeSlug: slugify(rows[0].make),
        model: rows[0].model,
        modelSlug: slugify(rows[0].model),
        groups,
        firstYear: Math.min(...years),
        lastYear: Math.max(...years),
        sample: rows.some((r) => r.sample),
      };
    })
    .sort((a, b) => a.make.localeCompare(b.make) || a.model.localeCompare(b.model));
}

export function getCarMakes() {
  const models = getCarModels();
  const makes = [...new Set(models.map((m) => m.make))].sort();
  return makes.map((make) => ({ make, makeSlug: slugify(make), models: models.filter((m) => m.make === make) }));
}

export const yearSpan = (years: number[]) => {
  const s = [...years].sort((a, b) => a - b);
  return s[0] === s[s.length - 1] ? `${s[0]}` : `${s[0]} to ${s[s.length - 1]}`;
};

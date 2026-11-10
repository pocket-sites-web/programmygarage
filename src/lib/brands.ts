import { openers, slugify, learnButtons, type TaskKey } from './data';

// Most common steps for a task across a brand's openers (Genie publishes one method per button style).
function commonSteps(brand: string, style?: string): Brand['steps'] {
  const out: Brand['steps'] = {};
  const list = openers.filter((o) => o.brand === brand && (!style || o.learn_button_style === style));
  for (const k of ['remote', 'keypad', 'car', 'erase'] as TaskKey[]) {
    const counts = new Map<string, number>();
    for (const o of list) {
      const st = o.steps?.[k];
      if (st?.length) counts.set(JSON.stringify(st), (counts.get(JSON.stringify(st)) ?? 0) + 1);
    }
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (top) out[k] = JSON.parse(top[0]);
  }
  return out;
}

export interface Brand {
  name: string;
  slug: string;
  family: 'chamberlain' | 'genie' | 'other';
  blurb: string;
  learnWhere: string;
  // Brand-wide steps, in our own words. Only filled where every model of the family works the same way.
  steps: Partial<Record<TaskKey, string[]>>;
  stepsScope?: string; // who the brand-wide steps apply to, when not every model
}

const CHAMBERLAIN_STEPS: Brand['steps'] = {
  remote: [
    'Find the Learn button on the motor unit. It is on the back or side, near where the antenna wire hangs down, and sometimes under the light cover.',
    'Press and release the Learn button once. Do not hold it, or you will erase your remotes. The small LED next to it stays lit for about 30 seconds.',
    'Within those 30 seconds, press and hold the remote button you want to use.',
    'Let go when the opener lights blink or you hear two clicks.',
    'Press the remote button again. The door should move. If not, repeat from step 2.',
  ],
  keypad: [
    'Press and release the Learn button on the motor unit. The LED stays lit for about 30 seconds.',
    'Within 30 seconds, type a 4-digit PIN of your choice on the keypad.',
    'Press and hold the Enter button (or the up/down button on some keypads) until the opener lights blink.',
    'Test it: type your PIN and press Enter. The door should move.',
  ],
  car: [
    'Program the car first: hold your working remote 1 to 3 inches from the car\'s garage buttons, then press and hold the car button and the remote button together until the car\'s indicator light flashes quickly.',
    'Go to the opener and press and release the Learn button. You have 30 seconds.',
    'Back in the car, press and hold the garage button you programmed for 2 seconds, then let go. Repeat up to three times until the door moves.',
  ],
  erase: [
    'Press and hold the Learn button on the motor unit for about 6 seconds, until the LED goes out.',
    'Every remote and keypad paired to the opener is now erased. The wall button still works.',
    'Program the remotes and keypads you want to keep again.',
  ],
};

export const BRANDS: Brand[] = [
  { name: 'LiftMaster', slug: 'liftmaster', family: 'chamberlain', blurb: 'LiftMaster is the professional-installer brand of the Chamberlain Group. Its openers, remotes and keypads work the same way as Chamberlain and Craftsman ones with the same Learn button colour.', learnWhere: 'on the back or side of the motor unit, next to a small LED, near the antenna wire', steps: CHAMBERLAIN_STEPS },
  { name: 'Chamberlain', slug: 'chamberlain', family: 'chamberlain', blurb: 'Chamberlain openers are the retail version of LiftMaster. Programming is identical, and remotes are interchangeable when the Learn button colour matches.', learnWhere: 'on the back or side of the motor unit, sometimes under the light lens', steps: CHAMBERLAIN_STEPS },
  { name: 'Craftsman', slug: 'craftsman', family: 'chamberlain', blurb: 'Craftsman garage door openers sold at Sears were made by Chamberlain, so they use the same Learn button colours and the same remotes.', learnWhere: 'on the back of the motor unit, near the antenna wire, often under the light cover', steps: CHAMBERLAIN_STEPS },
  { name: 'Genie', slug: 'genie', family: 'genie', blurb: 'Genie openers use Intellicode rolling codes. Current models have a square PROGRAM/SET button with two LEDs; older ones have a round LEARN CODE button, and openers made before 1995 use DIP code switches.', learnWhere: 'on the powerhead: a square PROGRAM/SET button next to the round and long LEDs on current models, or a round LEARN CODE button on older ones', steps: commonSteps('Genie', 'prgm'), stepsScope: 'current Genie openers with a square PROGRAM/SET button' },
  { name: 'Raynor', slug: 'raynor', family: 'chamberlain', blurb: 'Raynor openers are made by the Chamberlain Group, so they use the same Learn button colours and remotes as LiftMaster.', learnWhere: 'on the back or side of the motor unit, near the antenna wire', steps: CHAMBERLAIN_STEPS },
  { name: 'True Value', slug: 'true-value', family: 'chamberlain', blurb: 'True Value store-brand openers were made by the Chamberlain Group and program the same way as Chamberlain openers.', learnWhere: 'on the back or side of the motor unit, near the antenna wire', steps: CHAMBERLAIN_STEPS },
  { name: 'Overhead Door', slug: 'overhead-door', family: 'genie', blurb: 'Overhead Door openers are made by the same company as Genie and use the same Intellicode technology.', learnWhere: 'on the powerhead, near the light lens', steps: {} },
  { name: 'Linear', slug: 'linear', family: 'other', blurb: 'Linear openers and Multi-Code remotes are common in older homes and gated communities.', learnWhere: 'on the opener\'s logic board, behind the light cover', steps: {} },
  { name: 'Marantec', slug: 'marantec', family: 'other', blurb: 'Marantec openers are sold mainly through garage door dealers.', learnWhere: 'on the control panel of the powerhead', steps: {} },
  { name: 'Wayne Dalton', slug: 'wayne-dalton', family: 'other', blurb: 'Wayne Dalton openers and the TorqueMaster system.', learnWhere: 'on the powerhead', steps: {} },
  { name: 'Ryobi', slug: 'ryobi', family: 'other', blurb: 'Ryobi openers with battery ports for Ryobi ONE+ accessories.', learnWhere: 'on the side of the powerhead', steps: {} },
  { name: 'Skylink', slug: 'skylink', family: 'other', blurb: 'Skylink makes universal remotes and keypads plus its own openers.', learnWhere: 'on the opener\'s motor unit', steps: {} },
];

// A brand page is built when we have opener data for it, or brand-wide steps.
export const activeBrands = () =>
  BRANDS.filter((b) => Object.keys(b.steps).length || openers.some((o) => slugify(o.brand) === b.slug));
export const getBrand = (slug: string) => BRANDS.find((b) => b.slug === slug);
export const brandButtons = (b: Brand) => learnButtons.filter((l) => l.brand_family === b.family);

export const TASKS = [
  { slug: 'program-remote', key: 'remote' as TaskKey, title: 'Program a Remote', verb: 'program a remote', h: 'How to program a {brand} garage door remote' },
  { slug: 'program-keypad', key: 'keypad' as TaskKey, title: 'Program a Keypad', verb: 'program a keypad', h: 'How to program a {brand} keypad' },
  { slug: 'program-car', key: 'car' as TaskKey, title: 'Program Your Car', verb: 'program your car', h: 'How to program your car to a {brand} opener' },
  { slug: 'reset', key: 'erase' as TaskKey, title: 'Reset and Erase Remotes', verb: 'erase all remotes', h: 'How to reset a {brand} opener and erase remotes' },
] as const;
export type Task = (typeof TASKS)[number];

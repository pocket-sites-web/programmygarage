# Program My Garage

How to program garage door openers, remotes, keypads and car HomeLink buttons, by opener model and Learn button colour. Astro static site, deployed by Cloudflare Pages (build `npm run build`, output `dist`). Domain: programmygarage.com.

## Pages
- `/[brand]/`: brand hub (LiftMaster, Chamberlain, Craftsman, Genie…).
- `/[brand]/program-remote/`, `/program-keypad/`, `/program-car/`, `/reset/`, `/learn-button/`: brand × task pages (the high-volume terms).
- `/[brand]/[model]/`: opener model page (Learn button colour + location, steps, compatible remotes).
- `/learn-button/` and `/learn-button/[id]/`: what each colour / technology means + compatible remotes.
- `/remotes/` and `/remotes/[id]/`: remote and keypad pages.
- `/cars/`, `/cars/[make]/`, `/cars/[make]/[model]/`: HomeLink steps from owner's manuals, identical years merged.
- about, sources, privacy, contact, 404, robots.txt.

## Data
`data/garage.json` from the scraper on Jon's PC (`data\garage\out\garage.json`). Keys: `learn_buttons`, `openers`, `remotes`, `cars`; schema in `src/lib/data.ts`. Rows with `"sample": true` are placeholders and show a "Sample data" label. Brand-wide steps (Chamberlain family) live in `src/lib/brands.ts`; an opener's own steps override them.

## Launch switches (`src/lib/site.ts`)
- `PREVIEW = true`: noindex everywhere, robots.txt blocks all, banner shown. Set to `false` at launch.
- `AMAZON_TAG` = booforgen-20.

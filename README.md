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
`data/garage.json` comes from the scraper on Jon's PC (`data\garage\out\garage.json`, rebuild with `python data\garage\scripts\build_all.py`). Import with:

```
python scripts/prepare-data.py path/to/garage.json
```

It fixes text encoding, drops duplicate ids, adds Learn button display colours and tidies remote names. Keys: `learn_buttons`, `openers`, `remotes`, `cars`, `other_brands`; schema in `src/lib/data.ts`. Rows with `"sample": true` show a "Sample data" label.

Data notes (2026-11-10): opener steps are the maker's standard method for that Learn button type, not model-specific. Opener sales years are unknown (`manual_year` is shown instead). Craftsman has no opener records (not on the Chamberlain site). Smaller brands are listed in `other_brands` but not extracted. Cars cover Toyota, Lexus, Nissan, Hyundai and Kia only. Brand-wide steps (Chamberlain family) live in `src/lib/brands.ts`; an opener's own steps override them.

## Launch switches (`src/lib/site.ts`)
- `PREVIEW`: when true, noindex everywhere, robots.txt blocks all, banner shown. `false` since launch (2026-11-10).
- `AMAZON_TAG` = booforgen-20.

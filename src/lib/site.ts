// programmygarage.com, bought by Jon on Cloudflare 2026-11-10. Set PREVIEW to false at launch to let Google in.
export const SITE_URL = 'https://programmygarage.com';
export const SITE_NAME = 'Program My Garage';
// While true: every page is noindex, robots.txt blocks crawlers, and a banner says the data may be sample data.
export const PREVIEW = false;

export const AMAZON_TAG = 'booforgen-20';
export const amazonUrl = (q: string) =>
  `https://www.amazon.com/s?k=${encodeURIComponent(q)}${AMAZON_TAG ? `&tag=${AMAZON_TAG}` : ''}`;

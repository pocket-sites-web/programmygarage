import injuries from '../data/stats/garage-door-injuries.json';
import garages from '../data/stats/garages.json';
export { injuries, garages };
export const SITE_NAME = 'Program My Garage';
export const SITE_URL = 'https://programmygarage.com';
export const STATS_UPDATED = '2026-11-17';
export const STATS_UPDATED_LABEL = 'November 17, 2026';
export const n0 = (v: number) => Math.round(v).toLocaleString('en-US');
export const round100 = (v: number) => (Math.round(v / 100) * 100).toLocaleString('en-US');
export const NEISS_URL = 'https://www.cpsc.gov/Research--Statistics/NEISS-Injury-Data';
export const NEISS_CITE = 'U.S. Consumer Product Safety Commission, National Electronic Injury Surveillance System (NEISS), 2015 to 2024 public data files';
export const CMPL_URL = 'https://www.nhtsa.gov/nhtsa-datasets-and-apis';
export const CMPL_CITE = 'National Highway Traffic Safety Administration, Office of Defects Investigation, vehicle owner complaints flat files';
export function articleLd(path: string, title: string, description: string, crumb: string) {
  const org = { '@type': 'Organization', name: SITE_NAME, url: SITE_URL };
  return [
    { '@context': 'https://schema.org', '@type': 'Article', headline: title, description, datePublished: STATS_UPDATED, dateModified: STATS_UPDATED, author: org, publisher: org, mainEntityOfPage: `${SITE_URL}${path}` },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Statistics', item: `${SITE_URL}/statistics/` },
      { '@type': 'ListItem', position: 3, name: crumb, item: `${SITE_URL}${path}` } ] },
  ];
}
export function datasetLd(path: string, name: string, description: string, csv: string[], basedOn: string, temporal: string) {
  const org = { '@type': 'Organization', name: SITE_NAME, url: SITE_URL };
  return { '@context': 'https://schema.org', '@type': 'Dataset', name, description, url: `${SITE_URL}${path}`, creator: org, license: 'https://creativecommons.org/licenses/by/4.0/', isAccessibleForFree: true, temporalCoverage: temporal, spatialCoverage: { '@type': 'Place', name: 'United States' }, isBasedOn: basedOn, dateModified: STATS_UPDATED,
    distribution: csv.map((c) => ({ '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: `${SITE_URL}${c}` })) };
}
export function faqLd(faq: string[][]) {
  return { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) };
}
export const RECS_URL = 'https://www.eia.gov/consumption/residential/data/2020/index.php?view=microdata';
export const RECS_CITE = 'U.S. Energy Information Administration, 2020 Residential Energy Consumption Survey (RECS) public microdata, version 7';

// Real estate scraper — uses Redfin's stingray API (public, no key required)
// Falls back to demo data if blocked or location unsupported

import { fetchWithRetry } from '../utils/http.js';
import type { HomeResult, HomesData } from '../types.js';

interface CityRegion {
  id: number;
  market: string;
}

// Redfin region IDs for major US cities (region_type 6 = city)
const CITY_REGIONS: Record<string, CityRegion> = {
  'nashville':    { id: 17883, market: 'nashville' },
  'austin':       { id: 30818, market: 'austin' },
  'denver':       { id: 12662, market: 'denver' },
  'seattle':      { id: 16163, market: 'seattle' },
  'portland':     { id: 29345, market: 'portland' },
  'chicago':      { id: 29470, market: 'chicago' },
  'atlanta':      { id: 15442, market: 'atlanta' },
  'dallas':       { id: 19648, market: 'dallas' },
  'houston':      { id: 26655, market: 'houston' },
  'phoenix':      { id: 12839, market: 'phoenix' },
  'miami':        { id: 10288, market: 'miami' },
  'tampa':        { id: 12182, market: 'tampa' },
  'orlando':      { id: 11960, market: 'orlando' },
  'charlotte':    { id: 12015, market: 'charlotte' },
  'raleigh':      { id: 31408, market: 'raleigh' },
  'minneapolis':  { id: 16262, market: 'minneapolis' },
  'kansas city':  { id: 6800,  market: 'kansascity' },
  'salt lake':    { id: 41580, market: 'saltlake' },
  'las vegas':    { id: 9497,  market: 'lasvegas' },
  'san antonio':  { id: 51298, market: 'sanantonio' },
  'boston':       { id: 30838, market: 'boston' },
  'new york':     { id: 17867, market: 'nyc' },
  'los angeles':  { id: 16323, market: 'losangeles' },
  'san francisco':{ id: 17151, market: 'sfbay' },
  'san diego':    { id: 12372, market: 'sandiego' },
};

const SUPPORTED_CITIES = Object.keys(CITY_REGIONS).join(', ');

const DEMO_HOMES: HomeResult[] = [
  { address: '123 Main St',   city: 'Nashville', state: 'TN', price: 450000,  beds: 3, baths: 2, sqft: 1850, status: 'Active' },
  { address: '456 Oak Ave',   city: 'Nashville', state: 'TN', price: 389000,  beds: 2, baths: 1, sqft: 1200, status: 'Active' },
  { address: '789 Elm Dr',    city: 'Nashville', state: 'TN', price: 625000,  beds: 4, baths: 3, sqft: 2800, status: 'Active' },
  { address: '321 Maple Ln',  city: 'Nashville', state: 'TN', price: 279000,  beds: 2, baths: 2, sqft: 1100, status: 'Active' },
  { address: '654 Pine Rd',   city: 'Nashville', state: 'TN', price: 799000,  beds: 5, baths: 4, sqft: 3500, status: 'Active' },
];

/** Partial Redfin home shape from the stingray API. */
interface RedfinHome {
  streetLine?: { value?: string };
  unitNumber?: { value?: string };
  city?: string;
  state?: string;
  price?: { value?: number };
  beds?: number;
  baths?: number;
  sqFt?: { value?: number };
  mlsStatus?: string;
}

interface RedfinPayload {
  homes?: RedfinHome[];
}

interface RedfinResponse {
  payload?: RedfinPayload;
}

export async function scrapeRealEstate(query: string, limit = 20): Promise<HomesData> {
  const region = findRegion(query);

  if (region === null) {
    return {
      homes: DEMO_HOMES.slice(0, limit),
      source: 'Demo Data',
      isDemo: true,
      note: `Location not recognized — showing sample data. Supported cities: ${SUPPORTED_CITIES}.`,
    };
  }

  try {
    const url = `https://www.redfin.com/stingray/api/gis?al=1&market=${region.market}&num_homes=${limit}&region_id=${region.id}&region_type=6&status=9&uipt=1,2,3,4,5,6,7,8&v=8`;
    const res = await fetchWithRetry(url, {
      headers: {
        Accept: 'text/plain',
        Referer: 'https://www.redfin.com',
      },
    });

    const text = await res.text();
    const json = JSON.parse(text.replace(/^\{\}&&/, '').trim()) as RedfinResponse;
    const homes = (json?.payload?.homes ?? []).slice(0, limit).map(normalizeHome);

    if (homes.length === 0) {
      return {
        homes: DEMO_HOMES.slice(0, limit),
        source: 'Demo Data',
        isDemo: true,
        note: 'Redfin returned no listings (may be blocking scraping) — showing sample data.',
      };
    }

    // Validate: the returned homes should belong to the requested city.
    // Redfin's stingray API sometimes returns wrong-market data when region IDs drift.
    const expectedCityKey = (Object.keys(CITY_REGIONS).find(c => region === CITY_REGIONS[c]) ?? '').toLowerCase();
    const firstCity = homes[0]?.city?.toLowerCase() ?? '';
    const expectedFirstWord = expectedCityKey.split(' ')[0] ?? '';
    const cityMatch = !expectedCityKey || !expectedFirstWord || firstCity.includes(expectedFirstWord);

    if (!cityMatch) {
      return {
        homes: DEMO_HOMES.slice(0, limit),
        source: 'Demo Data',
        isDemo: true,
        note: `Redfin returned data for the wrong location (got "${homes[0]?.city}" instead of requested city) — showing sample data.`,
      };
    }

    return { homes, source: 'Redfin', isDemo: false };
  } catch {
    return {
      homes: DEMO_HOMES.slice(0, limit),
      source: 'Demo Data',
      isDemo: true,
      note: 'Live scraping failed — showing sample data.',
    };
  }
}

export function normalizeHome(h: RedfinHome): HomeResult {
  const priceVal = h.price?.value ?? null;
  const sqftVal  = h.sqFt?.value  ?? null;

  const streetLine = h.streetLine?.value ?? '';
  const unitNum    = h.unitNumber?.value ?? '';
  // Redfin often bakes the unit into streetLine already — only append if not present
  const address = unitNum && !streetLine.includes(unitNum)
    ? `${streetLine} ${unitNum}`.trim()
    : streetLine;

  return {
    address,
    city:   h.city    ?? '',
    state:  h.state   ?? '',
    price:  priceVal,
    beds:   h.beds  ?? 'N/A',
    baths:  h.baths ?? 'N/A',
    sqft:   sqftVal,
    status: h.mlsStatus ?? 'Active',
  };
}

function findRegion(query: string): CityRegion | null {
  const q = query.toLowerCase();
  for (const [city, region] of Object.entries(CITY_REGIONS)) {
    if (q.includes(city)) return region;
  }
  return null;
}

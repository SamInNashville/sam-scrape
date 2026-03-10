// Bot output formatter — token-optimized JSON for machine consumers.
//
// Design rules:
//   - Short but unambiguous field names
//   - Numbers as numbers (not "$649,000")
//   - No null fields (omit entirely if no value)
//   - No redundancy (query lives in envelope, not every result)

import type {
  ScrapeType,
  ScrapeData,
  BotEnvelope,
  BotResult,
  BotJobResult,
  BotHomeResult,
  BotProductResult,
  JobResult,
  HomeResult,
  ProductResult,
} from '../types.js';

export function toBotEnvelope(query: string, type: ScrapeType, data: ScrapeData): BotEnvelope {
  const items: (JobResult | HomeResult | ProductResult)[] =
    'jobs' in data ? data.jobs : 'homes' in data ? data.homes : data.products;

  const envelope: BotEnvelope = {
    q:    query,
    type,
    src:  data.source,
    n:    items.length,
    ts:   new Date().toISOString(),
    results: [],
  };

  if (data.isDemo)    envelope.demo = true;
  if (data.note)      envelope.note = data.note;

  envelope.results = items.map((item): BotResult => {
    if (type === 'jobs')       return botJob(item as JobResult);
    if (type === 'realestate') return botHome(item as HomeResult);
    return botProduct(item as ProductResult);
  });

  return envelope;
}

// ─── Per-type shapers ─────────────────────────────────────────────────────────

function botHome(h: HomeResult): BotHomeResult {
  const r: BotHomeResult = {};
  if (h.address) r.addr  = h.address;
  if (h.city)    r.city  = h.city;
  if (h.state)   r.state = h.state;

  if (h.price !== null && h.price !== undefined) r.price = h.price;

  if (h.beds  !== 'N/A' && h.beds  != null) r.beds  = Number(h.beds);
  if (h.baths !== 'N/A' && h.baths != null) r.baths = Number(h.baths);

  if (h.sqft !== null && h.sqft !== undefined) r.sqft = h.sqft;

  if (h.status && h.status !== 'Active') r.status = h.status;

  return r;
}

function botJob(j: JobResult): BotJobResult {
  const r: BotJobResult = {};
  if (j.title)    r.title = j.title;
  if (j.company)  r.co    = j.company;
  if (j.location) r.loc   = j.location;
  if (j.type)     r.type  = j.type;
  if (j.url)      r.url   = j.url;
  return r;
}

function botProduct(p: ProductResult): BotProductResult {
  const r: BotProductResult = {};
  if (p.title)                     r.title  = p.title;
  if (p.brand && p.brand !== 'Unknown') r.brand = p.brand;

  const price = parsePrice(p.price);
  if (price !== null) r.price = price;

  if (p.rating && p.rating !== 'N/A') r.rating = p.rating;
  if (p.url)                           r.url    = p.url;
  return r;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parsePrice(val: string | number | null | undefined): number | null {
  if (val == null || val === 'N/A') return null;
  if (typeof val === 'number') return val;
  const n = parseFloat(String(val).replace(/[^0-9.]/g, ''));
  return isNaN(n) ? null : n;
}

function parseSqft(val: string | number | null | undefined): number | null {
  if (val == null || val === 'N/A') return null;
  if (typeof val === 'number') return val;
  const n = parseInt(String(val).replace(/,/g, ''), 10);
  return isNaN(n) ? null : n;
}

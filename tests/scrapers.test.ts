// Tests scraper parsing logic with fixture data — no live network calls
import { test, expect } from 'vitest';
import type { HomeResult, JobResult, ProductResult } from '../src/types.js';
import { normalizeHome } from '../src/scrapers/realestate.js';

// ─── Real estate normalizer ───────────────────────────────────────────────────

interface RedfinRaw {
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

test('normalizeHome handles full Redfin payload', () => {
  const raw: RedfinRaw = {
    streetLine: { value: '1234 Main St' },
    city: 'Nashville',
    state: 'TN',
    price: { value: 450000 },
    beds: 3,
    baths: 2,
    sqFt: { value: 1850 },
    mlsStatus: 'Active',
  };
  const home = normalizeHome(raw);
  expect(home.address).toBe('1234 Main St');
  expect(home.price).toBe(450000);          // number, not string
  expect(typeof home.price).toBe('number');
  expect(home.beds).toBe(3);
  expect(home.sqft).toBe(1850);             // number, not string
  expect(typeof home.sqft).toBe('number');
});

test('normalizeHome does not duplicate unit number already in streetLine', () => {
  const raw: RedfinRaw = {
    streetLine: { value: '3120 SW Avalon Way #402' },
    unitNumber: { value: '#402' },
    city: 'Seattle', state: 'WA',
  };
  const home = normalizeHome(raw);
  expect(home.address).toBe('3120 SW Avalon Way #402');
  expect(home.address).not.toContain('#402 #402');
});

test('normalizeHome appends unit when not already in streetLine', () => {
  const raw: RedfinRaw = {
    streetLine: { value: '3120 SW Avalon Way' },
    unitNumber: { value: '#402' },
    city: 'Seattle', state: 'WA',
  };
  const home = normalizeHome(raw);
  expect(home.address).toBe('3120 SW Avalon Way #402');
});

test('normalizeHome handles missing fields gracefully', () => {
  const raw: RedfinRaw = { city: 'Austin', state: 'TX' };
  const home = normalizeHome(raw);
  expect(home.price).toBeNull();   // null, not 'N/A'
  expect(home.beds).toBe('N/A');
  expect(home.address).toBe('');
  expect(home.status).toBe('Active');
});

// ─── Job normalizer ───────────────────────────────────────────────────────────

interface ArbeitnowRaw {
  title?: string;
  company_name?: string;
  location?: string;
  job_types?: string[];
  url?: string;
}

function normalizeJob(job: ArbeitnowRaw): JobResult {
  return {
    title:    job.title        ?? 'Unknown',
    company:  job.company_name ?? 'Unknown',
    location: job.location     ?? 'Remote',
    type:     job.job_types?.join(', ') ?? 'Full-time',
    url:      job.url          ?? '',
  };
}

test('normalizeJob maps Arbeitnow fields correctly', () => {
  const raw: ArbeitnowRaw = {
    title: 'Senior Engineer',
    company_name: 'Stripe',
    location: 'Remote',
    job_types: ['Full-time', 'Contract'],
    url: 'https://stripe.com/jobs/123',
  };
  const job = normalizeJob(raw);
  expect(job.title).toBe('Senior Engineer');
  expect(job.company).toBe('Stripe');
  expect(job.type).toBe('Full-time, Contract');
});

test('normalizeJob handles missing fields', () => {
  const job = normalizeJob({});
  expect(job.title).toBe('Unknown');
  expect(job.company).toBe('Unknown');
  expect(job.location).toBe('Remote');
  expect(job.type).toBe('Full-time');
});

// ─── Product normalizer ───────────────────────────────────────────────────────

interface UpcRaw {
  title?: string;
  brand?: string;
  offers?: Array<{ price?: string; link?: string }>;
}

function normalizeProduct(item: UpcRaw): ProductResult {
  const offer = item.offers?.[0];
  const price = offer?.price !== undefined
    ? `$${parseFloat(String(offer.price)).toFixed(2)}`
    : 'N/A';
  return {
    title:  item.title ?? 'Unknown',
    brand:  item.brand ?? 'Unknown',
    price,
    rating: 'N/A',
    url:    offer?.link ?? '',
  };
}

test('normalizeProduct formats price from offer', () => {
  const raw: UpcRaw = {
    title: 'Mechanical Keyboard',
    brand: 'Keychron',
    offers: [{ price: '89.99', link: 'https://keychron.com' }],
  };
  const p = normalizeProduct(raw);
  expect(p.price).toBe('$89.99');
  expect(p.brand).toBe('Keychron');
  expect(p.url).toBe('https://keychron.com');
});

test('normalizeProduct handles no offers', () => {
  const p = normalizeProduct({ title: 'Widget' });
  expect(p.price).toBe('N/A');
  expect(p.brand).toBe('Unknown');
});

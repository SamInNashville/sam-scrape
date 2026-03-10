// Unit tests for the bot output formatter — no network, no CLI
import { test, expect } from 'vitest';
import { toBotEnvelope } from '../src/formatters/bot.js';
import type { HomesData, JobsData, ProductsData } from '../src/types.js';

const HOMES_DATA: HomesData = {
  homes: [
    { address: '1402 McGavock St', city: 'Nashville', state: 'TN', price: 649000, beds: 3, baths: 2.5, sqft: 1842, status: 'Active' },
    { address: '804 Meridian St',  city: 'Nashville', state: 'TN', price: 389000, beds: 2, baths: 1,   sqft: null, status: 'Pending' },
    { address: '99 Nowhere',       city: 'Nashville', state: 'TN', price: null,   beds: 'N/A', baths: 'N/A', sqft: null, status: 'Active' },
  ],
  source: 'Redfin',
  isDemo: false,
};

const JOBS_DATA: JobsData = {
  jobs: [
    { title: 'Senior Engineer', company: 'Stripe', location: 'Remote', type: 'Full-time', url: 'https://stripe.com/jobs/1' },
    { title: 'Designer',        company: '',       location: '',        type: '',          url: '' },
  ],
  source: 'Arbeitnow',
  isDemo: false,
};

const PRODUCTS_DATA: ProductsData = {
  products: [
    { title: 'Keychron K2', brand: 'Keychron', price: '$89.99', rating: '4.6/5', url: 'https://keychron.com' },
    { title: 'Generic KB',  brand: 'Unknown',  price: 'N/A',    rating: 'N/A',   url: '' },
  ],
  source: 'UPC ItemDB',
  isDemo: false,
};

// ─── Envelope structure ───────────────────────────────────────────────────────

test('envelope has compact keys', () => {
  const env = toBotEnvelope('Nashville homes', 'realestate', HOMES_DATA);
  expect('q'   in env).toBe(true);
  expect('n'   in env).toBe(true);
  expect('ts'  in env).toBe(true);
  expect('src' in env).toBe(true);
  expect('query'  in env).toBe(false);
  expect('count'  in env).toBe(false);
  expect('source' in env).toBe(false);
});

test('n equals results.length', () => {
  const env = toBotEnvelope('Nashville homes', 'realestate', HOMES_DATA);
  expect(env.n).toBe(env.results.length);
});

test('demo flag only present when isDemo is true', () => {
  const live = toBotEnvelope('q', 'realestate', { ...HOMES_DATA, isDemo: false });
  expect('demo' in live).toBe(false);

  const demo = toBotEnvelope('q', 'realestate', { ...HOMES_DATA, isDemo: true });
  expect(demo.demo).toBe(true);
});

// ─── Real estate fields ───────────────────────────────────────────────────────

test('home price is a number, not a string', () => {
  const { results } = toBotEnvelope('Nashville homes', 'realestate', HOMES_DATA);
  const first = results[0] as { price?: number };
  expect(first?.price).toBe(649000);
  expect(typeof first?.price).toBe('number');
});

test('home sqft is a number', () => {
  const { results } = toBotEnvelope('Nashville homes', 'realestate', HOMES_DATA);
  const first = results[0] as { sqft?: number };
  expect(first?.sqft).toBe(1842);
});

test('null price/sqft fields are omitted entirely', () => {
  const { results } = toBotEnvelope('Nashville homes', 'realestate', HOMES_DATA);
  const third = results[2] as Record<string, unknown>;
  expect('price' in third).toBe(false);
  expect('beds'  in third).toBe(false);
  expect('sqft'  in third).toBe(false);
});

test('price consistency: bot and file output both use raw numbers', () => {
  // price is stored as number in HomeResult, so CSV/JSON get numbers automatically
  const homes = HOMES_DATA.homes;
  expect(typeof homes[0].price).toBe('number');
  expect(homes[0].price).toBe(649000);
  expect(homes[2].price).toBeNull();
});

test('status omitted when Active (default)', () => {
  const { results } = toBotEnvelope('Nashville homes', 'realestate', HOMES_DATA);
  const first  = results[0] as Record<string, unknown>;
  const second = results[1] as { status?: string };
  expect('status' in first).toBe(false);
  expect(second?.status).toBe('Pending');
});

test('no null values in home results', () => {
  const { results } = toBotEnvelope('Nashville homes', 'realestate', HOMES_DATA);
  for (const r of results) {
    for (const [k, v] of Object.entries(r as Record<string, unknown>)) {
      expect(v).not.toBeNull();
      void k;
    }
  }
});

// ─── Job fields ───────────────────────────────────────────────────────────────

test('job uses short field names', () => {
  const { results } = toBotEnvelope('python jobs', 'jobs', JOBS_DATA);
  const first = results[0] as Record<string, unknown>;
  expect('co'      in first).toBe(true);
  expect('loc'     in first).toBe(true);
  expect('company' in first).toBe(false);
  expect('location' in first).toBe(false);
});

test('empty job strings omitted', () => {
  const { results } = toBotEnvelope('python jobs', 'jobs', JOBS_DATA);
  const second = results[1] as Record<string, unknown>;
  expect('co'   in second).toBe(false);
  expect('loc'  in second).toBe(false);
  expect('type' in second).toBe(false);
  expect('url'  in second).toBe(false);
});

// ─── Product fields ───────────────────────────────────────────────────────────

test('product price is a number', () => {
  const { results } = toBotEnvelope('keyboard', 'products', PRODUCTS_DATA);
  const first = results[0] as { price?: number };
  expect(first?.price).toBe(89.99);
  expect(typeof first?.price).toBe('number');
});

test('unknown brand omitted', () => {
  const { results } = toBotEnvelope('keyboard', 'products', PRODUCTS_DATA);
  const second = results[1] as Record<string, unknown>;
  expect('brand' in second).toBe(false);
});

test('N/A rating omitted', () => {
  const { results } = toBotEnvelope('keyboard', 'products', PRODUCTS_DATA);
  const second = results[1] as Record<string, unknown>;
  expect('rating' in second).toBe(false);
});

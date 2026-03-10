// Tests for demo data labeling, location handling, and job filtering
import { test, expect, vi } from 'vitest';
import type { HomesData, JobsData } from '../src/types.js';
import { toBotEnvelope } from '../src/formatters/bot.js';

// ─── Demo data labeling ───────────────────────────────────────────────────────

test('bot envelope includes demo:true when isDemo', () => {
  const demoData: HomesData = {
    homes: [{ address: '123 Main St', city: 'Nashville', state: 'TN', price: 450000, beds: 3, baths: 2, sqft: 1850, status: 'Active' }],
    source: 'Demo Data',
    isDemo: true,
    note: 'Live scraping failed — showing sample data.',
  };
  const env = toBotEnvelope('Nashville TN homes', 'realestate', demoData);
  expect(env.demo).toBe(true);
  expect(env.src).toBe('Demo Data');
  expect(env.note).toContain('sample data');
});

test('bot envelope does NOT include demo flag when isDemo is false', () => {
  const liveData: HomesData = {
    homes: [{ address: '456 Oak Ave', city: 'Nashville', state: 'TN', price: 389000, beds: 2, baths: 1, sqft: 1200, status: 'Active' }],
    source: 'Redfin',
    isDemo: false,
  };
  const env = toBotEnvelope('Nashville TN homes', 'realestate', liveData);
  expect('demo' in env).toBe(false);
});

test('demo jobs envelope includes demo:true', () => {
  const demoJobs: JobsData = {
    jobs: [{ title: 'Engineer', company: 'Acme', location: 'Remote', type: 'Full-time', url: '' }],
    source: 'Demo Data',
    isDemo: true,
  };
  const env = toBotEnvelope('python developer jobs', 'jobs', demoJobs);
  expect(env.demo).toBe(true);
});

// ─── Location handling ────────────────────────────────────────────────────────

test('scrapeRealEstate returns isDemo:true with note for unknown location', async () => {
  const { scrapeRealEstate } = await import('../src/scrapers/realestate.js');
  const result = await scrapeRealEstate('homes in Timbuktu', 5);
  expect(result.isDemo).toBe(true);
  expect(result.note).toBeTruthy();
  expect(result.note).toContain('Location not recognized');
});

test('scrapeRealEstate demo homes are Nashville-labeled (not Seattle)', async () => {
  const { scrapeRealEstate } = await import('../src/scrapers/realestate.js');
  // Force unknown location to get demo data
  const result = await scrapeRealEstate('homes in Nonexistentville', 5);
  expect(result.isDemo).toBe(true);
  // Demo homes should not be Seattle-labeled
  for (const home of result.homes) {
    expect(home.city).not.toBe('Seattle');
  }
});

// ─── Price consistency ────────────────────────────────────────────────────────

test('HomeResult price is a number (not formatted string)', async () => {
  const { normalizeHome } = await import('../src/scrapers/realestate.js');
  const home = normalizeHome({ price: { value: 649000 }, city: 'Nashville', state: 'TN' });
  expect(home.price).toBe(649000);
  expect(typeof home.price).toBe('number');
});

test('HomeResult sqft is a number (not formatted string)', async () => {
  const { normalizeHome } = await import('../src/scrapers/realestate.js');
  const home = normalizeHome({ sqFt: { value: 1842 }, city: 'Nashville', state: 'TN' });
  expect(home.sqft).toBe(1842);
  expect(typeof home.sqft).toBe('number');
});

test('missing price is null (not N/A string)', async () => {
  const { normalizeHome } = await import('../src/scrapers/realestate.js');
  const home = normalizeHome({ city: 'Nashville', state: 'TN' });
  expect(home.price).toBeNull();
  expect(home.sqft).toBeNull();
});

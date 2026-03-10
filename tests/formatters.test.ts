import { test, expect } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';
import { readFileSync, unlinkSync } from 'fs';
import { writeJSON } from '../src/formatters/json.js';
import { writeCSV }  from '../src/formatters/csv.js';
import type { JobsData, HomesData } from '../src/types.js';

const SAMPLE_JOBS: JobsData = {
  jobs: [
    { title: 'Software Engineer', company: 'Acme',   location: 'Remote',    type: 'Full-time', url: 'https://example.com' },
    { title: 'Data Analyst',      company: 'Globex', location: 'New York',  type: 'Full-time', url: 'https://example.com/2' },
  ],
  source: 'Test',
  isDemo: false,
};

const SAMPLE_HOMES: HomesData = {
  homes: [
    { address: '123 Main St', city: 'Nashville', state: 'TN', price: '$400,000', beds: 3, baths: 2, sqft: '1,800', status: 'Active' },
  ],
  source: 'Test',
  isDemo: false,
};

test('writeJSON writes valid JSON for jobs', () => {
  const out = join(tmpdir(), `sam-scrape-test-${Date.now()}.json`);
  writeJSON('jobs', SAMPLE_JOBS, out);
  const parsed = JSON.parse(readFileSync(out, 'utf8')) as unknown[];
  expect(parsed.length).toBe(2);
  expect((parsed[0] as { title: string }).title).toBe('Software Engineer');
  unlinkSync(out);
});

test('writeJSON writes valid JSON for homes', () => {
  const out = join(tmpdir(), `sam-scrape-test-${Date.now()}.json`);
  writeJSON('realestate', SAMPLE_HOMES, out);
  const parsed = JSON.parse(readFileSync(out, 'utf8')) as unknown[];
  expect(parsed.length).toBe(1);
  expect((parsed[0] as { city: string }).city).toBe('Nashville');
  unlinkSync(out);
});

test('writeCSV writes valid CSV with headers', () => {
  const out = join(tmpdir(), `sam-scrape-test-${Date.now()}.csv`);
  writeCSV('jobs', SAMPLE_JOBS, out);
  const content = readFileSync(out, 'utf8');
  expect(content).toContain('title');
  expect(content).toContain('Software Engineer');
  expect(content).toContain('Acme');
  unlinkSync(out);
});

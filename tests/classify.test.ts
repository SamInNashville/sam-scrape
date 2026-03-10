import { test, expect } from 'vitest';
import { classify } from '../src/classify.js';

test('classifies real estate queries', () => {
  expect(classify('Nashville TN homes')).toBe('realestate');
  expect(classify('Austin real estate for sale')).toBe('realestate');
  expect(classify('Chicago apartments for rent')).toBe('realestate');
  expect(classify('Denver condos')).toBe('realestate');
  expect(classify('Seattle housing market')).toBe('realestate');
});

test('classifies job queries', () => {
  expect(classify('python developer jobs remote')).toBe('jobs');
  expect(classify('senior engineer hiring')).toBe('jobs');
  expect(classify('frontend developer position')).toBe('jobs');
  expect(classify('data analyst career')).toBe('jobs');
  expect(classify('remote work software engineer')).toBe('jobs');
});

test('classifies product queries', () => {
  expect(classify('mechanical keyboard prices')).toBe('products');
  expect(classify('best laptop deals')).toBe('products');
  expect(classify('buy gaming headphones')).toBe('products');
  expect(classify('GPU price comparison')).toBe('products');
});

test('falls back to products for unknown queries', () => {
  expect(classify('something completely unrecognized xyzzy')).toBe('products');
});

test('handles mixed signals — picks strongest match', () => {
  const result = classify('real estate developer jobs hiring');
  expect(['realestate', 'jobs']).toContain(result);
});

// Query → scrape type classifier
import type { ScrapeType } from './types.js';

const REAL_ESTATE_KEYWORDS = [
  'real estate', 'homes', 'home', 'houses', 'house', 'apartments', 'apartment',
  'condo', 'condos', 'property', 'properties', 'realty', 'listing', 'listings',
  'for sale', 'for rent', 'rental', 'rentals', 'zillow', 'redfin', 'mls',
  'bedroom', 'bath', 'sqft', 'mortgage', 'housing',
] as const;

const JOB_KEYWORDS = [
  'job', 'jobs', 'career', 'careers', 'position', 'positions', 'hiring',
  'developer', 'engineer', 'designer', 'manager', 'analyst', 'role', 'roles',
  'work', 'employment', 'remote work', 'full-time', 'part-time', 'internship',
  'salary', 'opening', 'openings', 'recruit', 'linkedin', 'indeed',
] as const;

const PRODUCT_KEYWORDS = [
  'price', 'prices', 'buy', 'shop', 'product', 'products', 'deal', 'deals',
  'cheapest', 'best price', 'amazon', 'ebay', 'review', 'reviews',
  'keyboard', 'laptop', 'phone', 'headphones', 'monitor', 'gpu', 'cpu',
  'gaming', 'electronics', 'gadget', 'gadgets',
] as const;

/**
 * Classify a natural language query into a scrape category.
 * Picks the category with the highest keyword score; defaults to 'products'.
 */
export function classify(query: string): ScrapeType {
  const q = query.toLowerCase();

  const scores: Record<ScrapeType, number> = { realestate: 0, jobs: 0, products: 0 };

  for (const kw of REAL_ESTATE_KEYWORDS) {
    if (q.includes(kw)) scores.realestate += kw.includes(' ') ? 2 : 1;
  }
  for (const kw of JOB_KEYWORDS) {
    if (q.includes(kw)) scores.jobs += kw.includes(' ') ? 2 : 1;
  }
  for (const kw of PRODUCT_KEYWORDS) {
    if (q.includes(kw)) scores.products += kw.includes(' ') ? 2 : 1;
  }

  const max = Math.max(...Object.values(scores));
  if (max === 0) return 'products';

  const winner = (Object.entries(scores) as [ScrapeType, number][]).find(([, v]) => v === max);
  return winner?.[0] ?? 'products';
}

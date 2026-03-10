// sam-scrape — programmatic API
// Use this if you want to embed scraping in your own code.

export { classify }        from './classify.js';
export { scrapeJobs }      from './scrapers/jobs.js';
export { scrapeRealEstate } from './scrapers/realestate.js';
export { scrapeProducts }  from './scrapers/products.js';
export type { ScrapeType, ScrapeData, JobResult, HomeResult, ProductResult, JobsData, HomesData, ProductsData } from './types.js';

import { classify }         from './classify.js';
import { scrapeJobs }       from './scrapers/jobs.js';
import { scrapeRealEstate } from './scrapers/realestate.js';
import { scrapeProducts }   from './scrapers/products.js';
import type { ScrapeType, ScrapeData } from './types.js';

interface ScrapeOptions {
  limit?: number;
}

interface ScrapeResult {
  type: ScrapeType;
  data: ScrapeData;
}

/**
 * Scrape anything. Pass a natural language query, get back structured data.
 *
 * @param query - e.g. "Nashville TN homes" or "python developer jobs remote"
 * @param options - { limit: 20 }
 */
export async function scrape(query: string, options: ScrapeOptions = {}): Promise<ScrapeResult> {
  const limit = options.limit ?? 20;
  const type = classify(query);

  let data: ScrapeData;
  if (type === 'jobs')            data = await scrapeJobs(query, limit);
  else if (type === 'realestate') data = await scrapeRealEstate(query, limit);
  else                            data = await scrapeProducts(query, limit);

  return { type, data };
}

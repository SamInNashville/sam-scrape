/** Scrape category */
export type ScrapeType = 'realestate' | 'jobs' | 'products';

// ─── Scraper result shapes ────────────────────────────────────────────────────

export interface JobResult {
  title: string;
  company: string;
  location: string;
  type: string;
  url: string;
}

export interface HomeResult {
  address: string;
  city: string;
  state: string;
  price: number | null;   // raw number; consumers format for display
  beds: number | 'N/A';
  baths: number | 'N/A';
  sqft: number | null;    // raw number; consumers format for display
  status: string;
}

export interface ProductResult {
  title: string;
  brand: string;
  price: string;
  rating: string;
  url: string;
}

// ─── Scraper output envelopes ─────────────────────────────────────────────────

export interface JobsData {
  jobs: JobResult[];
  source: string;
  isDemo: boolean;
  note?: string;
}

export interface HomesData {
  homes: HomeResult[];
  source: string;
  isDemo: boolean;
  note?: string;
}

export interface ProductsData {
  products: ProductResult[];
  source: string;
  isDemo: boolean;
  note?: string;
}

export type ScrapeData = JobsData | HomesData | ProductsData;

// ─── Bot output shapes ────────────────────────────────────────────────────────

export interface BotJobResult {
  title?: string;
  co?: string;
  loc?: string;
  type?: string;
  url?: string;
}

export interface BotHomeResult {
  addr?: string;
  city?: string;
  state?: string;
  price?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  status?: string;
  url?: string;
}

export interface BotProductResult {
  title?: string;
  brand?: string;
  price?: number;
  rating?: string;
  url?: string;
}

export type BotResult = BotJobResult | BotHomeResult | BotProductResult;

export interface BotEnvelope {
  q: string;
  type: ScrapeType;
  src: string;
  n: number;
  ts: string;
  demo?: true;
  note?: string;
  results: BotResult[];
}

export interface BotError {
  error: string;
  [key: string]: string | number;
}

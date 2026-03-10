// Product scraper — uses UPC ItemDB free tier (no key required)
// Falls back to demo data if rate-limited

import { fetchJSON } from '../utils/http.js';
import type { ProductResult, ProductsData } from '../types.js';

const DEMO_PRODUCTS: ProductResult[] = [
  { title: 'Logitech MX Keys Advanced Wireless Keyboard', brand: 'Logitech', price: '$109.99', rating: '4.7/5', url: 'https://www.logitech.com' },
  { title: 'Keychron K2 Wireless Mechanical Keyboard',    brand: 'Keychron', price: '$89.99',  rating: '4.6/5', url: 'https://www.keychron.com' },
  { title: 'HHKB Professional Hybrid Type-S',            brand: 'PFU',      price: '$269.00', rating: '4.8/5', url: 'https://hhkeyboard.us' },
  { title: 'Nuphy Air75 V2 Wireless Mechanical Keyboard', brand: 'Nuphy',    price: '$99.95',  rating: '4.5/5', url: 'https://nuphy.com' },
  { title: 'Apple Magic Keyboard',                        brand: 'Apple',    price: '$99.00',  rating: '4.4/5', url: 'https://apple.com' },
];

interface UpcOffer {
  price?: string | number;
  link?: string;
}

interface UpcItem {
  title?: string;
  brand?: string;
  offers?: UpcOffer[];
  images?: string[];
}

interface UpcResponse {
  items?: UpcItem[];
}

export async function scrapeProducts(query: string, limit = 20): Promise<ProductsData> {
  const searchTerm = cleanQuery(query);

  try {
    const raw = await fetchJSON(
      `https://api.upcitemdb.com/prod/trial/search?s=${encodeURIComponent(searchTerm)}&type=product`
    );
    const data = raw as UpcResponse;

    if (!data?.items?.length) {
      return { products: DEMO_PRODUCTS.slice(0, limit), source: 'Demo Data', isDemo: true };
    }

    const products = data.items.slice(0, limit).map(normalizeProduct);
    return { products, source: 'UPC ItemDB', isDemo: false };
  } catch {
    return { products: DEMO_PRODUCTS.slice(0, limit), source: 'Demo Data', isDemo: true };
  }
}

function normalizeProduct(item: UpcItem): ProductResult {
  const offer = item.offers?.[0];
  const price = offer?.price !== undefined
    ? `$${parseFloat(String(offer.price)).toFixed(2)}`
    : 'N/A';

  return {
    title:  item.title ?? 'Unknown',
    brand:  item.brand ?? 'Unknown',
    price,
    rating: 'N/A',
    url:    offer?.link ?? item.images?.[0] ?? '',
  };
}

function cleanQuery(query: string): string {
  return query
    .replace(/\b(price|prices|buy|shop|best|cheap|cheapest|deals?|reviews?)\b/gi, '')
    .trim();
}

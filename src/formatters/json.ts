// JSON file output
import { writeFileSync } from 'fs';
import type { ScrapeType, ScrapeData } from '../types.js';

export function writeJSON(type: ScrapeType, data: ScrapeData, filePath: string): void {
  const rows = getRows(type, data);
  writeFileSync(filePath, JSON.stringify(rows, null, 2), 'utf8');
}

function getRows(type: ScrapeType, data: ScrapeData): object[] {
  if (type === 'jobs'       && 'jobs'     in data) return data.jobs;
  if (type === 'realestate' && 'homes'    in data) return data.homes;
  if ('products' in data)                          return data.products;
  return [];
}

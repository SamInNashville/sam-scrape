// CSV file output
import { stringify } from 'csv-stringify/sync';
import { writeFileSync } from 'fs';
import type { ScrapeType, ScrapeData } from '../types.js';

export function writeCSV(type: ScrapeType, data: ScrapeData, filePath: string): void {
  const rows = getRows(type, data);
  const csv = stringify(rows, { header: true });
  writeFileSync(filePath, csv, 'utf8');
}

function getRows(type: ScrapeType, data: ScrapeData): object[] {
  if (type === 'jobs'       && 'jobs'     in data) return data.jobs;
  if (type === 'realestate' && 'homes'    in data) return data.homes;
  if ('products' in data)                          return data.products;
  return [];
}

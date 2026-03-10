// Rich terminal output — tables, colors, clean spacing
// Uses chalk + cli-table3

import chalk from 'chalk';
import Table from 'cli-table3';
import type { ScrapeType, ScrapeData, JobsData, HomesData, ProductsData } from '../types.js';

export function printResults(type: ScrapeType, data: ScrapeData): void {
  console.log('');

  if (type === 'jobs' && 'jobs' in data) {
    printJobs(data);
  } else if (type === 'realestate' && 'homes' in data) {
    printHomes(data);
  } else if ('products' in data) {
    printProducts(data);
  }

  printFooter(data);
}

function printJobs(data: JobsData): void {
  const { jobs, source, isDemo } = data;
  const table = new Table({
    head: [
      chalk.bold('Title'),
      chalk.bold('Company'),
      chalk.bold('Location'),
      chalk.bold('Type'),
    ],
    colWidths: [36, 24, 20, 14],
    style: { head: [], border: ['dim'] },
    wordWrap: true,
  });

  for (const job of jobs) {
    table.push([
      chalk.white(truncate(job.title, 34)),
      chalk.cyan(truncate(job.company, 22)),
      chalk.dim(truncate(job.location, 18)),
      chalk.yellow(truncate(job.type, 12)),
    ]);
  }

  console.log(
    chalk.bold.green(`  ${jobs.length} jobs found`) +
    chalk.dim(` · ${source}${isDemo ? ' ⚠ DEMO DATA' : ''}`)
  );
  if (isDemo)    console.log(chalk.yellow(`  ⚠ Demo data — live scraping unavailable`));
  if (data.note) console.log(chalk.dim(`  ℹ ${data.note}`));
  console.log(table.toString());
}

function printHomes({ homes, source, isDemo, note }: HomesData): void {
  const table = new Table({
    head: [
      chalk.bold('Address'),
      chalk.bold('City'),
      chalk.bold('Price'),
      chalk.bold('Beds'),
      chalk.bold('Baths'),
      chalk.bold('Sqft'),
    ],
    colWidths: [28, 16, 14, 6, 7, 10],
    style: { head: [], border: ['dim'] },
    wordWrap: true,
  });

  for (const h of homes) {
    const priceStr = h.price !== null ? `$${h.price.toLocaleString()}` : 'N/A';
    const sqftStr  = h.sqft  !== null ? h.sqft.toLocaleString()        : 'N/A';
    table.push([
      chalk.white(truncate(h.address, 26)),
      chalk.cyan(truncate(h.city, 14)),
      chalk.green(priceStr),
      chalk.yellow(String(h.beds)),
      chalk.yellow(String(h.baths)),
      chalk.dim(sqftStr),
    ]);
  }

  console.log(
    chalk.bold.green(`  ${homes.length} listings found`) +
    chalk.dim(` · ${source}${isDemo ? ' ⚠ DEMO DATA' : ''}`)
  );
  if (isDemo) console.log(chalk.yellow(`  ⚠ Demo data — live scraping unavailable`));
  if (note)   console.log(chalk.dim(`  ℹ ${note}`));
  console.log(table.toString());
}

function printProducts({ products, source, isDemo }: ProductsData): void {
  const table = new Table({
    head: [
      chalk.bold('Product'),
      chalk.bold('Brand'),
      chalk.bold('Price'),
      chalk.bold('Rating'),
    ],
    colWidths: [44, 18, 12, 10],
    style: { head: [], border: ['dim'] },
    wordWrap: true,
  });

  for (const p of products) {
    table.push([
      chalk.white(truncate(p.title, 42)),
      chalk.cyan(truncate(p.brand, 16)),
      chalk.green(p.price),
      chalk.yellow(p.rating),
    ]);
  }

  console.log(
    chalk.bold.green(`  ${products.length} products found`) +
    chalk.dim(` · ${source}${isDemo ? ' ⚠ DEMO DATA' : ''}`)
  );
  if (isDemo) console.log(chalk.yellow(`  ⚠ Demo data — live scraping unavailable`));
  console.log(table.toString());
}

function printFooter(data: ScrapeData): void {
  const items = 'jobs' in data ? data.jobs : 'homes' in data ? data.homes : data.products;
  const first = items[0];
  // JobResult and ProductResult have url; HomeResult does not
  if (first !== undefined && 'url' in first && first.url) {
    console.log(chalk.dim(`  First result: ${first.url}`));
  }
  console.log('');
}

function truncate(str: string, max: number): string {
  if (!str) return '';
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

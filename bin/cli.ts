import { program } from 'commander';
import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

import { classify }         from '../src/classify.js';
import { scrapeJobs }       from '../src/scrapers/jobs.js';
import { scrapeRealEstate } from '../src/scrapers/realestate.js';
import { scrapeProducts }   from '../src/scrapers/products.js';
import { printResults }     from '../src/formatters/console.js';
import { writeCSV }         from '../src/formatters/csv.js';
import { writeJSON }        from '../src/formatters/json.js';
import { toBotEnvelope }    from '../src/formatters/bot.js';
import { BOT_HELP }         from '../src/bot-help.js';
import { Spinner }          from '../src/utils/spinner.js';
import type { ScrapeData, ScrapeType } from '../src/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

interface PackageJson { version: string; }
const pkg = require(path.join(__dirname, '../package.json')) as PackageJson;

program
  .name('sam-scrape')
  .description('Scrape the web with one command.')
  .version(pkg.version)
  .argument('[query]', 'What to search for — natural language, no quotes required')
  .option('-o, --output <file>', 'Save results to a file (.csv, .json, or .tsv)')
  .option('-n, --limit <number>', 'Max number of results', parseInt)
  .option('--bot',      'Bot mode: token-optimized JSON to stdout. No colors. No spinners. Built for AI agents.')
  .option('--bot-help', 'Output a machine-readable JSON spec of this tool\'s interface, then exit.')
  .parse();

const [query] = program.args;
const rawOpts = program.opts<{
  output?: string;
  limit?: number;
  bot?: boolean;
  botHelp?: boolean;
}>();

// Validate --limit early: parseInt('abc') = NaN, negatives = bad
let limit = 20;
if (rawOpts.limit !== undefined) {
  if (isNaN(rawOpts.limit) || rawOpts.limit < 0) {
    if (rawOpts.bot) {
      process.stdout.write(JSON.stringify({ error: 'Invalid --limit value: must be a non-negative integer' }) + '\n');
      process.exit(1);
    }
    console.error(chalk.red(`\n  Error: --limit must be a non-negative integer\n`));
    process.exit(1);
  }
  limit = rawOpts.limit;
}

const { output, bot = false, botHelp = false } = rawOpts;

// EXIT CODES:
//   0 — success, live data
//   1 — error
//   2 — partial / fallback demo data

function emit(obj: unknown): void {
  process.stdout.write(JSON.stringify(obj, null, 2) + '\n');
}

function botError(message: string, extra: Record<string, unknown> = {}): never {
  emit({ error: message, ...extra });
  process.exit(1);
}

const KNOWN_EXTENSIONS = new Set(['.csv', '.tsv', '.json']);

function getFormat(filePath: string): 'json' | 'csv' {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.json') return 'json';
  if (!KNOWN_EXTENSIONS.has(ext)) {
    console.error(chalk.yellow(`\n  ⚠ Unknown extension "${ext}" — defaulting to CSV format. Use .csv, .tsv, or .json.\n`));
  }
  return 'csv';
}

async function run(): Promise<void> {
  // --bot-help: emit the interface spec and exit. No query needed.
  if (botHelp) {
    emit(BOT_HELP);
    process.exit(0);
  }

  if (!query) {
    if (bot) {
      botError('No query provided. Pass a search query as the first argument.');
    }
    program.help(); // prints help and exits (exit 0 for human UX)
  }

  const type: ScrapeType = classify(query);
  const typeLabel = { jobs: 'jobs', realestate: 'real estate listings', products: 'products' }[type];

  const spinner = bot ? null : new Spinner(`Searching for ${typeLabel}…`).start();

  let data: ScrapeData;
  try {
    if (type === 'jobs')            data = await scrapeJobs(query, limit);
    else if (type === 'realestate') data = await scrapeRealEstate(query, limit);
    else                            data = await scrapeProducts(query, limit);
  } catch (err) {
    spinner?.stop();
    if (bot) botError(err instanceof Error ? err.message : String(err));
    console.error(chalk.red(`\n  Error: ${err instanceof Error ? err.message : String(err)}`));
    process.exit(1);
  }

  spinner?.stop();

  // --bot: token-optimized JSON envelope to stdout, then done
  if (bot) {
    if (output) {
      process.stderr.write(`sam-scrape: warning: --bot and --output are mutually exclusive; --output ignored\n`);
    }
    const envelope = toBotEnvelope(query, type, data);
    emit(envelope);
    process.exit(data.isDemo ? 2 : 0);
  }

  // --output: write to file
  if (output) {
    const format = getFormat(output);
    try {
      if (format === 'json') writeJSON(type, data, output);
      else                   writeCSV(type, data, output);

      const items = 'jobs' in data ? data.jobs : 'homes' in data ? data.homes : data.products;
      if (data.isDemo) {
        console.log(chalk.yellow(`\n  ⚠ Demo data — live scraping unavailable`));
        if (data.note) console.log(chalk.dim(`  ℹ ${data.note}`));
      }
      console.log(chalk.green(`\n  ✓ ${items.length} results saved to ${output}\n`));
    } catch (err) {
      console.error(chalk.red(`\n  Couldn't write file: ${err instanceof Error ? err.message : String(err)}`));
      process.exit(1);
    }
    process.exit(data.isDemo ? 2 : 0);
  }

  // Default: pretty table for humans
  printResults(type, data);
  process.exit(data.isDemo ? 2 : 0);
}

run().catch((err: unknown) => {
  console.error(chalk.red(`\n  Fatal: ${err instanceof Error ? err.message : String(err)}`));
  process.exit(1);
});

// Machine-readable interface spec for --bot-help.
// Single source of truth for the bot interface.
// Keep it minimal — a bot should parse this in ~200 tokens.

// Import package.json via resolveJsonModule — tsc copies it to dist/
import pkg from '../package.json' with { type: 'json' };

export const BOT_HELP = {
  name: 'sam-scrape',
  version: pkg.version,
  usage: 'npx sam-scrape <query> [options]',
  args: {
    query: { type: 'string', required: true, description: 'natural language search query' },
  },
  flags: {
    '-o, --output':   { type: 'filepath', description: 'write results to file (csv/json/tsv auto-detected from extension)' },
    '-n, --limit':    { type: 'integer',  default: 20, description: 'max results' },
    '--bot':          { type: 'boolean',  description: 'machine-readable JSON output, no formatting, token-optimized' },
    '--bot-help':     { type: 'boolean',  description: 'output this interface spec as JSON and exit' },
  },
  output: {
    human: 'formatted table to stdout',
    bot: {
      format: 'JSON',
      note: 'token-optimized — numbers as numbers, no nulls, short field names',
      envelope: {
        q:       'string  — original query',
        type:    'string  — realestate | jobs | products',
        src:     'string  — data source name',
        n:       'integer — result count',
        ts:      'ISO8601 — timestamp',
        demo:    'boolean — present and true only when returning fallback data',
        note:    'string  — present only when there is a warning',
        results: 'array',
      },
      fields: {
        realestate: { addr: 'string', city: 'string', state: 'string', price: 'integer (USD)', beds: 'number', baths: 'number', sqft: 'integer', status: 'string (omitted if Active)', url: 'string' },
        jobs:       { title: 'string', co: 'string', loc: 'string', type: 'string', url: 'string' },
        products:   { title: 'string', brand: 'string', price: 'number (USD)', rating: 'string', url: 'string' },
      },
    },
    errors: {
      format: 'JSON',
      envelope: { error: 'string', retry_after: 'integer|omitted' },
    },
  },
  exit_codes: { 0: 'success', 1: 'error', 2: 'partial results (demo/fallback data)' },
  categories: ['realestate', 'jobs', 'products'],
  examples: [
    'npx sam-scrape "Nashville homes" --bot',
    'npx sam-scrape "python jobs remote" --bot -n 10',
    'npx sam-scrape "mechanical keyboard" --bot -o results.json',
  ],
} as const;

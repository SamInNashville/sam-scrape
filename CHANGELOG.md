# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-03-13

### Added
- Initial release
- Real estate scraper (Redfin stingray API, 25 cities, graceful demo fallback)
- Jobs scraper (Indeed HTML scrape, demo fallback)
- Products scraper (demo data)
- Natural-language query classification (`realestate` / `jobs` / `products`)
- Human-readable console output (tables, colors, spinners)
- Bot mode (`--bot`): token-optimized JSON stdout, no ANSI, exit code 2 for demo data
- Machine-readable interface spec (`--bot-help`)
- File output (`-o file.csv`, `-o file.json`, `-o file.tsv`)
- `-n` flag to limit results
- Programmatic API (`import { scrape } from 'sam-scrape'`)
- GitHub Actions CI (install, build, test on push/PR)

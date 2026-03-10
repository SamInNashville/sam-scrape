# sam-scrape

Scrape the web — jobs, real estate, products — with one command.

```bash
npx sam-scrape "Nashville TN homes"
```

That's it.

---

## Flags

| Flag | Description |
|------|-------------|
| `-n <number>` | Max results (default: 20) |
| `-o <file>` | Save to file — `.csv`, `.json`, or `.tsv` auto-detected |
| `--bot` | Token-optimized JSON to stdout. No colors. No spinners. Built for AI agents. |
| `--bot-help` | Machine-readable JSON spec of the full interface. Output and exit. |
| `--help` | Standard help |

---

## Bot Mode

**`--bot` turns sam-scrape into an AI-native tool.**

```bash
npx sam-scrape "Nashville homes" --bot
```

Clean JSON to stdout. No ANSI, no spinners, no decorative boxes. Just data.

```json
{
  "q": "Nashville TN homes",
  "type": "realestate",
  "src": "Redfin",
  "n": 8,
  "ts": "2026-03-10T05:07:00Z",
  "results": [
    { "addr": "1402 McGavock St", "city": "Nashville", "state": "TN", "price": 649000, "beds": 3, "baths": 2.5, "sqft": 1842 },
    { "addr": "804 Meridian St",  "city": "Nashville", "state": "TN", "price": 389000, "beds": 2, "baths": 1 }
  ]
}
```

Errors are JSON too: `{ "error": "Rate limited", "retry_after": 30 }`

**Exit codes:**

| Code | Meaning |
|------|---------|
| `0` | Success — live data |
| `1` | Error |
| `2` | Partial — fallback/demo data (`"demo": true` in envelope) |

**`--bot-help` — machine-readable interface spec:**

```bash
npx sam-scrape --bot-help
```

One call, full interface. ~200 tokens. No prose.

**Pipe anywhere:**

```bash
npx sam-scrape "python jobs" --bot | jq '.results[].title'
npx sam-scrape "Nashville homes" --bot | jq '[.results[] | select(.beds >= 3)]'
```

---

## Why This Exists

The old way: install a framework, read the docs, configure 30 options, write boilerplate, debug for an hour.

The new way: one command, real data, done.

`sam-scrape` is bespoke tooling for the AI era. No abstraction layers you don't need. No config files. No learning curve. Just results. Built for humans **and** machines — because in 2026, bots are users too.

---

## Sample Output

**Human (`npx sam-scrape "Nashville homes"`):**

```
  20 listings found · Redfin
┌────────────────────────────┬───────────────┬──────────────┬──────┬───────┬──────────┐
│ Address                    │ City          │ Price        │ Beds │ Baths │ Sqft     │
├────────────────────────────┼───────────────┼──────────────┼──────┼───────┼──────────┤
│ 1234 Belmont Blvd          │ Nashville     │ $525,000     │ 3    │ 2     │ 1,950    │
│ 456 12th Ave S             │ Nashville     │ $389,000     │ 2    │ 1     │ 1,100    │
└────────────────────────────┴───────────────┴──────────────┴──────┴───────┴──────────┘
```

**Bot (`--bot`):**

```json
{ "q": "Nashville homes", "type": "realestate", "src": "Redfin", "n": 2, "ts": "2026-03-10T05:07:00Z",
  "results": [{ "addr": "1234 Belmont Blvd", "city": "Nashville", "state": "TN", "price": 525000, "beds": 3, "baths": 2, "sqft": 1950 }] }
```

---

MIT License · 2026 · Sam M.

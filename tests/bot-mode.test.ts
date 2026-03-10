// Tests --bot and --bot-help flag behavior via spawned CLI process
import { test, expect } from 'vitest';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const CLI = join(dirname(fileURLToPath(import.meta.url)), '../dist/bin/cli.js');

function run(args: string[]): { stdout: string; stderr: string; status: number | null } {
  const result = spawnSync(process.execPath, [CLI, ...args], {
    encoding: 'utf8',
    timeout: 30000,
  });
  return { stdout: result.stdout, stderr: result.stderr, status: result.status };
}

// ─── --bot ────────────────────────────────────────────────────────────────────

test('--bot outputs valid JSON to stdout', () => {
  const { stdout } = run(['Nashville TN homes', '--bot', '-n', '5']);
  const parsed: unknown = JSON.parse(stdout);
  expect(parsed).toBeTruthy();
});

test('--bot envelope has required fields', () => {
  const { stdout, status } = run(['Nashville TN homes', '--bot', '-n', '5']);
  const p = JSON.parse(stdout) as Record<string, unknown>;
  expect('q'       in p).toBe(true);
  expect('type'    in p).toBe(true);
  expect('src'     in p).toBe(true);
  expect('n'       in p).toBe(true);
  expect('ts'      in p).toBe(true);
  expect('results' in p).toBe(true);
  expect(typeof p['n']).toBe('number');
  expect(Array.isArray(p['results'])).toBe(true);
  expect([0, 2]).toContain(status);
});

test('--bot stdout has no ANSI escape codes', () => {
  const { stdout } = run(['python developer jobs', '--bot', '-n', '3']);
  // eslint-disable-next-line no-control-regex
  expect(stdout).not.toMatch(/\x1b\[/);
});

test('--bot stderr is empty (no spinner)', () => {
  const { stderr } = run(['mechanical keyboard prices', '--bot', '-n', '3']);
  expect(stderr.trim()).toBe('');
});

test('--bot: home results have numeric price', () => {
  const { stdout } = run(['Nashville TN homes', '--bot', '-n', '5']);
  const { results } = JSON.parse(stdout) as { results: Array<Record<string, unknown>> };
  const first = results[0];
  if (first !== undefined && first['price'] != null) {
    expect(typeof first['price']).toBe('number');
  }
});

test('--bot: no null fields in results', () => {
  const { stdout } = run(['Nashville TN homes', '--bot', '-n', '5']);
  const { results } = JSON.parse(stdout) as { results: Array<Record<string, unknown>> };
  for (const r of results) {
    for (const [k, v] of Object.entries(r)) {
      expect(v).not.toBeNull();
      void k;
    }
  }
});

test('--bot: job results have short field names', () => {
  const { stdout } = run(['python developer jobs remote', '--bot', '-n', '3']);
  const { results, type } = JSON.parse(stdout) as { results: Array<Record<string, unknown>>; type: string };
  expect(type).toBe('jobs');
  const first = results[0];
  if (first !== undefined) {
    expect('title' in first || 'co' in first).toBe(true);
    expect('company_name' in first).toBe(false);
    expect('job_location' in first).toBe(false);
  }
});

test('--bot: ts field is valid ISO8601', () => {
  const { stdout } = run(['mechanical keyboard', '--bot', '-n', '3']);
  const { ts } = JSON.parse(stdout) as { ts: string };
  expect(isNaN(new Date(ts).getTime())).toBe(false);
});

// ─── --bot-help ───────────────────────────────────────────────────────────────

test('--bot-help outputs valid JSON and exits 0', () => {
  const { stdout, status } = run(['--bot-help']);
  const parsed: unknown = JSON.parse(stdout);
  expect(status).toBe(0);
  expect(parsed).toBeTruthy();
});

test('--bot-help has required spec fields', () => {
  const { stdout } = run(['--bot-help']);
  const spec = JSON.parse(stdout) as Record<string, unknown>;
  expect('name'       in spec).toBe(true);
  expect('version'    in spec).toBe(true);
  expect('usage'      in spec).toBe(true);
  expect('args'       in spec).toBe(true);
  expect('flags'      in spec).toBe(true);
  expect('output'     in spec).toBe(true);
  expect('exit_codes' in spec).toBe(true);
  expect('categories' in spec).toBe(true);
  expect('examples'   in spec).toBe(true);
});

test('--bot-help documents --bot flag', () => {
  const { stdout } = run(['--bot-help']);
  const { flags } = JSON.parse(stdout) as { flags: Record<string, unknown> };
  expect('--bot' in flags).toBe(true);
});

test('--bot-help documents --bot-help itself', () => {
  const { stdout } = run(['--bot-help']);
  const { flags } = JSON.parse(stdout) as { flags: Record<string, unknown> };
  expect('--bot-help' in flags).toBe(true);
});

test('--bot-help works without a query argument', () => {
  const { status, stdout } = run(['--bot-help']);
  expect(status).toBe(0);
  expect(stdout.trim().startsWith('{')).toBe(true);
});

test('--bot-help output has no ANSI codes', () => {
  const { stdout } = run(['--bot-help']);
  // eslint-disable-next-line no-control-regex
  expect(stdout).not.toMatch(/\x1b\[/);
});

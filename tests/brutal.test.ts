// brutal.test.ts — edge cases and adversarial input tests
import { test, expect } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(__dirname, '../dist/bin/cli.js');

interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
}

function runCLI(args: string[], opts: Record<string, unknown> = {}): Promise<RunResult> {
  return new Promise((resolve) => {
    execFile(process.execPath, [CLI, ...args], { ...opts, timeout: 15000 }, (err, stdout, stderr) => {
      const code = (err as NodeJS.ErrnoException | null)?.code;
      resolve({
        code: typeof code === 'number' ? code : 0,
        stdout: stdout as string,
        stderr: stderr as string,
      });
    });
  });
}

// ─── Bug #1: -n -1 ───────────────────────────────────────────────────────────
test('-n -1 should error or return 0 results, not N-1', async () => {
  const { stdout, code } = await runCLI(['Nashville homes', '-n', '-1', '--bot']);
  const data = JSON.parse(stdout) as Record<string, unknown>;
  if (data['error']) {
    expect(code).toBe(1);
  } else {
    expect(data['n']).toBe(0);
    expect((data['results'] as unknown[]).length).toBe(0);
  }
});

// ─── Bug #2: -n abc (NaN) ────────────────────────────────────────────────────
test('-n abc (NaN) should error or use default', async () => {
  const { stdout, code } = await runCLI(['Nashville homes', '-n', 'abc', '--bot']);
  const data = JSON.parse(stdout) as Record<string, unknown>;
  if (data['error']) {
    expect(code).toBe(1);
  } else {
    expect(data['n']).toBeGreaterThan(0);
  }
});

// ─── Bug #3: --bot with no query ─────────────────────────────────────────────
test('--bot with no query should emit JSON error and exit 1', async () => {
  const { stdout, code } = await runCLI(['--bot']);
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(stdout) as Record<string, unknown>;
  } catch {
    throw new Error(`--bot with no query must output valid JSON, got: ${stdout.slice(0, 200)}`);
  }
  expect(parsed['error']).toBeTruthy();
  expect(code).toBe(1);
});

// ─── Bug #4: --bot -o file ───────────────────────────────────────────────────
test('--bot -o file: should warn on stderr, not silently ignore -o', async () => {
  const tmpFile = '/tmp/brutal_test_bot_o.csv';
  if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  const { stdout, stderr, code } = await runCLI(['Nashville homes', '--bot', '-o', tmpFile]);
  const fileCreated = fs.existsSync(tmpFile);
  const validBotJSON = (() => {
    try { const d = JSON.parse(stdout) as { type?: string }; return !!d.type; } catch { return false; }
  })();
  const hasWarning = stderr.includes('mutually exclusive') || stderr.includes('ignored') || code === 1;
  if (validBotJSON && !fileCreated) {
    expect(hasWarning).toBe(true);
  }
  if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
});

// ─── Bug #5: -o unknown.xyz ──────────────────────────────────────────────────
test('-o unknown.xyz should warn about unknown extension', async () => {
  const tmpFile = '/tmp/brutal_test.xyz';
  if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  const { stderr, code } = await runCLI(['Nashville homes', '-o', tmpFile]);
  const hasWarning =
    stderr.toLowerCase().includes('unknown') ||
    stderr.toLowerCase().includes('extension') ||
    stderr.toLowerCase().includes('warn') ||
    code !== 0;
  if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  expect(hasWarning).toBe(true);
});

// ─── Empty string query shows help ───────────────────────────────────────────
test('empty string query shows help and exits cleanly', async () => {
  const { stdout, stderr } = await runCLI(['']);
  const combined = stdout + stderr;
  expect(combined.length).toBeGreaterThan(0);
});

// ─── Nonsense query returns valid bot envelope ────────────────────────────────
test('nonsense query returns valid bot JSON', async () => {
  const { stdout } = await runCLI(['asdjkfhaslkdjfh', '--bot']);
  const data = JSON.parse(stdout) as Record<string, unknown>;
  expect(data['q']).toBeTruthy();
  expect(data['type']).toBeTruthy();
  expect(Array.isArray(data['results'])).toBe(true);
});

// ─── Special chars in query ───────────────────────────────────────────────────
test("special chars in query (<script>alert('xss')</script>) return valid JSON", async () => {
  const { stdout } = await runCLI(["Nashville <script>alert('xss')</script>", '--bot']);
  const data = JSON.parse(stdout) as Record<string, unknown>;
  expect(String(data['q'])).toContain('<script>');
  expect(Array.isArray(data['results'])).toBe(true);
});

// ─── Unicode query ────────────────────────────────────────────────────────────
test('unicode query (東京 apartments) returns valid bot JSON', async () => {
  const { stdout } = await runCLI(['東京 apartments', '--bot']);
  const data = JSON.parse(stdout) as Record<string, unknown>;
  expect(data['q']).toBe('東京 apartments');
  expect(Array.isArray(data['results'])).toBe(true);
});

// ─── Very long query ─────────────────────────────────────────────────────────
test('very long query (500+ chars) does not crash', async () => {
  const longQuery = 'Nashville homes ' + 'a'.repeat(500);
  const { stdout, code } = await runCLI([longQuery, '--bot']);
  expect(() => JSON.parse(stdout)).not.toThrow();
  expect([0, 2]).toContain(code);
});

// ─── --bot-help is valid JSON ─────────────────────────────────────────────────
test('--bot-help outputs valid JSON with no ANSI codes', async () => {
  const { stdout, code } = await runCLI(['--bot-help']);
  expect(code).toBe(0);
  // eslint-disable-next-line no-control-regex
  expect(/\x1b\[/.test(stdout)).toBe(false);
  const data = JSON.parse(stdout) as Record<string, unknown>;
  expect(data['name']).toBeTruthy();
});

// ─── n field matches results.length ──────────────────────────────────────────
test('envelope n field always matches results.length', async () => {
  const { stdout } = await runCLI(['Nashville homes', '--bot']);
  const data = JSON.parse(stdout) as { n: number; results: unknown[] };
  expect(data.n).toBe(data.results.length);
});

// ─── -n 0 returns empty results ──────────────────────────────────────────────
test('-n 0 returns empty results consistently', async () => {
  const { stdout } = await runCLI(['Nashville homes', '-n', '0', '--bot']);
  const data = JSON.parse(stdout) as { n: number; results: unknown[] };
  expect(data.n).toBe(0);
  expect(data.results.length).toBe(0);
});

// ─── Bad output path exits 1 ─────────────────────────────────────────────────
test('-o /root/nope.csv exits 1 with error message', async () => {
  const { code, stderr } = await runCLI(['Nashville homes', '-o', '/root/nope.csv']);
  expect(code).toBe(1);
  const msg = stderr.toLowerCase();
  expect(msg.includes('couldn') || msg.includes('error')).toBe(true);
});

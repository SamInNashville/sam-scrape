// Fetch wrapper with retries and user agent rotation

const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
] as const;

let uaIndex = 0;

/** Returns the next user agent string, cycling through the list. */
export function getUA(): string {
  const ua = USER_AGENTS[uaIndex % USER_AGENTS.length];
  uaIndex++;
  return ua ?? USER_AGENTS[0];
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Fetch with automatic retries and rotating user agents.
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 2
): Promise<Response> {
  const headers: Record<string, string> = {
    'User-Agent': getUA(),
    'Accept': 'application/json, text/html,*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    ...(options.headers as Record<string, string> | undefined),
  };

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        headers,
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) {
        if (attempt < retries) {
          await sleep(500 * (attempt + 1));
          continue;
        }
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return res;
    } catch (err) {
      if (attempt >= retries) throw err;
      await sleep(500 * (attempt + 1));
    }
  }
  // unreachable, but TypeScript needs it
  throw new Error('fetchWithRetry: exhausted retries');
}

/** Fetch JSON from a URL with retries. */
export async function fetchJSON(url: string, options: RequestInit = {}): Promise<unknown> {
  const res = await fetchWithRetry(url, options);
  return res.json() as Promise<unknown>;
}

/** Fetch text from a URL with retries. */
export async function fetchText(url: string, options: RequestInit = {}): Promise<string> {
  const res = await fetchWithRetry(url, options);
  return res.text();
}

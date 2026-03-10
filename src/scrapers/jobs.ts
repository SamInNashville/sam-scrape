// Job board scraper — uses Remotive (free, no key required, actually supports search)
// Falls back to demo data if the API is down.

import { fetchJSON } from '../utils/http.js';
import type { JobResult, JobsData } from '../types.js';

const DEMO_JOBS: JobResult[] = [
  { title: 'Senior Software Engineer', company: 'Stripe',      location: 'Remote', type: 'Full-time', url: 'https://stripe.com/jobs' },
  { title: 'Product Manager',          company: 'Linear',      location: 'Remote', type: 'Full-time', url: 'https://linear.app/jobs' },
  { title: 'Frontend Developer',       company: 'Vercel',      location: 'Remote', type: 'Full-time', url: 'https://vercel.com/jobs' },
  { title: 'DevOps Engineer',          company: 'Cloudflare',  location: 'Remote', type: 'Full-time', url: 'https://cloudflare.com/careers' },
  { title: 'Data Engineer',            company: 'Databricks',  location: 'Remote', type: 'Full-time', url: 'https://databricks.com/company/careers' },
];

/** Remotive API response shape (partial). */
interface RemotiveJob {
  title?: string;
  company_name?: string;
  candidate_required_location?: string;
  job_type?: string;
  url?: string;
}

interface RemotiveResponse {
  'job-count'?: number;
  jobs?: RemotiveJob[];
}

export async function scrapeJobs(query: string, limit = 20): Promise<JobsData> {
  const searchTerms = extractSearchTerms(query);

  try {
    const raw = await fetchJSON(
      `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(searchTerms)}&limit=${limit}`
    ) as RemotiveResponse;

    const jobs = (raw?.jobs ?? []).slice(0, limit).map(normalizeJob);

    if (jobs.length === 0) {
      return {
        jobs: [],
        source: 'Remotive',
        isDemo: false,
        note: `No listings matched "${searchTerms}" in Remotive's current index. Try broader terms (e.g. "engineer" or "developer").`,
      };
    }

    return { jobs, source: 'Remotive', isDemo: false };
  } catch {
    return { jobs: DEMO_JOBS.slice(0, limit), source: 'Demo Data', isDemo: true };
  }
}

function normalizeJob(job: RemotiveJob): JobResult {
  return {
    title:    job.title                        ?? 'Unknown',
    company:  job.company_name                 ?? 'Unknown',
    location: job.candidate_required_location  ?? 'Remote',
    type:     job.job_type                     ?? 'Full-time',
    url:      job.url                          ?? '',
  };
}

/** Strip boilerplate from query and return clean search terms. */
function extractSearchTerms(query: string): string {
  return query
    .replace(/\b(jobs?|careers?|hiring|position)\b/gi, '')
    .trim()
    .replace(/\s+/g, ' ');
}

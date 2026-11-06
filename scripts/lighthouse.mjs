/**
 * Lighthouse budget gate. Usage: node scripts/lighthouse.mjs [baseUrl]
 * Runs mobile Lighthouse on key pages of a running build (astro preview) and exits 1
 * if any category score is below the budget (PLAN.md / prompt section 8).
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const BASE = process.argv[2] ?? 'http://localhost:4321';
const PAGES = ['/', '/servicios/drywall-y-superboard/', '/sectores/retail/', '/cotizar/', '/blog/drywall-vs-mamposteria/'];
const MIN_SCORE = 95;
const BUDGET = { lcpMs: 2500, cls: 0.1, tbtMs: 200 };

const out = mkdtempSync(path.join(tmpdir(), 'lh-'));
let failed = false;

for (const page of PAGES) {
  const file = path.join(out, `${page.replace(/\W+/g, '_') || 'home'}.json`);
  const run = spawnSync(
    'npx',
    [
      'lighthouse',
      BASE + page,
      '--quiet',
      '--output=json',
      `--output-path=${file}`,
      '--chrome-flags=--headless=new --no-sandbox',
      '--only-categories=performance,accessibility,best-practices,seo',
    ],
    { stdio: 'inherit' },
  );
  if (run.status !== 0) {
    console.error(`✖ Lighthouse failed to run on ${page}`);
    failed = true;
    continue;
  }
  const report = JSON.parse(readFileSync(file, 'utf8'));
  const scores = Object.fromEntries(Object.entries(report.categories).map(([k, v]) => [k, Math.round(v.score * 100)]));
  const lcp = report.audits['largest-contentful-paint'].numericValue;
  const cls = report.audits['cumulative-layout-shift'].numericValue;
  const tbt = report.audits['total-blocking-time'].numericValue;
  const problems = [
    ...Object.entries(scores)
      .filter(([, s]) => s < MIN_SCORE)
      .map(([k, s]) => `${k} ${s} < ${MIN_SCORE}`),
    ...(lcp > BUDGET.lcpMs ? [`LCP ${Math.round(lcp)}ms > ${BUDGET.lcpMs}`] : []),
    ...(cls > BUDGET.cls ? [`CLS ${cls.toFixed(3)} > ${BUDGET.cls}`] : []),
    ...(tbt > BUDGET.tbtMs ? [`TBT ${Math.round(tbt)}ms > ${BUDGET.tbtMs}`] : []),
  ];
  console.log(`${problems.length ? '✖' : '✔'} ${page}  ${JSON.stringify(scores)}  LCP ${Math.round(lcp)}ms  CLS ${cls.toFixed(3)}  TBT ${Math.round(tbt)}ms`);
  problems.forEach((p) => console.log(`    ${p}`));
  if (problems.length) failed = true;
}

process.exit(failed ? 1 : 0);

import * as chromeLauncher from 'chrome-launcher';

import { Flags } from 'lighthouse';
import fs from 'fs';
import minimist from 'minimist';
import path from 'path';

type Metrics = {
  run: number;
  fcp: number;
  lcp: number;
  tbt: number;
  cls: number;
  si: number;
  score: number;
};

type MetricsResponse = { metrics: Metrics, htmlReport: string };

async function runLighthouse(url: string, run: number, cookie: string): Promise<MetricsResponse> {
  const lighthouse = (await import('lighthouse')).default;
  const chromeFlags = ['--headless', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage'];
  const chrome = await chromeLauncher.launch({ chromeFlags });

  const extraHeaders: Record<string, string> = {};
  if (cookie) {
    extraHeaders['Cookie'] = cookie;
  }

  console.log('extraHeaders', extraHeaders);

  const options: Flags = {
    logLevel: 'error',
    output: 'html',
    onlyCategories: ['performance'],
    port: chrome.port,
    extraHeaders: extraHeaders,
  };

  console.log('Console is warming up');
  const runnerResult = await lighthouse(url, options);

  console.log('Lets extract the metrics');
  // Extract metrics
  const audits = runnerResult?.lhr.audits || {};
  const categories = runnerResult?.lhr.categories || {};

  const metrics: Metrics = {
    run,
    fcp: audits['first-contentful-paint'].numericValue || 0,
    lcp: audits['largest-contentful-paint'].numericValue || 0,
    tbt: audits['total-blocking-time'].numericValue || 0,
    cls: audits['cumulative-layout-shift'].numericValue || 0,
    si: audits['speed-index'].numericValue || 0,
    score: categories['performance'].score ? categories['performance'].score * 100 : 0,
  };

  const htmlReport = runnerResult?.report as string;

  chrome.kill();
  console.log('Closing chrome, please wait');
  await new Promise(res => setTimeout(res, 1000)); // 1 second delay

  return { metrics, htmlReport };
}

const formatValue = (value:  number, fixed = 1): number => {
  return value ? parseFloat(value.toFixed(fixed)) : value
}

async function main() {
  // Parse CLI arguments
  const argv = minimist(process.argv.slice(2));
  const url = argv.url || argv.u;
  const fileName = argv.reports || argv.rep || 'lighthouse-report-run';
  const runs = parseInt(argv.runs || argv.r || '5', 10);
  const cookie = argv.cookie || argv.c;

  if (!url) {
    console.error('Usage: tsx src/index.ts --url <URL> [--runs <number>]');
    process.exit(1);
  }

  const results: Metrics[] = [];
  const reportsDir = path.join(__dirname, '..', 'reports');

  console.log(`Looking for: ${reportsDir}`);
  if (fs.existsSync(reportsDir)) {
    console.log(`Removing: ${reportsDir}`);
    fs.rmSync(reportsDir, { recursive: true, force: true });
  }

  console.log(`Creating: ${reportsDir}`);
  fs.mkdirSync(reportsDir);

  for (let i = 1; i <= runs; i++) {
    console.clear();

    if (results.length) {
      console.log('Previous results:');
      console.table(results);
    }

    const percent = Math.round(((i - 1) / runs) * 100);

    console.log(`Running: ${percent}% (Run ${i} of ${runs})`);
    const {metrics, htmlReport} = await runLighthouse(url, i, cookie);

    console.log('Finished, saving report');
    // Save HTML report
    const reportPath = path.join(reportsDir, `${fileName}-${i}.html`);
    fs.writeFileSync(reportPath, htmlReport);

    results.push(metrics);
    // Output variables in console
    console.log(`Run ${i}:`, metrics);
  }
  // After all runs
  console.clear()
  console.table(results);

  console.log('Running: 100% (All runs complete)');

  // Create table (CSV)
  const ms = 1000;
  const tableHeader = 'Run,FCP,LCP,TBT,CLS,SI,Score\n';
  const tableRows = results.map(({ run, fcp, lcp, tbt, cls, si, score }) =>
    `${run},${formatValue(fcp/ms)},${formatValue(lcp/ms)},${formatValue(tbt, 0)},${formatValue(cls, 3)},${formatValue(si/ms)},${score}`
  ).join('\n');
  const table = tableHeader + tableRows;

  // Save table
  const tablePath = path.join(reportsDir, `${fileName}.csv`);
  fs.writeFileSync(tablePath, table);

  // Create table (TXT, tab-separated)
  const txtHeader = 'Run\tFCP\tLCP\tTBT\tCLS\tSI\tScore\n';
  const txtRows = results.map(({ run, fcp, lcp, tbt, cls, si, score }) =>
    `${run}\t${formatValue(fcp/ms)}\t${formatValue(lcp/ms)}\t${formatValue(tbt, 0)}\t${formatValue(cls, 3)}\t${formatValue(si/ms)}\t${score}`
  ).join('\n');
  const txtTable = txtHeader + txtRows;

  // Save TXT table
  const txtPath = path.join(reportsDir, `${fileName}.txt`);
  fs.writeFileSync(txtPath, txtTable);

  // Output table in console
  console.log('\nMetrics Table:\n');
  console.log(table);
}

const execute = async () => {
  try {
    await main();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

execute();

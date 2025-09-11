import fs from "fs";
import minimist from "minimist";
import path from "path";

function getMedianMetrics(jsonPath: string) {
  const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  return data.find((r: any) => r.isMedian);
}

function percentDiff(pre: number, post: number): number {
  if (pre === 0) return post === 0 ? 0 : 100;
  return ((post - pre) / pre) * 100;
}

function createComparisonHtml(preMedian: any, postMedian: any, description: string): string {
  const metrics = ["fcp", "lcp", "tbt", "cls", "si", "score"];
  function formatNumber(value: number): string {
    return value.toFixed(2);
  }

  const tableRows = metrics.map(metric => {
    const preVal = preMedian[metric];
    const postVal = postMedian[metric];
    const diff = percentDiff(preVal, postVal);
    let color = 'black';
    if (diff !== 0) {
      if (metric === 'score') {
        color = diff > 0 ? 'green' : 'red';
      } else {
        color = diff < 0 ? 'green' : 'red';
      }
    }
    return `<tr><td>${metric.toUpperCase()}</td><td>${formatNumber(preVal)}</td><td>${formatNumber(postVal)}</td><td style="color:${color}">${formatNumber(diff)}%</td></tr>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Median Comparison Table</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f7f7f7; margin: 0; padding: 2em; }
    h1 { color: #333; text-align: center; margin-bottom: 1em; }
    .description { color: #666; text-align: center; margin-bottom: 2em; font-size: 1.1em; }
    table { border-collapse: collapse; width: 100%; max-width: 600px; margin: 2em auto; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    th, td { padding: 0.75em 1em; text-align: center; }
    th { background: #4a90e2; color: #fff; font-weight: 600; }
    tr:nth-child(even) { background: #f0f4f8; }
    tr:hover { background: #e6f7ff; }
    td { border-bottom: 1px solid #eaeaea; }
  </style>
</head>
<body>
  <h1>Lighthouse Performance Comparison</h1>
  <div class="description">${description}</div>
  <table>
    <thead>
      <tr>
        <th>Metric</th>
        <th>Before</th>
        <th>After</th>
        <th>% Change</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>
</body>
</html>`;
}

function main() {
  const argv = minimist(process.argv.slice(2));
  const prePath = argv.pre;
  const postPath = argv.post;
  const fileName = argv.out || "comparison-table.html";
  const description = argv.description || argv.desc || "Median Comparison Table";
  
  // Create comparisonResults directory if it doesn't exist
  const resultsDir = path.join(__dirname, "..", "comparisonResults");
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir);
  }
  
  const outPath = path.join(resultsDir, fileName);

  if (!prePath || !postPath) {
    console.error("Usage: tsx compare-medians.ts --pre pre-file.json --post post-file.json [--out output.html]");
    process.exit(1);
  }

  const preMedian = getMedianMetrics(prePath);
  const postMedian = getMedianMetrics(postPath);

  if (!preMedian || !postMedian) {
    console.error("Could not find median record in one or both files.");
    process.exit(1);
  }

  const html = createComparisonHtml(preMedian, postMedian, description);
  fs.writeFileSync(outPath, html);
  console.log("Comparison table written to", outPath);
}

main();

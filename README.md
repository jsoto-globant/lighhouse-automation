# Lighthouse Performance Automation

This repository contains tools for automating Lighthouse performance testing and comparing results between different runs.

## Installation

```bash
npm install
```

## Usage

The toolset consists of two main scripts:

### 1. Performance Testing Script (`src/index.ts`)

This script runs Lighthouse performance tests multiple times for a given URL and generates detailed reports.

```bash
npx tsx src/index.ts --url <URL> [options]
```

#### Options:
- `--url` or `-u`: Target URL to test (required)
- `--runs` or `-r`: Number of test runs (default: 5)
- `--reports` or `--rep`: Name for the report files (default: "lighthouse-report-run")
- `--cookie-cart`: Cart cookie value for authenticated pages (optional)

#### Examples:
```bash
# Basic usage
npx tsx src/index.ts --url http://localhost:4000/my-page --reports pre-release --runs 5

# With cart cookie for authenticated pages
npx tsx src/index.ts --url http://localhost:4000/my-page --reports pre-release --runs 5 --cookie-cart "your-cart-cookie-value"
```

#### Outputs:
The script creates a directory structure under `reports/<report-name>/` containing:
- Individual HTML reports for each run (`<report-name>-1.html` to `<report-name>-N.html`)
- CSV summary of all runs (`<report-name>.csv`)
- TXT summary of all runs (`<report-name>.txt`)
- JSON file with detailed metrics and median indication (`<report-name>.json`)

### 2. Results Comparison Script (`src/compare-medians.ts`)

This script compares two sets of Lighthouse results and generates a visual comparison report.

```bash
npx tsx src/compare-medians.ts --pre <pre-json> --post <post-json> [options]
```

#### Options:
- `--pre`: Path to the "before" JSON results file (required)
- `--post`: Path to the "after" JSON results file (required)
- `--out`: Output HTML file name (default: "comparison-table.html")
- `--description` or `--desc`: Custom description for the comparison (default: "Median Comparison Table")

#### Example:
```bash
npx tsx src/compare-medians.ts --pre ./reports/pre-release/pre-release.json --post ./reports/post-release/post-release.json --out release-comparison.html --description "Release 60 vs Release 59"
```

#### Outputs:
The comparison script creates an HTML report in `comparisonResults/` directory with:
- Side-by-side comparison of median values
- Percentage differences
- Color-coded results:
  - For FCP, LCP, TBT, CLS, and SI:
    - 🟢 Green: Improvement (negative percentage)
    - 🔴 Red: Regression (positive percentage)
  - For Performance Score:
    - 🟢 Green: Improvement (positive percentage)
    - 🔴 Red: Regression (negative percentage)
  - ⚫ Black: No change (0%)

## Typical Workflow

1. Run baseline performance tests:
```bash
npx tsx src/index.ts --url http://localhost:4000/page --reports pre-release --runs 5
```

2. Make your changes and run performance tests again:
```bash
npx tsx src/index.ts --url http://localhost:4000/page --reports post-release --runs 5
```

3. Compare the results:
```bash
npx tsx src/compare-medians.ts --pre ./reports/pre-release/pre-release.json --post ./reports/post-release/post-release.json --out comparison.html --description "Pre vs Post Release"
```

4. Check the generated comparison report in `comparisonResults/comparison.html`
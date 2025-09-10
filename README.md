# Prompt
Currently, I have to take 5 Core Web Vitals metrics manually in the Lighthouse tab provided by Chrome. Then, I create a table following the next order:

Runs, FCP, LCP, TBT, CLS, SI, Score

I am a little tired of doing it manually, so I am wondering if you could provide me with a project in TS to take these 5 metrics, store the Lighthouse HTML taken in each run, and create a new file with a table of the data following the same order:

Runs, FCP, LCP, TBT, CLS, SI, Score

# Architecture
/lighthouse-automation
  /reports
    run-1.html
    run-2.html
    ...
  /summary
    summary.csv
  src/
    index.ts
  package.json
  tsconfig.json

# Basic usage (5 runs, default folders)
npx tsx src/index.ts --url http://localhost.dcsg.com:4000/s/footwear-release-calendar

# Custom number of runs
npx tsx src/index.ts --url http://localhost.dcsg.com:4000/s/footwear-release-calendar --runs 10

# Custom output directories
npx tsx src/index.ts --url http://localhost.dcsg.com:4000/s/footwear-release-calendar --runs 5 --reports test
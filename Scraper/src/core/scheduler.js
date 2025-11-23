const cron = require("node-cron");
const fs = require("fs");
const path = require("path");
const { crawlListingPage } = require("./crawler");
// Note: don't require the queue at module load time. Requiring the queue will start
// a Worker which immediately attempts to connect to Redis. To allow a dry-run
// mode and to avoid hard crashes when Redis/docker isn't available during tests,
// we require the queue lazily inside runAutomatedCrawl when it's needed.

const SCRAPED_FILE = path.join(
  __dirname,
  "..",
  "..",
  "data",
  "scraped-urls.json"
);

function loadScrapedUrls() {
  try {
    if (!fs.existsSync(SCRAPED_FILE)) return new Set();
    const raw = fs.readFileSync(SCRAPED_FILE, "utf-8");
    const arr = JSON.parse(raw || "[]");
    return new Set(arr);
  } catch (e) {
    return new Set();
  }
}

function saveScrapedUrls(set) {
  const arr = Array.from(set);
  fs.writeFileSync(SCRAPED_FILE, JSON.stringify(arr, null, 2));
}

async function runAutomatedCrawl(config) {
  console.log("🚀 Running automated crawl for configured sites...");

  const scraped = loadScrapedUrls();
  const newUrls = [];

  for (const site of config.sites) {
    try {
      console.log(`🔎 Crawling: ${site.name} -> ${site.listingUrl}`);
      const found = await crawlListingPage(site.listingUrl, site);
      console.log(`   ⚙️  Found ${found.length} links`);

      for (const u of found) {
        if (!scraped.has(u)) {
          scraped.add(u);
          newUrls.push(u);
        }
      }
    } catch (err) {
      console.error(`❌ Error crawling ${site.name}:`, err.message);
    }
  }

  if (newUrls.length > 0) {
    if (
      config.dryRun ||
      process.env.DRY_RUN === "1" ||
      process.env.DRY_RUN === "true"
    ) {
      console.log(
        `✅ (dry-run) Discovered ${newUrls.length} new listings (not queued):`
      );
      newUrls.slice(0, 50).forEach((u) => console.log("   -", u));
      if (newUrls.length > 50)
        console.log(`   ...and ${newUrls.length - 50} more`);
      // persist discovered URLs so we don't repeatedly report the same ones during dry runs
      saveScrapedUrls(scraped);
    } else {
      console.log(`✅ Queuing ${newUrls.length} new listings for scraping`);
      const { addBulkScrapingJobs } = require("./queue");
      await addBulkScrapingJobs(newUrls);
      saveScrapedUrls(scraped);
    }
  } else {
    console.log("ℹ️ No new listings found");
  }
}

function startScheduler(config) {
  console.log("🚀 Starting scheduler with cron:", config.schedule);
  if (config.runOnStart) {
    runAutomatedCrawl(config).catch((err) =>
      console.error("Initial crawl error:", err)
    );
  }

  cron.schedule(config.schedule, () => {
    runAutomatedCrawl(config).catch((err) =>
      console.error("Scheduled crawl error:", err)
    );
  });

  console.log("✅ Scheduler started");
}

module.exports = {
  startScheduler,
  runAutomatedCrawl,
};

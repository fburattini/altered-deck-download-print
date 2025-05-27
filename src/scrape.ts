#!/usr/bin/env node

import { createScraper } from './market/scraper';

const main = async () => {
  const args = process.argv.slice(2);
  const command = args[0] || 'test';

  const scraper = createScraper();

  switch (command) {
    case 'test':
      console.log('Running test scrape...');
      await scraper.runTestScrape();
      break;
      
    case 'analyze':
      console.log('Analyzing filters...');
      await scraper.analyzeFilters();
      break;
      
    case 'full':
      console.log('Running full scrape...');
      await scraper.runFullScrape();
      break;
      
    default:
      console.log('Usage: npm run scrape [test|analyze|full]');
      console.log('  test    - Run a test scrape with limited data');
      console.log('  analyze - Analyze filter requirements');
      console.log('  full    - Run full scrape of all unique cards');
      break;
  }
};

main().catch(error => {
  console.error('Scraper failed:', error);
  process.exit(1);
});

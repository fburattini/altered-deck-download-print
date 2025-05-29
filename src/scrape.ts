#!/usr/bin/env node

import { createScraper } from './market/scraper';
import { FilterOptions } from './market/api-client';

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
      
    case 'filter':
      console.log('Running filtered scrape...');
      
      // Parse filter arguments from command line
      const filters: FilterOptions = {};
      
      // Simple argument parsing for filters
      for (let i = 1; i < args.length; i += 2) {
        const key = args[i];
        const value = args[i + 1];
        
        if (!key || !value) continue;
        
        switch (key) {
          case '--rarity':
            filters.rarity = value.split(',');
            break;
          case '--cardSet':
            filters.cardSet = value.split(',');
            break;
          case '--factions':
            filters.factions = value.split(',');
            break;
          case '--mainCost':
            filters.mainCost = value.split(',').map(Number).filter(n => !isNaN(n));
            break;
          case '--recallCost':
            filters.recallCost = value.split(',').map(Number).filter(n => !isNaN(n));
            break;
          case '--forestPower':
            filters.forestPower = value.split(',').map(Number).filter(n => !isNaN(n));
            break;
          case '--mountainPower':
            filters.mountainPower = value.split(',').map(Number).filter(n => !isNaN(n));
            break;
          case '--oceanPower':
            filters.oceanPower = value.split(',').map(Number).filter(n => !isNaN(n));
            break;
          case '--inSale':
            filters.inSale = value.toLowerCase() === 'true';
            break;
        }
      }
      
      console.log('Applied filters:', JSON.stringify(filters, null, 2));
      await scraper.runFilteredScrape(filters);
      break;
      
    default:
      console.log('Usage: npm run scrape [test|analyze|full|filter]');
      console.log('  test    - Run a test scrape with limited data');
      console.log('  analyze - Analyze filter requirements');
      console.log('  full    - Run full scrape of all unique cards');
      console.log('  filter  - Run filtered scrape with custom filters');
      console.log('');
      console.log('Filter options for "filter" command:');
      console.log('  --rarity UNIQUE,RARE');
      console.log('  --cardSet CORE,ALIZE');
      console.log('  --factions AX,BR,LY');
      console.log('  --mainCost 1,2,3');
      console.log('  --recallCost 1,2');
      console.log('  --forestPower 0,1,2');
      console.log('  --mountainPower 2,3');
      console.log('  --oceanPower 1,2,3');
      console.log('  --inSale true');
      console.log('');
      console.log('Example:');
      console.log('  npm run scrape filter --rarity UNIQUE --factions AX,BR --mainCost 1,2,3');
      break;
  }
};

main().catch(error => {
  console.error('Scraper failed:', error);
  process.exit(1);
});

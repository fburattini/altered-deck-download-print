#!/usr/bin/env npx tsx

/**
 * Quick Query Script for Altered Card Scraping
 * 
 * This script makes it super easy to run filtered scrapes.
 * Just modify the QUERY_FILTERS object below and run the script!
 * 
 * Usage: npm run tsx src/queries/run-query.ts
 * Or: npx tsx src/queries/run-query.ts
 */

import { createScraper } from '../market/scraper';
import { FilterOptions } from '../market/api-client';

// ============================================
// 🔧 MODIFY THESE FILTERS FOR YOUR QUERY
// ============================================

const QUERY_FILTERS: FilterOptions = {
  // Card rarity (uncomment and modify as needed)
  rarity: ['UNIQUE'],
  
  // Card sets (uncomment and modify as needed)
  cardSet: ['CORE'],
  
  // Factions (uncomment and modify as needed)
  factions: ['AX'],
  
  // Costs (uncomment and modify as needed)
  mainCost: [1, 2, 3],
  // recallCost: [1, 2],
  
  // Powers (uncomment and modify as needed)
  // forestPower: [2, 3, 4],
  // mountainPower: [0, 1, 2],
  // oceanPower: [1, 2, 3],
  
  // Only cards for sale (uncomment and modify as needed)
  inSale: true,
  
  // Pagination (usually not needed for filtered queries)
  // itemsPerPage: 100,
};

// ============================================
// 🚀 SCRIPT CONFIGURATION
// ============================================

const CONFIG = {
  // Set to false to start fresh, true to resume from checkpoint
  resumeFromCheckpoint: true,
  
  // Add a custom description for this query (optional)
  queryDescription: 'AX faction unique cards with low main cost',
};

// ============================================
// 📋 AVAILABLE OPTIONS (for reference)
// ============================================

/*
RARITY OPTIONS:
- 'COMMON'
- 'RARE' 
- 'UNIQUE'

CARD SET OPTIONS:
- 'CORE'
- 'ALIZE'

FACTION OPTIONS:
- 'AX' (Axiom)
- 'BR' (Bravos)
- 'LY' (Lyra)
- 'MU' (Muna)
- 'OR' (Ordis)
- 'YZ' (Yzmir)

COST/POWER RANGE:
- Numbers from 0 to 10

EXAMPLE QUERIES:

1. All unique cards from AX faction:
   { rarity: ['UNIQUE'], factions: ['AX'] }

2. Low-cost cards from multiple factions:
   { mainCost: [1, 2], factions: ['AX', 'BR'] }

3. High forest power cards:
   { forestPower: [5, 6, 7, 8, 9, 10] }

4. Cards from latest set only:
   { cardSet: ['ALIZE'] }

5. Budget cards (low cost, for sale):
   { mainCost: [1, 2, 3], recallCost: [0, 1, 2], inSale: true }
*/

// ============================================
// 🔄 MAIN EXECUTION
// ============================================

const runQuery = async () => {
  console.log('🎯 Running Custom Card Query');
  console.log('==============================');
  
  if (CONFIG.queryDescription) {
    console.log(`📝 Query: ${CONFIG.queryDescription}`);
  }
  
  console.log('🔍 Applied Filters:');
  console.log(JSON.stringify(QUERY_FILTERS, null, 2));
  console.log('');
  
  // Estimate the scope
  const filterCount = Object.keys(QUERY_FILTERS).length;
  if (filterCount === 0) {
    console.log('⚠️  WARNING: No filters specified! This will fetch ALL cards.');
  } else if (filterCount >= 3) {
    console.log('✅ Good filter specificity - should be fast!');
  } else {
    console.log('⚡ Moderate filter specificity - may take a bit longer.');
  }
  
  console.log(`🔄 Checkpoint mode: ${CONFIG.resumeFromCheckpoint ? 'Resume if available' : 'Start fresh'}`);
  console.log('');
  
  try {
    const scraper = createScraper();
    const startTime = Date.now();
    
    await scraper.runFilteredScrape(QUERY_FILTERS, CONFIG.resumeFromCheckpoint);
    
    const duration = (Date.now() - startTime) / 1000;
    console.log('');
    console.log(`🎉 Query completed successfully in ${duration.toFixed(2)} seconds!`);
    
  } catch (error) {
    console.error('❌ Query failed:', error);
    process.exit(1);
  }
};

// ============================================
// 🏃 RUN THE QUERY
// ============================================

runQuery();

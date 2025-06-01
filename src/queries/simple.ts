#!/usr/bin/env npx tsx

/**
 * 🚀 SUPER SIMPLE QUERY RUNNER
 * 
 * Just change the values below and run!
 * No complex syntax, no arrays - just simple options.
 */

import { createScraper } from '../market/scraper';
import { getBearerToken } from '../config/auth';

// ============================================
// 🎯 SIMPLE CONFIGURATION
// ============================================

// Which rarity? (leave blank for all)
const RARITY = 'UNIQUE';              // Options: 'COMMON', 'RARE', 'UNIQUE', or ''

// Which card set? (leave blank for all)  
const CARD_SET = '';              // Options: 'CORE', 'ALIZE', or ''

// Which faction? (leave blank for all)
const FACTION = 'YZ';                 // Options: 'AX', 'BR', 'LY', 'MU', 'OR', 'YZ', or ''

// What main cost? (leave blank for all, or use ranges like '1-3')
const MAIN_COST = '2';              // Examples: '1', '1-3', '5-10', or ''

// What recall cost? (leave blank for all, or use ranges like '1-2')
const RECALL_COST: string = '';            // Examples: '1', '1-2', '0-5', or ''

// What card name? (leave blank for all, use partial name matching)
const CARD_NAME = 'alchemist';                     // Examples: 'Kelon', 'Dragon', 'Elemental', or ''

// Only cards for sale?
const ONLY_FOR_SALE = true;           // true or false

// ============================================
// 🔄 AUTO-CONVERSION TO FILTERS
// ============================================

const filters: any = {};

if (RARITY) filters.rarity = [RARITY];
if (CARD_SET) filters.cardSet = [CARD_SET];
if (FACTION) filters.factions = [FACTION];
if (CARD_NAME) filters.cardName = CARD_NAME;
if (ONLY_FOR_SALE) filters.inSale = true;

// Handle cost ranges
if (MAIN_COST) {
  if (MAIN_COST.includes('-')) {
    const [min, max] = MAIN_COST.split('-').map(Number);
    filters.mainCost = Array.from({length: max - min + 1}, (_, i) => min + i);
  } else {
    filters.mainCost = [Number(MAIN_COST)];
  }
}

if (RECALL_COST) {
  if (RECALL_COST.includes('-')) {
    const [min, max] = RECALL_COST.split('-').map(Number);
    filters.recallCost = Array.from({length: max - min + 1}, (_, i) => min + i);
  } else {
    filters.recallCost = [Number(RECALL_COST)];
  }
}

// ============================================
// 🚀 RUN THE QUERY
// ============================================

const runSimpleQuery = async () => {
  console.log('🎯 Running Simple Query');
  console.log('=======================');
  
  // Show what we're searching for in plain English
  let description = 'Searching for';
  if (RARITY) description += ` ${RARITY.toLowerCase()}`;
  if (FACTION) description += ` ${FACTION}`;
  if (CARD_SET) description += ` from ${CARD_SET}`;
  description += ' cards';
  if (CARD_NAME) description += ` with name containing "${CARD_NAME}"`;
  if (MAIN_COST) description += ` with main cost ${MAIN_COST}`;
  if (RECALL_COST) description += ` and recall cost ${RECALL_COST}`;
  if (ONLY_FOR_SALE) description += ' that are for sale';
  
  console.log(`📝 ${description}`);
  console.log('');
  console.log('🔍 Technical filters:');
  console.log(JSON.stringify(filters, null, 2));
  console.log('');
  
  try {
    const locale = 'en-us'
    const token = getBearerToken();

    const scraper = createScraper(locale, token);
    const startTime = Date.now();
    
    console.log('💰 Fetching card data with integrated pricing...');
    
    // Run filtered scrape with pricing data integration
    await scraper.runFilteredScrapeWithPricing(filters, true);

    const duration = (Date.now() - startTime) / 1000;
    console.log('');
    console.log(`🎉 Query completed in ${duration.toFixed(2)} seconds!`);
    
  } catch (error) {
    console.error('❌ Query failed:', error);
    process.exit(1);
  }
};

runSimpleQuery();

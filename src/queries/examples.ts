#!/usr/bin/env npx tsx

/**
 * Quick Examples - Common Card Queries
 * 
 * This file contains several pre-configured query examples.
 * Uncomment the query you want to run and execute the script!
 */

import { createScraper } from '../market/scraper';
import { FilterOptions } from '../market/api-client';

// ============================================
// 📚 EXAMPLE QUERIES
// ============================================

// 🔥 Example 1: All unique AX faction cards
const UNIQUE_AX_CARDS: FilterOptions = {
  rarity: ['UNIQUE'],
  factions: ['AX'],
  inSale: true
};

// 💰 Example 2: Budget cards (low cost)
const BUDGET_CARDS: FilterOptions = {
  mainCost: [1, 2, 3],
  recallCost: [0, 1, 2],
  inSale: true
};

// 🌲 Example 3: High forest power cards
const HIGH_FOREST_POWER: FilterOptions = {
  forestPower: [5, 6, 7, 8, 9, 10],
  rarity: ['UNIQUE'],
  inSale: true
};

// 🆕 Example 4: Latest set cards (ALIZE)
const LATEST_SET_CARDS: FilterOptions = {
  cardSet: ['ALIZE'],
  rarity: ['UNIQUE', 'RARE'],
  inSale: true
};

// ⚔️ Example 5: Competitive cards (high power, mid cost)
const COMPETITIVE_CARDS: FilterOptions = {
  mainCost: [3, 4, 5],
  rarity: ['UNIQUE'],
  inSale: true,
  // Look for cards with at least some power
  forestPower: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
};

// 🎯 Example 6: Multi-faction deck building
const MULTI_FACTION_CARDS: FilterOptions = {
  factions: ['AX', 'BR', 'LY'],
  mainCost: [2, 3, 4],
  rarity: ['UNIQUE'],
  inSale: true
};

// ============================================
// 🔧 SELECT YOUR QUERY HERE
// ============================================

// 👇 CHANGE THIS LINE to select which query to run
const SELECTED_QUERY = UNIQUE_AX_CARDS;
const QUERY_NAME = "Unique AX Faction Cards";

// ============================================
// 🚀 RUN THE SELECTED QUERY
// ============================================

const runExample = async () => {
  console.log('🎯 Running Example Query');
  console.log('========================');
  console.log(`📝 Query: ${QUERY_NAME}`);
  console.log('🔍 Filters:');
  console.log(JSON.stringify(SELECTED_QUERY, null, 2));
  console.log('');
  
  try {
    const scraper = createScraper();
    const startTime = Date.now();
    
    await scraper.runFilteredScrape(SELECTED_QUERY, true);
    
    const duration = (Date.now() - startTime) / 1000;
    console.log('');
    console.log(`🎉 Query "${QUERY_NAME}" completed in ${duration.toFixed(2)} seconds!`);
    
  } catch (error) {
    console.error('❌ Query failed:', error);
    process.exit(1);
  }
};

runExample();

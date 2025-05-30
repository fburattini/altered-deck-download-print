#!/usr/bin/env npx tsx

/**
 * 🧪 STATS API TEST SCRIPT
 * 
 * Test the /cards/stats endpoint to debug pricing data issues
 */

import { AlteredApiClient, FilterOptions } from '../market/api-client';
import { getBearerToken } from '../config/auth';
import * as fs from 'fs-extra';
import * as path from 'path';

// ============================================
// 🎯 TEST CONFIGURATION
// ============================================

// Test cases with different filter combinations
const TEST_CASES: { name: string; filters: FilterOptions }[] = [
  {
    name: 'No filters (should get some stats)',
    filters: {
      itemsPerPage: 10
    }
  },
  {
    name: 'Unique cards only',
    filters: {
      rarity: ['UNIQUE'],
      itemsPerPage: 10
    }
  },
  {
    name: 'Cards for sale only',
    filters: {
      inSale: true,
      itemsPerPage: 10
    }
  },
  {
    name: 'Specific card (Belasenka)',
    filters: {
      cardName: 'Belasenka',
      itemsPerPage: 10
    }
  },
  {
    name: 'YZ faction unique cards',
    filters: {
      rarity: ['UNIQUE'],
      factions: ['YZ'],
      itemsPerPage: 10
    }
  },
  {
    name: 'Cost 3-4 unique cards for sale',
    filters: {
      rarity: ['UNIQUE'],
      mainCost: [3, 4],
      inSale: true,
      itemsPerPage: 5
    }
  }
];

// ============================================
// 🧪 TEST FUNCTIONS
// ============================================

/**
 * Test a single stats API call
 */
const testStatsAPI = async (testCase: { name: string; filters: FilterOptions }): Promise<void> => {
  console.log(`\n🧪 Testing: ${testCase.name}`);
  console.log('━'.repeat(60));
  console.log(`📋 Filters: ${JSON.stringify(testCase.filters, null, 2)}`);
  
  const apiClient = new AlteredApiClient('en-us', getBearerToken());
  
  try {
    const startTime = Date.now();
    const statsResult = await apiClient.getCardStats(testCase.filters);
    const duration = Date.now() - startTime;
    
    console.log(`✅ Request successful (${duration}ms)`);
    console.log(`📊 Response structure:`);
    console.log(`   - @context: ${statsResult['@context']}`);
    console.log(`   - @id: ${statsResult['@id']}`);
    console.log(`   - @type: ${statsResult['@type']}`);
    console.log(`   - hydra:totalItems: ${statsResult['hydra:totalItems']}`);
    console.log(`   - hydra:member length: ${statsResult['hydra:member']?.length || 0}`);
    
    if (statsResult['hydra:member'] && statsResult['hydra:member'].length > 0) {
      console.log(`\n📈 First stat item details:`);
      const firstStat = statsResult['hydra:member'][0];
      console.log(`   - @id: ${firstStat['@id']}`);
      console.log(`   - inMyTradelist: ${firstStat.inMyTradelist}`);
      console.log(`   - inMyCollection: ${firstStat.inMyCollection}`);
      console.log(`   - inMyWantlist: ${firstStat.inMyWantlist}`);
      console.log(`   - lowerPrice: ${firstStat.lowerPrice}`);
      console.log(`   - lowerOfferId: ${firstStat.lowerOfferId}`);
      console.log(`   - inSale: ${firstStat.inSale}`);
      console.log(`   - inMySale: ${firstStat.inMySale}`);
      console.log(`   - numberCopyAvailable: ${firstStat.numberCopyAvailable}`);
      console.log(`   - foiled: ${firstStat.foiled}`);
      console.log(`   - lastSale: ${firstStat.lastSale}`);
      console.log(`   - isExclusive: ${firstStat.isExclusive}`);
      
      // Count stats with pricing data
      const statsWithPricing = statsResult['hydra:member'].filter(stat => stat.lowerPrice > 0);
      const statsWithLastSale = statsResult['hydra:member'].filter(stat => stat.lastSale > 0);
      const statsForSale = statsResult['hydra:member'].filter(stat => stat.inSale > 0);
      
      console.log(`\n📊 Pricing summary:`);
      console.log(`   - Total stats: ${statsResult['hydra:member'].length}`);
      console.log(`   - With pricing (lowerPrice > 0): ${statsWithPricing.length}`);
      console.log(`   - With last sale data: ${statsWithLastSale.length}`);
      console.log(`   - Currently for sale: ${statsForSale.length}`);
      
      if (statsWithPricing.length > 0) {
        const prices = statsWithPricing.map(s => s.lowerPrice);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        
        console.log(`   - Price range: €${minPrice.toFixed(2)} - €${maxPrice.toFixed(2)}`);
        console.log(`   - Average price: €${avgPrice.toFixed(2)}`);
      }
      
      // Show a few examples
      if (statsResult['hydra:member'].length > 1) {
        console.log(`\n🔍 Sample entries (first 3):`);
        statsResult['hydra:member'].slice(0, 3).forEach((stat, index) => {
          const cardId = stat['@id'].replace('/cards/', '');
          console.log(`   ${index + 1}. ${cardId}: €${stat.lowerPrice || 0} (${stat.inSale} for sale, last: €${stat.lastSale || 0})`);
        });
      }
    } else {
      console.log(`⚠️  No stats data returned`);
    }
    
  } catch (error: any) {
    console.log(`❌ Request failed: ${error.message}`);
    if (error.response) {
      console.log(`   - Status: ${error.response.status}`);
      console.log(`   - Status Text: ${error.response.statusText}`);
      if (error.response.data) {
        console.log(`   - Response data: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }
  }
};

/**
 * Save raw stats response for debugging
 */
const saveStatsResponse = async (testCase: { name: string; filters: FilterOptions }): Promise<void> => {
  console.log(`\n💾 Saving raw response for: ${testCase.name}`);
  
  const apiClient = new AlteredApiClient('en-us', getBearerToken());
  
  try {
    const statsResult = await apiClient.getCardStats(testCase.filters);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeName = testCase.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const fileName = `stats-test-${safeName}-${timestamp}.json`;
    const filePath = path.join(process.cwd(), 'card_db', fileName);
    
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeJson(filePath, {
      testCase: testCase.name,
      filters: testCase.filters,
      timestamp: new Date().toISOString(),
      response: statsResult
    }, { spaces: 2 });
    
    console.log(`   ✅ Saved to: ${fileName}`);
    
  } catch (error) {
    console.log(`   ❌ Failed to save: ${error}`);
  }
};

/**
 * Compare stats vs regular card data
 */
const compareStatsWithCards = async (): Promise<void> => {
  console.log(`\n🔄 Comparing stats API vs cards API`);
  console.log('━'.repeat(60));
  
  const filters: FilterOptions = {
    rarity: ['UNIQUE'],
    factions: ['YZ'],
    mainCost: [3],
    itemsPerPage: 5
  };
  
  const apiClient = new AlteredApiClient('en-us', getBearerToken());
  
  try {
    console.log(`📋 Using filters: ${JSON.stringify(filters, null, 2)}`);
    
    // Get regular cards
    console.log(`\n🃏 Fetching cards...`);
    const cardsResult = await apiClient.getCards(filters);
    console.log(`   - Found ${cardsResult['hydra:member'].length} cards`);
    
    // Get stats
    console.log(`\n📊 Fetching stats...`);
    const statsResult = await apiClient.getCardStats(filters);
    console.log(`   - Found ${statsResult['hydra:member']?.length || 0} stats`);
    
    // Compare
    const cardIds = new Set(cardsResult['hydra:member'].map(card => card.id));
    const statCardIds = new Set(statsResult['hydra:member']?.map(stat => stat['@id'].replace('/cards/', '')) || []);
    
    console.log(`\n🔍 Comparison:`);
    console.log(`   - Card IDs from cards API: ${Array.from(cardIds).join(', ')}`);
    console.log(`   - Card IDs from stats API: ${Array.from(statCardIds).join(', ')}`);
    
    const onlyInCards = Array.from(cardIds).filter(id => !statCardIds.has(id));
    const onlyInStats = Array.from(statCardIds).filter(id => !cardIds.has(id));
    const inBoth = Array.from(cardIds).filter(id => statCardIds.has(id));
    
    console.log(`   - Only in cards API: ${onlyInCards.length > 0 ? onlyInCards.join(', ') : 'none'}`);
    console.log(`   - Only in stats API: ${onlyInStats.length > 0 ? onlyInStats.join(', ') : 'none'}`);
    console.log(`   - In both APIs: ${inBoth.length > 0 ? inBoth.join(', ') : 'none'}`);
    
    // Show detailed comparison for cards in both
    if (inBoth.length > 0) {
      console.log(`\n💰 Pricing details for matched cards:`);
      for (const cardId of inBoth) {
        const card = cardsResult['hydra:member'].find(c => c.id === cardId);
        const stat = statsResult['hydra:member']?.find(s => s['@id'].replace('/cards/', '') === cardId);
        
        if (card && stat) {
          console.log(`   - ${card.name} (${cardId}):`);
          console.log(`     • Lower price: €${stat.lowerPrice || 0}`);
          console.log(`     • Last sale: €${stat.lastSale || 0}`);
          console.log(`     • In sale: ${stat.inSale}`);
          console.log(`     • Available copies: ${stat.numberCopyAvailable}`);
        }
      }
    }
    
  } catch (error) {
    console.log(`❌ Comparison failed: ${error}`);
  }
};

// ============================================
// 🚀 MAIN EXECUTION
// ============================================

const runStatsTests = async (): Promise<void> => {
  console.log('🧪 Stats API Test Suite');
  console.log('========================');
  console.log(`🔑 Using bearer token: ${getBearerToken().substring(0, 20)}...`);
  
  // Test all cases
  for (const testCase of TEST_CASES) {
    await testStatsAPI(testCase);
    
    // Save first few responses for debugging
    if (TEST_CASES.indexOf(testCase) < 3) {
      await saveStatsResponse(testCase);
    }
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Compare APIs
  await compareStatsWithCards();
  
  console.log(`\n🎉 Stats API tests completed!`);
  console.log(`📁 Check card_db/ for saved responses`);
};

// Run the tests if this file is executed directly
if (require.main === module) {
  runStatsTests().catch(console.error);
}

export { runStatsTests };

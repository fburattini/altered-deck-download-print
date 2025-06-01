// ============================================
// 🚀 CLI EXECUTION (for backward compatibility)
// ============================================

import { CardSearcher, SearchFilters } from "./search";

const runLegacySearch = async (): Promise<void> => {
  console.log('🔍 Local Altered Card Search');
  console.log('============================');
  
  // Legacy configuration for CLI usage
  const MAIN_COST_FILTER = '';
  // const MAIN_EFFECT_FILTER = 'When you roll'; // Original value
  const MAIN_EFFECT_FILTER = ''; // Temporarily emptied to broaden search, was 'When you roll'
  const ECHO_EFFECT_FILTER = '';
  const NAME_FILTER = 'cloth'; // This should match 'Lyra Cloth Dancer'
  const FACTION_FILTER = '';
  const RARITY_FILTER = '';
  const RESULT_LIMIT = 40;
  
  // Build filters from configuration
  const filters: SearchFilters = {};
  
  if (MAIN_COST_FILTER) filters.mainCost = MAIN_COST_FILTER;
  if (MAIN_EFFECT_FILTER) filters.mainEffect = MAIN_EFFECT_FILTER;
  if (ECHO_EFFECT_FILTER) filters.echoEffect = ECHO_EFFECT_FILTER;
  if (NAME_FILTER) filters.name = NAME_FILTER;
  if (FACTION_FILTER) filters.faction = FACTION_FILTER;
  if (RARITY_FILTER) filters.rarity = RARITY_FILTER;
  
  // Show search criteria
  console.log('🎯 Search Criteria:');
  if (Object.keys(filters).length === 0) {
    console.log('   (No filters specified - showing all cards)');
  } else {
    Object.entries(filters).forEach(([key, value]) => {
      const displayKey = key.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^./, str => str.toUpperCase());
      console.log(`   ${displayKey}: "${value}"`);
    });
  }
  console.log('');
  
  try {
    const searcher = new CardSearcher();
    const results = await searcher.search(filters, {
      resultLimit: RESULT_LIMIT,
      sortByPrice: true,
      // inSaleOnly: true // Original value
      inSaleOnly: false // Changed to false to find cards regardless of sale status for this test
    });

    searcher.displayResults(results, RESULT_LIMIT);
    
  } catch (error) {
    console.error('❌ Search failed:', error);
    process.exit(1);
  }
};

runLegacySearch();
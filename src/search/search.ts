#!/usr/bin/env npx tsx

/**
 * 🔍 LOCAL CARD SEARCH
 * 
 * Search through locally downloaded Altered card data
 * Supports filtering by main cost, main effect, and echo effect using string matching
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { CardDetail } from '../market/markte-types';

// ============================================
// 🎯 SEARCH CONFIGURATION
// ============================================

// Main cost filter (exact match or range like "1-3")
const MAIN_COST_FILTER = '2';          // Examples: '3', '1-3', '5-7', or ''

// Main effect text search (case-insensitive partial match)
// Support multiple terms: 'draw,boost' (OR logic) or 'draw+boost' (AND logic)
const MAIN_EFFECT_FILTER = '';        // Examples: 'boost', 'draw,boost', 'discard+exhaust', or ''

// Echo effect text search (case-insensitive partial match)  
// Support multiple terms: 'reserve,expedition' (OR logic) or 'reserve+draw' (AND logic)
const ECHO_EFFECT_FILTER = '';        // Examples: 'draw', 'reserve,expedition', 'token+sacrifice', or ''

// Card name filter (case-insensitive partial match)
const NAME_FILTER = 'pamola';               // Examples: 'Dragon', 'Elemental', 'Snowball', or ''

// Faction filter
const FACTION_FILTER = '';            // Options: 'AX', 'BR', 'LY', 'MU', 'OR', 'YZ', or ''

// Rarity filter
const RARITY_FILTER = '';             // Options: 'COMMON', 'RARE', 'UNIQUE', or ''

// Show results limit (0 = show all)
const RESULT_LIMIT = 40;

// ============================================
// 🔧 SEARCH INTERFACE
// ============================================

interface SearchFilters {
  mainCost?: string;
  mainEffect?: string;
  echoEffect?: string;
  name?: string;
  faction?: string;
  rarity?: string;
}

interface SearchResult {
  card: CardDetail;
  matchReasons: string[];
}

// ============================================
// 🔍 SEARCH FUNCTIONS
// ============================================

/**
 * Load card data from a JSONL file
 */
const loadCardData = async (filePath: string): Promise<CardDetail[]> => {
  if (!await fs.pathExists(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.trim().split('\n').filter(line => line.trim());
  
  return lines.map(line => {
    try {
        // console.log(line, JSON.parse(line))
      return JSON.parse(line) as CardDetail;
    } catch (error) {
      console.warn(`Failed to parse line: ${line.substring(0, 100)}...`);
      return null;
    }
  }).filter(card => card !== null) as CardDetail[];
};

/**
 * Get all available card data files
 */
const getAvailableDataFiles = async (): Promise<string[]> => {
  const cardDbPath = path.join(process.cwd(), 'card_db');
  const dataPath = path.join(process.cwd(), 'data');
  
  const files: string[] = [];
  
  // Check card_db directory
  if (await fs.pathExists(cardDbPath)) {
    const cardDbFiles = await fs.readdir(cardDbPath);
    files.push(...cardDbFiles
      .filter(file => 
        (file.endsWith('.jsonl') || file.endsWith('.json')) &&
        (file.startsWith('altered-cards-filtered') || 
         file.startsWith('altered-cards-latest') ||
         file.startsWith('altered-cards-with-pricing'))
      )
      .map(file => path.join(cardDbPath, file))
    );
  }
  
  // Check data directory  
  if (await fs.pathExists(dataPath)) {
    const dataFiles = await fs.readdir(dataPath);
    files.push(...dataFiles
      .filter(file => file.endsWith('.jsonl'))
      .map(file => path.join(dataPath, file))
    );
  }
  
  return files.sort((a, b) => {
    const aBasename = path.basename(a);
    const bBasename = path.basename(b);
    
    // Prioritize files with "latest" in the name first
    if (aBasename.includes('latest') && !bBasename.includes('latest')) return -1;
    if (!aBasename.includes('latest') && bBasename.includes('latest')) return 1;
    
    // Then prioritize pricing files (most comprehensive data)
    if (aBasename.startsWith('altered-cards-with-pricing') && !bBasename.startsWith('altered-cards-with-pricing')) return -1;
    if (!aBasename.startsWith('altered-cards-with-pricing') && bBasename.startsWith('altered-cards-with-pricing')) return 1;
    
    // Then prioritize filtered files from card_db
    if (aBasename.startsWith('altered-cards-filtered') && !bBasename.startsWith('altered-cards-filtered')) return -1;
    if (!aBasename.startsWith('altered-cards-filtered') && bBasename.startsWith('altered-cards-filtered')) return 1;
    
    // Finally sort by date (most recent first) based on filename
    return bBasename.localeCompare(aBasename);
  });
};

/**
 * Check if a card matches the search filters
 */
const matchesFilters = (card: CardDetail, filters: SearchFilters): { matches: boolean, reasons: string[] } => {
  const reasons: string[] = [];
  let matches = true;

  // Main cost filter
  if (filters.mainCost) {
    const cardMainCost = parseInt(card.elements.MAIN_COST);
    let costMatches = false;
    
    if (filters.mainCost.includes('-')) {
      const [min, max] = filters.mainCost.split('-').map(Number);
      costMatches = cardMainCost >= min && cardMainCost <= max;
      if (costMatches) reasons.push(`Main cost ${cardMainCost} in range ${min}-${max}`);
    } else {
      const targetCost = parseInt(filters.mainCost);
      costMatches = cardMainCost === targetCost;
      if (costMatches) reasons.push(`Main cost matches ${targetCost}`);
    }
    
    if (!costMatches) matches = false;
  }

  // Main effect filter
  if (filters.mainEffect && matches) {
    const mainEffect = card.elements.MAIN_EFFECT || '';
    let effectMatches = false;
    let matchDetails = '';
    
    if (filters.mainEffect.includes('+')) {
      // AND logic: all terms must be present
      const terms = filters.mainEffect.split('+').map(term => term.trim());
      effectMatches = terms.every(term => 
        mainEffect.toLowerCase().includes(term.toLowerCase())
      );
      if (effectMatches) {
        matchDetails = `contains all: ${terms.join(' AND ')}`;
      }
    } else if (filters.mainEffect.includes(',')) {
      // OR logic: any term must be present
      const terms = filters.mainEffect.split(',').map(term => term.trim());
      const matchedTerms = terms.filter(term => 
        mainEffect.toLowerCase().includes(term.toLowerCase())
      );
      effectMatches = matchedTerms.length > 0;
      if (effectMatches) {
        matchDetails = `contains: ${matchedTerms.join(' OR ')}`;
      }
    } else {
      // Single term
      effectMatches = mainEffect.toLowerCase().includes(filters.mainEffect.toLowerCase());
      if (effectMatches) {
        matchDetails = `contains "${filters.mainEffect}"`;
      }
    }
    
    if (effectMatches) {
      reasons.push(`Main effect ${matchDetails}`);
    } else {
      matches = false;
    }
  }

  // Echo effect filter
  if (filters.echoEffect && matches) {
    const echoEffect = card.elements.ECHO_EFFECT || '';
    let effectMatches = false;
    let matchDetails = '';
    
    if (filters.echoEffect.includes('+')) {
      // AND logic: all terms must be present
      const terms = filters.echoEffect.split('+').map(term => term.trim());
      effectMatches = terms.every(term => 
        echoEffect.toLowerCase().includes(term.toLowerCase())
      );
      if (effectMatches) {
        matchDetails = `contains all: ${terms.join(' AND ')}`;
      }
    } else if (filters.echoEffect.includes(',')) {
      // OR logic: any term must be present
      const terms = filters.echoEffect.split(',').map(term => term.trim());
      const matchedTerms = terms.filter(term => 
        echoEffect.toLowerCase().includes(term.toLowerCase())
      );
      effectMatches = matchedTerms.length > 0;
      if (effectMatches) {
        matchDetails = `contains: ${matchedTerms.join(' OR ')}`;
      }
    } else {
      // Single term
      effectMatches = echoEffect.toLowerCase().includes(filters.echoEffect.toLowerCase());
      if (effectMatches) {
        matchDetails = `contains "${filters.echoEffect}"`;
      }
    }
    
    if (effectMatches) {
      reasons.push(`Echo effect ${matchDetails}`);
    } else {
      matches = false;
    }
  }

  // Name filter
  if (filters.name && matches) {
    const nameMatches = card.name.toLowerCase().includes(filters.name.toLowerCase());
    if (nameMatches) {
      reasons.push(`Name contains "${filters.name}"`);
    } else {
      matches = false;
    }
  }

  // Faction filter
  if (filters.faction && matches) {
    const factionMatches = card.mainFaction.reference === filters.faction;
    if (factionMatches) {
      reasons.push(`Faction is ${filters.faction}`);
    } else {
      matches = false;
    }
  }

  // Rarity filter
  if (filters.rarity && matches) {
    const rarityMatches = card.rarity.reference === filters.rarity;
    if (rarityMatches) {
      reasons.push(`Rarity is ${filters.rarity}`);
    } else {
      matches = false;
    }
  }

  return { matches, reasons };
};

/**
 * Search cards with the given filters
 */
const searchCards = async (filters: SearchFilters): Promise<SearchResult[]> => {
  console.log('🔍 Searching local card data...');
  
  const dataFiles = await getAvailableDataFiles();
  
  if (dataFiles.length === 0) {
    throw new Error('No card data files found. Please run a scrape first.');
  }

  console.log(`📂 Found ${dataFiles.length} data files`);
  
  // Load cards from all available files
  const allCards: CardDetail[] = [];
  const cardIds = new Set<string>(); // Track unique cards to avoid duplicates
  
  for (const filePath of dataFiles) {
    const fileName = path.basename(filePath);
    console.log(`📖 Loading from: ${fileName}`);
    
    try {
      const cards = await loadCardData(filePath);
      let newCards = 0;
      
      for (const card of cards) {
        if (!cardIds.has(card.id)) {
          cardIds.add(card.id);
          allCards.push(card);
          newCards++;
        }
      }
      
      console.log(`   → Loaded ${cards.length} cards (${newCards} unique)`);
    } catch (error) {
      console.warn(`   ⚠️  Failed to load ${fileName}: ${error}`);
    }
  }
  
  console.log(`📋 Total unique cards loaded: ${allCards.length}`);
  
  const results: SearchResult[] = [];
  
  for (const card of allCards) {
    const { matches, reasons } = matchesFilters(card, filters);
    if (matches) {
      results.push({ card, matchReasons: reasons });
    }
  }
  
  return results;
};

/**
 * Display search results
 */
const displayResults = (results: SearchResult[], limit: number = 0): void => {
  if (results.length === 0) {
    console.log('❌ No cards found matching the search criteria.');
    return;
  }

  const displayCount = limit > 0 ? Math.min(results.length, limit) : results.length;
  const limitedResults = results.slice(0, displayCount);

  console.log(`\n✅ Found ${results.length} matching cards${limit > 0 && results.length > limit ? ` (showing first ${limit})` : ''}`);
  console.log('='.repeat(80));

  limitedResults.forEach((result, index) => {
    const { card, matchReasons } = result;
    
    console.log(`\n${index + 1}. ${card.name}`);
    console.log(`   ID: ${card.id}`);
    console.log(`   Reference: https://www.altered.gg/cards/${card.reference}`);
    console.log(`   Faction: ${card.mainFaction.name} (${card.mainFaction.reference})`);
    console.log(`   Price: €${card.pricing?.lowerPrice ?? '??'} (x${card.pricing?.numberCopyAvailable ?? 0})`);
    console.log(`   Set: ${card.cardSet.name}`);
    console.log(`   Type: ${card.cardType.name}`);
    
    console.log(`   Costs: Main ${card.elements.MAIN_COST}, Recall ${card.elements.RECALL_COST}`);
    console.log(`   Powers: Forest ${card.elements.FOREST_POWER}, Mountain ${card.elements.MOUNTAIN_POWER}, Ocean ${card.elements.OCEAN_POWER}`);
    
    if (card.elements.MAIN_EFFECT) {
      console.log(`   Main Effect: ${card.elements.MAIN_EFFECT}`);
    }
    
    if (card.elements.ECHO_EFFECT) {
      console.log(`   Echo Effect: ${card.elements.ECHO_EFFECT}`);
    }
    
    console.log(`   ✓ Matches: ${matchReasons.join(', ')}`);
    
    if (index < limitedResults.length - 1) {
      console.log('-'.repeat(80));
    }
  });

  if (results.length > displayCount) {
    console.log(`\n... and ${results.length - displayCount} more cards`);
  }
};

// ============================================
// 🚀 MAIN EXECUTION
// ============================================

const runSearch = async (): Promise<void> => {
  console.log('🔍 Local Altered Card Search');
  console.log('============================');
  
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
    const results = (await searchCards(filters)).filter(x => x.card.pricing?.inSale).sort((a, b) => {
      const priceA = a.card.pricing?.lowerPrice ?? Infinity;
      const priceB = b.card.pricing?.lowerPrice ?? Infinity;
      return priceA === priceB ? 0 : priceA < priceB ? -1 : 1;
    });

    displayResults(results, RESULT_LIMIT);
    
  } catch (error) {
    console.error('❌ Search failed:', error);
    process.exit(1);
  }
};

// Run the search if this file is executed directly
if (require.main === module) {
  runSearch().catch(console.error);
}

// Export for use as a module
export { searchCards, SearchFilters, SearchResult, loadCardData, getAvailableDataFiles };
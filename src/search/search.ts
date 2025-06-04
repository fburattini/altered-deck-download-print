#!/usr/bin/env npx tsx

/**
 * 🔍 LOCAL CARD SEARCH
 * 
 * Search through locally downloaded Altered card data
 * Supports filtering by main cost, main effect, and echo effect using string matching
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { CardDetail } from '../market/market-types';

// ============================================
// 🔧 SEARCH INTERFACE
// ============================================

export interface SearchFilters {
  mainCost?: string;
  recallCost?: string;
  mainEffect?: string;
  echoEffect?: string;
  name?: string;
  faction?: string;
  rarity?: string;
  inSale?: boolean;
}

export interface SearchResult {
  card: CardDetail;
  matchReasons: string[];
}

export interface SearchOptions {
  resultLimit?: number;
  sortByPrice?: boolean;
  inSaleOnly?: boolean;
}

// ============================================
// 🔍 CARD SEARCHER CLASS
// ============================================

export class CardSearcher {
  private cards: CardDetail[] = [];
  private isLoaded: boolean = false;

  /**
   * Load card data from available JSONL files
   */
  async loadCardData(): Promise<void> {
    if (this.isLoaded) {
      return; // Already loaded
    }

    console.log('🔍 Loading local card data...');
    
    const dataFiles = await this.getAvailableDataFiles();
    
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
        const cards = await this.loadCardsFromFile(filePath);
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
    
    this.cards = allCards;
    this.isLoaded = true;
    console.log(`📋 Total unique cards loaded: ${this.cards.length}`);
  }

  /**
   * Search cards with the given filters
   */
  async search(filters: SearchFilters, options: SearchOptions = {}): Promise<SearchResult[]> {
    // Ensure data is loaded
    if (!this.isLoaded) {
      await this.loadCardData();
    }

    const
      resultLimit = 0,
      sortByPrice = true,
      inSaleOnly = false

    console.log('🔍 Searching cards...', filters, options);
    
    const results: SearchResult[] = [];
    
    for (const card of this.cards) {
      const { matches, reasons } = this.matchesFilters(card, filters);
      if (matches) {
        results.push({ card, matchReasons: reasons });
      }
    }

    // Apply filtering and sorting
    let filteredResults = results;

    if (inSaleOnly) {
      filteredResults = filteredResults.filter(x => x.card.pricing?.inSale);
    }

    if (sortByPrice) {
      filteredResults.sort((a, b) => {
        const priceA = a.card.pricing?.lowerPrice ?? Infinity;
        const priceB = b.card.pricing?.lowerPrice ?? Infinity;
        return priceA === priceB ? 0 : priceA < priceB ? -1 : 1;
      });
    }

    return filteredResults;
  }

  /**
   * Display search results in console
   */
  displayResults(results: SearchResult[], limit: number = 0): void {
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
  }

  // ============================================
  // 🔧 PRIVATE HELPER METHODS
  // ============================================

  /**
   * Load card data from a JSONL file
   */
  private async loadCardsFromFile(filePath: string): Promise<CardDetail[]> {
    if (!await fs.pathExists(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n').filter(line => line.trim());
    
    return lines.map(line => {
      try {
        return JSON.parse(line) as CardDetail;
      } catch (error) {
        console.warn(`Failed to parse line: ${line.substring(0, 100)}...`);
        return null;
      }
    }).filter(card => card !== null) as CardDetail[];
  }  /**
   * Get all available card data files
   */
  private async getAvailableDataFiles(): Promise<string[]> {
    const cardDbPath = path.join(process.cwd(), 'card_db');
    
    const files: string[] = [];
    
    // Check card_db directory and load ALL .jsonl and .json files
    if (await fs.pathExists(cardDbPath)) {
      const cardDbFiles = await fs.readdir(cardDbPath);
      files.push(...cardDbFiles
        .filter(file => file.endsWith('.jsonl') || file.endsWith('.json'))
        .map(file => path.join(cardDbPath, file))
      );
    }
    
    return files;
  }

  /**
   * Check if a card matches the search filters
   */
  private matchesFilters(card: CardDetail, filters: SearchFilters): { matches: boolean, reasons: string[] } {
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

    // Recall cost filter
    if (filters.recallCost && matches) {
      const cardRecallCost = parseInt(card.elements.RECALL_COST);
      let costMatches = false;
      
      if (filters.recallCost.includes('-')) {
        const [min, max] = filters.recallCost.split('-').map(Number);
        costMatches = cardRecallCost >= min && cardRecallCost <= max;
        if (costMatches) reasons.push(`Recall cost ${cardRecallCost} in range ${min}-${max}`);
      } else {
        const targetCost = parseInt(filters.recallCost);
        costMatches = cardRecallCost === targetCost;
        if (costMatches) reasons.push(`Recall cost matches ${targetCost}`);
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
    }    // Rarity filter
    if (filters.rarity && matches) {
      const rarityMatches = card.rarity.reference === filters.rarity;
      if (rarityMatches) {
        reasons.push(`Rarity is ${filters.rarity}`);
      } else {
        matches = false;
      }
    }    // InSale filter
    if (filters.inSale !== undefined && matches) {
      const cardInSale = (card.pricing?.inSale ?? 0) > 0;
      const inSaleMatches = cardInSale === filters.inSale;
      if (inSaleMatches) {
        reasons.push(`Card is ${filters.inSale ? 'for sale' : 'not for sale'}`);
      } else {
        matches = false;
      }
    }

    return { matches, reasons };
  }
}

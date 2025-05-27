import axios, { AxiosResponse } from 'axios';
import { CardCollection, CardDetail } from './markte-types';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface FilterOptions {
  rarity?: string[];
  cardSet?: string[];
  factions?: string[];
  mainCost?: number[];
  recallCost?: number[];
  forestPower?: number[];
  mountainPower?: number[];
  oceanPower?: number[];
  inSale?: boolean;
  itemsPerPage?: number;
  page?: number;
  locale?: string;
}

export class AlteredApiClient {
  private baseUrl = 'https://api.altered.gg';
  private defaultLocale = 'en-us';

  constructor(private locale: string = 'en-us') {
    this.defaultLocale = locale;
  }

  /**
   * Build query parameters for the cards API
   */
  private buildQueryParams = (options: FilterOptions): URLSearchParams => {
    const params = new URLSearchParams();

    // Default parameters
    params.append('locale', options.locale || this.defaultLocale);
    if (options.itemsPerPage) {
      params.append('itemsPerPage', options.itemsPerPage.toString());
    }
    if (options.page) {
      params.append('page', options.page.toString());
    }
    if (options.inSale !== undefined) {
      params.append('inSale', options.inSale.toString());
    }

    // Array parameters
    options.rarity?.forEach(r => params.append('rarity[]', r));
    options.cardSet?.forEach(cs => params.append('cardSet[]', cs));
    options.factions?.forEach(f => params.append('factions[]', f));
    options.mainCost?.forEach(mc => params.append('mainCost[]', mc.toString()));
    options.recallCost?.forEach(rc => params.append('recallCost[]', rc.toString()));
    options.forestPower?.forEach(fp => params.append('forestPower[]', fp.toString()));
    options.mountainPower?.forEach(mp => params.append('mountainPower[]', mp.toString()));
    options.oceanPower?.forEach(op => params.append('oceanPower[]', op.toString()));

    return params;
  };

  /**
   * Fetch cards with filtering options
   */
  async getCards(options: FilterOptions = {}): Promise<CardCollection> {
    const params = this.buildQueryParams(options);
    const url = `${this.baseUrl}/cards?${params.toString()}`;
    
    try {
      const response: AxiosResponse<CardCollection> = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error(`Error fetching cards from ${url}:`, error);
      throw error;
    }
  }

  /**
   * Extract clean card ID from @id field (removes "/cards/" prefix)
   */
  private extractCardId(cardIdOrPath: string): string {
    if (cardIdOrPath.startsWith('/cards/')) {
      return cardIdOrPath.replace('/cards/', '');
    }
    return cardIdOrPath;
  }

  /**
   * Fetch detailed information for a specific card
   */
  async getCardDetail(cardIdOrPath: string): Promise<CardDetail> {
    const cleanCardId = this.extractCardId(cardIdOrPath);
    const url = `${this.baseUrl}/cards/${cleanCardId}`;
    const params = new URLSearchParams({ locale: this.defaultLocale });
    
    try {
      const response: AxiosResponse<CardDetail> = await axios.get(`${url}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching card detail for ${cleanCardId} (from ${cardIdOrPath}):`, error);
      throw error;
    }
  }

  /**
   * Get all possible combinations for comprehensive scraping
   * This generates filter combinations that stay under the 1000 item limit
   */
  getAllFilterCombinations(): FilterOptions[] {
    const cardSets = ['CORE', 'ALIZE'];
    const factions = ['AX', 'BR', 'LY', 'MU', 'OR', 'YZ'];
    const costs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    
    const combinations: FilterOptions[] = [];

    // Generate combinations: rarity=UNIQUE + cardSet + faction + mainCost + recallCost
    for (const cardSet of cardSets) {
      for (const faction of factions) {
        for (const mainCost of costs) {
          for (const recallCost of costs) {
            combinations.push({
              rarity: ['UNIQUE'],
              cardSet: [cardSet],
              factions: [faction],
              mainCost: [mainCost],
              recallCost: [recallCost],
              inSale: true,
              itemsPerPage: 999
            });
          }
        }
      }
    }

    return combinations;
  }

  /**
   * Load checkpoint data from file
   */
  private async loadCheckpoint(): Promise<{ 
    processedCombinations: Set<string>, 
    allCards: Map<string, CardDetail>,
    summary: any 
  } | null> {
    const checkpointPath = path.join(process.cwd(), 'data', 'scrape-checkpoint.json');
    
    try {
      if (await fs.pathExists(checkpointPath)) {
        const data = await fs.readJson(checkpointPath);
        const processedCombinations = new Set<string>(data.processedCombinations);
        const allCards = new Map<string, CardDetail>();
        
        // Load existing cards
        data.cards.forEach((card: CardDetail) => allCards.set(card.id, card));
        
        console.log(`Loaded checkpoint: ${processedCombinations.size} combinations processed, ${allCards.size} cards collected`);
        
        return {
          processedCombinations,
          allCards,
          summary: data.summary
        };
      }
    } catch (error) {
      console.warn(`Failed to load checkpoint: ${error}`);
    }
    
    return null;
  }

  /**
   * Save checkpoint data to file
   */
  private async saveCheckpoint(
    processedCombinations: Set<string>, 
    allCards: Map<string, CardDetail>,
    summary: any
  ): Promise<void> {
    const checkpointPath = path.join(process.cwd(), 'data', 'scrape-checkpoint.json');
    
    const checkpointData = {
      timestamp: new Date().toISOString(),
      processedCombinations: Array.from(processedCombinations),
      cards: Array.from(allCards.values()),
      summary
    };
    
    try {
      await fs.ensureDir(path.dirname(checkpointPath));
      await fs.writeJson(checkpointPath, checkpointData, { spaces: 2 });
      console.log(`Checkpoint saved: ${processedCombinations.size} combinations, ${allCards.size} cards`);
    } catch (error) {
      console.error(`Failed to save checkpoint: ${error}`);
    }
  }

  /**
   * Generate a unique key for a filter combination
   */
  private getCombinationKey(combination: FilterOptions): string {
    return `${combination.cardSet?.[0] || 'none'}-${combination.factions?.[0] || 'none'}-${combination.mainCost?.[0] || 'none'}-${combination.recallCost?.[0] || 'none'}`;
  }

  /**
   * Comprehensive scrape using all filter combinations with checkpoint support
   */
  async scrapeAllCards(resumeFromCheckpoint: boolean = true): Promise<{ cards: CardDetail[], summary: any }> {
    const combinations = this.getAllFilterCombinations();
    let allCards = new Map<string, CardDetail>();
    let processedCombinations = new Set<string>();
    let summary = {
      totalCombinations: combinations.length,
      processedCombinations: 0,
      uniqueCards: 0,
      errors: [] as string[],
      startTime: new Date().toISOString(),
      endTime: '',
      resumedFromCheckpoint: false
    };

    // Try to load checkpoint
    if (resumeFromCheckpoint) {
      const checkpoint = await this.loadCheckpoint();
      if (checkpoint) {
        allCards = checkpoint.allCards;
        processedCombinations = checkpoint.processedCombinations;
        summary = { ...summary, ...checkpoint.summary, resumedFromCheckpoint: true };
        console.log(`Resuming from checkpoint with ${allCards.size} cards already collected`);
      }
    }

    console.log(`Starting comprehensive scrape with ${combinations.length} filter combinations...`);
    console.log(`Already processed: ${processedCombinations.size} combinations`);
    console.log(`Remaining: ${combinations.length - processedCombinations.size} combinations`);

    for (let i = 0; i < combinations.length; i++) {
      const combination = combinations[i];
      const combinationKey = this.getCombinationKey(combination);
      
      // Skip if already processed
      if (processedCombinations.has(combinationKey)) {
        continue;
      }
      
      try {
        console.log(`Processing combination ${i + 1}/${combinations.length}: ${JSON.stringify(combination)}`);
        
        const collection = await this.getCards(combination);
        console.log(`  Found ${collection['hydra:member'].length} cards in this combination`);

        // Fetch detailed information for each card
        for (const card of collection['hydra:member']) {
          if (!allCards.has(card.id)) {
            try {
              const detail = await this.getCardDetail(card['@id']);
              allCards.set(card.id, detail);
              console.log(`    Added card: ${detail.name} (${detail.id})`);
            } catch (error) {
              const errorMsg = `Failed to fetch detail for card ${card.id} (@id: ${card['@id']}): ${error}`;
              console.error(`    ${errorMsg}`);
              summary.errors.push(errorMsg);
            }
          }
        }

        // Mark this combination as processed
        processedCombinations.add(combinationKey);
        summary.processedCombinations = processedCombinations.size;
        summary.uniqueCards = allCards.size;

        // Save checkpoint every 10 combinations
        if (processedCombinations.size % 10 === 0) {
          await this.saveCheckpoint(processedCombinations, allCards, summary);
        }

        // Add small delay to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        const errorMsg = `Failed to process combination ${i + 1}: ${error}`;
        console.error(errorMsg);
        summary.errors.push(errorMsg);
        
        // Save checkpoint on error
        await this.saveCheckpoint(processedCombinations, allCards, summary);
      }
    }

    // Final checkpoint save
    summary.endTime = new Date().toISOString();
    await this.saveCheckpoint(processedCombinations, allCards, summary);

    console.log(`Scraping completed. Found ${allCards.size} unique cards.`);
    
    return {
      cards: Array.from(allCards.values()),
      summary
    };
  }

  /**
   * Save scraped data to JSON file or JSONL file if data is an array
   */
  async saveToFile(data: any, filename: string): Promise<void> {
    const filePath = path.join(process.cwd(), filename);
    await fs.ensureDir(path.dirname(filePath));
    
    if (Array.isArray(data)) {
      // Save as JSONL (one JSON object per line)
      const jsonlPath = filePath.replace(/\.json$/, '.jsonl');
      const jsonlContent = data.map(item => JSON.stringify(item)).join('\n');
      await fs.writeFile(jsonlPath, jsonlContent, 'utf8');
      console.log(`Data saved to ${jsonlPath} (${data.length} items in JSONL format)`);
    } else {
      // Save as regular JSON
      await fs.writeJson(filePath, data, { spaces: 2 });
      console.log(`Data saved to ${filePath}`);
    }
  }
}

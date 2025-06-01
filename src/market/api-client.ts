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
  cardName?: string;
}

export interface CardStats {
  "@context": string;
  "@id": string;
  "@type": string;
  "hydra:totalItems": number;
  "hydra:member": CardStatItem[];
  "hydra:view": any;
  "hydra:search": any;
}

export interface CardStatItem {
  inMyTradelist: number;
  inMyCollection: number;
  inMyWantlist: boolean;
  lowerPrice: number;
  lowerOfferId: string;
  inSale: number;
  inMySale: number;
  numberCopyAvailable: number;
  foiled: boolean;
  lastSale: number;
  isExclusive: boolean;
  "@id": string; // Card ID reference like "/cards/ALT_ALIZE_B_OR_39_C"
}

export class AlteredApiClient {
  private baseUrl = 'https://api.altered.gg';
  private defaultLocale = 'en-us';
  private bearerToken?: string;

  constructor(private locale: string = 'en-us', bearerToken?: string) {
    this.defaultLocale = locale;
    this.bearerToken = bearerToken;
  }

  /**
   * Build query parameters for the cards API
   */
  buildQueryParams = (options: FilterOptions): URLSearchParams => {
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

    // Card name filter
    if (options.cardName && options.cardName.trim()) {
      params.append('translations.name', options.cardName.trim());
    }

    return params;
  };

  /**
   * Get HTTP headers for API requests
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.bearerToken) {
      headers.Authorization = `Bearer ${this.bearerToken}`;
    }

    return headers;
  }

  /**
   * Fetch a single page with retry logic for rate limiting
   */
  private async fetchPage(url: string, retryCount: number = 0): Promise<CardCollection> {
    const maxRetries = 3;
    
    try {
      const response: AxiosResponse<CardCollection> = await axios.get(url, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error: any) {
      // Handle rate limiting (429) with exponential backoff
      if (error.response?.status === 429 && retryCount < maxRetries) {
        const waitTime = Math.pow(2, retryCount) * 1000 + Math.random() * 1000; // Exponential backoff with jitter
        console.warn(`Rate limited for page request, retrying in ${Math.round(waitTime)}ms (attempt ${retryCount + 1}/${maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.fetchPage(url, retryCount + 1);
      }
      
      console.error(`Error fetching page from ${url}:`, error);
      throw error;
    }
  }

  /**
   * Fetch cards with filtering options and retry logic for rate limiting
   * Automatically handles pagination to get ALL cards for the given filter
   */
  async getCards(options: FilterOptions = {}, retryCount: number = 0): Promise<CardCollection> {
    const params = this.buildQueryParams(options);
    const url = `${this.baseUrl}/cards?${params.toString()}`;
    
    try {
      const firstPage = await this.fetchPage(url);
      let allCards = [...firstPage['hydra:member']];
      let currentCollection = firstPage;
      
      // Check if there are more pages to fetch
      while (currentCollection['hydra:view'] && currentCollection['hydra:view']['hydra:next']) {
        const nextPageUrl = `${this.baseUrl}${currentCollection['hydra:view']['hydra:next']}`;
        console.log(`  Fetching next page: ${nextPageUrl}`);
        
        // Add small delay between page requests
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 100)); // 100-200ms
        
        const nextPage = await this.fetchPage(nextPageUrl);
        allCards.push(...nextPage['hydra:member']);
        currentCollection = nextPage;
      }
      
      console.log(`  Total cards fetched across all pages: ${allCards.length}`);
      
      // Return the combined collection with all cards
      return {
        ...firstPage,
        'hydra:member': allCards,
        'hydra:totalItems': allCards.length
      };
      
    } catch (error: any) {
      console.error(`Error in getCards for ${url}:`, error);
      throw error;
    }
  }

  /**
   * Fetch card statistics (pricing data) for cards matching the filters
   * Uses the same parameters as getCards but hits the /cards/stats endpoint
   */
  async getCardStats(options: FilterOptions = {}, retryCount: number = 0): Promise<CardStats> {
    const params = this.buildQueryParams(options);
    const url = `${this.baseUrl}/cards/stats?${params.toString()}`;
    const maxRetries = 3;
    
    try {
      const response: AxiosResponse<CardStats> = await axios.get(url, {
        headers: this.getHeaders()
      });
      
      return response.data;
    } catch (error: any) {
      // Handle rate limiting (429) with exponential backoff
      if (error.response?.status === 429 && retryCount < maxRetries) {
        const waitTime = Math.pow(2, retryCount) * 1000 + Math.random() * 1000; // Exponential backoff with jitter
        console.warn(`Rate limited for stats request, retrying in ${Math.round(waitTime)}ms (attempt ${retryCount + 1}/${maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.getCardStats(options, retryCount + 1);
      }
      
      console.error(`Error fetching card stats from ${url}:`, error);
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
   * Fetch detailed information for a specific card with retry logic for rate limiting
   */
  async getCardDetail(cardIdOrPath: string, retryCount: number = 0): Promise<CardDetail> {
    const cleanCardId = this.extractCardId(cardIdOrPath);
    const url = `${this.baseUrl}/cards/${cleanCardId}`;
    const params = new URLSearchParams({ locale: this.defaultLocale });
    const maxRetries = 3;
    
    try {
      const response: AxiosResponse<CardDetail> = await axios.get(`${url}?${params.toString()}`, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error: any) {
      // Handle rate limiting (429) with exponential backoff
      if (error.response?.status === 429 && retryCount < maxRetries) {
        const waitTime = Math.pow(2, retryCount) * 1000 + Math.random() * 1000; // Exponential backoff with jitter
        console.warn(`Rate limited for card ${cleanCardId}, retrying in ${Math.round(waitTime)}ms (attempt ${retryCount + 1}/${maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.getCardDetail(cardIdOrPath, retryCount + 1);
      }
      
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
    const costs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const powers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // Power stats range
    
    const combinations: FilterOptions[] = [];

    // Comprehensive combinations: rarity=UNIQUE + cardSet + faction + mainCost + recallCost + forestPower + mountainPower + oceanPower
    // This ensures we capture every possible unique card with all filter parameters
    for (const cardSet of cardSets) {
      for (const faction of factions) {
        for (const mainCost of costs) {
          for (const recallCost of costs) {
            for (const forestPower of powers) {
              for (const mountainPower of powers) {
                // we don't cycle for ocean power cause the previous filters are already narrow enoughs
                combinations.push({
                    rarity: ['UNIQUE'],
                    cardSet: [cardSet],
                    factions: [faction],
                    mainCost: [mainCost],
                    recallCost: [recallCost],
                    forestPower: [forestPower],
                    mountainPower: [mountainPower],
                    inSale: true,
                    itemsPerPage: 999
                  });
              }
            }
          }
        }
      }
    }

    const totalCombinations = 2 * 6 * 11 * 11 * 11 * 11; // 2 cardSets × 6 factions × 11^4 costs/powers
    console.log(`Generated ${combinations.length} comprehensive filter combinations`);
    console.log(`Total: ${totalCombinations.toLocaleString()} combinations (cardSet × faction × mainCost × recallCost × forestPower × mountainPower × oceanPower)`);
    console.log(`This ensures complete coverage of all unique cards with all possible stat combinations`);

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
    const checkpointPath = path.join(process.cwd(), 'checkpoints_db', 'scrape-checkpoint.json');
    const cardsDataPath = path.join(process.cwd(), 'checkpoints_db', 'altered-cards-latest.jsonl');
    
    try {
      if (await fs.pathExists(checkpointPath)) {
        const data = await fs.readJson(checkpointPath);
        const processedCombinations = new Set<string>(data.processedCombinations);
        const allCards = new Map<string, CardDetail>();
        
        // Load existing cards from the dedicated cards file
        if (await fs.pathExists(cardsDataPath)) {
          const cardsContent = await fs.readFile(cardsDataPath, 'utf8');
          const lines = cardsContent.trim().split('\n').filter(line => line.length > 0);
          
          lines.forEach(line => {
            try {
              const card: CardDetail = JSON.parse(line);
              allCards.set(card.id, card);
            } catch (error) {
              console.warn(`Failed to parse card line: ${error}`);
            }
          });
        }
        
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
    const checkpointPath = path.join(process.cwd(), 'checkpoints_db', 'scrape-checkpoint.json');
    
    const checkpointData = {
      timestamp: new Date().toISOString(),
      processedCombinations: Array.from(processedCombinations),
      summary
    };
    
    try {
      await fs.ensureDir(path.dirname(checkpointPath));
      await fs.writeJson(checkpointPath, checkpointData, { spaces: 2 });
      console.log(`Checkpoint saved: ${processedCombinations.size} combinations, ${allCards.size} cards`);
        // Save the current cards data to a dedicated file for easy access
      const cardsDataPath = path.join('checkpoints_db', 'altered-cards-latest.jsonl');
      const cardsArray = Array.from(allCards.values());
      await this.saveToFile(cardsArray, cardsDataPath);
      
    } catch (error) {
      console.error(`Failed to save checkpoint: ${error}`);
    }
  }

  /**
   * Generate a unique key for a filter combination
   */
  private getCombinationKey(combination: FilterOptions): string {
    const cardSet = combination.cardSet?.[0] || 'none';
    const faction = combination.factions?.[0] || 'none';
    const mainCost = combination.mainCost?.[0] ?? 'none';
    const recallCost = combination.recallCost?.[0] ?? 'none';
    const forestPower = combination.forestPower?.[0] ?? 'none';
    const mountainPower = combination.mountainPower?.[0] ?? 'none';
    const oceanPower = combination.oceanPower?.[0] ?? 'none';
    
    // Comprehensive key format for all filter parameters
    return `${cardSet}-${faction}-${mainCost}-${recallCost}-${forestPower}-${mountainPower}-${oceanPower}`;
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
        console.log(`- Processing combination ${i + 1}/${combinations.length}: ${JSON.stringify(combination)}`);
        
        const collection = await this.getCards(combination);
        console.log(`  Found ${collection['hydra:member'].length} cards in this combination`);

        // Fetch detailed information for each card
        for (const card of collection['hydra:member']) {
          if (!allCards.has(card.id)) {
            try {
              const detail = await this.getCardDetail(card['@id']);
              allCards.set(card.id, detail);
              console.log(`    Added card: ${detail.name} (${detail.id})`);
              
              // Small delay between card detail requests
              await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 200)); // 200-400ms
              
            } catch (error: any) {
              const errorMsg = `Failed to fetch detail for card ${card.id} (@id: ${card['@id']}): ${error}`;
              console.error(`    ${errorMsg}`);
              summary.errors.push(errorMsg);
              
              // If it's a rate limit error that couldn't be resolved with retries, wait before continuing
              if (error.response?.status === 429) {
                console.warn('Rate limit error on card detail, waiting 2 seconds before continuing...');
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
            }
          }
        }

        // Mark this combination as processed
        processedCombinations.add(combinationKey);
        summary.processedCombinations = processedCombinations.size;
        summary.uniqueCards = allCards.size;        // Save checkpoint every 10 combinations
        if (processedCombinations.size % 10 === 0) {
          await this.saveCheckpoint(processedCombinations, allCards, summary);
          
          // Also save cards using name and faction approach
          try {
            const cardsArray = Array.from(allCards.values());
            if (cardsArray.length > 0) {
              await this.saveCardsByNameAndFaction(cardsArray);
            }
          } catch (error) {
            console.warn('Failed to save cards by name and faction during checkpoint:', error);
          }
        }

        // Add delay to be respectful to the API (increased for rate limiting)
        await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 500)); // 500-1000ms delay
        
      } catch (error: any) {
        const errorMsg = `Failed to process combination ${i + 1}: ${error}`;
        console.error(errorMsg);
        summary.errors.push(errorMsg);
        
        // If it's a rate limit error, wait longer before continuing
        if (error.response?.status === 429) {
          console.warn('Rate limited on combination request, waiting 5 seconds before continuing...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
          // Save checkpoint on error
        await this.saveCheckpoint(processedCombinations, allCards, summary);
        
        // Also save cards using name and faction approach
        try {
          const cardsArray = Array.from(allCards.values());
          if (cardsArray.length > 0) {
            await this.saveCardsByNameAndFaction(cardsArray);
          }
        } catch (saveError) {
          console.warn('Failed to save cards by name and faction during error checkpoint:', saveError);
        }
      }
    }    // Final checkpoint save
    summary.endTime = new Date().toISOString();
    await this.saveCheckpoint(processedCombinations, allCards, summary);

    console.log(`Scraping completed. Found ${allCards.size} unique cards.`);
    
    // Save cards using the new name and faction-based approach
    try {
      const cardsArray = Array.from(allCards.values());
      console.log('Saving cards by name and faction...');
      await this.saveCardsByNameAndFaction(cardsArray);
      console.log('Cards saved successfully using name and faction-based filenames.');
    } catch (error) {
      console.error('Failed to save cards by name and faction:', error);
      summary.errors.push(`Failed to save cards by name and faction: ${error}`);
    }
    
    return {
      cards: Array.from(allCards.values()),
      summary
    };
  }

  /**
   * Run a focused scrape with specific filters
   * This allows users to scrape only cards matching specific criteria
   */
  async scrapeWithFilters(
    filters: FilterOptions, 
    resumeFromCheckpoint: boolean = true,
    checkpointPrefix: string = 'filtered'
  ): Promise<{ cards: CardDetail[], summary: any }> {
    let allCards = new Map<string, CardDetail>();
    let processedCombinations = new Set<string>();
    let summary = {
      totalCombinations: 1,
      processedCombinations: 0,
      uniqueCards: 0,
      errors: [] as string[],
      startTime: new Date().toISOString(),
      endTime: '',
      resumedFromCheckpoint: false,
      filters: filters
    };

    // Create a unique checkpoint name based on the filters
    const filterKey = this.getFilterKey(filters);    const checkpointPath = path.join(process.cwd(), 'checkpoints_db', `${checkpointPrefix}-scrape-checkpoint-${filterKey}.json`);
    const cardsDataPath = path.join(process.cwd(), 'checkpoints_db', `${checkpointPrefix}-cards-latest-${filterKey}.jsonl`);

    // Try to load checkpoint
    if (resumeFromCheckpoint) {
      const checkpoint = await this.loadFilteredCheckpoint(checkpointPath, cardsDataPath);
      if (checkpoint) {
        allCards = checkpoint.allCards;
        processedCombinations = checkpoint.processedCombinations;
        summary = { ...summary, ...checkpoint.summary, resumedFromCheckpoint: true };
        console.log(`Resuming from checkpoint with ${allCards.size} cards already collected`);
      }
    }

    console.log(`Starting filtered scrape with filters: ${JSON.stringify(filters)}`);
    
    try {
      console.log(`- Processing filter combination: ${JSON.stringify(filters)}`);
      
      const collection = await this.getCards(filters);
      console.log(`  Found ${collection['hydra:member'].length} cards matching filters`);

      // Fetch detailed information for each card
      for (const card of collection['hydra:member']) {
        if (!allCards.has(card.id)) {
          try {
            const detail = await this.getCardDetail(card['@id']);
            allCards.set(card.id, detail);
            console.log(`    Added card: ${detail.name} (${detail.id})`);
            
            // Small delay between card detail requests
            await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 100)); // 100-200ms
            
          } catch (error: any) {
            const errorMsg = `Failed to fetch detail for card ${card.id} (@id: ${card['@id']}): ${error}`;
            console.error(`    ${errorMsg}`);
            summary.errors.push(errorMsg);
            
            // If it's a rate limit error that couldn't be resolved with retries, wait before continuing
            if (error.response?.status === 429) {
              console.warn('Rate limit error on card detail, waiting 2 seconds before continuing...');
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        }
      }

      // Mark as processed
      processedCombinations.add(filterKey);
      summary.processedCombinations = 1;
      summary.uniqueCards = allCards.size;      // Save cards using new name+faction approach
      const cardsArray = Array.from(allCards.values());
      await this.saveCardsByNameAndFaction(cardsArray);
      
      // Save checkpoint for resume functionality
      await this.saveFilteredCheckpoint(processedCombinations, allCards, summary, checkpointPath, cardsDataPath);
        
    } catch (error: any) {
      const errorMsg = `Failed to process filtered scrape: ${error}`;
      console.error(errorMsg);
      summary.errors.push(errorMsg);
      
      // If it's a rate limit error, wait longer before continuing
      if (error.response?.status === 429) {
        console.warn('Rate limited on filter request, waiting 5 seconds before continuing...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      // Save checkpoint on error (but still try to save cards first)
      try {
        const cardsArray = Array.from(allCards.values());
        if (cardsArray.length > 0) {
          await this.saveCardsByNameAndFaction(cardsArray);
        }
      } catch (saveError) {
        console.error(`Failed to save cards after error: ${saveError}`);
      }
      await this.saveFilteredCheckpoint(processedCombinations, allCards, summary, checkpointPath, cardsDataPath);
    }

    // Final saves
    summary.endTime = new Date().toISOString();
    const cardsArray = Array.from(allCards.values());
    await this.saveCardsByNameAndFaction(cardsArray);
    await this.saveFilteredCheckpoint(processedCombinations, allCards, summary, checkpointPath, cardsDataPath);

    console.log(`Filtered scraping completed. Found ${allCards.size} unique cards.`);
    
    return {
      cards: Array.from(allCards.values()),
      summary
    };
  }

  /**
   * Generate a unique key for a set of filters
   */
  private getFilterKey(filters: FilterOptions): string {
    const parts: string[] = [];
    
    if (filters.rarity) parts.push(`rarity-${filters.rarity.join(',')}`);
    if (filters.cardSet) parts.push(`set-${filters.cardSet.join(',')}`);
    if (filters.factions) parts.push(`faction-${filters.factions.join(',')}`);
    if (filters.mainCost) parts.push(`main-${filters.mainCost.join(',')}`);
    if (filters.recallCost) parts.push(`recall-${filters.recallCost.join(',')}`);
    if (filters.forestPower) parts.push(`forest-${filters.forestPower.join(',')}`);
    if (filters.mountainPower) parts.push(`mountain-${filters.mountainPower.join(',')}`);
    if (filters.oceanPower) parts.push(`ocean-${filters.oceanPower.join(',')}`);
    if (filters.inSale !== undefined) parts.push(`sale-${filters.inSale}`);
    if (filters.cardName) parts.push(`name-${filters.cardName.replace(/[^a-zA-Z0-9]/g, '_')}`);
    
    return parts.length > 0 ? parts.join('_') : 'no-filters';
  }

  /**
   * Load checkpoint data from file for filtered scrapes
   */
  private async loadFilteredCheckpoint(checkpointPath: string, cardsDataPath: string): Promise<{ 
    processedCombinations: Set<string>, 
    allCards: Map<string, CardDetail>,
    summary: any 
  } | null> {
    try {
      if (await fs.pathExists(checkpointPath)) {
        const data = await fs.readJson(checkpointPath);
        const processedCombinations = new Set<string>(data.processedCombinations);
        const allCards = new Map<string, CardDetail>();
        
        // Load existing cards from the dedicated cards file
        if (await fs.pathExists(cardsDataPath)) {
          const cardsContent = await fs.readFile(cardsDataPath, 'utf8');
          const lines = cardsContent.trim().split('\n').filter(line => line.length > 0);
          
          lines.forEach(line => {
            try {
              const card: CardDetail = JSON.parse(line);
              allCards.set(card.id, card);
            } catch (error) {
              console.warn(`Failed to parse card line: ${error}`);
            }
          });
        }
        
        console.log(`Loaded filtered checkpoint: ${processedCombinations.size} combinations processed, ${allCards.size} cards collected`);
        
        return {
          processedCombinations,
          allCards,
          summary: data.summary
        };
      }
    } catch (error) {
      console.warn(`Failed to load filtered checkpoint: ${error}`);
    }
    
    return null;
  }

  /**
   * Save checkpoint data to file for filtered scrapes
   */
  private async saveFilteredCheckpoint(
    processedCombinations: Set<string>, 
    allCards: Map<string, CardDetail>,
    summary: any,
    checkpointPath: string,
    cardsDataPath: string
  ): Promise<void> {
    const checkpointData = {
      timestamp: new Date().toISOString(),
      processedCombinations: Array.from(processedCombinations),
      summary
    };
    
    try {
      await fs.ensureDir(path.dirname(checkpointPath));
      await fs.writeJson(checkpointPath, checkpointData, { spaces: 2 });
      console.log(`Filtered checkpoint saved: ${processedCombinations.size} combinations, ${allCards.size} cards`);
      
      // Save the current cards data to a dedicated file for easy access
      const cardsArray = Array.from(allCards.values());
      await this.saveToFile(cardsArray, cardsDataPath);
      
    } catch (error) {
      console.error(`Failed to save filtered checkpoint: ${error}`);
    }
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

  /**
   * Generate filename for card based on name and faction
   */
  private getCardFileName(card: CardDetail): string {
    // Sanitize card name for filename
    const sanitizedName = card.name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-').toLowerCase();
    const faction = card.mainFaction.reference;
    return `card_db/cards-${sanitizedName}-${faction}.jsonl`;
  }

  /**
   * Save a single card to its dedicated file based on name and faction
   * Checks for duplicates before adding
   */
  async saveCardByNameAndFaction(card: CardDetail): Promise<void> {
    const filename = this.getCardFileName(card);
    const filePath = path.join(process.cwd(), filename);
    
    // Ensure directory exists
    await fs.ensureDir(path.dirname(filePath));
    
    // Load existing cards if file exists
    const existingCards: CardDetail[] = [];
    if (await fs.pathExists(filePath)) {
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const lines = content.trim().split('\n').filter(line => line.length > 0);
        
        for (const line of lines) {
          try {
            const existingCard: CardDetail = JSON.parse(line);
            existingCards.push(existingCard);
          } catch (error) {
            console.warn(`Failed to parse existing card line in ${filename}: ${error}`);
          }
        }
      } catch (error) {
        console.warn(`Failed to read existing cards from ${filename}: ${error}`);
      }
    }
    
    // Check if card already exists (by ID or reference) and find its index
    const duplicateIndex = existingCards.findIndex(existing => 
      existing.id === card.id || 
      existing.reference === card.reference ||
      existing['@id'] === card['@id']
    );
    
    if (duplicateIndex !== -1) {
      // Card exists, overwrite it with the new card data
      console.log(`Card ${card.name} (${card.id}) already exists in ${filename}, overwriting with new data.`);
      existingCards[duplicateIndex] = card;
    } else {
      // Card does not exist, add it
      // console.log(`Adding new card ${card.name} (${card.id}) to ${filename}.`); // Original log before change
      existingCards.push(card);
    }
    
    // Save all cards back to file
    const jsonlContent = existingCards.map(c => JSON.stringify(c)).join('\n');
    await fs.writeFile(filePath, jsonlContent, 'utf8');
    
    // console.log(`Saved card ${card.name} to ${filename} (${existingCards.length} total cards)`); // Original log
    if (duplicateIndex !== -1) {
      console.log(`Updated card ${card.name} in ${filename} (${existingCards.length} total cards)`);
    } else {
      console.log(`Saved new card ${card.name} to ${filename} (${existingCards.length} total cards)`);
    }
  }

  /**
   * Save multiple cards to their respective files based on name and faction
   * Groups cards and checks for duplicates
   */
  async saveCardsByNameAndFaction(cards: CardDetail[]): Promise<void> {
    // Group cards by their filename
    const cardsByFile = new Map<string, CardDetail[]>();
    
    for (const card of cards) {
      const filename = this.getCardFileName(card);
      if (!cardsByFile.has(filename)) {
        cardsByFile.set(filename, []);
      }
      cardsByFile.get(filename)!.push(card);
    }
    
    // Save each group to its respective file
    for (const [filename, cardsForFile] of cardsByFile) {
      const filePath = path.join(process.cwd(), filename);
      
      // Ensure directory exists
      await fs.ensureDir(path.dirname(filePath));
      
      // Load existing cards if file exists
      const existingCards: CardDetail[] = [];
      if (await fs.pathExists(filePath)) {
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const lines = content.trim().split('\n').filter(line => line.length > 0);
          
          for (const line of lines) {
            try {
              const existingCard: CardDetail = JSON.parse(line);
              existingCards.push(existingCard);
            } catch (error) {
              console.warn(`Failed to parse existing card line in ${filename}: ${error}`);
            }
          }
        } catch (error) {
          console.warn(`Failed to read existing cards from ${filename}: ${error}`);
        }
      }
      
      let addedCount = 0;
      let updatedCount = 0;

      // Process each card from the input `cardsForFile`
      for (const newCard of cardsForFile) {
        const duplicateIndex = existingCards.findIndex(existing => 
          existing.id === newCard.id || 
          existing.reference === newCard.reference ||
          existing['@id'] === newCard['@id']
        );

        if (duplicateIndex !== -1) {
          // Card exists, overwrite it with the new card data
          existingCards[duplicateIndex] = newCard;
          updatedCount++;
        } else {
          // Card does not exist, add it to the list
          existingCards.push(newCard);
          addedCount++;
        }
      }
      
      // Only save if there were actual changes
      if (addedCount > 0 || updatedCount > 0) {
        const jsonlContent = existingCards.map(c => JSON.stringify(c)).join('\n');
        await fs.writeFile(filePath, jsonlContent, 'utf8');
        console.log(`Updated ${filename}: ${addedCount} new cards added, ${updatedCount} cards updated. (${existingCards.length} total)`);
      } else {
        console.log(`No new cards to add or update in ${filename}`);
      }
    }
  }
}

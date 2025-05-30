import { AlteredApiClient, FilterOptions } from './api-client';
import * as fs from 'fs-extra';
import * as path from 'path';

export class AlteredScraper {
  private apiClient: AlteredApiClient;
  private cardDb = 'card_db'

  constructor(locale: string = 'en-us', bearerToken?: string) {
    this.apiClient = new AlteredApiClient(locale, bearerToken);
  }

  /**
   * Run a full scrape of all unique cards
   */
  async runFullScrape(resumeFromCheckpoint: boolean = true): Promise<void> {
    console.log('Starting full scrape of Altered cards...');
    console.log('This will use narrow filters to stay within API limits.');
    
    if (resumeFromCheckpoint) {
      console.log('Will attempt to resume from checkpoint if available...');
    } else {
      console.log('Starting fresh scrape (ignoring any existing checkpoint)...');
    }
    
    try {
      const result = await this.apiClient.scrapeAllCards(resumeFromCheckpoint);
      
      // Create data directory if it doesn't exist
      const dataDir = path.join(process.cwd(), this.cardDb);
      await fs.ensureDir(dataDir);

      // Save all cards data
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const cardsFile = `${this.cardDb}/altered-cards-${timestamp}.json`;
      await this.apiClient.saveToFile(result.cards, cardsFile);

      // Save summary
      const summaryFile = `${this.cardDb}/scrape-summary-${timestamp}.json`;
      await this.apiClient.saveToFile(result.summary, summaryFile);

      // Log summary
      console.log('\n=== Scrape Summary ===');
      console.log(`Total combinations processed: ${result.summary.processedCombinations}/${result.summary.totalCombinations}`);
      console.log(`Unique cards found: ${result.summary.uniqueCards}`);
      console.log(`Errors encountered: ${result.summary.errors.length}`);
      
      if (result.summary.errors.length > 0) {
        console.log('\nErrors:');
        result.summary.errors.slice(0, 10).forEach((error: string) => console.log(`  - ${error}`));
        if (result.summary.errors.length > 10) {
          console.log(`  ... and ${result.summary.errors.length - 10} more errors`);
        }
      }

      console.log(`\nData saved to:`);
      console.log(`  Cards: ${cardsFile}`);
      console.log(`  Summary: ${summaryFile}`);
      console.log(`  Latest cards also available at: data/altered-cards-latest.jsonl`);
      console.log(`  Checkpoint: data/scrape-checkpoint.json`);

    } catch (error) {
      console.error('Scrape failed:', error);
      throw error;
    }
  }

  /**
   * Run a test scrape with limited filters
   */
  async runTestScrape(): Promise<void> {
    console.log('Running test scrape...');
    
    try {
      // Test with a single combination
      const testResult = await this.apiClient.getCards({
        rarity: ['UNIQUE'],
        cardSet: ['CORE'],
        factions: ['AX'],
        mainCost: [2],
        recallCost: [1],
        inSale: true,
        itemsPerPage: 10
      });

      console.log(`Test found ${testResult['hydra:member'].length} cards`);
      
      // Get details for first card
      if (testResult['hydra:member'].length > 0) {
        const firstCard = testResult['hydra:member'][0];
        console.log(`Getting details for: ${firstCard.name} (id: ${firstCard.id})`);
        console.log(`Card @id: ${firstCard['@id']}`);
        
        const cardDetail = await this.apiClient.getCardDetail(firstCard['@id']);
        console.log(`Card detail: ${cardDetail.name} - ${cardDetail.cardType.name}`);
        console.log(`Elements: ${JSON.stringify(cardDetail.elements, null, 2)}`);
      
        await this.apiClient.saveToFile(testResult['hydra:member'], `${this.cardDb}/test.jsonl`)
    }

    } catch (error) {
      console.error('Test scrape failed:', error);
      throw error;
    }
  }

  /**
   * Analyze the data to understand filtering requirements
   */
  async analyzeFilters(): Promise<void> {
    console.log('Analyzing filter requirements...');
    
    try {
      // Test different combinations to see response sizes
      const testCases = [
        { name: 'All UNIQUE cards', filters: { rarity: ['UNIQUE'], itemsPerPage: 1000 } },
        { name: 'UNIQUE + CORE', filters: { rarity: ['UNIQUE'], cardSet: ['CORE'], itemsPerPage: 1000 } },
        { name: 'UNIQUE + CORE + AX', filters: { rarity: ['UNIQUE'], cardSet: ['CORE'], factions: ['AX'], itemsPerPage: 1000 } }
      ];

      for (const testCase of testCases) {
        try {
          const result = await this.apiClient.getCards(testCase.filters);
          console.log(`${testCase.name}: ${result['hydra:member'].length} cards (total: ${result['hydra:totalItems']})`);
        } catch (error) {
          console.log(`${testCase.name}: Error - ${error}`);
        }
      }

    } catch (error) {
      console.error('Filter analysis failed:', error);
      throw error;
    }
  }

  /**
   * Run a filtered scrape with specific criteria
   */
  async runFilteredScrape(filters: FilterOptions, resumeFromCheckpoint: boolean = true): Promise<void> {
    console.log('Starting filtered scrape of Altered cards...');
    console.log(`Applied filters: ${JSON.stringify(filters, null, 2)}`);
    
    if (resumeFromCheckpoint) {
      console.log('Will attempt to resume from checkpoint if available...');
    } else {
      console.log('Starting fresh scrape (ignoring any existing checkpoint)...');
    }
    
    try {
      const result = await this.apiClient.scrapeWithFilters(filters, resumeFromCheckpoint);
      
      // Create data directory if it doesn't exist
      const dataDir = path.join(process.cwd(), this.cardDb);
      await fs.ensureDir(dataDir);

      // Save all cards data with filter-specific filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filterKey = this.getFilterKeyForFilename(filters);
      const cardsFile = `${this.cardDb}/altered-cards-filtered-${filterKey}-${timestamp}.json`;
      await this.apiClient.saveToFile(result.cards, cardsFile);

      // Save summary
      const summaryFile = `${this.cardDb}/scrape-summary-filtered-${filterKey}-${timestamp}.json`;
      await this.apiClient.saveToFile(result.summary, summaryFile);

      // Log summary
      console.log('\n=== Filtered Scrape Summary ===');
      console.log(`Applied filters: ${JSON.stringify(result.summary.filters, null, 2)}`);
      console.log(`Unique cards found: ${result.summary.uniqueCards}`);
      console.log(`Errors encountered: ${result.summary.errors.length}`);
      
      if (result.summary.errors.length > 0) {
        console.log('\nErrors:');
        result.summary.errors.slice(0, 5).forEach((error: string) => console.log(`  - ${error}`));
        if (result.summary.errors.length > 5) {
          console.log(`  ... and ${result.summary.errors.length - 5} more errors`);
        }
      }

      console.log(`\nData saved to:`);
      console.log(`  Cards: ${cardsFile}`);
      console.log(`  Summary: ${summaryFile}`);

    } catch (error) {
      console.error('Filtered scrape failed:', error);
      throw error;
    }
  }

  /**
   * Generate a filename-safe filter key
   */
  private getFilterKeyForFilename(filters: FilterOptions): string {
    const parts: string[] = [];
    
    if (filters.rarity) parts.push(`rarity-${filters.rarity.join('-')}`);
    if (filters.cardSet) parts.push(`set-${filters.cardSet.join('-')}`);
    if (filters.factions) parts.push(`faction-${filters.factions.join('-')}`);
    if (filters.mainCost) parts.push(`main-${filters.mainCost.join('-')}`);
    if (filters.recallCost) parts.push(`recall-${filters.recallCost.join('-')}`);
    if (filters.forestPower) parts.push(`forest-${filters.forestPower.join('-')}`);
    if (filters.mountainPower) parts.push(`mountain-${filters.mountainPower.join('-')}`);
    if (filters.oceanPower) parts.push(`ocean-${filters.oceanPower.join('-')}`);
    if (filters.inSale !== undefined) parts.push(`sale-${filters.inSale}`);
    if (filters.cardName) parts.push(`name-${filters.cardName.replace(/[^a-zA-Z0-9]/g, '_')}`);
    
    return parts.length > 0 ? parts.join('_') : 'no-filters';
  }
}

// Export for CLI usage
export const createScraper = (locale?: string, bearerToken?: string) => new AlteredScraper(locale, bearerToken);

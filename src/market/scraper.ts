import { AlteredApiClient, CardStatItem, FilterOptions } from './api-client';
import { CardDetail, CardDetailPricing } from './market-types';

export interface CardStatsResult {
	stats: CardStatItem[];
	summary: {
		totalItems: number;
		cardsWithPricing: number;
		cardsWithLastSale: number;
		avgLowerPrice: number;
		avgLastSale: number;
		priceRange: {
			min: number;
			max: number;
		};
	};
}

export class AlteredScraper {
	private apiClient: AlteredApiClient;

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
		} try {
			const result = await this.apiClient.scrapeAllCards(resumeFromCheckpoint);

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

			console.log(`\nCards saved by name and faction to: card_db/cards-{name}-{faction}.jsonl files`);
			console.log(`  Latest cards also available at: checkpoints_db/altered-cards-latest.jsonl`);
			console.log(`  Checkpoint: checkpoints_db/scrape-checkpoint.json`);

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

				await this.apiClient.saveToFile(testResult['hydra:member'], `card_db/test.jsonl`)
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

			// Log summary
			console.log('\n=== Filtered Scrape Summary ===');
			console.log(`Applied filters: ${JSON.stringify(result.summary.filters, null, 2)}`);
			console.log(`Unique cards found: ${result.summary.uniqueCards}`);
			console.log(`Errors encountered: ${result.summary.errors.length}`);

			if (result.summary.errors.length > 0) {
				console.log('\nErrors:');
				result.summary.errors.slice(0, 10).forEach((error: string) => console.log(`  - ${error}`));
				if (result.summary.errors.length > 10) {
					console.log(`  ... and ${result.summary.errors.length - 10} more errors`);
				}
			}

			console.log(`\nCards saved by name and faction to: card_db/cards-{name}-{faction}.jsonl files`);

		} catch (error) {
			console.error('Filtered scrape failed:', error);
			throw error;
		}
	}

	/**
	 * Run a filtered scrape with pricing data integrated into card details
	 */
	async runFilteredScrapeWithPricing(filters: FilterOptions, resumeFromCheckpoint: boolean = true): Promise<{ 
		totalCards: number, 
		cardsWithPricing: number,
		newCards: number,
		cardsWithPricingChanges: number,
		cardsWithoutChanges: number,
		cards: CardDetail[]
	}> {
		console.log('Starting filtered scrape with pricing data integration...');
		console.log(`Applied filters: ${JSON.stringify(filters, null, 2)}`);

		if (resumeFromCheckpoint) {
			console.log('Will attempt to resume from checkpoint if available...');
		} else {
			console.log('Starting fresh scrape (ignoring any existing checkpoint)...');
		}

		try {
			// First get the card data
			console.log('📋 Fetching card details...');
			const cardResult = await this.apiClient.scrapeWithFilters(filters, resumeFromCheckpoint, 'filtered', true);

			// Then get the pricing data
			console.log('💰 Fetching pricing data...');
			const statsResult = await this.apiClient.getCardStats(filters);

			// Create a map of card ID to pricing data
			const pricingMap = new Map();
			if (statsResult && statsResult['hydra:member']) {
				statsResult['hydra:member'].forEach((stat: CardStatItem) => {
					// Extract card ID from @id field (removes "/cards/" prefix)
					const cardId = stat["@id"].replace('/cards/', '');
					pricingMap.set(cardId, {
						lowerPrice: stat.lowerPrice || 0,
						lastSale: stat.lastSale || 0,
						inSale: stat.inSale || 0,
						numberCopyAvailable: stat.numberCopyAvailable || 0,
						inMyTradelist: stat.inMyTradelist || 0,
						inMyCollection: stat.inMyCollection || 0,
						inMyWantlist: stat.inMyWantlist || false,
						foiled: stat.foiled || false,
						isExclusive: stat.isExclusive || false
					});
				});
			}

			// Merge pricing data into card details
			const enrichedCards = cardResult.cards.map(card => {
				// Extract the reference ID from the card's @id field (same as what we use for pricing map keys)
				const cardRefId = card['@id'].replace('/cards/', '');
				const pricing = pricingMap.get(cardRefId) || {
					lowerPrice: 0,
					lastSale: 0,
					inSale: 0,
					numberCopyAvailable: 0,
					inMyTradelist: 0,
					inMyCollection: 0,
					inMyWantlist: false,
					foiled: false,
					isExclusive: false
				};

				return {
					...card,
					pricing: pricing
				};
			});

			// Save the enriched cards using the name+faction based saving system
			// which now returns detailed statistics about what was saved
			console.log('💾 Saving enriched cards with pricing data...');
			const savingStats = await this.apiClient.saveCardsByNameAndFaction(enrichedCards);

			// Calculate pricing stats for summary
			const pricingStats = this.calculatePricingStats(enrichedCards);
			const enhancedSummary = {
				...cardResult.summary,
				pricingStats,
				cardsWithPricing: enrichedCards.filter(card => card.pricing.lowerPrice > 0).length
			};

			// Log summary
			console.log('\n=== Filtered Scrape with Pricing Summary ===');
			console.log(`Applied filters: ${JSON.stringify(enhancedSummary.filters, null, 2)}`);
			console.log(`Total cards processed: ${enhancedSummary.uniqueCards}`);
			console.log(`🆕 New cards (not tracked before): ${savingStats.newCards}`);
			console.log(`💰 Cards with pricing changes: ${savingStats.cardsWithPricingChanges}`);
			console.log(`🔄 Cards without changes: ${savingStats.cardsWithoutChanges}`);
			console.log(`Cards with pricing data: ${enhancedSummary.cardsWithPricing}`);
			console.log(`Price range: €${pricingStats.minPrice.toFixed(2)} - €${pricingStats.maxPrice.toFixed(2)}`);
			console.log(`Average price: €${pricingStats.avgPrice.toFixed(2)}`);
			console.log(`Errors encountered: ${enhancedSummary.errors.length}`);

			if (enhancedSummary.errors.length > 0) {
				console.log('\nErrors:');
				enhancedSummary.errors.slice(0, 10).forEach((error: string) => console.log(`  - ${error}`));
				if (enhancedSummary.errors.length > 10) {
					console.log(`  ... and ${enhancedSummary.errors.length - 10} more errors`);
				}
			}			
			console.log(`\nEnriched cards with pricing saved by name and faction to: card_db/cards-{name}-{faction}.jsonl files`);

			return {
				totalCards: enhancedSummary.uniqueCards,
				cardsWithPricing: enhancedSummary.cardsWithPricing,
				newCards: savingStats.newCards,
				cardsWithPricingChanges: savingStats.cardsWithPricingChanges,
				cardsWithoutChanges: savingStats.cardsWithoutChanges,
				cards: enrichedCards
			};

		} catch (error) {
			console.error('Filtered scrape with pricing failed:', error);
			throw error;
		}
	}
	
	/**
	 * Get card statistics (pricing data) for specific filters
	 */
	async getCardStatsForFilters(filters: FilterOptions): Promise<CardStatsResult> {
		console.log('📊 Fetching card statistics for filters...');
		console.log(`Applied filters: ${JSON.stringify(filters, null, 2)}`);

		try {
			const statsResult = await this.apiClient.getCardStats(filters);

			if (!statsResult || !statsResult['hydra:member']) {
				console.log('No pricing data found for the given filters');
				return {
					stats: [],
					summary: {
						totalItems: 0,
						cardsWithPricing: 0,
						cardsWithLastSale: 0,
						avgLowerPrice: 0,
						avgLastSale: 0,
						priceRange: { min: 0, max: 0 }
					}
				};
			}

			const stats = statsResult['hydra:member'];
			const cardsWithPricing = stats.filter(stat => stat.lowerPrice > 0);
			const cardsWithLastSale = stats.filter(stat => stat.lastSale > 0);

			const avgLowerPrice = cardsWithPricing.length > 0
				? cardsWithPricing.reduce((sum, stat) => sum + stat.lowerPrice, 0) / cardsWithPricing.length
				: 0;

			const avgLastSale = cardsWithLastSale.length > 0
				? cardsWithLastSale.reduce((sum, stat) => sum + stat.lastSale, 0) / cardsWithLastSale.length
				: 0;

			const summary = {
				totalItems: statsResult['hydra:totalItems'],
				cardsWithPricing: cardsWithPricing.length,
				cardsWithLastSale: cardsWithLastSale.length,
				avgLowerPrice,
				avgLastSale,
				priceRange: cardsWithPricing.length > 0 ? {
					min: Math.min(...cardsWithPricing.map(s => s.lowerPrice)),
					max: Math.max(...cardsWithPricing.map(s => s.lowerPrice))
				} : { min: 0, max: 0 }
			};

			console.log('\n=== Pricing Summary ===');
			console.log(`Total cards: ${summary.totalItems}`);
			console.log(`Cards with pricing: ${summary.cardsWithPricing}`);
			console.log(`Cards with last sale data: ${summary.cardsWithLastSale}`);
			console.log(`Average lower price: €${summary.avgLowerPrice.toFixed(2)}`);
			console.log(`Average last sale: €${summary.avgLastSale.toFixed(2)}`);
			console.log(`Price range: €${summary.priceRange.min.toFixed(2)} - €${summary.priceRange.max.toFixed(2)}`);

			return {
				stats,
				summary
			};

		} catch (error) {
			console.error('Failed to fetch card statistics:', error);
			throw error;
		}
	}

	/**
	 * Calculate pricing statistics from enriched cards
	 */
	private calculatePricingStats(enrichedCards: any[]): any {
		const cardsWithPricing = enrichedCards.filter(card => card.pricing.lowerPrice > 0);

		if (cardsWithPricing.length === 0) {
			return {
				minPrice: 0,
				maxPrice: 0,
				avgPrice: 0,
				totalCardsWithPricing: 0
			};
		}

		const lowerPrices = cardsWithPricing.map(card => card.pricing.lowerPrice);
		const lastSales = cardsWithPricing.filter(card => card.pricing.lastSale > 0).map(card => card.pricing.lastSale);

		const minPrice = Math.min(...lowerPrices);
		const maxPrice = Math.max(...lowerPrices);
		const avgPrice = lowerPrices.reduce((sum, price) => sum + price, 0) / lowerPrices.length;

		// Calculate average last sale price if available
		const avgLastSale = lastSales.length > 0
			? lastSales.reduce((sum, price) => sum + price, 0) / lastSales.length
			: 0;

		return {
			minPrice,
			maxPrice,
			avgPrice,
			avgLastSale,
			totalCardsWithPricing: cardsWithPricing.length,
			totalCardsWithLastSale: lastSales.length
		};
	}
}
export const createScraper = (locale?: string, bearerToken?: string) => new AlteredScraper(locale, bearerToken);

import express, { Request, Response } from 'express';
import cors from 'cors';
import { CardSearcher, SearchFilters, SearchOptions } from '../src/search/search';
import { createScraper } from '../src/market/scraper';
import { getBearerToken } from '../src/config/auth';

const app = express();
app.use(cors());
app.use(express.json()); // Add JSON body parsing
const port: number = 3001;

app.get('/', (req: Request, res: Response) => {
    res.json({
        message: 'Altered Card Search API',
        endpoints: {
            'POST /api/search': {
                description: 'Search for cards with filters',
                body: {
                    filters: {
                        mainCost: 'string (e.g., "2" or "1-3")',
                        mainEffect: 'string (e.g., "draw" or "draw,boost" or "draw+boost")',
                        echoEffect: 'string (same format as mainEffect)',
                        name: 'string (partial match)',
                        faction: 'string (AX, BR, LY, MU, OR, YZ)',
                        rarity: 'string (COMMON, RARE, UNIQUE)'
                    },
                    options: {
                        resultLimit: 'number (0 = unlimited)',
                        sortByPrice: 'boolean (default: true)',
                        inSaleOnly: 'boolean (default: true)'
                    }
                }
            }
        }
    });
});

app.post('/api/search', async (req: Request, res: Response) => {
	try {
		// Extract search filters and options from request body
		const { filters = {}, options = {} }: { 
			filters?: SearchFilters, 
			options?: SearchOptions 
		} = req.body;

		// Create searcher instance
		const searcher = new CardSearcher();

		// Perform search
		const results = await searcher.search(filters, options);

		// Return results
		res.json({
			success: true,
			count: results.length,
			data: results
		});

	} catch (error) {
		console.error('Search API error:', error);
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred',
			count: 0,
			data: []
		});
	}
})

app.post('/api/scrape', async (req: Request, res: Response) => {
	try {
		const {
			RARITY = '',
			CARD_SET = '',
			FACTION = '',
			MAIN_COST = '',
			RECALL_COST = '',
			CARD_NAME = '',
			ONLY_FOR_SALE = true,
			locale = 'en-us' // Default locale
		}: {
			RARITY?: string;
			CARD_SET?: string;
			FACTION?: string;
			MAIN_COST?: string;
			RECALL_COST?: string;
			CARD_NAME?: string;
			ONLY_FOR_SALE?: boolean;
			locale?: string;
		} = req.body;

		// AUTO-CONVERSION TO FILTERS (similar to simple.ts)
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
				filters.mainCost = Array.from({ length: max - min + 1 }, (_, i) => min + i);
			} else {
				filters.mainCost = [Number(MAIN_COST)];
			}
		}

		if (RECALL_COST) {
			if (RECALL_COST.includes('-')) {
				const [min, max] = RECALL_COST.split('-').map(Number);
				filters.recallCost = Array.from({ length: max - min + 1 }, (_, i) => min + i);
			} else {
				filters.recallCost = [Number(RECALL_COST)];
			}
		}
		
		console.log('🚀 Received scrape request with filters:', filters);

		const token = getBearerToken();
		const scraper = createScraper(locale, token);
		
		console.log('💰 Fetching card data with integrated pricing...');
		
		// Run filtered scrape with pricing data integration
		// The result of runFilteredScrapeWithPricing is void, it saves data to files.
		// We can indicate success if no error is thrown.
		await scraper.runFilteredScrapeWithPricing(filters, true);

		res.json({
			success: true,
			message: 'Scrape completed successfully. Data saved to file system.',
			filtersApplied: filters
		});

	} catch (error) {
		console.error('Scrape API error:', error);
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred during scrape',
		});
	}
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

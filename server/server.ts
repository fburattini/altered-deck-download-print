import express, { Request, Response } from 'express';
import cors from 'cors';
import { CardSearcher, SearchFilters, SearchOptions } from '../src/search/search';
import { createScraper } from '../src/market/scraper';
import { getBearerToken } from '../src/config/auth';
import { CardReader } from '../src/db/CardReader'; // Added import for CardReader
import { BookmarkManager } from '../src/db/BookmarkManager'; // Added import for BookmarkManager
import { UserManager } from '../src/db/UserManager'; // Added import for UserManager

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
				body: {					filters: {
						mainCost: 'string (e.g., "2" or "1-3")',
						recallCost: 'string (e.g., "2" or "1-3")',
						mainEffect: 'string (e.g., "draw" or "draw,boost" or "draw+boost")',
						echoEffect: 'string (same format as mainEffect)',
						name: 'string (partial match)',
						faction: 'string (AX, BR, LY, MU, OR, YZ)',
						rarity: 'string (COMMON, RARE, UNIQUE)',
						inSale: 'boolean (true = only cards for sale, false = only cards not for sale)'
					},
					options: {
						resultLimit: 'number (0 = unlimited)',
						sortByPrice: 'boolean (default: true)',
						inSaleOnly: 'boolean (default: true)'
					}
				}
			},
			'POST /api/scrape': {
				description: 'Scrape cards with filters and save to database',
				body: {
					RARITY: 'string (optional)',
					CARD_SET: 'string (optional)',
					FACTION: 'string (optional)',
					MAIN_COST: 'string (optional, e.g., "2" or "1-3")',
					RECALL_COST: 'string (optional, e.g., "2" or "1-3")',
					CARD_NAME: 'string (optional)',
					ONLY_FOR_SALE: 'boolean (default: true)',
					locale: 'string (default: "en-us")',
					bearerToken: 'string (optional, uses config if not provided)'
				}
			},
			'GET /api/cards-in-db': {
				description: 'Get all card name-faction combinations from database'
			},
			'POST /api/bookmarks/toggle': {
				description: 'Toggle bookmark status for a card',
				body: {
					userId: 'string (required)',
					cardId: 'string (required)',
					cardName: 'string (required)',
					faction: 'string (required)'
				}
			},
			'GET /api/bookmarks/:userId': {
				description: 'Get all bookmarks for a user'
			},
			'GET /api/watchlist/:userId': {
				description: 'Get all watchlist items for a user'
			},
			'POST /api/watchlist/toggle': {
				description: 'Toggle watchlist status for a card',
				body: {
					userId: 'string (required)',
					cardName: 'string (required)',
					faction: 'string (required)',
					mainCost: 'number[] (required)'
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
			locale = 'en-us', // Default locale
			bearerToken
		}: {
			RARITY?: string;
			CARD_SET?: string;
			FACTION?: string;
			MAIN_COST?: string;
			RECALL_COST?: string;
			CARD_NAME?: string;
			ONLY_FOR_SALE?: boolean;
			locale?: string;
			bearerToken?: string;
		} = req.body;

		// AUTO-CONVERSION TO FILTERS (similar to simple.ts)
		const filters: any = {};

		filters.inSale = true;
		filters.rarity = ['UNIQUE']
		if (CARD_SET) filters.cardSet = [CARD_SET];
		if (FACTION) filters.factions = [FACTION];
		if (CARD_NAME) filters.cardName = CARD_NAME;

		if(filters.cardName && filters.cardName.includes(' ')) {
			filters.cardName = filters.cardName.split(' ').at(-1)
		}

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

		// Use bearerToken from request body, fallback to getBearerToken() if not provided
		const token = bearerToken || getBearerToken();
		console.log('🔑 Using token from:', bearerToken ? 'request body' : 'config/auth');
		const scraper = createScraper(locale, token);
		console.log('💰 Fetching card data with integrated pricing...');

		// Run filtered scrape with pricing data integration
		const scrapeResult = await scraper.runFilteredScrapeWithPricing(filters, false);

		res.json({
			success: true,
			message: 'Scrape completed successfully. Data saved to file system.',
			filtersApplied: filters,
			cardsFound: scrapeResult.totalCards,
			cardsWithPricing: scrapeResult.cardsWithPricing,
			cardsWithPricingChanges: scrapeResult.cardsWithPricingChanges,
			cardsWithoutChanges: scrapeResult.cardsWithoutChanges,
			newCards: scrapeResult.newCards,
			cards: scrapeResult.cards
		});

	} catch (error) {
		console.error('Scrape API error:', error);
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred during scrape',
		});
	}
});

// New endpoint to get all card name-faction combinations
app.get('/api/cards-in-db', async (req: Request, res: Response) => {
	try {
		const cardReader = new CardReader();
		const nameFactions = await cardReader.getCardNameFactions();

		res.json({
			success: true,
			count: nameFactions.length,
			data: nameFactions
		});

	} catch (error) {
		console.error('API error fetching card name-factions:', error);
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred while fetching card name-factions',
			count: 0,
			data: []
		});
	}
});

// Bookmark toggle endpoint
app.post('/api/bookmarks/toggle', async (req: Request, res: Response) => {
	try {
		const { userId, cardId, cardName, faction }: {
			userId: string;
			cardId: string;
			cardName: string;
			faction: string;
		} = req.body;

		// Validate required fields
		if (!userId || !cardId || !cardName || !faction) {
			res.status(400).json({
				success: false,
				error: 'Missing required fields: userId, cardId, cardName, and faction are required'
			});
			return
		}

		const bookmarkManager = new BookmarkManager();

		// Create a minimal card object for the toggle operation
		const cardDetail = {
			id: cardId,
			name: cardName,
			mainFaction: {
				reference: faction
			}
		} as any; // Using 'as any' since we only need these specific fields

		// Toggle the bookmark
		const isNowBookmarked = await bookmarkManager.toggleBookmark(userId, cardDetail);

		res.json({
			success: true,
			isBookmarked: isNowBookmarked,
			message: isNowBookmarked 
				? `Added bookmark for ${cardName}` 
				: `Removed bookmark for ${cardName}`
		});

	} catch (error) {
		console.error('Bookmark toggle API error:', error);
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred while toggling bookmark'
		});
	}
});

// Get user bookmarks endpoint
app.get('/api/bookmarks/:userId', async (req: Request, res: Response) => {
	try {
		const { userId } = req.params;

		if (!userId) {
			res.status(400).json({
				success: false,
				error: 'Missing userId parameter'
			});
			return
		}

		const bookmarkManager = new BookmarkManager();
		const bookmarks = await bookmarkManager.getUserBookmarks(userId);

		res.json({
			success: true,
			userId,
			count: bookmarks.length,
			bookmarks
		});

	} catch (error) {
		console.error('Get bookmarks API error:', error);
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred while fetching bookmarks'
		});
	}
});

// Get user watchlist endpoint
app.get('/api/watchlist/:userId', async (req: Request, res: Response) => {
	try {
		const { userId } = req.params;

		if (!userId) {
			res.status(400).json({
				success: false,
				error: 'Missing userId parameter'
			});
			return;
		}

		const userManager = new UserManager();
		const watchlist = await userManager.getUserWatchlist(userId);

		res.json({
			success: true,
			userId,
			count: watchlist.length,
			watchlist
		});

	} catch (error) {
		console.error('Get watchlist API error:', error);
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred while fetching watchlist'
		});
	}
});

// Watchlist toggle endpoint
app.post('/api/watchlist/toggle', async (req: Request, res: Response) => {
	try {
		const { userId, cardName, faction, mainCost }: {
			userId: string;
			cardName: string;
			faction: string;
			mainCost: number[];
		} = req.body;

		// Validate required fields
		if (!userId || !cardName || !faction || !mainCost) {
			res.status(400).json({
				success: false,
				error: 'Missing required fields: userId, cardName, faction, and mainCost are required'
			});
			return;
		}

		const userManager = new UserManager();

		// Create watchlist entry object
		const watchlistEntry = {
			cardName,
			faction,
			mainCost
		};

		// Check current status before toggling
		const wasInWatchlist = await userManager.isCardInWatchlist(userId, cardName, faction);

		// Toggle the watchlist
		const updatedUser = await userManager.toggleWatchlist(userId, watchlistEntry);

		if (!updatedUser) {
			res.status(500).json({
				success: false,
				error: 'Failed to toggle watchlist item'
			});
			return;
		}

		const isNowInWatchlist = !wasInWatchlist;

		res.json({
			success: true,
			isInWatchlist: isNowInWatchlist,
			message: isNowInWatchlist 
				? `Added ${cardName} to watchlist` 
				: `Removed ${cardName} from watchlist`
		});

	} catch (error) {
		console.error('Watchlist toggle API error:', error);
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred while toggling watchlist'
		});
	}
});

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
});

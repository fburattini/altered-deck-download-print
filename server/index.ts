import express, { Request, Response } from 'express';
import cors from 'cors';
import { CardSearcher, SearchFilters, SearchOptions } from '../src/search/search';

const app = express();
app.use(cors());
app.use(express.json()); // Add JSON body parsing
const port: number = 3000;

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

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

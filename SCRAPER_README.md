# Altered Card Scraper

This project includes a comprehensive scraper for the Altered TCG API that can extract all unique cards while respecting the API's 1000-item limit.

## What We Built

### 1. API Client (`src/market/api-client.ts`)
- `AlteredApiClient` class that handles all API interactions
- Proper handling of the `@id` field for card details (removes `/cards/` prefix)
- Filter combination generation to stay under API limits
- Built-in error handling and logging

### 2. Scraper (`src/market/scraper.ts`)
- `AlteredScraper` class with multiple scraping modes:
  - `runTestScrape()` - Test with limited data
  - `analyzeFilters()` - Analyze API response sizes
  - `runFullScrape()` - Complete scrape of all unique cards

### 3. CLI Integration (`src/cli.ts`)
- Added scraper commands to the existing CLI menu
- Options 5, 6, and 7 for different scraper functions

### 4. Standalone Scripts
- `src/scrape.ts` - Direct script runner
- `src/test-api.ts` - Simple API test
- `src/quick-test.ts` - Quick verification test

## Key Features

### Smart Filter Strategy
The scraper uses a narrow filtering strategy to avoid the API's 1000-item limit:
- Always includes `rarity=UNIQUE`
- Filters by single `cardSet` (CORE or ALIZE)
- Filters by single `faction` (AX, BR, LY, MU, OR, YZ)
- Filters by specific `mainCost` and `recallCost` combinations
- Total combinations: 2 cardSets × 6 factions × 11 costs × 11 costs = 1,452 API calls

### Duplicate Prevention
- Uses a Map to track unique cards by ID
- Avoids re-fetching card details for already processed cards

### Error Handling & Rate Limiting
- **Automatic retry with exponential backoff** for HTTP 429 (Too Many Requests) errors
- **Up to 3 retry attempts** per failed request with increasing delays
- **Smart delay management**:
  - 500-1000ms delay between filter combination requests
  - 200-400ms delay between individual card detail requests
  - Extended delays when rate limits are encountered
- Continues processing even if individual cards fail
- Logs all errors for review
- Provides comprehensive summary of results

### Checkpoint System
- **Automatic progress saving** every 10 processed combinations
- **Resume functionality** to continue from where you left off
- **Separate data files**:
  - `checkpoints_db/scrape-checkpoint.json` - Progress tracking (lightweight)
  - `checkpoints_db/altered-cards-latest.jsonl` - Current card data (updated on each checkpoint)
- **Error recovery** - Checkpoints saved on errors to prevent data loss

## New Feature: Filtered Scraping

The scraper now supports focused, filtered scraping to allow users to query specific subsets of cards instead of always running the comprehensive full scrape. This is much faster for targeted searches.

### Benefits of Filtered Scraping

- **Much faster execution** - Only scrapes cards matching your criteria
- **Reduced API calls** - Stays well within rate limits
- **Targeted results** - Get exactly the cards you're interested in
- **Custom file naming** - Results saved with filter-specific filenames
- **Checkpoint support** - Resume filtered scrapes from where you left off

### Usage Options

#### Via CLI (Interactive)
```bash
npm run cli
# Select option 8: "Run filtered card scrape"
# Follow the interactive prompts to configure your filters
```

#### Via Direct Script (Command Line)
```bash
# Examples of filtered scraping
npm run scrape filter --rarity UNIQUE --factions AX,BR --mainCost 1,2,3

npm run scrape filter --cardSet CORE --rarity UNIQUE,RARE --inSale true

npm run scrape filter --factions LY --forestPower 2,3,4 --mountainPower 0,1
```

#### Programmatic Usage
```typescript
import { createScraper } from './market/scraper';

const scraper = createScraper();

// Example: Get all unique AX faction cards with main cost 1-3
await scraper.runFilteredScrape({
    rarity: ['UNIQUE'],
    factions: ['AX'],
    mainCost: [1, 2, 3],
    inSale: true
});
```

### Available Filters

- **rarity**: COMMON, RARE, UNIQUE
- **cardSet**: CORE, ALIZE
- **factions**: AX, BR, LY, MU, OR, YZ
- **mainCost**: 0-10 (card's main cost)
- **recallCost**: 0-10 (card's recall cost)
- **forestPower**: 0-10 (forest power stat)
- **mountainPower**: 0-10 (mountain power stat)
- **oceanPower**: 0-10 (ocean power stat)
- **inSale**: true/false (only cards currently for sale)

### Output Files

Filtered scrapes create uniquely named files based on your filters:
- `card_db/altered-cards-filtered-{filter-description}-{timestamp}.json` - Card data
- `card_db/scrape-summary-filtered-{filter-description}-{timestamp}.json` - Scrape summary
- `checkpoints_db/filtered-cards-latest-{filter-key}.jsonl` - Latest cards (for checkpoints)
- `checkpoints_db/filtered-scrape-checkpoint-{filter-key}.json` - Checkpoint data

### Performance Comparison

| Scrape Type | API Calls | Estimated Time | Use Case |
|-------------|-----------|----------------|-----------|
| Full Scrape | ~1,452 | 2-3 minutes | Complete card database |
| Filtered Scrape | 1-10 | 5-30 seconds | Specific card queries |

### Example Use Cases

1. **Get all unique cards from a specific faction**:
   ```bash
   npm run scrape filter --rarity UNIQUE --factions AX
   ```

2. **Find low-cost cards for budget builds**:
   ```bash
   npm run scrape filter --mainCost 1,2 --recallCost 0,1
   ```

3. **Search for high-power forest cards**:
   ```bash
   npm run scrape filter --forestPower 4,5,6,7,8,9,10
   ```

4. **Get all cards from the latest set**:
   ```bash
   npm run scrape filter --cardSet ALIZE
   ```

## Usage

### Via CLI
```bash
npm run cli
# Select option 5 (Test), 6 (Analyze), or 7 (Full scrape)
```

### Via Direct Script
```bash
# Test scrape
npm run scrape test

# Analyze filters
npm run scrape analyze

# Full scrape (Warning: This will make ~1,452 API calls)
npm run scrape full
```

### Programmatic Usage
```typescript
import { createScraper } from './market/scraper';

const scraper = createScraper();

// Test scrape
await scraper.runTestScrape();

// Full scrape
await scraper.runFullScrape();
```

## Output

The scraper saves data to the `data/` directory:
- `altered-cards-[timestamp].json` - All card details
- `scrape-summary-[timestamp].json` - Scraping summary and statistics

## API Details

### Card Collection Endpoint
```
GET https://api.altered.gg/cards
```
Returns `CardCollection` type with `hydra:member` array containing card summaries.

### Card Detail Endpoint  
```
GET https://api.altered.gg/cards/{cardId}
```
Returns `CardDetail` type with complete card information.

### Important Notes
1. Use `@id` field (not `id`) to get card details
2. Strip `/cards/` prefix from `@id` before making detail API call
3. API limit is 1000 total items, but returns max 36 per page
4. Narrow filtering is essential to get complete data

## Example Card Data Structure

```typescript
{
  "id": "5B4K5K7QZE96ATRQ9H4HVMSGRW",
  "name": "Kelon Elemental", 
  "@id": "/cards/ALT_CORE_B_AX_04_U_109",
  "cardType": { "name": "Character" },
  "elements": {
    "MAIN_COST": "2",
    "RECALL_COST": "1", 
    "MOUNTAIN_POWER": "0",
    "OCEAN_POWER": "2",
    "FOREST_POWER": "2",
    "MAIN_EFFECT": "...",
    "ECHO_EFFECT": "..."
  }
}
```

## Performance Considerations

- Full scrape will make ~1,452 API calls
- Includes 100ms delay between requests to be respectful
- Estimated time: ~2-3 minutes for complete scrape
- Results in comprehensive database of all unique cards

The scraper is ready to use and will provide a complete dataset of all unique Altered cards with their full details, images, and game mechanics.

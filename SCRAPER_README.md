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
  - `data/scrape-checkpoint.json` - Progress tracking (lightweight)
  - `data/altered-cards-latest.jsonl` - Current card data (updated on each checkpoint)
- **Error recovery** - Checkpoints saved on errors to prevent data loss

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

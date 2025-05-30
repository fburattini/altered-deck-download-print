#!/usr/bin/env npx tsx

import { AlteredApiClient } from '../market/api-client';
import { getBearerToken } from '../config/auth';

const testFilteredScrape = async () => {
    console.log('=== Testing Filtered Scrape Functionality ===');
    
    const apiClient = new AlteredApiClient('en-us', getBearerToken());
    
    console.log('\n1. Testing filtered scrape with specific criteria...');
    
    // Test with a focused filter that should return a manageable number of cards
    const testFilters = {
        rarity: ['UNIQUE'],
        cardSet: ['CORE'],
        factions: ['AX'],
        mainCost: [2],
        recallCost: [1],
        inSale: true,
        itemsPerPage: 10
    };
    
    console.log('Test filters:', JSON.stringify(testFilters, null, 2));
    
    const result = await apiClient.scrapeWithFilters(testFilters, false, 'test');
    
    console.log(`\nFiltered scrape result: ${result.cards.length} cards found`);
    console.log(`Summary:`, result.summary);
    
    if (result.cards.length > 0) {
        console.log('\nFirst few cards:');
        result.cards.slice(0, 3).forEach(card => {
            console.log(`  - ${card.name} (${card.id}) - ${card.cardType.name}`);
            console.log(`    Main Cost: ${card.elements.MAIN_COST}, Recall Cost: ${card.elements.RECALL_COST}`);
            console.log(`    Powers: Forest ${card.elements.FOREST_POWER}, Mountain ${card.elements.MOUNTAIN_POWER}, Ocean ${card.elements.OCEAN_POWER}`);
        });
    }
    
    console.log('\n=== Filtered Scrape Test Complete ===');
};

testFilteredScrape().catch(console.error);

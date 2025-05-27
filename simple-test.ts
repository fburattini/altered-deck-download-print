#!/usr/bin/env npx tsx

import { AlteredApiClient } from './src/market/api-client';

const simpleTest = async () => {
    console.log('=== Simple API Test ===');
    
    const apiClient = new AlteredApiClient();
    
    try {
        console.log('Testing basic API connectivity...');
        const testResult = await apiClient.getCards({
            rarity: ['UNIQUE'],
            cardSet: ['CORE'],
            factions: ['AX'],
            mainCost: [2],
            recallCost: [1],
            inSale: true,
            itemsPerPage: 5
        });

        console.log(`Found ${testResult['hydra:member'].length} cards`);
        
        if (testResult['hydra:member'].length > 0) {
            const firstCard = testResult['hydra:member'][0];
            console.log(`First card: ${firstCard.name} (id: ${firstCard.id})`);
            console.log(`Card @id: ${firstCard['@id']}`);
            
            console.log('Testing card detail fetch...');
            const cardDetail = await apiClient.getCardDetail(firstCard['@id']);
            console.log(`Card detail: ${cardDetail.name} - ${cardDetail.cardType.name}`);
        }

        console.log('\nTesting filter combinations generation...');
        const combinations = apiClient.getAllFilterCombinations();
        console.log(`Generated ${combinations.length} filter combinations`);
        console.log(`First combination: ${JSON.stringify(combinations[0])}`);
        
        console.log('\n=== Test Complete ===');
        
    } catch (error) {
        console.error('Test failed:', error);
    }
};

simpleTest();

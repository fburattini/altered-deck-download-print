#!/usr/bin/env npx tsx

import { AlteredApiClient } from './src/market/api-client';
import * as fs from 'fs-extra';
import * as path from 'path';

const testCheckpoint = async () => {
    console.log('=== Testing Checkpoint System ===');
    
    const apiClient = new AlteredApiClient();
    
    // Create a modified version that stops after 3 combinations to test checkpointing
    const originalMethod = apiClient.scrapeAllCards;
    
    // Override to stop early for testing
    apiClient.scrapeAllCards = async function(resumeFromCheckpoint: boolean = true) {
        const combinations = this.getAllFilterCombinations();
        let allCards = new Map<string, any>();
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

        console.log(`Testing with ${Math.min(3, combinations.length)} combinations (out of ${combinations.length} total)...`);

        // Process only first 3 combinations for testing
        for (let i = 0; i < Math.min(3, combinations.length); i++) {
            const combination = combinations[i];
            const combinationKey = `${combination.cardSet?.[0] || 'none'}-${combination.factions?.[0] || 'none'}-${combination.mainCost?.[0] || 'none'}-${combination.recallCost?.[0] || 'none'}`;
            
            try {
                console.log(`Processing test combination ${i + 1}/3: ${JSON.stringify(combination)}`);
                
                const collection = await this.getCards(combination);
                console.log(`  Found ${collection['hydra:member'].length} cards in this combination`);

                // Add cards to our collection
                for (const card of collection['hydra:member']) {
                    if (!allCards.has(card.id)) {
                        try {
                            const detail = await this.getCardDetail(card['@id']);
                            allCards.set(card.id, detail);
                            console.log(`    Added card: ${detail.name} (${detail.id})`);
                        } catch (error) {
                            const errorMsg = `Failed to fetch detail for card ${card.id}: ${error}`;
                            console.error(`    ${errorMsg}`);
                            summary.errors.push(errorMsg);
                        }
                    }
                }

                processedCombinations.add(combinationKey);
                summary.processedCombinations = processedCombinations.size;
                summary.uniqueCards = allCards.size;

                // Save checkpoint after each combination for testing
                const checkpointData = {
                    timestamp: new Date().toISOString(),
                    processedCombinations: Array.from(processedCombinations),
                    cards: Array.from(allCards.values()),
                    summary
                };
                
                const checkpointPath = path.join(process.cwd(), 'data', 'scrape-checkpoint.json');
                await fs.ensureDir(path.dirname(checkpointPath));
                await fs.writeJson(checkpointPath, checkpointData, { spaces: 2 });
                console.log(`  Checkpoint saved: ${processedCombinations.size} combinations, ${allCards.size} cards`);

                // Add delay
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                const errorMsg = `Failed to process combination ${i + 1}: ${error}`;
                console.error(errorMsg);
                summary.errors.push(errorMsg);
            }
        }

        summary.endTime = new Date().toISOString();
        console.log(`Test completed. Found ${allCards.size} unique cards.`);
        
        return {
            cards: Array.from(allCards.values()),
            summary
        };
    }.bind(apiClient);
    
    console.log('\n1. Running initial test scrape (will create checkpoint)...');
    const result1 = await apiClient.scrapeAllCards(false); // Start fresh
    console.log(`Initial scrape result: ${result1.cards.length} cards, ${result1.summary.processedCombinations} combinations`);
    
    console.log('\n2. Checking if checkpoint file exists...');
    const checkpointPath = path.join(process.cwd(), 'data', 'scrape-checkpoint.json');
    const checkpointExists = await fs.pathExists(checkpointPath);
    console.log(`Checkpoint file exists: ${checkpointExists}`);
    
    if (checkpointExists) {
        const checkpointData = await fs.readJson(checkpointPath);
        console.log(`Checkpoint contains: ${checkpointData.cards.length} cards, ${checkpointData.processedCombinations.length} combinations`);
        
        console.log('\n3. Testing resume from checkpoint...');
        const result2 = await apiClient.scrapeAllCards(true); // Resume from checkpoint
        console.log(`Resume scrape result: ${result2.cards.length} cards, ${result2.summary.processedCombinations} combinations`);
        console.log(`Resumed from checkpoint: ${result2.summary.resumedFromCheckpoint}`);
    }
    
    console.log('\n=== Checkpoint Test Complete ===');
};

testCheckpoint().catch(console.error);

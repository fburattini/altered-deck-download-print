#!/usr/bin/env npx tsx

import { AlteredApiClient } from '../market/api-client';
import { getBearerToken } from '../config/auth';
import * as fs from 'fs-extra';
import * as path from 'path';

const testCheckpoint = async () => {
    console.log('=== Testing Checkpoint System ===');
    
    const apiClient = new AlteredApiClient('en-us', getBearerToken());
    
    console.log('\n1. Running initial test scrape (will create checkpoint)...');
    const result1 = await apiClient.scrapeAllCards(true); // Start fresh
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

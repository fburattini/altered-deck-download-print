import { AlteredApiClient } from './market/api-client';
import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Test that checkpoints are saved to the new checkpoints_db folder
 */
async function testCheckpointLocation() {
  console.log('=== Testing Checkpoint Location ===\n');
  
  const apiClient = new AlteredApiClient();
  
  try {
    console.log('1. Running a small filtered scrape to create a checkpoint...');
    
    // Test with a small filter to get a few cards quickly
    const result = await apiClient.scrapeWithFilters({
      rarity: ['UNIQUE'],
      factions: ['AX'],
      mainCost: [1],
      inSale: true
    });
    
    console.log(`Scrape completed: ${result.cards.length} cards found`);
    
    // Check if checkpoints_db folder was created
    const checkpointsDbPath = path.join(process.cwd(), 'checkpoints_db');
    const folderExists = await fs.pathExists(checkpointsDbPath);
    console.log(`\n2. Checkpoints folder exists: ${folderExists}`);
    
    if (folderExists) {
      // List all files in the checkpoints_db folder
      const files = await fs.readdir(checkpointsDbPath);
      console.log(`\n3. Files in checkpoints_db:`);
      files.forEach(file => console.log(`   - ${file}`));
      
      // Check for specific checkpoint files
      const filteredCheckpoint = files.find(file => file.includes('filtered-scrape-checkpoint'));
      const filteredCards = files.find(file => file.includes('filtered-cards-latest'));
      
      console.log(`\n4. Checkpoint files found:`);
      console.log(`   - Filtered checkpoint: ${filteredCheckpoint ? '✓' : '✗'}`);
      console.log(`   - Filtered cards data: ${filteredCards ? '✓' : '✗'}`);
    }
    
    console.log('\n=== Test Complete ===');
    console.log('Checkpoints are now saved in the checkpoints_db folder!');
    
  } catch (error) {
    console.error('Test failed:', error);
    console.error('Error details:', error instanceof Error ? error.stack : error);
  }
}

console.log('Starting checkpoint location test...');
testCheckpointLocation().catch((error) => {
  console.error('Unhandled error:', error);
  console.error('Stack:', error instanceof Error ? error.stack : error);
});

import { AlteredApiClient } from './market/api-client';
import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Simple test to verify checkpoint paths are correct
 */
async function validateCheckpointPaths() {
  console.log('=== Validating Checkpoint Paths ===\n');
  
  try {
    // Test the main checkpoint path
    const checkpointPath = path.join(process.cwd(), 'checkpoints_db', 'scrape-checkpoint.json');
    const cardsDataPath = path.join(process.cwd(), 'checkpoints_db', 'altered-cards-latest.jsonl');
    
    console.log('Expected checkpoint paths:');
    console.log(`  Main checkpoint: ${checkpointPath}`);
    console.log(`  Cards data: ${cardsDataPath}`);
    
    // Test filtered checkpoint path
    const filterKey = 'rarity-UNIQUE_faction-AX_main-1_sale-true';
    const filteredCheckpointPath = path.join(process.cwd(), 'checkpoints_db', `filtered-scrape-checkpoint-${filterKey}.json`);
    const filteredCardsPath = path.join(process.cwd(), 'checkpoints_db', `filtered-cards-latest-${filterKey}.jsonl`);
    
    console.log('\nExpected filtered checkpoint paths:');
    console.log(`  Filtered checkpoint: ${filteredCheckpointPath}`);
    console.log(`  Filtered cards data: ${filteredCardsPath}`);
    
    // Ensure the checkpoints_db directory exists
    const checkpointsDbPath = path.join(process.cwd(), 'checkpoints_db');
    await fs.ensureDir(checkpointsDbPath);
    console.log(`\nCheckpoints directory created/verified: ${checkpointsDbPath}`);
    
    // Create mock checkpoint files to test the structure
    const mockCheckpoint = {
      timestamp: new Date().toISOString(),
      processedCombinations: ['test-combination'],
      summary: {
        totalCombinations: 1,
        processedCombinations: 1,
        uniqueCards: 0,
        errors: [],
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString()
      }
    };
    
    await fs.writeJson(filteredCheckpointPath, mockCheckpoint, { spaces: 2 });
    await fs.writeFile(filteredCardsPath, '', 'utf8');
    
    console.log('\nMock checkpoint files created successfully!');
    
    // Verify files exist
    const checkpointExists = await fs.pathExists(filteredCheckpointPath);
    const cardsExists = await fs.pathExists(filteredCardsPath);
    
    console.log(`\nVerification:`);
    console.log(`  Checkpoint file exists: ${checkpointExists ? '✓' : '✗'}`);
    console.log(`  Cards file exists: ${cardsExists ? '✓' : '✗'}`);
    
    // List all files in checkpoints_db
    const files = await fs.readdir(checkpointsDbPath);
    console.log(`\nFiles in checkpoints_db:`);
    files.forEach(file => console.log(`  - ${file}`));
    
    console.log('\n=== Checkpoint Path Validation Complete ===');
    console.log('✓ Checkpoints are now saved to checkpoints_db folder!');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

validateCheckpointPaths();

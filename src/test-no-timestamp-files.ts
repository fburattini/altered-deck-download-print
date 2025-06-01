import { AlteredScraper } from './market/scraper';
import * as fs from 'fs-extra';
import * as path from 'path';

async function testNoTimestampFiles() {
  console.log('Testing that timestamp-based files are no longer generated...');
  
  // Get initial state of card_db folder
  const cardDbPath = path.join(process.cwd(), 'card_db');
  await fs.ensureDir(cardDbPath);
  
  const initialFiles = await fs.readdir(cardDbPath);
  console.log(`Initial files in card_db: ${initialFiles.length}`);
  
  // Run a small filtered scrape
  const scraper = new AlteredScraper('en-us');
  
  try {
    console.log('Running filtered scrape...');
    await scraper.runFilteredScrape({
      rarity: ['UNIQUE'],
      factions: ['AX'],
      mainCost: [1],
      inSale: true,
      itemsPerPage: 5
    }, false); // Don't resume from checkpoint
    
    // Check final state
    const finalFiles = await fs.readdir(cardDbPath);
    const newFiles = finalFiles.filter(file => !initialFiles.includes(file));
    
    console.log(`\nFinal files in card_db: ${finalFiles.length}`);
    console.log(`New files created: ${newFiles.length}`);
    
    if (newFiles.length > 0) {
      console.log('New files:');
      newFiles.forEach(file => console.log(`  - ${file}`));
    }
    
    // Check for timestamp patterns in new files
    const timestampFiles = newFiles.filter(file => 
      file.includes('2025-') || file.includes('filtered-') && file.includes('.json')
    );
    
    if (timestampFiles.length === 0) {
      console.log('✅ SUCCESS: No timestamp-based files were generated!');
    } else {
      console.log('❌ PROBLEM: Timestamp-based files still being generated:');
      timestampFiles.forEach(file => console.log(`  - ${file}`));
    }
    
    // Check for name+faction files
    const nameBasedFiles = newFiles.filter(file => 
      file.startsWith('cards-') && file.endsWith('.jsonl') && !file.includes('2025-')
    );
    
    if (nameBasedFiles.length > 0) {
      console.log('✅ Name+faction based files found:');
      nameBasedFiles.forEach(file => console.log(`  - ${file}`));
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testNoTimestampFiles().catch(console.error);

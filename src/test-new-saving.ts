import { AlteredApiClient } from './market/api-client';

/**
 * Test the new card saving functionality
 */
async function testNewSaving() {
  console.log('=== Testing New Card Saving Functionality ===\n');
  
  const apiClient = new AlteredApiClient();
  
  try {
    console.log('1. Testing filtered scrape with new saving...');
    
    // Test with a small filter to get a few cards
    const result = await apiClient.scrapeWithFilters({
      rarity: ['UNIQUE'],
      factions: ['AX'],
      mainCost: [1],
      forestPower: [1],
      mountainPower: [1],
      oceanPower: [1],
      inSale: true
    });
    
    console.log(`\nScrape completed:`);
    console.log(`- Found ${result.cards.length} cards`);
    console.log(`- Processed ${result.summary.processedCombinations} combinations`);
    console.log(`- Errors: ${result.summary.errors.length}`);
    
    if (result.summary.errors.length > 0) {
      console.log('\nErrors encountered:');
      result.summary.errors.slice(0, 3).forEach((error: string) => console.log(`  - ${error}`));
    }
    
    console.log('\n=== Test Complete ===');
    console.log('Check the card_db directory for new files organized by card name and faction!');
    
  } catch (error) {
    console.error('Test failed:', error);
    console.error('Error details:', error instanceof Error ? error.stack : error);
  }
}

console.log('Starting test...');
testNewSaving().catch((error) => {
  console.error('Unhandled error:', error);
  console.error('Stack:', error instanceof Error ? error.stack : error);
});

import { AlteredApiClient } from './market/api-client';

const testApi = async () => {
  console.log('Testing Altered API...');
  
  try {
    const client = new AlteredApiClient();
    
    // Test basic API call
    console.log('Making test API call...');
    const result = await client.getCards({
      rarity: ['UNIQUE'],
      itemsPerPage: 5,
      locale: 'en-us'
    });
    
    console.log(`Success! Found ${result['hydra:member'].length} cards`);
    console.log(`Total items: ${result['hydra:totalItems']}`);
    
    // Show first card
    if (result['hydra:member'].length > 0) {
      const firstCard = result['hydra:member'][0];
      console.log(`First card: ${firstCard.name} (${firstCard.id})`);
      console.log(`Card @id: ${firstCard['@id']}`);
      
      // Test card detail
      console.log('Getting card detail...');
      const detail = await client.getCardDetail(firstCard['@id']); // Use @id field
      console.log(`Card detail: ${detail.name} - ${detail.cardType.name}`);
      console.log(`Main Cost: ${detail.elements.MAIN_COST}, Recall Cost: ${detail.elements.RECALL_COST}`);
    }
    
  } catch (error) {
    console.error('API test failed:', error);
  }
};

testApi();

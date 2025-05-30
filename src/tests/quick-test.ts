import { AlteredApiClient } from '../market/api-client';
import { getBearerToken } from '../config/auth';

const quickTest = async () => {
  console.log('Quick API test...');
  
  const client = new AlteredApiClient('en-us', getBearerToken());
  
  // Get a small batch
  const result = await client.getCards({
    rarity: ['UNIQUE'],
    cardSet: ['CORE'], 
    factions: ['AX'],
    mainCost: [2],
    recallCost: [1],
    itemsPerPage: 3
  });
  
  console.log(`Found ${result['hydra:member'].length} cards`);
  
  // Get details for just one card
  if (result['hydra:member'].length > 0) {
    const card = result['hydra:member'][0];
    console.log(`Getting details for: ${card.name}`);
    const detail = await client.getCardDetail(card['@id']);
    console.log(`Success: ${detail.name} - ${detail.cardType.name}`);
  }
  
  console.log('Test completed successfully!');
};

quickTest().catch(console.error);

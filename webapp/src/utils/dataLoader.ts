import { Card } from '../types';
import { searchAPI, APISearchResponse } from '../services/searchAPI';

export interface DataLoaderResult {
  cards: Card[];
  fileCount: number;
  cardCount: number;
  errors: string[];
}

// List of JSONL files in the card_db directory
const CARD_DATA_FILES = [
  'altered-cards-with-pricing-filtered-rarity-UNIQUE_faction-BR_main-1-2_sale-true_name-issun-2025-06-01T09-24-32-761Z.jsonl',
  'altered-cards-with-pricing-filtered-rarity-UNIQUE_faction-BR_main-2_sale-true_name-ozma-2025-06-01T09-10-15-156Z.jsonl',
  'altered-cards-with-pricing-filtered-rarity-UNIQUE_faction-LY_main-2-3_sale-true_name-cloth-2025-06-01T14-41-28-562Z.jsonl',
  'altered-cards-with-pricing-filtered-rarity-UNIQUE_faction-LY_main-2-3_sale-true_name-nisse-2025-06-01T14-16-55-364Z.jsonl',
  'altered-cards-with-pricing-filtered-rarity-UNIQUE_faction-LY_main-2_sale-true_name-trickster-2025-06-01T14-32-13-087Z.jsonl',
  'altered-cards-with-pricing-filtered-rarity-UNIQUE_faction-LY_main-4_sale-true_name-nisse-2025-06-01T14-24-38-179Z.jsonl',
  'altered-cards-with-pricing-filtered-rarity-UNIQUE_faction-YZ_main-1_sale-true_name-disciple-2025-05-31T15-30-12-978Z.jsonl',
  'altered-cards-with-pricing-filtered-rarity-UNIQUE_faction-YZ_main-2_sale-true_name-baba_yaga-2025-05-31T15-20-23-123Z.jsonl',
  'altered-cards-with-pricing-filtered-rarity-UNIQUE_faction-YZ_main-2_sale-true_name-disciple-2025-05-31T15-32-45-148Z.jsonl',
  'altered-cards-with-pricing-filtered-rarity-UNIQUE_faction-YZ_main-2_sale-true_name-hathor-2025-05-31T15-02-35-522Z.jsonl',
  'altered-cards-with-pricing-filtered-rarity-UNIQUE_faction-YZ_main-2_sale-true_name-pamola-2025-05-31T15-59-24-730Z.jsonl',
  'altered-cards-with-pricing-filtered-rarity-UNIQUE_faction-YZ_main-2_sale-true_name-snowball-2025-05-31T15-23-19-109Z.jsonl',
  'altered-cards-with-pricing-filtered-rarity-UNIQUE_faction-YZ_main-3-4_sale-true_name-nyala-2025-06-01T09-07-58-771Z.jsonl',
  'altered-cards-with-pricing-filtered-rarity-UNIQUE_faction-YZ_main-3_sale-true_name-monolith_legate-2025-05-31T14-38-54-971Z.jsonl',
  'altered-cards-with-pricing-filtered-rarity-UNIQUE_faction-YZ_main-4_sale-true_name-aroro-2025-05-31T14-56-34-995Z.jsonl',
];

/**
 * Parse a JSONL file content into an array of cards
 */
const parseJsonlContent = (content: string): Card[] => {
  const cards: Card[] = [];
  const lines = content.split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    try {
      const cardData = JSON.parse(line);
      
      // Transform the raw card data into our Card interface
      const card: Card = {
        id: cardData.id || cardData.reference || '',
        name: cardData.name || '',
        '@id': cardData['@id'] || '',
        '@context': cardData['@context'] || '',
        '@type': cardData['@type'] || '',
        cardType: cardData.cardType || {
          '@id': '',
          '@type': 'CardType',
          reference: '',
          id: '',
          name: ''
        },
        cardSubTypes: cardData.cardSubTypes || [],
        cardSet: cardData.cardSet || {
          '@id': '',
          '@type': 'CardSet',
          id: '',
          reference: '',
          name: ''
        },
        rarity: cardData.rarity || {
          '@id': '',
          '@type': 'Rarity',
          reference: '',
          id: '',
          name: ''
        },
        cardRulings: cardData.cardRulings || [],
        imagePath: cardData.imagePath || '',
        assets: cardData.assets || { WEB: [] },
        lowerPrice: cardData.lowerPrice || 0,
        qrUrlDetail: cardData.qrUrlDetail || '',
        isSuspended: cardData.isSuspended || false,
        reference: cardData.reference || '',
        mainFaction: cardData.mainFaction || {
          '@id': '',
          '@type': 'Faction',
          reference: '',
          color: '',
          id: '',
          name: ''
        },
        allImagePath: cardData.allImagePath || {},
        elements: cardData.elements || {
          MAIN_COST: '0',
          RECALL_COST: '0',
          MOUNTAIN_POWER: '0',
          OCEAN_POWER: '0',
          FOREST_POWER: '0'
        },
        pricing: cardData.pricing || undefined,
        loreEntries: cardData.loreEntries || []
      };
      
      cards.push(card);
    } catch (error) {
      console.warn('Failed to parse card data line:', line, error);
    }
  }
  
  return cards;
};

/**
 * Load card data from the backend API instead of static files
 */
export const loadCardDataFromAPI = async (): Promise<DataLoaderResult> => {
  const result: DataLoaderResult = {
    cards: [],
    fileCount: 0,
    cardCount: 0,
    errors: []
  };

  try {
    console.log('🔗 Loading card data from backend API...');
    
    // Check if we're in development (frontend dev server) or production
    const apiBaseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '';
    const response = await fetch(`${apiBaseUrl}/api/cards/all`);
    
    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
    }
    
    const apiData = await response.json();
    
    // Transform backend response to our format
    const transformedCards: Card[] = apiData.cards.map((cardData: any) => ({
      id: cardData.id || cardData.reference || '',
      name: cardData.name || '',
      '@id': cardData['@id'] || '',
      '@context': cardData['@context'] || '',
      '@type': cardData['@type'] || '',
      cardType: cardData.cardType || {
        '@id': '',
        '@type': 'CardType',
        reference: '',
        id: '',
        name: ''
      },
      cardSubTypes: cardData.cardSubTypes || [],
      cardSet: cardData.cardSet || {
        '@id': '',
        '@type': 'CardSet',
        id: '',
        reference: '',
        name: ''
      },
      rarity: cardData.rarity || {
        '@id': '',
        '@type': 'Rarity',
        reference: '',
        id: '',
        name: ''
      },
      cardRulings: cardData.cardRulings || [],
      imagePath: cardData.imagePath || '',
      assets: cardData.assets || { WEB: [] },
      lowerPrice: cardData.lowerPrice || 0,
      qrUrlDetail: cardData.qrUrlDetail || '',
      isSuspended: cardData.isSuspended || false,
      reference: cardData.reference || '',
      mainFaction: cardData.mainFaction || {
        '@id': '',
        '@type': 'Faction',
        reference: '',
        color: '',
        id: '',
        name: ''
      },
      allImagePath: cardData.allImagePath || {},
      elements: cardData.elements || {
        MAIN_COST: '0',
        RECALL_COST: '0',
        MOUNTAIN_POWER: '0',
        OCEAN_POWER: '0',
        FOREST_POWER: '0'
      },
      pricing: cardData.pricing || undefined,
      loreEntries: cardData.loreEntries || []
    }));
    
    result.cards = transformedCards;
    result.fileCount = apiData.fileCount || 1;
    result.cardCount = transformedCards.length;
    result.errors = apiData.errors || [];
    
    console.log(`✅ Successfully loaded ${result.cardCount} cards from backend API (${result.fileCount} files)`);
    
  } catch (error) {
    console.error('❌ Failed to load data from backend API:', error);
    result.errors.push(`Backend API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    // Fallback to static file loading
    console.log('🔄 Falling back to static file loading...');
    return await loadCardData();
  }

  return result;
};
export const loadCardData = async (): Promise<DataLoaderResult> => {
  const result: DataLoaderResult = {
    cards: [],
    fileCount: 0,
    cardCount: 0,
    errors: []
  };

  try {
    const loadedCards: Card[] = [];
    let successfullyLoadedFiles = 0;
    
    // Load each JSONL file
    for (const filename of CARD_DATA_FILES) {
      try {
        console.log(`Loading card data from: ${filename}`);
        
        // Fetch the JSONL file from the public directory
        const response = await fetch(`/card_db/${filename}`);
        
        if (!response.ok) {
          throw new Error(`Failed to load ${filename}: ${response.statusText}`);
        }
        
        const content = await response.text();
        const cards = parseJsonlContent(content);
        
        loadedCards.push(...cards);
        successfullyLoadedFiles++;
        
        console.log(`Successfully loaded ${cards.length} cards from ${filename}`);
        
      } catch (error) {
        const errorMessage = `Failed to load ${filename}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMessage);
        result.errors.push(errorMessage);
      }
    }
    
    result.cards = loadedCards;
    result.fileCount = successfullyLoadedFiles;
    result.cardCount = loadedCards.length;
    
    console.log(`Total loaded: ${result.cardCount} cards from ${result.fileCount}/${CARD_DATA_FILES.length} files`);
    
    // If no cards were loaded successfully, fall back to demo data
    if (result.cardCount === 0) {
      console.warn('No card data loaded, falling back to demo data');
      result.cards = generateDemoCards();
      result.cardCount = result.cards.length;
      result.fileCount = 1;
      result.errors.push('No real card data available, using demo data');
    }
    
  } catch (error) {
    console.error('Error loading card data:', error);
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    
    // Fallback to demo data if loading fails
    result.cards = generateDemoCards();
    result.cardCount = result.cards.length;
    result.fileCount = 1;
  }

  return result;
};

/**
 * Generate demo cards for development/testing
 */
const generateDemoCards = (): Card[] => {
  return [
    {
      '@context': '/contexts/Card',
      '@id': '/cards/DEMO_CORE_AX_01_U',
      '@type': 'Card',
      id: 'demo-1',
      reference: 'DEMO_CORE_AX_01_U',
      name: 'Axiom Warrior',
      isSuspended: false,
      lowerPrice: 0,
      qrUrlDetail: '',
      imagePath: 'https://via.placeholder.com/250x350/3b82f6/ffffff?text=Axiom+Warrior',
      allImagePath: {},
      assets: { WEB: [] },
      loreEntries: [],
      cardRulings: [],
      cardType: {
        '@id': '/card_types/CHARACTER',
        '@type': 'CardType',
        id: 'character-id',
        reference: 'CHARACTER',
        name: 'Character'
      },
      cardSubTypes: [],
      cardSet: {
        '@id': '/card_sets/CORE',
        '@type': 'CardSet',
        id: 'core-id',
        reference: 'CORE',
        name: 'Beyond the Gates'
      },
      rarity: {
        '@id': '/rarities/UNIQUE',
        '@type': 'Rarity',
        id: 'unique-id',
        reference: 'UNIQUE',
        name: 'Unique'
      },
      mainFaction: {
        '@id': '/factions/AX',
        '@type': 'Faction',
        id: 'axiom-id',
        reference: 'AX',
        name: 'Axiom',
        color: '#3b82f6'
      },
      elements: {
        MAIN_COST: '3',
        RECALL_COST: '2',
        MOUNTAIN_POWER: '2',
        OCEAN_POWER: '1',
        FOREST_POWER: '1',
        MAIN_EFFECT: 'When this card enters play, draw a card.',
        ECHO_EFFECT: 'You may pay {1} to draw a card.'
      },
      pricing: {
        lowerPrice: 150,
        lastSale: 140,
        inSale: 3,
        numberCopyAvailable: 5,
        inMyTradelist: 0,
        inMyCollection: 1,
        inMyWantlist: false,
        foiled: false,
        isExclusive: false
      }
    },
    {
      '@context': '/contexts/Card',
      '@id': '/cards/DEMO_CORE_BR_02_R',
      '@type': 'Card',
      id: 'demo-2',
      reference: 'DEMO_CORE_BR_02_R',
      name: 'Bravos Scout',
      isSuspended: false,
      lowerPrice: 0,
      qrUrlDetail: '',
      imagePath: 'https://via.placeholder.com/250x350/ef4444/ffffff?text=Bravos+Scout',
      allImagePath: {},
      assets: { WEB: [] },
      loreEntries: [],
      cardRulings: [],
      cardType: {
        '@id': '/card_types/CHARACTER',
        '@type': 'CardType',
        id: 'character-id',
        reference: 'CHARACTER',
        name: 'Character'
      },
      cardSubTypes: [],
      cardSet: {
        '@id': '/card_sets/CORE',
        '@type': 'CardSet',
        id: 'core-id',
        reference: 'CORE',
        name: 'Beyond the Gates'
      },
      rarity: {
        '@id': '/rarities/RARE',
        '@type': 'Rarity',
        id: 'rare-id',
        reference: 'RARE',
        name: 'Rare'
      },
      mainFaction: {
        '@id': '/factions/BR',
        '@type': 'Faction',
        id: 'bravos-id',
        reference: 'BR',
        name: 'Bravos',
        color: '#ef4444'
      },
      elements: {
        MAIN_COST: '2',
        RECALL_COST: '1',
        MOUNTAIN_POWER: '1',
        OCEAN_POWER: '0',
        FOREST_POWER: '2',
        MAIN_EFFECT: 'When this card enters play, deal 1 damage to target character.',
        ECHO_EFFECT: 'You may pay {1} to deal 1 damage to target character.'
      },
      pricing: {
        lowerPrice: 75,
        lastSale: 80,
        inSale: 8,
        numberCopyAvailable: 12,
        inMyTradelist: 0,
        inMyCollection: 2,
        inMyWantlist: true,
        foiled: false,
        isExclusive: false
      }
    },
    {
      '@context': '/contexts/Card',
      '@id': '/cards/DEMO_ALIZE_LY_03_C',
      '@type': 'Card',
      id: 'demo-3',
      reference: 'DEMO_ALIZE_LY_03_C',
      name: 'Lyra Mystic',
      isSuspended: false,
      lowerPrice: 0,
      qrUrlDetail: '',
      imagePath: 'https://via.placeholder.com/250x350/8b5cf6/ffffff?text=Lyra+Mystic',
      allImagePath: {},
      assets: { WEB: [] },
      loreEntries: [],
      cardRulings: [],
      cardType: {
        '@id': '/card_types/SPELL',
        '@type': 'CardType',
        id: 'spell-id',
        reference: 'SPELL',
        name: 'Spell'
      },
      cardSubTypes: [],
      cardSet: {
        '@id': '/card_sets/ALIZE',
        '@type': 'CardSet',
        id: 'alize-id',
        reference: 'ALIZE',
        name: 'Trial by Frost'
      },
      rarity: {
        '@id': '/rarities/COMMON',
        '@type': 'Rarity',
        id: 'common-id',
        reference: 'COMMON',
        name: 'Common'
      },
      mainFaction: {
        '@id': '/factions/LY',
        '@type': 'Faction',
        id: 'lyra-id',
        reference: 'LY',
        name: 'Lyra',
        color: '#8b5cf6'
      },
      elements: {
        MAIN_COST: '1',
        RECALL_COST: '0',
        MOUNTAIN_POWER: '0',
        OCEAN_POWER: '1',
        FOREST_POWER: '0',
        MAIN_EFFECT: 'Draw a card.',
        ECHO_EFFECT: 'You may discard a card to draw a card.'
      },
      pricing: {
        lowerPrice: 25,
        lastSale: 30,
        inSale: 15,
        numberCopyAvailable: 25,
        inMyTradelist: 1,
        inMyCollection: 4,
        inMyWantlist: false,
        foiled: true,
        isExclusive: false
      }
    }
  ];
};

/**
 * Mock API endpoint for card data (would be replaced with real backend)
 */
export const setupMockCardDataAPI = () => {
  // This would typically be handled by a backend service
  // For now, we'll use the demo data
  if (typeof window !== 'undefined') {
    // Client-side mock
    (window as any).__mockCardDataAPI = () => {
      return Promise.resolve({
        cards: generateDemoCards(),
        fileCount: 1,
        cardCount: 3
      });
    };
  }
};

/**
 * Load all card data from the backend search API
 */
export const loadAllCardsFromBackend = async (): Promise<DataLoaderResult> => {
  const result: DataLoaderResult = {
    cards: [],
    fileCount: 0,
    cardCount: 0,
    errors: []
  };

  try {
    console.log('🔗 Loading all cards from backend search API...');
    
    // Test connection first
    const isConnected = await searchAPI.testConnection();
    if (!isConnected) {
      throw new Error('Backend API is not available. Please ensure the server is running on port 3000.');
    }

    // Search with empty filters to get all cards
    const searchResponse: APISearchResponse = await searchAPI.searchCards({}, {
      resultLimit: 0, // Get all cards
      sortByPrice: false,
      inSaleOnly: false
    });

    if (!searchResponse.success) {
      throw new Error(searchResponse.error || 'Search API returned error');
    }

    // Transform search results to Card objects
    const transformedCards: Card[] = searchResponse.data.map(searchResult => {
      const cardData = searchResult.card;
      
      return {
        id: cardData.id || cardData.reference || '',
        name: cardData.name || '',
        '@id': cardData['@id'] || '',
        '@context': cardData['@context'] || '',
        '@type': cardData['@type'] || '',
        cardType: cardData.cardType || {
          '@id': '',
          '@type': 'CardType',
          reference: '',
          id: '',
          name: ''
        },
        cardSubTypes: cardData.cardSubTypes || [],
        cardSet: cardData.cardSet || {
          '@id': '',
          '@type': 'CardSet',
          id: '',
          reference: '',
          name: ''
        },
        rarity: cardData.rarity || {
          '@id': '',
          '@type': 'Rarity',
          reference: '',
          id: '',
          name: ''
        },
        cardRulings: cardData.cardRulings || [],
        imagePath: cardData.imagePath || '',
        assets: cardData.assets || { WEB: [] },
        lowerPrice: cardData.lowerPrice || 0,
        qrUrlDetail: cardData.qrUrlDetail || '',
        isSuspended: cardData.isSuspended || false,
        reference: cardData.reference || '',
        mainFaction: cardData.mainFaction || {
          '@id': '',
          '@type': 'Faction',
          reference: '',
          color: '',
          id: '',
          name: ''
        },
        elements: cardData.elements || {
          MAIN_COST: '0',
          RECALL_COST: '0',
          FOREST_POWER: '0',
          MOUNTAIN_POWER: '0',
          OCEAN_POWER: '0',
          MAIN_EFFECT: '',
          ECHO_EFFECT: ''
        },
        pricing: cardData.pricing || null
      } as Card;
    });

    result.cards = transformedCards;
    result.cardCount = transformedCards.length;
    result.fileCount = 1; // API is treated as one source
    
    console.log(`✅ Loaded ${result.cardCount} cards from backend API`);
    
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error loading from backend';
    console.error('❌ Backend API loading error:', error);
    result.errors.push(errorMessage);
    throw error;
  }
};

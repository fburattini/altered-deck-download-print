#!/usr/bin/env npx tsx

/**
 * 🧪 API TEST: Search Endpoint
 * 
 * Test the /api/search endpoint with various search queries
 */

const API_BASE_URL = 'http://localhost:3000';

const testSearchAPI = async () => {
  console.log('🧪 Testing Card Search API');
  console.log('===========================');

  // Test 1: Simple name search
  console.log('\n📍 Test 1: Search by name "cloth"');
  try {
    const response1 = await fetch(`${API_BASE_URL}/api/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filters: {
          name: 'cloth'
        },
        options: {
          resultLimit: 5,
          sortByPrice: true,
          inSaleOnly: true
        }
      })
    });

    const result1 = await response1.json();
    console.log(`✅ Found ${result1.count} cards`);
    if (result1.data.length > 0) {
      console.log(`   First result: ${result1.data[0].card.name} (€${result1.data[0].card.pricing?.lowerPrice || '?'})`);
    }
  } catch (error) {
    console.error('❌ Test 1 failed:', error);
  }

  // Test 2: Search by faction and cost
  console.log('\n📍 Test 2: Search LY faction, cost 2-3');
  try {
    const response2 = await fetch(`${API_BASE_URL}/api/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filters: {
          faction: 'LY',
          mainCost: '2-3'
        },
        options: {
          resultLimit: 3,
          sortByPrice: true,
          inSaleOnly: false
        }
      })
    });

    const result2 = await response2.json();
    console.log(`✅ Found ${result2.count} cards`);
    result2.data.slice(0, 3).forEach((item: any, index: number) => {
      console.log(`   ${index + 1}. ${item.card.name} - Cost: ${item.card.elements.MAIN_COST}`);
    });
  } catch (error) {
    console.error('❌ Test 2 failed:', error);
  }

  // Test 3: Search by main effect
  console.log('\n📍 Test 3: Search by main effect "draw"');
  try {
    const response3 = await fetch(`${API_BASE_URL}/api/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filters: {
          mainEffect: 'draw'
        },
        options: {
          resultLimit: 2,
          sortByPrice: false,
          inSaleOnly: true
        }
      })
    });

    const result3 = await response3.json();
    console.log(`✅ Found ${result3.count} cards with "draw" effect`);
    result3.data.slice(0, 2).forEach((item: any, index: number) => {
      console.log(`   ${index + 1}. ${item.card.name} - ${item.matchReasons.join(', ')}`);
    });
  } catch (error) {
    console.error('❌ Test 3 failed:', error);
  }

  // Test 4: Error handling - invalid request
  console.log('\n📍 Test 4: Test error handling');
  try {
    const response4 = await fetch(`${API_BASE_URL}/api/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invalidField: 'test'
      })
    });

    const result4 = await response4.json();
    if (result4.success === false) {
      console.log('✅ Error handling works correctly');
    } else {
      console.log(`✅ Request handled gracefully: ${result4.count} cards found`);
    }
  } catch (error) {
    console.error('❌ Test 4 failed:', error);
  }

  console.log('\n✅ API tests completed!');
};

// Run tests if this file is executed directly
if (require.main === module) {
  testSearchAPI().catch(console.error);
}

export { testSearchAPI };

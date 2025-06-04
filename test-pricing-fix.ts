import { AlteredApiClient } from './src/market/api-client';
import { CardDetail } from './src/market/markte-types';

/**
 * Test the pricing change detection fix
 */
async function testPricingChangeFix() {
  console.log('=== Testing Pricing Change Detection Fix ===\n');

  // Access private method for testing (TypeScript hack)
  const apiClient = new AlteredApiClient() as any;

  // Test cases
  console.log('Test 1: Both undefined - should return false');
  console.log('Result:', apiClient.hasPricingChanged(undefined, undefined));

  console.log('\nTest 2: Old undefined, new with zero values - should return false');
  const newPricingZero = { lowerPrice: 0, lastSale: 0, inSale: 0, numberCopyAvailable: 0 };
  console.log('Result:', apiClient.hasPricingChanged(undefined, newPricingZero));

  console.log('\nTest 3: Old undefined, new with meaningful values - should return true');
  const newPricingMeaningful = { lowerPrice: 5.0, lastSale: 4.0, inSale: 2, numberCopyAvailable: 10 };
  console.log('Result:', apiClient.hasPricingChanged(undefined, newPricingMeaningful));

  console.log('\nTest 4: Same values - should return false');
  const oldPricing = { lowerPrice: 5.0, lastSale: 4.0, inSale: 2, numberCopyAvailable: 10 };
  const newPricingSame = { lowerPrice: 5.0, lastSale: 4.0, inSale: 2, numberCopyAvailable: 10 };
  console.log('Result:', apiClient.hasPricingChanged(oldPricing, newPricingSame));

  console.log('\nTest 5: Different values - should return true');
  const newPricingDifferent = { lowerPrice: 6.0, lastSale: 4.0, inSale: 2, numberCopyAvailable: 10 };
  console.log('Result:', apiClient.hasPricingChanged(oldPricing, newPricingDifferent));

  console.log('\nTest 6: Old with values, new undefined - should return true');
  console.log('Result:', apiClient.hasPricingChanged(oldPricing, undefined));

  console.log('\nTest 7: Old with zero values, new undefined - should return false');
  console.log('Result:', apiClient.hasPricingChanged(newPricingZero, undefined));

  console.log('\n✅ Pricing change detection test completed!');
}

testPricingChangeFix().catch(console.error);

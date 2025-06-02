/**
 * 🔗 SEARCH API SERVICE
 * 
 * Service for making search requests to the backend API
 */

export interface APISearchFilters {
  mainCost?: string;
  mainEffect?: string;
  echoEffect?: string;
  name?: string;
  faction?: string;
  rarity?: string;
  inSale?: boolean;
}

export interface APISearchOptions {
  resultLimit?: number;
  sortByPrice?: boolean;
  inSaleOnly?: boolean;
}

export interface APISearchResult {
  card: any; // Will match Card interface from types.ts
  matchReasons: string[];
}

export interface APISearchResponse {
  success: boolean;
  count: number;
  data: APISearchResult[];
  error?: string;
}

// Interface for the scrape request body, based on the backend
export interface APIScrapeFilters {
  CARD_NAME?: string;
  MAIN_EFFECT?: string;
  FACTION?: string;
  MAIN_COST?: string; // e.g., "2" or "1-3"
  bearerToken?: string; // Added optional bearerToken
  // Add other filters from your backend if needed, e.g., RARITY, ONLY_FOR_SALE
  // For now, we'll only include what the user requested for the webapp
}

export interface APIScrapeResponse {
  success: boolean;
  message?: string;
  filtersApplied?: any;
  error?: string;
}

export interface CardNameFaction {
  cardName: string;
  cardFaction: string;
}

export interface APICardsInDBResponse {
  success: boolean;
  count: number;
  data: CardNameFaction[];
  error?: string;
}

class SearchAPIService {
  private baseUrl: string;

  constructor() {
    // Use different URLs for development and production
    this.baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3001' 
      : '';
  }

  /**
   * Search for cards using the backend API
   */
  async searchCards(
    filters: APISearchFilters = {}, 
    options: APISearchOptions = {}
  ): Promise<APISearchResponse> {
    try {
      console.log('🔍 Searching cards via API:', { filters, options });

      const response = await fetch(`${this.baseUrl}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filters,
          options: {
            resultLimit: 0, // Get all results by default
            sortByPrice: true,
            inSaleOnly: true,
            ...options
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Search API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ API search completed: ${data.count} results`);
      
      return data;
    } catch (error) {
      console.error('❌ Search API error:', error);
      
      return {
        success: false,
        count: 0,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown search error'
      };
    }
  }

  /**
   * Scrape cards using the backend API
   */
  async scrapeCards(
    filters: APIScrapeFilters = {},
    bearerToken?: string // Optional token to be passed in the body
  ): Promise<APIScrapeResponse> {
    try {
      const bodyPayload: APIScrapeFilters = { ...filters };
      if (bearerToken) {
        bodyPayload.bearerToken = bearerToken;
      }
      console.log('🚀 Requesting scrape via API with payload:', bodyPayload);

      const response = await fetch(`${this.baseUrl}/api/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload) // Pass the potentially modified payload
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Scrape API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ API scrape request completed:', data.message);
      return data;

    } catch (error) {
      console.error('❌ Scrape API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown scrape error'
      };
    }
  }
  /**
   * Get list of all cards available in the database
   */
  async getCardsInDB(): Promise<APICardsInDBResponse> {
    try {
      console.log('📋 Fetching available cards from database...');

      const response = await fetch(`${this.baseUrl}/api/cards-in-db`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cards-in-DB API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ Available cards fetched: ${data.count} cards`);
      
      return data;
    } catch (error) {
      console.error('❌ Cards-in-DB API error:', error);
      
      return {
        success: false,
        count: 0,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error fetching available cards'
      };
    }
  }

  /**
   * Test API connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const searchAPI = new SearchAPIService();

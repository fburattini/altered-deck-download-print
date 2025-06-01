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
        throw new Error(`Search API error: ${response.status} ${response.statusText}`);
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

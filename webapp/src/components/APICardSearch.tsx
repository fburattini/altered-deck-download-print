import React, { useState, useCallback } from 'react';
import { Card } from '../types';
import { searchAPI, APISearchFilters, APISearchOptions } from '../services/searchAPI';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface APICardSearchProps {
  onSearchResults: (cards: Card[], isLoading: boolean, error?: string) => void;
}

interface LocalFilters {
  searchQuery: string;
  factions: string[];
  cardType: string[];
  mainCostRange: { min?: number; max?: number };
  priceRange: { min?: number; max?: number };
  inSaleOnly: boolean;
}

const APICardSearch: React.FC<APICardSearchProps> = ({ onSearchResults }) => {  const [filters, setFilters] = useState<LocalFilters>({
    searchQuery: '',
    factions: [],
    cardType: [],
    mainCostRange: {},
    priceRange: {},
    inSaleOnly: true
  });
  
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Manual search function triggered by button
  const performSearch = useCallback(async (currentFilters: LocalFilters) => {
    setIsSearching(true);
    setSearchError(null);
    
    try {
      // Convert local filters to API format
      const apiFilters: APISearchFilters = {};
      const apiOptions: APISearchOptions = {
        resultLimit: 0, // Get all results
        sortByPrice: true,
        inSaleOnly: currentFilters.inSaleOnly
      };      // Convert search query to name filter
      if (currentFilters.searchQuery.trim()) {
        apiFilters.name = currentFilters.searchQuery.trim();
      }

      // Always filter for UNIQUE rarity
      apiFilters.rarity = 'UNIQUE';

      // Convert faction filter 
      if (currentFilters.factions.length === 1) {
        apiFilters.faction = currentFilters.factions[0];
      }

      // Convert main cost range to string
      if (currentFilters.mainCostRange.min !== undefined || currentFilters.mainCostRange.max !== undefined) {
        const min = currentFilters.mainCostRange.min;
        const max = currentFilters.mainCostRange.max;
        
        if (min !== undefined && max !== undefined) {
          apiFilters.mainCost = `${min}-${max}`;
        } else if (min !== undefined) {
          apiFilters.mainCost = `${min}`;
        } else if (max !== undefined) {
          apiFilters.mainCost = `1-${max}`;
        }
      }

      console.log('🔍 Performing API search with filters:', apiFilters, apiOptions);

      const response = await searchAPI.searchCards(apiFilters, apiOptions);
        if (response.success) {
        const cards = response.data.map(result => result.card);
        onSearchResults(cards, false);
        setHasSearched(true);
      } else {
        throw new Error(response.error || 'Search failed');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      setSearchError(errorMessage);
      onSearchResults([], false, errorMessage);
    } finally {
      setIsSearching(false);
    }
  }, [onSearchResults]);
  // Manual search trigger
  const handleSearch = () => {
    if (!isSearching) {
      performSearch(filters);
    }
  };

  const updateFilter = (key: keyof LocalFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleArrayFilter = (key: 'factions' | 'cardType', value: string) => {
    setFilters(prev => {
      const currentArray = prev[key];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      
      return {
        ...prev,
        [key]: newArray
      };
    });
  };  const clearAllFilters = () => {
    setFilters({
      searchQuery: '',
      factions: [],
      cardType: [],
      mainCostRange: {},
      priceRange: {},
      inSaleOnly: true
    });
  };

  // Handle form submission (Enter key)
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  return (    <form onSubmit={handleFormSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Search Cards</h2>
          <p className="text-sm text-gray-500">Showing only UNIQUE rarity cards</p>
        </div>
        {isSearching && (
          <div className="flex items-center text-sm text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Searching...
          </div>
        )}
      </div>

      {/* Search Status */}
      {!isSearching && hasSearched && searchError === null && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="text-sm text-green-800">
            <strong>Ready:</strong> Adjust filters and click "Search Cards" to find new results
          </div>
        </div>
      )}

      {/* Search Error */}
      {searchError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="text-sm text-red-800">
            <strong>Search Error:</strong> {searchError}
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search by name, effect, or keyword..."
          value={filters.searchQuery}
          onChange={(e) => updateFilter('searchQuery', e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>      {/* Quick Filters */}
      <div className="space-y-4">
        {/* Faction Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Faction</label>
          <div className="flex flex-wrap gap-2">
            {[
              { ref: 'AX', name: 'Axiom' },
              { ref: 'BR', name: 'Bravos' },
              { ref: 'LY', name: 'Lyra' },
              { ref: 'MU', name: 'Muna' },
              { ref: 'OR', name: 'Ordis' },
              { ref: 'YZ', name: 'Yzmir' }
            ].map(faction => (
              <button
                key={faction.ref}
                onClick={() => toggleArrayFilter('factions', faction.ref)}
                className={`px-3 py-1 text-sm rounded-full border ${
                  filters.factions.includes(faction.ref)
                    ? 'bg-blue-100 border-blue-300 text-blue-800'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {faction.name}
              </button>
            ))}
          </div>
        </div>

        {/* Main Cost Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Main Cost</label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              placeholder="Min"
              min="0"
              max="10"
              value={filters.mainCostRange.min || ''}
              onChange={(e) => updateFilter('mainCostRange', {
                ...filters.mainCostRange,
                min: e.target.value ? parseInt(e.target.value) : undefined
              })}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
            />
            <span className="text-gray-500">to</span>
            <input
              type="number"
              placeholder="Max"
              min="0"
              max="10"
              value={filters.mainCostRange.max || ''}
              onChange={(e) => updateFilter('mainCostRange', {
                ...filters.mainCostRange,
                max: e.target.value ? parseInt(e.target.value) : undefined
              })}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>

        {/* In Sale Only */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="inSaleOnly"
            checked={filters.inSaleOnly}
            onChange={(e) => updateFilter('inSaleOnly', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="inSaleOnly" className="ml-2 block text-sm text-gray-700">
            Show only cards for sale
          </label>        </div>
      </div>

      {/* Search Button */}
      <button
        onClick={handleSearch}
        disabled={isSearching}
        className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isSearching ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Searching...
          </>
        ) : (
          <>
            <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
            Search Cards
          </>
        )}
      </button>      {/* Clear Filters */}
      <button
        onClick={clearAllFilters}
        className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Clear All Filters
      </button>
    </form>
  );
};

export default APICardSearch;

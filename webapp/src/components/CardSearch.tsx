import React, { useState, useEffect, useMemo } from 'react';
import { Card, SearchFilters } from '../types';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface CardSearchProps {
  cards: Card[];
  onFilteredCards: (cards: Card[]) => void;
}

const CardSearch: React.FC<CardSearchProps> = ({ cards, onFilteredCards }) => {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Filter cards based on current filters and search query
  const filteredCards = useMemo(() => {
    let result = cards;

    // Text search across name and effects
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(card => 
        card.name.toLowerCase().includes(query) ||
        card.elements.MAIN_EFFECT?.toLowerCase().includes(query) ||
        card.elements.ECHO_EFFECT?.toLowerCase().includes(query) ||
        card.cardType.name.toLowerCase().includes(query) ||
        card.mainFaction.name.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (filters.rarity?.length) {
      result = result.filter(card => filters.rarity!.includes(card.rarity.reference));
    }

    if (filters.cardSet?.length) {
      result = result.filter(card => filters.cardSet!.includes(card.cardSet.reference));
    }

    if (filters.factions?.length) {
      result = result.filter(card => filters.factions!.includes(card.mainFaction.reference));
    }

    if (filters.cardType?.length) {
      result = result.filter(card => filters.cardType!.includes(card.cardType.reference));
    }

    if (filters.mainCost?.length) {
      result = result.filter(card => filters.mainCost!.includes(parseInt(card.elements.MAIN_COST)));
    }

    if (filters.recallCost?.length) {
      result = result.filter(card => filters.recallCost!.includes(parseInt(card.elements.RECALL_COST)));
    }

    if (filters.forestPower?.length) {
      result = result.filter(card => filters.forestPower!.includes(parseInt(card.elements.FOREST_POWER)));
    }

    if (filters.mountainPower?.length) {
      result = result.filter(card => filters.mountainPower!.includes(parseInt(card.elements.MOUNTAIN_POWER)));
    }

    if (filters.oceanPower?.length) {
      result = result.filter(card => filters.oceanPower!.includes(parseInt(card.elements.OCEAN_POWER)));
    }

    if (filters.inSale !== undefined) {
      result = result.filter(card => {
        const inSale = card.pricing?.inSale ? card.pricing.inSale > 0 : false;
        return inSale === filters.inSale;
      });
    }

    if (filters.priceRange) {
      result = result.filter(card => {
        const price = card.pricing?.lowerPrice || 0;
        const { min, max } = filters.priceRange!;
        return (!min || price >= min) && (!max || price <= max);
      });
    }

    return result;
  }, [cards, filters, searchQuery]);

  useEffect(() => {
    onFilteredCards(filteredCards);
  }, [filteredCards, onFilteredCards]);

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleArrayFilter = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => {
      const currentArray = (prev[key] as string[]) || [];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      
      return {
        ...prev,
        [key]: newArray.length > 0 ? newArray : undefined
      };
    });
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  const getActiveFilterCount = () => {
    let count = 0;
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value) && value.length > 0) count++;
        else if (!Array.isArray(value)) count++;
      }
    });
    if (searchQuery.trim()) count++;
    return count;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Search Cards</h2>
        {getActiveFilterCount() > 0 && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            Clear Filters ({getActiveFilterCount()})
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search by name, effect, type, or faction..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Rarity Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Rarity</label>
          <div className="space-y-2">
            {['UNIQUE', 'RARE', 'COMMON'].map(rarity => (
              <label key={rarity} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.rarity?.includes(rarity) || false}
                  onChange={() => toggleArrayFilter('rarity', rarity)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 capitalize">{rarity.toLowerCase()}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Card Set Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Card Set</label>
          <div className="space-y-2">
            {[
              { value: 'CORE', label: 'Core (Beyond the Gates)' },
              { value: 'ALIZE', label: 'Alize' }
            ].map(set => (
              <label key={set.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.cardSet?.includes(set.value) || false}
                  onChange={() => toggleArrayFilter('cardSet', set.value)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{set.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Faction Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Faction</label>
          <div className="space-y-2">
            {[
              { value: 'AX', label: 'Axiom', color: '#2563eb' },
              { value: 'BR', label: 'Bravos', color: '#c32637' },
              { value: 'LY', label: 'Lyra', color: '#16a34a' },
              { value: 'MU', label: 'Muna', color: '#9333ea' },
              { value: 'OR', label: 'Ordis', color: '#ea580c' },
              { value: 'YZ', label: 'Yzmir', color: '#eab308' }
            ].map(faction => (
              <label key={faction.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.factions?.includes(faction.value) || false}
                  onChange={() => toggleArrayFilter('factions', faction.value)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 flex items-center">
                  <span
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: faction.color }}
                  ></span>
                  {faction.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Card Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Card Type</label>
          <div className="space-y-2">
            {['CHARACTER', 'SPELL', 'PERMANENT'].map(type => (
              <label key={type} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.cardType?.includes(type) || false}
                  onChange={() => toggleArrayFilter('cardType', type)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 capitalize">{type.toLowerCase()}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Main Cost Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Main Cost</label>
          <div className="grid grid-cols-6 gap-1">
            {Array.from({ length: 11 }, (_, i) => i).map(cost => (
              <button
                key={cost}
                onClick={() => toggleArrayFilter('mainCost', cost.toString())}
                className={`px-2 py-1 text-xs rounded border transition-colors ${
                  filters.mainCost?.includes(cost)
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {cost}
              </button>
            ))}
          </div>
        </div>

        {/* For Sale Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.inSale === true}
                onChange={(e) => updateFilter('inSale', e.target.checked ? true : undefined)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">For Sale</span>
            </label>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          Showing {filteredCards.length} of {cards.length} cards
        </p>
      </div>
    </div>
  );
};

export default CardSearch;

import React from 'react';
import { Card } from '../types';

interface CardDisplayProps {
  card: Card;
  viewMode?: 'grid' | 'list';
}

const CardDisplay: React.FC<CardDisplayProps> = ({ card, viewMode = 'grid' }) => {
  const getFactionColor = (faction: string) => {
    const colors: Record<string, string> = {
      'AX': '#2563eb',
      'BR': '#c32637', 
      'LY': '#16a34a',
      'MU': '#9333ea',
      'OR': '#ea580c',
      'YZ': '#eab308'
    };
    return colors[faction] || '#6b7280';
  };

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      'UNIQUE': '#fbbf24',
      'RARE': '#a855f7',
      'COMMON': '#6b7280'
    };
    return colors[rarity] || '#6b7280';
  };

  const formatPrice = (price?: number) => {
    if (!price || price <= 0) return 'N/A';
    return `€${price.toFixed(2)}`;
  };

  const formatEffect = (effect?: string) => {
    if (!effect) return null;
    // Replace game symbols with readable text
    return effect
      .replace(/\{(\w+)\}/g, '[$1]')
      .replace(/\[\[(\w+)\]\]/g, '[$1]');
  };
  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
        <div className="flex gap-4">
          {/* Card Image - Smaller in list view */}
          <div className="w-20 h-28 bg-gray-200 rounded overflow-hidden flex-shrink-0">
            {card.imagePath ? (
              <img
                src={card.imagePath}
                alt={card.name}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                No Image
              </div>
            )}
            
            {/* Faction indicator */}
            <div 
              className="absolute top-1 left-1 w-3 h-3 rounded-full border border-white"
              style={{ backgroundColor: getFactionColor(card.mainFaction.reference) }}
              title={card.mainFaction.name}
            ></div>
          </div>

          {/* Card Details - Expanded in list view */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-lg text-gray-900 truncate" title={card.name}>
                  {card.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {card.cardType.name} • {card.cardSet.name} • 
                  <span 
                    className="inline-block w-3 h-3 rounded-full ml-1 mr-1"
                    style={{ backgroundColor: getRarityColor(card.rarity.reference) }}
                  ></span>
                  {card.rarity.reference}
                </p>
                
                {/* Costs and Powers - Inline */}
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                  <span>Cost: {card.elements.MAIN_COST}/{card.elements.RECALL_COST}</span>
                  <span>Powers: 🌲{card.elements.FOREST_POWER} ⛰️{card.elements.MOUNTAIN_POWER} 🌊{card.elements.OCEAN_POWER}</span>
                </div>

                {/* Effects */}
                {card.elements.MAIN_EFFECT && (
                  <div className="mb-2">
                    <span className="text-xs font-medium text-gray-700">Main: </span>
                    <span className="text-xs text-gray-600">{formatEffect(card.elements.MAIN_EFFECT)}</span>
                  </div>
                )}
                
                {card.elements.ECHO_EFFECT && (
                  <div className="mb-2">
                    <span className="text-xs font-medium text-gray-700">Echo: </span>
                    <span className="text-xs text-gray-600">{formatEffect(card.elements.ECHO_EFFECT)}</span>
                  </div>
                )}
              </div>

              {/* Pricing - Right side */}
              {card.pricing && (
                <div className="ml-4 text-right flex-shrink-0">
                  <div className="text-lg font-bold text-gray-900">
                    {formatPrice(card.pricing.lowerPrice)}
                  </div>
                  {card.pricing.lastSale > 0 && (
                    <div className="text-sm text-gray-500">
                      Last: {formatPrice(card.pricing.lastSale)}
                    </div>
                  )}
                  {card.pricing.numberCopyAvailable > 0 && (
                    <div className="text-xs text-green-600">
                      {card.pricing.numberCopyAvailable} available
                    </div>
                  )}
                  {card.pricing.inSale > 0 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                      For Sale
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view (original design)
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">\
      {/* Card Image */}
      <div className="aspect-[5/7] bg-gray-200 relative overflow-hidden">
        {card.imagePath ? (
          <img
            src={card.imagePath}
            alt={card.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span>No Image</span>
          </div>
        )}
        
        {/* Faction indicator */}
        <div 
          className="absolute top-2 left-2 w-4 h-4 rounded-full border-2 border-white"
          style={{ backgroundColor: getFactionColor(card.mainFaction.reference) }}
          title={card.mainFaction.name}
        ></div>

        {/* Rarity indicator */}
        <div 
          className="absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded text-white"
          style={{ backgroundColor: getRarityColor(card.rarity.reference) }}
        >
          {card.rarity.reference}
        </div>
      </div>

      {/* Card Details */}
      <div className="p-4">
        {/* Name and Type */}
        <div className="mb-3">
          <h3 className="font-bold text-lg text-gray-900 truncate" title={card.name}>
            {card.name}
          </h3>
          <p className="text-sm text-gray-600">
            {card.cardType.name} • {card.cardSet.name}
          </p>
        </div>

        {/* Costs and Powers */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
          <div className="bg-gray-50 rounded p-2">
            <div className="font-medium text-gray-700">Costs</div>
            <div className="text-gray-600">
              Main: {card.elements.MAIN_COST} • Recall: {card.elements.RECALL_COST}
            </div>
          </div>
          <div className="bg-gray-50 rounded p-2">
            <div className="font-medium text-gray-700">Powers</div>
            <div className="text-gray-600 text-xs">
              🌲{card.elements.FOREST_POWER} ⛰️{card.elements.MOUNTAIN_POWER} 🌊{card.elements.OCEAN_POWER}
            </div>
          </div>
        </div>

        {/* Effects */}
        {card.elements.MAIN_EFFECT && (
          <div className="mb-3">
            <div className="text-xs font-medium text-gray-700 mb-1">Main Effect</div>
            <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
              {formatEffect(card.elements.MAIN_EFFECT)}
            </div>
          </div>
        )}

        {card.elements.ECHO_EFFECT && (
          <div className="mb-3">
            <div className="text-xs font-medium text-gray-700 mb-1">Echo Effect</div>
            <div className="text-xs text-gray-600 bg-green-50 p-2 rounded">
              {formatEffect(card.elements.ECHO_EFFECT)}
            </div>
          </div>
        )}

        {/* Pricing */}
        {card.pricing && (
          <div className="border-t pt-3">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {formatPrice(card.pricing.lowerPrice)}
                </div>
                {card.pricing.numberCopyAvailable > 0 && (
                  <div className="text-xs text-green-600">
                    {card.pricing.numberCopyAvailable} available
                  </div>
                )}
              </div>
              {card.pricing.inSale > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  For Sale
                </span>
              )}
            </div>
          </div>
        )}

        {/* Faction */}
        <div className="mt-2 pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {card.mainFaction.name}
            </span>
            <span className="text-xs text-gray-400">
              ID: {card.reference}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardDisplay;

import React from 'react';
import { Card } from '../types';
import { FACTION_COLORS } from '../services/utils';
import '../styles/CardGridView.scss';

interface CardGridViewProps {
  cards: Card[];
  onCardHover?: (card: Card | null) => void;
}

const CardGridView: React.FC<CardGridViewProps> = ({ cards, onCardHover }) => {
  const getFactionColor = (faction: string) => {
    return FACTION_COLORS[faction] || '#6b7280';
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'N/A';
    return `$${price.toFixed(2)}`;
  };

  return (
    <div className="card-grid-view">
      {cards.map((card) => (
        <div
          key={card.id}
          className="grid-card-item"
          onMouseEnter={() => onCardHover?.(card)}
          onMouseLeave={() => onCardHover?.(null)}
        >
          {/* Card Image */}
          <div className="grid-card-image">
            <img
              src={card.imagePath}
              alt={`${card.name} card`}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-card.jpg';
              }}
            />
            
            {/* Overlay with card info */}
            <div className="grid-card-overlay">
              <div className="grid-card-info">
                <div className="grid-card-header">
                  <h3 className="grid-card-name">{card.name}</h3>
                  <span 
                    className="grid-card-faction"
                    style={{ backgroundColor: getFactionColor(card.mainFaction.reference) }}
                  >
                    {card.mainFaction.reference}
                  </span>
                </div>
                
                <div className="grid-card-stats">
                  <div className="grid-card-costs">
                    <span className="cost-item">
                      <span className="cost-label">MC:</span>
                      <span className="cost-value">{card.elements.MAIN_COST}</span>
                    </span>
                    <span className="cost-item">
                      <span className="cost-label">RC:</span>
                      <span className="cost-value">{card.elements.RECALL_COST}</span>
                    </span>
                  </div>
                  
                  <div className="grid-card-powers">
                    <span className="power-item">🌲{card.elements.FOREST_POWER}</span>
                    <span className="power-item">⛰️{card.elements.MOUNTAIN_POWER}</span>
                    <span className="power-item">🌊{card.elements.OCEAN_POWER}</span>
                  </div>
                </div>
                
                <div className="grid-card-price">
                  <span className="price-label">Price:</span>
                  <span className="price-value">
                    {formatPrice(card.pricing?.lowerPrice)}
                  </span>
                </div>
                
                <div className="grid-card-actions">
                  <a
                    href={`https://www.altered.gg/cards/${card.reference}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="view-card-btn"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                      <polyline points="15,3 21,3 21,9"/>
                      <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                    View Original
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          {/* Card footer with essential info always visible */}
          <div className="grid-card-footer">
            <div className="footer-left">
              <span className="footer-name">{card.name}</span>
              <span className="footer-rarity">{card.rarity.name}</span>
            </div>
            <div className="footer-right">
              <span className="footer-price">
                {formatPrice(card.pricing?.lowerPrice)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CardGridView;

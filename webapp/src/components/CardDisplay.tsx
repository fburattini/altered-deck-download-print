import React from 'react';
import { Card } from '../types';
import '../styles/CardDisplay.scss';
import { FACTION_COLORS } from '../services/utils';

interface CardDisplayProps {
  card: Card;
}

const CardDisplay: React.FC<CardDisplayProps> = ({ card }) => {
  const getFactionColor = (faction: string) => {
    return FACTION_COLORS[faction] || '#6b7280'; // Default to gray
  };

  const formatEffect = (effect?: string) => {
    if (!effect) return null;
    // Replace game symbols with readable text
    return effect
      .replace(/\{(\w+)\}/g, '[$1]')
      .replace(/\[\[(\w+)\]\]/g, '[$1]');
  };

  return (
    <>
      <td className="card-name-cell">
        <div className="flex-container">
          <span
            className="faction-indicator"
            style={{ backgroundColor: getFactionColor(card.mainFaction.reference) }}
            title={card.mainFaction.name}
          ></span>
          <a
            href={`https://www.altered.gg/cards/${card.reference}`}
            target="_blank"
            rel="noopener noreferrer"
            className="card-name-link"
            title="View on Altered Marketplace"
          >
            {card.name}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="external-link-icon"
            >
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15,3 21,3 21,9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
      </td>
      <td className="centered-cell">
        {card.pricing?.lowerPrice ? `$${card.pricing.lowerPrice.toFixed(2)}` : 'N/A'}
      </td>
      <td className="centered-cell">{card.elements.MAIN_COST}</td>
      <td className="centered-cell">{card.elements.RECALL_COST}</td>
      <td className="attributes-cell">
        🌲{card.elements.FOREST_POWER} ⛰️{card.elements.MOUNTAIN_POWER} 🌊{card.elements.OCEAN_POWER}
      </td>
      <td className="effect-cell">
        {formatEffect(card.elements.MAIN_EFFECT)}
      </td>
      <td className="effect-cell">
        {formatEffect(card.elements.ECHO_EFFECT)}
      </td>
    </>
  );
};

export default CardDisplay;

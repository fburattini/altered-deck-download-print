import React from 'react';
import { Card } from '../types';

interface CardPreviewProps {
    hoveredCard: Card | null;
}

const CardPreview: React.FC<CardPreviewProps> = ({ hoveredCard }) => {
    const formatEffect = (effect?: string) => {
        if (!effect) return 'None';
        // Replace game symbols with readable text
        return effect
            .replace(/\{(\w+)\}/g, '[$1]')
            .replace(/\[\[(\w+)\]\]/g, '[$1]');
    };

    const getFactionColor = (faction: string) => {
        const colors: Record<string, string> = {
            'AX': '#2563eb', // Axiom - Blue
            'BR': '#c32637', // Bravos - Red
            'LY': '#16a34a', // Lyra - Green
            'MU': '#9333ea', // Muna - Purple
            'OR': '#ea580c', // Ordis - Orange
            'YZ': '#eab308'  // Yzmir - Yellow
        };
        return colors[faction] || '#6b7280'; // Default to gray
    };

    return (
        <div className="card-preview-sidebar">
            {hoveredCard ? (
                <div className="card-preview-content">
                    <div className="card-preview-header">
                        <h3>Card Preview</h3>
                    </div>
                    <div className="card-preview-image">
                        <img
                            src={hoveredCard.imagePath}
                            alt={`${hoveredCard.name} card preview`}
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>
                    <div className="card-details">
                        <div className="card-detail-section">
                            <h4 className="card-detail-title">
                                {hoveredCard.name} | {' '}
                                 <a
                                    href={`https://www.altered.gg/cards/${hoveredCard.reference}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {hoveredCard.reference}
                                </a>
                            </h4>
                            <div className="card-detail-subtitle">
                                <span className="faction-badge" style={{ backgroundColor: getFactionColor(hoveredCard.mainFaction.reference) }}>
                                    {hoveredCard.mainFaction.name}
                                </span>
                                <span className="card-type">{hoveredCard.cardType.name}</span>
                                <span className="rarity">{hoveredCard.rarity.name}</span>
                            </div>
                        </div>

                        <div className="card-detail-section">
                            <div className="stats-grid">
                                <div className="stat-item">
                                    <span className="stat-label">Main Cost:</span>
                                    <span className="stat-value">{hoveredCard.elements.MAIN_COST}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Recall Cost:</span>
                                    <span className="stat-value">{hoveredCard.elements.RECALL_COST}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">🌲 Forest:</span>
                                    <span className="stat-value">{hoveredCard.elements.FOREST_POWER}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">⛰️ Mountain:</span>
                                    <span className="stat-value">{hoveredCard.elements.MOUNTAIN_POWER}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">🌊 Ocean:</span>
                                    <span className="stat-value">{hoveredCard.elements.OCEAN_POWER}</span>
                                </div>
                            </div>
                        </div>

                        <div className="card-detail-section">
                            <div className="effect-section">
                                <h5>Main Effect</h5>
                                <p className="effect-text">{formatEffect(hoveredCard.elements.MAIN_EFFECT)}</p>
                            </div>
                            <div className="effect-section">
                                <h5>Echo Effect</h5>
                                <p className="effect-text">{formatEffect(hoveredCard.elements.ECHO_EFFECT)}</p>
                            </div>
                        </div>

                        {hoveredCard.pricing && (
                            <div className="card-detail-section">
                                <div className="pricing-section">
                                    <h5>Market Info</h5>
                                    <div className="pricing-grid">
                                        <div className="price-item">
                                            <span className="price-label">Price:</span>
                                            <span className="price-value">${hoveredCard.pricing.lowerPrice.toFixed(2)}</span>
                                        </div>
                                        <div className="price-item">
                                            <span className="price-label">Available:</span>
                                            <span className="price-value">{hoveredCard.pricing.numberCopyAvailable}</span>
                                        </div>
                                        <div className="price-item">
                                            <span className="price-label">In Sale:</span>
                                            <span className="price-value">{hoveredCard.pricing.inSale ? 'Yes' : 'No'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="card-detail-section">
                            <div className="card-actions">
                                <a
                                    href={`https://www.altered.gg/cards/${hoveredCard.reference}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="view-on-altered-btn"
                                >
                                    View on Altered
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                                        <polyline points="15,3 21,3 21,9"/>
                                        <line x1="10" y1="14" x2="21" y2="3"/>
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="card-preview-placeholder">
                    <div className="placeholder-content">
                        <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p>Hover over a card to preview</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CardPreview;

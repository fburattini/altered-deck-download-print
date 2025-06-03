import React, { memo, useState } from 'react';
import { Card } from '../types';
import { FACTION_COLORS } from '../services/utils';
import '../styles/CardGridView.scss';

interface CardGridViewProps {
	cards: Card[];
	onCardHover?: (card: Card | null) => void;
}

const CardGridView: React.FC<CardGridViewProps> = ({ cards, onCardHover }) => {
	return (
		<div className="card-grid-view">
			{cards.map((card) => <CardTile key={card.id} card={card} onCardHover={onCardHover} />)}
		</div>
	);
};

interface CardTileProps {
	card: Card;
	onCardHover?: (card: Card | null) => void;
}

const CardTile: React.FC<CardTileProps> = ({ card, onCardHover }) => {
	const [copyLinkSuccess, setCopyLinkSuccess] = useState(false);

	const getFactionColor = (faction: string) => {
		return FACTION_COLORS[faction] || '#6b7280';
	};

	const formatPrice = (price?: number) => {
		if (!price) return 'N/A';
		return `$${price.toFixed(2)}`;
	};

	const copyLinkToClipboard = async () => {
		if (!card) return;

		try {
			const cardUrl = `https://www.altered.gg/cards/${card.reference}`;
			await navigator.clipboard.writeText(cardUrl);
			setCopyLinkSuccess(true);
			setTimeout(() => setCopyLinkSuccess(false), 2000);
		} catch (error) {
			console.error('Failed to copy link:', error);
		}
	};

	return (
		<div
			key={card.id}
			className="grid-card-item"
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
									<path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
									<polyline points="15,3 21,3 21,9" />
									<line x1="10" y1="14" x2="21" y2="3" />
								</svg>
								View Original
							</a>
								<button
                                    onClick={copyLinkToClipboard}
                                    className="copy-link-btn"
                                    title="Copy card link to clipboard"
                                    style={{
                                        marginLeft: '8px',
                                        background: copyLinkSuccess ? '#10b981' : '#6b7280',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '4px 8px',
                                        cursor: 'pointer',
                                        fontSize: '11px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        transition: 'background-color 0.2s'
                                    }}
                                >
                                    {copyLinkSuccess ? (
                                        <>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="20,6 9,17 4,12"/>
                                            </svg>
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                                                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.72-1.71"/>
                                            </svg>
                                            Copy Link
                                        </>
                                    )}
                                </button>
						</div>
					</div>
				</div>
			</div>

			{/* Card footer with essential info always visible */}
			<div className="grid-card-footer">
				<div className="footer-left">
					<span className="footer-name">{card.name}</span>
					<span className="footer-rarity">{card.cardSet.reference}</span>
				</div>
				<div className="footer-right">
					<span className="footer-price">
						{formatPrice(card.pricing?.lowerPrice)}
					</span>
				</div>
			</div>
		</div>
	)
}

export default CardGridView;

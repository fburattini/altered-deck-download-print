import React, { memo, useState } from 'react';
import { Card } from '../types';
import { BookmarkEntry } from '../services/searchAPI';
import { FACTION_COLORS } from '../services/utils';
import '../styles/CardGridView.scss';

interface CardGridViewProps {
	cards: Card[];
	onCardHover?: (card: Card | null) => void;
	userBookmarks?: BookmarkEntry[];
	onToggleBookmark?: (card: Card) => Promise<void>;
	isCardBookmarked?: (cardId: string) => boolean;
}

const CardGridView: React.FC<CardGridViewProps> = ({ 
	cards, 
	onCardHover, 
	userBookmarks, 
	onToggleBookmark, 
	isCardBookmarked 
}) => {
	return (
		<div className="card-grid-view">
			{cards.map((card) => (
				<CardTile 
					key={card.id} 
					card={card} 
					onCardHover={onCardHover}
					userBookmarks={userBookmarks}
					onToggleBookmark={onToggleBookmark}
					isCardBookmarked={isCardBookmarked}
				/>
			))}
		</div>
	);
};

interface CardTileProps {
	card: Card;
	onCardHover?: (card: Card | null) => void;
	userBookmarks?: BookmarkEntry[];
	onToggleBookmark?: (card: Card) => Promise<void>;
	isCardBookmarked?: (cardId: string) => boolean;
}

const CardTile: React.FC<CardTileProps> = ({ 
	card, 
	onCardHover, 
	userBookmarks, 
	onToggleBookmark, 
	isCardBookmarked 
}) => {
	const [copyLinkSuccess, setCopyLinkSuccess] = useState(false);

	// Check if this card is bookmarked
	const isBookmarked = isCardBookmarked ? isCardBookmarked(card.id) : false;

	const getFactionColor = (faction: string) => {
		return FACTION_COLORS[faction] || '#6b7280';
	};

	const formatPrice = (price?: number) => {
		if (!price) return 'N/A';
		return `€${price.toFixed(2)}`;
	};

	const formatDate = (dateString?: string) => {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString();
	};

	const formatDateTime = (dateString?: string) => {
		if (!dateString) return 'N/A';
		const date = new Date(dateString);
		return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
	};

	const getPriceChangeIndicator = () => {
		if (!card.scrapeMetadata?.priceHistory || card.scrapeMetadata.priceHistory.length < 2) {
			return null;
		}

		const history = card.scrapeMetadata.priceHistory;
		const currentPrice = history[history.length - 1]?.lowerPrice || 0;
		const previousPrice = history[history.length - 2]?.lowerPrice || 0;

		if (currentPrice === previousPrice) {
			return { icon: '→', color: '#6b7280', text: 'No change' };
		} else if (currentPrice > previousPrice) {
			return { icon: '↗', color: '#ef4444', text: `+€${(currentPrice - previousPrice).toFixed(2)} (€${previousPrice.toFixed(2)})` };
		} else {
			return { icon: '↘', color: '#10b981', text: `-€${(previousPrice - currentPrice).toFixed(2)} (€${previousPrice.toFixed(2)})` };
		}
	};

	const priceChange = getPriceChangeIndicator();

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

	const handleBookmarkToggle = async () => {
		if (onToggleBookmark) {
			await onToggleBookmark(card);
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
							{priceChange && (
								<span
									className="price-change"
									style={{
										color: priceChange.color,
										marginLeft: '8px',
										fontSize: '12px',
										fontWeight: 'bold'
									}}
									title={`Price ${priceChange.text}`}
								>
									{priceChange.icon} {priceChange.text}
								</span>
							)}
						</div>

						{/* Scrape Date Information */}
						{card.scrapeMetadata && (
							<div className="grid-card-scrape-info" style={{
								fontSize: '11px',
								color: '#9ca3af',
								marginTop: '8px',
								borderTop: '1px solid rgba(156, 163, 175, 0.2)',
								paddingTop: '6px'
							}}>
								<div style={{ marginBottom: '3px' }}>
									<span>First scraped: {formatDate(card.scrapeMetadata.firstScrapedAt)}</span>
								</div>
								<div style={{ marginBottom: '3px' }}>
									<span>Last updated: {formatDateTime(card.scrapeMetadata.lastUpdatedAt)}</span>
								</div>
								{card.scrapeMetadata.pricingLastUpdatedAt && (
									<div style={{ marginBottom: '3px' }}>
										<span>Price updated: {formatDateTime(card.scrapeMetadata.pricingLastUpdatedAt)}</span>
									</div>
								)}
								{card.scrapeMetadata.priceHistory && card.scrapeMetadata.priceHistory.length > 0 && (
									<div style={{ fontSize: '10px', opacity: 0.8 }}>
										<span>Price history: {card.scrapeMetadata.priceHistory.length} entries</span>
									</div>
								)}
							</div>
						)}

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
							{onToggleBookmark && (
								<button
									onClick={handleBookmarkToggle}
									className="bookmark-btn"
									title={isBookmarked ? "Remove bookmark" : "Add bookmark"}
									style={{
										marginLeft: '8px',
										background: isBookmarked ? '#f59e0b' : '#6b7280',
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
									<svg width="12" height="12" viewBox="0 0 24 24" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
										<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
									</svg>
									{isBookmarked ? 'Saved' : 'Save'}
								</button>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Card footer with essential info always visible */}
			<div className="grid-card-footer">
				<div className="footer-left">
					<span className="footer-name">{card.name}</span>
					<span className="footer-rarity">{card.cardSet.reference}</span>
					{card.scrapeMetadata?.lastUpdatedAt && (
						<div style={{ 
							fontSize: '10px', 
							color: '#9ca3af',
							marginTop: '2px'
						}}>
							Updated: {formatDateTime(card.scrapeMetadata.lastUpdatedAt)}
						</div>
					)}
				</div>
				<div className="footer-right">
					<span className={`footer-price${priceChange ? ' footer-price-changed' : ''}`}>
						{formatPrice(card.pricing?.lowerPrice)}
						{priceChange && (
							<span
								style={{
									color: priceChange.color,
									marginLeft: '6px',
									fontSize: '11px',
									fontWeight: 'bold'
								}}
								title={`Price ${priceChange.text}`}
							>
								{priceChange.icon}
							</span>
						)}
					</span>
				</div>
			</div>
		</div>
	)
}

export default CardGridView;

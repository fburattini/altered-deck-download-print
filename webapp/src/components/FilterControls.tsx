import React from 'react';
import { Card } from '../types';
import '../styles/FilterControls.scss';

export interface FilterControlsProps {
	cards: Card[];
	onFilteredCards: (cards: Card[]) => void;
	isCardBookmarked?: (cardId: string) => boolean;
}

export interface FilterOptions {
	showBookmarkedOnly: boolean;
	showPricingChangesOnly: boolean;
	showNewCardsOnly: boolean;
}

const FilterControls: React.FC<FilterControlsProps> = ({
	cards,
	onFilteredCards,
	isCardBookmarked
}) => {
	const [filters, setFilters] = React.useState<FilterOptions>({
		showBookmarkedOnly: false,
		showPricingChangesOnly: false,
		showNewCardsOnly: false
	});

	// Apply filters whenever cards or filter options change
	React.useEffect(() => {
		let filteredCards = [...cards];

		// Filter by bookmarked cards
		if (filters.showBookmarkedOnly && isCardBookmarked) {
			filteredCards = filteredCards.filter(card => isCardBookmarked(card.id));
		}

		// Filter by cards with pricing changes
		if (filters.showPricingChangesOnly) {
			filteredCards = filteredCards.filter(card => {
				return card.scrapeMetadata?.changeType === 'pricing_changed';
			});
		}

		// Filter by new cards
		if (filters.showNewCardsOnly) {
			filteredCards = filteredCards.filter(card => {
				return card.scrapeMetadata?.changeType === 'new';
			});
		}

		onFilteredCards(filteredCards);
	}, [cards, filters, isCardBookmarked, onFilteredCards]);

	const handleFilterChange = (filterKey: keyof FilterOptions, value: boolean) => {
		setFilters(prev => ({
			...prev,
			[filterKey]: value
		}));
	};

	const clearAllFilters = () => {
		setFilters({
			showBookmarkedOnly: false,
			showPricingChangesOnly: false,
			showNewCardsOnly: false
		});
	};

	const getActiveFilterCount = () => {
		let count = 0;
		if (filters.showBookmarkedOnly) count++;
		if (filters.showPricingChangesOnly) count++;
		if (filters.showNewCardsOnly) count++;
		return count;
	};

	// Get count of bookmarked cards
	const bookmarkedCount = isCardBookmarked 
		? cards.filter(card => isCardBookmarked(card.id)).length 
		: 0;

	// Get count of cards with pricing changes
	const pricingChangesCount = cards.filter(card => {
		return card.scrapeMetadata?.changeType === 'pricing_changed';
	}).length;

	// Get count of new cards
	const newCardsCount = cards.filter(card => {
		return card.scrapeMetadata?.changeType === 'new';
	}).length;

	return (
		<div className="filter-controls">
			<div className="filter-options">
				<label className="filter-option">
					<input
						type="checkbox"
						checked={filters.showBookmarkedOnly}
						onChange={(e) => handleFilterChange('showBookmarkedOnly', e.target.checked)}
						className="filter-checkbox"
					/>
					<span className="filter-label">
						<svg className="bookmark-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path>
						</svg>
						Bookmarked
						{bookmarkedCount > 0 && (
							<span className="count-badge">{bookmarkedCount}</span>
						)}
					</span>
				</label>

				<label className="filter-option">
					<input
						type="checkbox"
						checked={filters.showPricingChangesOnly}
						onChange={(e) => handleFilterChange('showPricingChangesOnly', e.target.checked)}
						className="filter-checkbox"
					/>
					<span className="filter-label">
						<svg className="price-change-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<path d="M3 3v5h5"></path>
							<path d="m3 8 9-5 2.5 2.5"></path>
							<path d="M21 21v-5h-5"></path>
							<path d="m21 16-9 5-2.5-2.5"></path>
						</svg>
						Price Changes (Last Scrape)
						{pricingChangesCount > 0 && (
							<span className="count-badge">{pricingChangesCount}</span>
						)}
					</span>
				</label>

				<label className="filter-option">
					<input
						type="checkbox"
						checked={filters.showNewCardsOnly}
						onChange={(e) => handleFilterChange('showNewCardsOnly', e.target.checked)}
						className="filter-checkbox"
					/>
					<span className="filter-label">
						<svg className="new-card-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<path d="M8 2v4"></path>
							<path d="M16 2v4"></path>
							<rect x="3" y="4" width="18" height="18" rx="2"></rect>
							<path d="M3 10h18"></path>
							<path d="M10 16h4"></path>
						</svg>
						New Cards (Last Scrape)
						{newCardsCount > 0 && (
							<span className="count-badge">{newCardsCount}</span>
						)}
					</span>
				</label>

				{getActiveFilterCount() > 0 && (
					<button
						onClick={clearAllFilters}
						className="clear-filters-btn"
						title="Clear all filters"
					>
						Clear ({getActiveFilterCount()})
					</button>
				)}
			</div>
		</div>
	);
};

export default FilterControls;

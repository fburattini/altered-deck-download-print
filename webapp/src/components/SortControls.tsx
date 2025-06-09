import React from 'react';
import { Card } from '../types';
import '../styles/SortControls.scss';

export type SortOption = 'name' | 'mainCost' | 'price' | 'rarity' | 'faction' | 'priceChange';
export type SortDirection = 'asc' | 'desc';

export interface SortControlsProps {
	sortBy: SortOption;
	sortDirection: SortDirection;
	onSortChange: (option: SortOption) => void;
	onDirectionToggle: () => void;
}

// Helper function to calculate price change magnitude for sorting
export const getPriceChangeMagnitude = (card: Card): number => {
	if (!card.scrapeMetadata?.priceHistory || card.scrapeMetadata.priceHistory.length < 2) {
		return 0; // No change if no price history
	}

	const history = card.scrapeMetadata.priceHistory;
	const currentPrice = history[history.length - 1]?.lowerPrice || 0;
	const previousPrice = history[history.length - 2]?.lowerPrice || 0;

	// Return the absolute difference for sorting by magnitude
	return Math.abs(currentPrice - previousPrice);
};

// Sort cards function
export const sortCards = (cards: Card[], sortBy: SortOption, sortDirection: SortDirection): Card[] => {
	return [...cards].sort((a, b) => {
		let valueA: string | number;
		let valueB: string | number;

		switch (sortBy) {
			case 'name':
				valueA = a.name.toLowerCase();
				valueB = b.name.toLowerCase();
				break;
			case 'mainCost':
				valueA = parseInt(a.elements?.MAIN_COST || '0');
				valueB = parseInt(b.elements?.MAIN_COST || '0');
				break;
			case 'price':
				valueA = a.pricing?.lowerPrice || 0;
				valueB = b.pricing?.lowerPrice || 0;
				break;
			case 'rarity':
				valueA = a.rarity?.name?.toLowerCase() || '';
				valueB = b.rarity?.name?.toLowerCase() || '';
				break;
			case 'faction':
				valueA = a.mainFaction?.name?.toLowerCase() || '';
				valueB = b.mainFaction?.name?.toLowerCase() || '';
				break;
			case 'priceChange':
				valueA = getPriceChangeMagnitude(a);
				valueB = getPriceChangeMagnitude(b);
				break;
			default:
				valueA = a.name.toLowerCase();
				valueB = b.name.toLowerCase();
		}

		if (typeof valueA === 'string' && typeof valueB === 'string') {
			return sortDirection === 'asc'
				? valueA.localeCompare(valueB)
				: valueB.localeCompare(valueA);
		} else {
			return sortDirection === 'asc'
				? (valueA as number) - (valueB as number)
				: (valueB as number) - (valueA as number);
		}
	});
};

const SortControls: React.FC<SortControlsProps> = ({
	sortBy,
	sortDirection,
	onSortChange,
	onDirectionToggle
}) => {
	return (
		<div className="sort-controls">
			
			<div className="sort-dropdown-container">
				<select
					value={sortBy}
					onChange={(e) => onSortChange(e.target.value as SortOption)}
					className="sort-dropdown"
				>
					<option value="price">💰 Price</option>
					<option value="mainCost">⚡ Main Cost</option>
					<option value="faction">⚔️ Faction</option>
					<option value="priceChange">📈 Price Change</option>
				</select>
			</div>

			<button
				onClick={onDirectionToggle}
				className="sort-direction-button"
				title={`Sort ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
			>
				<span className="sort-direction-icon">
					{sortDirection === 'asc' ? '⬆️' : '⬇️'}
				</span>
				<span className="sort-direction-text">
					{sortDirection === 'asc' ? 'Asc' : 'Desc'}
				</span>
			</button>
		</div>
	);
};

export default SortControls;

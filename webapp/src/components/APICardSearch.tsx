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

const APICardSearch: React.FC<APICardSearchProps> = ({ onSearchResults }) => {
	const [filters, setFilters] = useState<LocalFilters>({
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
	}; const clearAllFilters = () => {
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
	return (
		<form onSubmit={handleFormSubmit} className="search-form">
			<div className="search-header">
				<h2 className="search-title">Search Cards</h2>
				<p className="search-subtitle">Showing only UNIQUE rarity cards</p>
				{isSearching && (
					<div className="loading-indicator">
						<div className="loading-spinner"></div>
						Searching...
					</div>
				)}
			</div>

			{/* Search Status */}
			{!isSearching && hasSearched && searchError === null && (
				<div className="status-ready">
					<strong>Ready:</strong> Adjust filters and click "Search Cards" to find new results
				</div>
			)}

			{/* Search Error */}
			{searchError && (
				<div className="status-error">
					<strong>Search Error:</strong> {searchError}
				</div>
			)}

			{/* Search Input */}
			<div className="search-input-container">
				<MagnifyingGlassIcon className="search-icon" />
				<input
					type="text"
					placeholder="Search by name, effect, or keyword..."
					value={filters.searchQuery}
					onChange={(e) => updateFilter('searchQuery', e.target.value)}
					className="search-input"
				/>
			</div>
			<div className="filters-section">
				{/* Faction Filter */}
				<div className="filter-group">
					<label className="filter-label">Faction</label>
					<div className="filter-buttons">
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
								type="button"
								onClick={() => toggleArrayFilter('factions', faction.ref)}
								className={`filter-button ${filters.factions.includes(faction.ref) ? 'active' : ''}`}
							>
								{faction.name}
							</button>
						))}
					</div>
				</div>

				{/* Main Cost Range */}
				<div className="filter-group">
					<label className="filter-label">Main Cost</label>
					<div className="cost-range">
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
							className="cost-input"
						/>
						<span className="cost-separator">to</span>
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
							className="cost-input"
						/>
					</div>
				</div>

				{/* In Sale Only */}
				<div className="checkbox-group">
					<input
						type="checkbox"
						id="inSaleOnly"
						checked={filters.inSaleOnly}
						onChange={(e) => updateFilter('inSaleOnly', e.target.checked)}
						className="checkbox"
					/>
					<label htmlFor="inSaleOnly" className="checkbox-label">
						Show only cards for sale
					</label>
				</div>
			</div>

			{/* Search Button */}
			<button
				type="button"
				onClick={handleSearch}
				disabled={isSearching}
				className="search-button"
			>
				{isSearching ? (
					<>
						<div className="loading-spinner"></div>
						Searching...
					</>
				) : (
					<>
						<MagnifyingGlassIcon className="search-button-icon" />
						Search Cards
					</>
				)}
			</button>

			{/* Clear Filters */}
			<button
				type="button"
				onClick={clearAllFilters}
				className="clear-button"
			>
				Clear All Filters
			</button>
		</form>
	);
};

export default APICardSearch;

import React, { useState, useCallback } from 'react';
import { Card } from '../types';
import { searchAPI, APISearchFilters, APISearchOptions, APIScrapeFilters } from '../services/searchAPI';
import { MagnifyingGlassIcon, CloudArrowDownIcon } from '@heroicons/react/24/outline'; // Added CloudArrowDownIcon

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
	const [isScraping, setIsScraping] = useState(false);
	const [scrapeMessage, setScrapeMessage] = useState<string | null>(null);
	const [scrapeError, setScrapeError] = useState<string | null>(null);
	const [bearerTokenInput, setBearerTokenInput] = useState<string>(''); // State for the token input

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

	// Function to handle scrape request
	const handleScrape = useCallback(async () => {
		if (isScraping) return;

		setIsScraping(true);
		setScrapeMessage(null);
		setScrapeError(null);

		try {
			const scrapeFilters: APIScrapeFilters = {};

			if (filters.searchQuery.trim()) {
				scrapeFilters.CARD_NAME = filters.searchQuery.trim();
			}
			if (filters.factions.length === 1) { // Assuming only one faction for scrape for simplicity
				scrapeFilters.FACTION = filters.factions[0];
			}

			if (filters.mainCostRange.min !== undefined || filters.mainCostRange.max !== undefined) {
				const min = filters.mainCostRange.min;
				const max = filters.mainCostRange.max;
				if (min !== undefined && max !== undefined && min === max) {
					scrapeFilters.MAIN_COST = `${min}`;
				} else if (min !== undefined && max !== undefined) {
					scrapeFilters.MAIN_COST = `${min}-${max}`;
				} else if (min !== undefined) {
					scrapeFilters.MAIN_COST = `${min}`;
				} else if (max !== undefined) {
					// If only max is set, backend might need a range like "1-max" or just max depending on its logic.
					// For now, sending just max. Adjust if backend expects a range.
					scrapeFilters.MAIN_COST = `${max}`;
				}
			}

			// You might want to add default RARITY and ONLY_FOR_SALE here if the backend expects them
			// e.g., scrapeFilters.RARITY = 'UNIQUE';
			// scrapeFilters.ONLY_FOR_SALE = true;

			console.log('🚀 Performing API scrape with filters:', scrapeFilters, 'and token:', bearerTokenInput || '(using backend default)');
			const response = await searchAPI.scrapeCards(scrapeFilters, bearerTokenInput || undefined);

			if (response.success) {
				setScrapeMessage(response.message || 'Scrape initiated successfully.');
			} else {
				throw new Error(response.error || 'Scrape failed');
			}

		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Scrape operation failed';
			setScrapeError(errorMessage);
		} finally {
			setIsScraping(false);
		}
	}, [filters, isScraping, bearerTokenInput]); // Added bearerTokenInput to dependencies

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
				{isScraping && (
					<div className="loading-indicator">
						<div className="loading-spinner"></div>
						Scraping data...
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

			{/* Scrape Status/Error Messages */}
			{scrapeMessage && (
				<div className="status-success">
					{scrapeMessage}
				</div>
			)}
			{scrapeError && (
				<div className="status-error">
					<strong>Scrape Error:</strong> {scrapeError}
				</div>
			)}

			{/* Bearer Token Input for Scrape */}
			<div className="filter-group">
				<label htmlFor="bearerTokenInput" className="filter-label">Bearer Token (Optional for Scrape)</label>
				<input
					id="bearerTokenInput"
					type="text"
					placeholder="Enter Bearer Token (or leave blank)"
					value={bearerTokenInput}
					onChange={(e) => setBearerTokenInput(e.target.value)}
					className="search-input" // Reuse search-input style or create a new one
					disabled={isScraping || isSearching}
				/>
			</div>

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
								// Disable multi-select for factions if scrape only supports one
								disabled={isScraping && filters.factions.length > 0 && !filters.factions.includes(faction.ref)}
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

				{/* Action Buttons */}
				<div className="action-buttons">
					<button type="submit" className="search-button" disabled={isSearching || isScraping}>
						<MagnifyingGlassIcon />
						{isSearching ? 'Searching...' : 'Search Cards'}
					</button>
					<button type="button" onClick={handleScrape} className="scrape-button" disabled={isSearching || isScraping}>
						<CloudArrowDownIcon />
						{isScraping ? 'Scraping...' : 'Fetch Cards'}
					</button>
					<button type="button" onClick={clearAllFilters} className="clear-button" disabled={isSearching || isScraping}>
						Clear Filters
					</button>
				</div>
			</div>
		</form>
	);
};

export default APICardSearch;

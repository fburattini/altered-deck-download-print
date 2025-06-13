import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Card } from '../types';
import { searchAPI, APISearchFilters, APISearchOptions, APIScrapeFilters } from '../services/searchAPI';
import { MagnifyingGlassIcon, CloudArrowDownIcon, EyeIcon } from '@heroicons/react/24/outline';
import ConfirmationPopup from './ConfirmationPopup';
import { FACTIONS } from '../services/utils';

export interface APICardSearchRef {
	triggerSearch: (cardName: string, faction: string, mainCost?: number[]) => void;
}

interface APICardSearchProps {
	onSearchResults: (cards: Card[], isLoading: boolean, error?: string) => void;
	bearerToken?: string;
	// Watchlist props
	currentUserId?: string;
	userIdValid?: boolean;
	onToggleWatchlist?: (cardName: string, faction: string, mainCost: number[]) => Promise<void>;
	isCardInWatchlist: (cardName: string, faction: string) => boolean
}

interface LocalFilters {
	searchQuery: string;
	mainEffect: string;
	factions: string[];
	cardType: string[];
	mainCostRange: { min?: number; max?: number };
	recallCostRange: { min?: number; max?: number };
	priceRange: { min?: number; max?: number };
	inSaleOnly: boolean;
}

const APICardSearch = forwardRef<APICardSearchRef, APICardSearchProps>(({ onSearchResults, bearerToken, currentUserId, userIdValid, onToggleWatchlist, isCardInWatchlist }, ref) => {
	const [filters, setFilters] = useState<LocalFilters>({
		searchQuery: '',
		mainEffect: '',
		factions: [],
		cardType: [],
		mainCostRange: {},
		recallCostRange: {},
		priceRange: {},
		inSaleOnly: true
	});

	const [isSearching, setIsSearching] = useState(false);
	const [searchError, setSearchError] = useState<string | null>(null);
	const [hasSearched, setHasSearched] = useState(false);
	const [isScraping, setIsScraping] = useState(false);
	const [scrapeMessage, setScrapeMessage] = useState<string | null>(null);
	const [scrapeError, setScrapeError] = useState<string | null>(null);
	const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
	const [searchResults, setSearchResults] = useState<Card[]>([]);

	const sample = searchResults?.[0]
	const isInWatchlist = isCardInWatchlist(sample?.name, sample?.mainFaction.reference)

	// Manual search function triggered by button
	const performSearch = useCallback(async (currentFilters: LocalFilters) => {
		setIsSearching(true);
		setSearchError(null);

		try {			// Convert local filters to API format
			const apiFilters: APISearchFilters = {};
			const apiOptions: APISearchOptions = {
				resultLimit: 0, // Get all results
				sortByPrice: true,
				inSaleOnly: false // Disable the legacy inSaleOnly option
			};			// Convert search query to name filter (required)
			apiFilters.name = currentFilters.searchQuery.trim();

			// Convert main effect filter
			if (currentFilters.mainEffect.trim()) {
				apiFilters.mainEffect = currentFilters.mainEffect.trim();
			}

			// Always filter for UNIQUE rarity
			apiFilters.rarity = 'UNIQUE';

			// Convert inSaleOnly to inSale filter
			if (currentFilters.inSaleOnly) {
				apiFilters.inSale = true;
			}

			// Convert faction filter 
			if (currentFilters.factions.length === 1) {
				apiFilters.faction = currentFilters.factions[0];
			}			// Convert main cost range to string
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

			// Convert recall cost range to string
			if (currentFilters.recallCostRange.min !== undefined || currentFilters.recallCostRange.max !== undefined) {
				const min = currentFilters.recallCostRange.min;
				const max = currentFilters.recallCostRange.max;

				if (min !== undefined && max !== undefined) {
					apiFilters.recallCost = `${min}-${max}`;
				} else if (min !== undefined) {
					apiFilters.recallCost = `${min}`;
				} else if (max !== undefined) {
					apiFilters.recallCost = `1-${max}`;
				}
			}

			console.log('🔍 Performing API search with filters:', apiFilters, apiOptions);

			const response = await searchAPI.searchCards(apiFilters, apiOptions);
			if (response.success) {
				const cards = response.data.map(result => result.card);
				setSearchResults(cards); // Store results locally
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

	// Expose triggerSearch function to parent components
	useImperativeHandle(ref, () => ({
		triggerSearch: (cardName: string, faction: string, mainCost?: number[]) => {
			// Update filters with the card name, faction, and main cost
			const updatedFilters: LocalFilters = {
				...filters,
				searchQuery: cardName,
				factions: [faction],
				// Set main cost range if provided
				mainCostRange: mainCost && mainCost.length > 0 ? {
					min: Math.min(...mainCost),
					max: Math.max(...mainCost)
				} : filters.mainCostRange
			};
			
			// Trigger the search with updated filters
			performSearch(updatedFilters);
			
			// Update the UI state to reflect the new search
			setFilters(updatedFilters);
		}
	}), [filters, performSearch]);

	// Function to handle scrape request
	const handleScrape = useCallback(async () => {
		if (isScraping) return;

		// Validate required fields
		if (!filters.searchQuery.trim()) {
			setScrapeError('Card name is required for scraping.');
			return;
		}

		if (filters.mainCostRange.min === undefined && filters.mainCostRange.max === undefined) {
			setScrapeError('Main cost range is required for scraping.');
			return;
		}

		if (filters.factions.length === 0) {
			setScrapeError('A faction must be selected for scraping.');
			return;
		}

		if (!bearerToken?.trim()) {
			setScrapeError('Bearer token is required for scraping.');
			return;
		}

		setIsScraping(true);
		setScrapeMessage(null);
		setScrapeError(null);

		try {
			const scrapeFilters: APIScrapeFilters = {};

			// Name is required (already validated above)
			scrapeFilters.CARD_NAME = filters.searchQuery.trim();
			if (filters.mainEffect.trim()) {
				scrapeFilters.MAIN_EFFECT = filters.mainEffect.trim();
			} if (filters.factions.length === 1) { // Assuming only one faction for scrape for simplicity
				scrapeFilters.FACTION = filters.factions[0];
			}

			// Main cost is required (already validated above)
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

			if (filters.recallCostRange.min !== undefined || filters.recallCostRange.max !== undefined) {
				const min = filters.recallCostRange.min;
				const max = filters.recallCostRange.max;
				if (min !== undefined && max !== undefined && min === max) {
					scrapeFilters.RECALL_COST = `${min}`;
				} else if (min !== undefined && max !== undefined) {
					scrapeFilters.RECALL_COST = `${min}-${max}`;
				} else if (min !== undefined) {
					scrapeFilters.RECALL_COST = `${min}`;
				} else if (max !== undefined) {
					scrapeFilters.RECALL_COST = `${max}`;
				}
			}

			// You might want to add default RARITY and ONLY_FOR_SALE here if the backend expects them
			// e.g., scrapeFilters.RARITY = 'UNIQUE';
			// scrapeFilters.ONLY_FOR_SALE = true;

			console.log('🚀 Performing API scrape with filters:', scrapeFilters, 'and token:', bearerToken || '(using backend default)');
			const response = await searchAPI.scrapeCards(scrapeFilters, bearerToken || undefined);
			if (response.success) {
				const baseMessage = response.message || 'Scrape completed successfully.';
				let detailedMessage = baseMessage;

				if (response.cardsFound !== undefined) {
					detailedMessage += `\n\n📊 Results Summary:`;
					detailedMessage += `\n• Total cards found: ${response.cardsFound}`;

					// Add detailed breakdown of changes
					if (response.newCards !== undefined && response.newCards > 0) {
						detailedMessage += `\n• New cards added: ${response.newCards}`;
					}
					if (response.cardsWithPricingChanges !== undefined) {
						detailedMessage += `\n• Pricing updates: ${response.cardsWithPricingChanges}`;
					}
					if (response.cardsWithoutChanges !== undefined && response.cardsWithoutChanges > 0) {
						detailedMessage += `\n• Unchanged cards: ${response.cardsWithoutChanges}`;
					}
				}

				setScrapeMessage(detailedMessage);
				setShowConfirmationPopup(true);
				handleSearch();
			} else {
				throw new Error(response.error || 'Scrape failed');
			}

		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Scrape operation failed';
			setScrapeError(errorMessage);
		} finally {
			setIsScraping(false);
		}
	}, [filters, isScraping, bearerToken]); // Updated dependency

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
			mainEffect: '',
			factions: [],
			cardType: [],
			mainCostRange: {},
			recallCostRange: {},
			priceRange: {},
			inSaleOnly: true
		});
	};

	// Handle form submission (Enter key)
	const handleFormSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		handleSearch();
	};

	const handleCloseConfirmationPopup = () => {
		setShowConfirmationPopup(false);
		setScrapeMessage(null);
	};

	// Function to add current search to watchlist
	const handleAddSearchToWatchlist = async () => {
		if (!onToggleWatchlist || !currentUserId || !userIdValid) return;

		// Validate that we have search results with actual card names
		if (searchResults.length === 0) return;

		// Validate required fields for watchlist entry
		if (filters.factions.length !== 1) return;
		if (filters.mainCostRange.min === undefined && filters.mainCostRange.max === undefined) return;

		try {
			// Build main cost array based on the range
			const mainCostArray: number[] = [];
			const min = filters.mainCostRange.min;
			const max = filters.mainCostRange.max;

			if (min !== undefined && max !== undefined) {
				// Add all values in range
				for (let i = min; i <= max; i++) {
					mainCostArray.push(i);
				}
			} else if (min !== undefined) {
				// Only min specified
				mainCostArray.push(min);
			} else if (max !== undefined) {
				// Only max specified
				mainCostArray.push(max);
			}

			// Add all cards from search results to watchlist
			const sample = searchResults[0]
			if (sample && sample.name) {
				await onToggleWatchlist(
					sample.name,
					filters.factions[0],
					mainCostArray
				);
			}
		} catch (error) {
			console.error('Failed to add search results to watchlist:', error);
		}
	};

	return (
		<div className="top-search-layout">
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

				{/* Search Error */}
				{searchError && (
					<div className="status-error">
						<strong>Search Error:</strong> {searchError}
					</div>
				)}

				{/* Scrape Error Messages */}
				{scrapeError && (
					<div className="status-error">
						<strong>Scrape Error:</strong> {scrapeError}
					</div>
				)}

				<div className="search-inputs-row">
					<div className="search-input-container">
						<label htmlFor="searchQuery" className="filter-label">Card Name <span style={{ fontSize: '0.75rem' }}>(required)</span></label>
						<MagnifyingGlassIcon className="search-icon" />
						<input
							id="searchQuery"
							type="text"
							placeholder="Search by card name..."
							value={filters.searchQuery}
							onChange={(e) => updateFilter('searchQuery', e.target.value)}
							className="base-input base-input-icon"
						/>
					</div>

					<div className="search-input-container">
						<label htmlFor="mainEffect" className="filter-label">Main Effect</label>
						<input
							id="mainEffect"
							type="text"
							placeholder="Search by main effect text..."
							value={filters.mainEffect}
							onChange={(e) => updateFilter('mainEffect', e.target.value)}
							className="base-input"
						/>
					</div>
				</div>
				<div className="filters-section">
					{/* Faction Filter */}
					<div className="filter-group">
						<label className="filter-label">Faction</label>
						<div className="filter-buttons">
							{FACTIONS.map(faction => {
								const isSelected = filters.factions.includes(faction.ref)
								return (
									<button
										key={faction.ref}
										type="button"
										onClick={() => toggleArrayFilter('factions', faction.ref)}
										className={`filter-button ${isSelected ? 'active' : ''}`}
										style={{
											backgroundColor: `${isSelected ? faction.color : ''}`,
											border: `${isSelected ? `1px solid ${faction.color}` : ''}`,
										}}
										// Disable multi-select for factions if scrape only supports one
										disabled={isScraping && filters.factions.length > 0 && !isSelected}
									>
										{faction.name}
									</button>
								)
							})}
						</div>
					</div>
					{/* Main Cost Range */}
					<div className="filter-group">
						<label className="filter-label">Main Cost <span style={{ fontSize: '0.75rem' }}>(required for scraping)</span></label>
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

					{/* Recall Cost Range */}
					<div className="filter-group">
						<label className="filter-label">Recall Cost</label>
						<div className="cost-range">
							<input
								type="number"
								placeholder="Min"
								min="0"
								max="10"
								value={filters.recallCostRange.min || ''}
								onChange={(e) => updateFilter('recallCostRange', {
									...filters.recallCostRange,
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
								value={filters.recallCostRange.max || ''}
								onChange={(e) => updateFilter('recallCostRange', {
									...filters.recallCostRange,
									max: e.target.value ? parseInt(e.target.value) : undefined
								})}
								className="cost-input"
							/>
						</div>
					</div>
					<div className="action-buttons">
						<button
							type="submit"
							className="search-button"
							disabled={
								isSearching ||
								isScraping
								// !filters.searchQuery.trim()
							}
							title={
								!filters.searchQuery.trim() ? 'Card name is required for searching' : ''
							}
						>
							<MagnifyingGlassIcon />
							{isSearching ? 'Searching...' : 'Search Cards'}
						</button>
						<button
							type="button"
							onClick={handleScrape}
							className="scrape-button"
							disabled={
								isSearching ||
								isScraping ||
								!filters.searchQuery.trim() ||
								(filters.mainCostRange.min === undefined && filters.mainCostRange.max === undefined) ||
								filters.factions.length === 0 ||
								!bearerToken?.trim()
							}
							title={
								!filters.searchQuery.trim() ? 'Card name is required for scraping' :
									(filters.mainCostRange.min === undefined && filters.mainCostRange.max === undefined) ? 'Main cost range is required for scraping' :
										filters.factions.length === 0 ? 'A faction must be selected for scraping' :
											!bearerToken?.trim() ? 'Bearer token is required for scraping. Please set it in Settings.' :
												''
							}
						>
							<CloudArrowDownIcon />
							{isScraping ? 'Scraping...' : 'Scrape Cards'}
						</button>
						{isScraping &&
							<div style={{ display: 'flex', alignItems: 'center' }}>
								<div className="spinner"></div>
							</div>}
						<button
							type="button"
							onClick={handleAddSearchToWatchlist}
							className="watchlist-button"
							disabled={
								isSearching ||
								isScraping ||
								filters.factions.length !== 1 ||
								(filters.mainCostRange.min === undefined && filters.mainCostRange.max === undefined)
							}
							title={
								filters.factions.length !== 1 ? 'Exactly one faction must be selected' :
									(filters.mainCostRange.min === undefined && filters.mainCostRange.max === undefined) ? 'Main cost range is required' :
										`${!isInWatchlist ? 'Add' : 'Remove'} card in Watchlist`
							}
						>
							<EyeIcon />
							{!isInWatchlist ? 'Add' : 'Remove'} card in Watchlist
						</button>
						<button type="button" onClick={clearAllFilters} className="clear-button" disabled={isSearching || isScraping}>
							Clear Filters
						</button>
					</div>
				</div>
			</form>

			{/* Confirmation Popup */}
			{showConfirmationPopup && scrapeMessage && (
				<ConfirmationPopup
					message={scrapeMessage}
					onClose={handleCloseConfirmationPopup}
				/>
			)}
		</div>
	);
});

export default APICardSearch;

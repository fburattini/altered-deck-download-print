import React, { useState } from 'react';
import APICardSearch from './components/APICardSearch';
import CardTable from './components/CardTable';
import { Card } from './types';
import './styles/App.scss';

// Sorting options
type SortOption = 'name' | 'mainCost' | 'price' | 'rarity' | 'faction';
type SortDirection = 'asc' | 'desc';

const App: React.FC = () => {
	const [searchResults, setSearchResults] = useState<Card[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [searchError, setSearchError] = useState<string | null>(null);

	// Sorting state
	const [sortBy, setSortBy] = useState<SortOption>('name');
	const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

	// State for hovered/selected card image
	const [hoveredCardImage, setHoveredCardImage] = useState<string | null>(null);

	// Handle search results from APICardSearch component
	const handleSearchResults = (cards: Card[], loading: boolean, error?: string) => {
		setSearchResults(cards);
		setIsLoading(loading);
		setSearchError(error || null);
	};

	// Apply sorting to search results
	const sortedResults = [...searchResults].sort((a, b) => {
		let comparison = 0;

		switch (sortBy) {
			case 'name':
				comparison = a.name.localeCompare(b.name);
				break;
			case 'mainCost':
				comparison = parseInt(a.elements.MAIN_COST) - parseInt(b.elements.MAIN_COST);
				break;
			case 'price':
				const priceA = a.pricing?.lowerPrice || 0;
				const priceB = b.pricing?.lowerPrice || 0;
				comparison = priceA - priceB;
				break;
			case 'rarity':
				const rarityOrder = { 'COMMON': 1, 'RARE': 2, 'UNIQUE': 3 };
				const rarityA = rarityOrder[a.rarity.reference as keyof typeof rarityOrder] || 0;
				const rarityB = rarityOrder[b.rarity.reference as keyof typeof rarityOrder] || 0;
				comparison = rarityA - rarityB;
				break;
			case 'faction':
				comparison = a.mainFaction.name.localeCompare(b.mainFaction.name);
				break;
			default:
				comparison = 0;
		}

		return sortDirection === 'desc' ? -comparison : comparison;
	});

	const handleSortChange = (newSortBy: SortOption) => {
		if (newSortBy === sortBy) {
			setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
		} else {
			setSortBy(newSortBy);
			setSortDirection('asc');
		}
	};

	if (isLoading && searchResults.length === 0) {
		return (
			<div className="app-container">
				<div className="loading-state">
					<div className="spinner"></div>
					<p>Loading cards from backend...</p>
				</div>
			</div>
		);
	}	return (
		<div className="app-container">
			{/* Top Search Bar */}
			<div className="top-search-bar">
				<div className="search-section">
					<APICardSearch onSearchResults={handleSearchResults} />
				</div>
			</div>

			{/* Main Content Area */}
			<div className="main-content">
				<div className="results-area">
					{/* Controls Bar */}
					<div className="controls-bar">
						{/* Results Count */}
						<div className="results-count">
							Displaying {sortedResults.length} cards
						</div>

						{/* View and Sort Controls */}
						<div className="control-group">
							{/* Sort Controls */}
							<select
								value={sortBy}
								onChange={(e) => handleSortChange(e.target.value as SortOption)}
							>
								<option value="name">Name</option>
								<option value="mainCost">Main Cost</option>
								<option value="price">Price</option>
								<option value="rarity">Rarity</option>
								<option value="faction">Faction</option>
							</select>

							<button
								onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
								className="sort-button-padding"
							>
								{sortDirection === 'asc' ? '↑' : '↓'}
							</button>
						</div>
					</div>

				{/* Cards Display */}
				{sortedResults.length === 0 && !isLoading ? (
					<div className="no-cards-found">
						<div className="icon-container">
							<svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.083-2.327.653-.71 1.46-1.302 2.364-1.748A7.966 7.966 0 0112 9c2.34 0 4.47.881 6.083 2.327-.653-.71-1.46 1.302-2.364 1.748z" />
							</svg>
						</div>
						<h3 className="title">No cards found</h3>
						<p className="message">Try adjusting your search filters to find cards.</p>
					</div>				) : (
					<>
						{/* Card Table and Image Preview */}
						<CardTable 
							cards={sortedResults}
							hoveredCardImage={hoveredCardImage}
							onCardHover={setHoveredCardImage}
						/>
					</>
				)}
				</div>
			</div>
		</div>
	);
};

export default App;

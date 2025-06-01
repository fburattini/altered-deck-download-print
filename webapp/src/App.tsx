import React, { useState, useEffect } from 'react';
import APICardSearch from './components/APICardSearch';
import CardDisplay from './components/CardDisplay';
import { Card } from './types';
import './styles/App.scss'; // Import the SCSS file

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
	}
	return (
		<div className="app-container">
			<header className="app-header">
				<h1 className="app-title">Altered Card Search</h1>
				<p className="app-subtitle">Backend API Search</p>
			</header>

			<div className="main-layout">
				{/* Search and Filters Sidebar */}
				<div className="search-panel">
					<APICardSearch onSearchResults={handleSearchResults} />
				</div>				{/* Main Content */}
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
							// className removed, will be styled by .control-group select
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
					<div className="no-cards-found"> {/* Updated class */}
						<div className="icon-container"> {/* Updated class */}
							<svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.083-2.327.653-.71 1.46-1.302 2.364-1.748A7.966 7.966 0 0112 9c2.34 0 4.47.881 6.083 2.327-.653-.71-1.46 1.302-2.364 1.748z" />
							</svg>
						</div>
						<h3 className="title">No cards found</h3> {/* Updated class */}
						<p className="message">Try adjusting your search filters to find cards.</p> {/* Updated class */}
					</div>
				) : (
					<>
						{/* Card Table and Image Preview */}
						<div className='table-image-container'> {/* Updated class */}
							{sortedResults.length > 0 && (
								<div className="table-container"> {/* Updated class */}
									<table> {/* Removed min-w-full etc. as it\'s in SCSS now */}
										<thead> {/* Removed bg-gray-50 as it\'s in SCSS now */}
											<tr>
												<th scope="col"> {/* Removed Tailwind classes */}
													Name
												</th>
												<th scope="col" className="text-center"> {/* Added text-center for SCSS */}
													Price
												</th>
												<th scope="col" className="text-center"> {/* Added text-center for SCSS */}
													Main Cost
												</th>
												<th scope="col" className="text-center"> {/* Added text-center for SCSS */}
													Recall Cost
												</th>
												<th scope="col"> {/* Removed Tailwind classes */}
													Attributes
												</th>
												<th scope="col"> {/* Removed Tailwind classes */}
													Main Effect
												</th>
												<th scope="col"> {/* Removed Tailwind classes */}
													Echo Effect
												</th>
											</tr>
										</thead>
										<tbody> {/* Removed bg-white etc. as it\'s in SCSS now */}
											{sortedResults.map((card) => ( // Changed from paginatedCards to sortedResults
												<tr
													key={card.id}
													className="card-display-row" // Retained from previous step
													onMouseEnter={() => setHoveredCardImage(card.imagePath || null)}
													onMouseLeave={() => setHoveredCardImage(null)}
												>
													<CardDisplay card={card} />
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}

							{hoveredCardImage && (
								<div className="image-preview-container">  {/* Updated class */}
									<div className="sticky-image-wrapper"> {/* Updated class */}
										<img
											src={hoveredCardImage}
											alt="Hovered card"
											// className removed, will be styled by .sticky-image-wrapper img
											onError={(e) => {
												(e.target as HTMLImageElement).style.display = 'none';
											}}
										/>
									</div>
								</div>
							)}
						</div>

					</>
				)}
				</div>
			</div>
		</div>
	);
};

export default App;

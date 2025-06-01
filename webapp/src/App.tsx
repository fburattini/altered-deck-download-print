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

	// View options - viewMode is removed, default to table view
	// const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); 
	const [cardsPerPage, setCardsPerPage] = useState(20);
	const [currentPage, setCurrentPage] = useState(1);

	// State for hovered/selected card image
	const [hoveredCardImage, setHoveredCardImage] = useState<string | null>(null);

	// Handle search results from APICardSearch component
	const handleSearchResults = (cards: Card[], loading: boolean, error?: string) => {
		setSearchResults(cards);
		setIsLoading(loading);
		setSearchError(error || null);
		setCurrentPage(1); // Reset to first page when search results change
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

	// Get paginated cards
	const paginatedCards = sortedResults.slice(
		(currentPage - 1) * cardsPerPage,
		currentPage * cardsPerPage
	);

	const totalPages = Math.ceil(sortedResults.length / cardsPerPage);

	const handleSortChange = (newSortBy: SortOption) => {
		if (newSortBy === sortBy) {
			setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
		} else {
			setSortBy(newSortBy);
			setSortDirection('asc');
		}
	};

	// Status component
	const SearchStatus: React.FC = () => {
		if (isLoading) {
			return (
				<div className="status-loading"> {/* Updated class */}
					<div className="spinner-icon"></div> {/* Updated class for spinner */}
					<span className="text">Searching cards...</span> {/* Updated class */}
				</div>
			);
		}

		if (searchError) {
			return (
				<div className="status-error"> {/* Updated class */}
					<div className="icon"> {/* Updated class */}
						<svg viewBox="0 0 20 20" fill="currentColor">
							<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
						</svg>
					</div>
					<div className="content"> {/* Updated class */}
						<h3 className="title">Search Error</h3> {/* Updated class */}
						<p className="message">{searchError}</p> {/* Updated class */}
					</div>
				</div>
			);
		}

		if (searchResults.length > 0) {
			return (
				<div className="status-success"> {/* Updated class */}
					<div className="left-content"> {/* Added wrapper for icon and text */}
						<svg className="icon" fill="currentColor" viewBox="0 0 20 20"> {/* Updated class */}
							<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
						</svg>
						<span className="text">
							Found {searchResults.length.toLocaleString()} cards
						</span> {/* Updated class */}
					</div>
					<div className="powered-by">
						Powered by backend API
					</div> {/* Updated class */}
				</div>
			);
		}

		return null;
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
				<p className="app-subtitle">Backend API Search - UNIQUE Rarity Cards</p>
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
							Showing {((currentPage - 1) * cardsPerPage) + 1}-{Math.min(currentPage * cardsPerPage, sortedResults.length)} of {sortedResults.length} cards
						</div>

						{/* View and Sort Controls */}
						<div className="control-group">
							{/* View Mode Toggle - Removed */}
							{/* <div className="view-toggle">
								<button
									onClick={() => setViewMode('grid')}
									className={viewMode === 'grid' ? 'active' : ''}
								>
									Grid
								</button>
								<button
									onClick={() => setViewMode('list')}
									className={`px-3 py-1 rounded text-sm font-medium ${viewMode === 'list'
										? 'bg-white text-gray-900 shadow-sm'
										: 'text-gray-600 hover:text-gray-900'
										}`}
								>
									List
								</button>
							</div> */}

							{/* Sort Controls */}
							<select
								value={sortBy}
								onChange={(e) => setSortBy(e.target.value as SortOption)}
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
								className="sort-button-padding" // Updated class for specific padding
							>
								{sortDirection === 'asc' ? '↑' : '↓'}
							</button>

							{/* Cards per page */}
							<select
								value={cardsPerPage}
								onChange={(e) => setCardsPerPage(parseInt(e.target.value))}
							// className removed, will be styled by .control-group select
							>
								<option value={10}>10 per page</option>
								<option value={20}>20 per page</option>
								<option value={50}>50 per page</option>
								<option value={100}>100 per page</option>
							</select>
						</div>
					</div>
				</div>

				{/* Search Status */}
				<SearchStatus />

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
									<table> {/* Removed min-w-full etc. as it's in SCSS now */}
										<thead> {/* Removed bg-gray-50 as it's in SCSS now */}
											<tr>
												<th scope="col"> {/* Removed Tailwind classes */}
													Name
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
										<tbody> {/* Removed bg-white etc. as it's in SCSS now */}
											{paginatedCards.map((card) => (
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

						{/* Pagination */}
						{totalPages > 1 && (
							<div className="pagination-container"> {/* Updated class */}
								<nav> {/* Removed flex items-center space-x-2 */}
									<button
										onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
										disabled={currentPage === 1}
									// className removed, will be styled by .pagination-container button
									>
										Previous
									</button>

									{/* Page numbers */}
									{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
										let pageNum;
										if (totalPages <= 5) {
											pageNum = i + 1;
										} else if (currentPage <= 3) {
											pageNum = i + 1;
										} else if (currentPage >= totalPages - 2) {
											pageNum = totalPages - 4 + i;
										} else {
											pageNum = currentPage - 2 + i;
										}

										return (
											<button
												key={pageNum}
												onClick={() => setCurrentPage(pageNum)}
												className={currentPage === pageNum ? 'active' : ''} // Simplified className for SCSS
											>
												{pageNum}
											</button>
										);
									})}

									<button
										onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
										disabled={currentPage === totalPages}
									// className removed, will be styled by .pagination-container button
									>
										Next
									</button>
								</nav>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
};

export default App;

import React, { useState, useEffect } from 'react';
import APICardSearch from './components/APICardSearch';
import CardDisplay from './components/CardDisplay';
import { Card } from './types';

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

	// View options
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
	const [cardsPerPage, setCardsPerPage] = useState(20);
	const [currentPage, setCurrentPage] = useState(1);

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
				<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
					<div className="flex items-center">
						<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
						<span className="text-blue-800">Searching cards...</span>
					</div>
				</div>
			);
		}

		if (searchError) {
			return (
				<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
					<div className="flex">
						<div className="flex-shrink-0">
							<svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
								<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
							</svg>
						</div>
						<div className="ml-3">
							<h3 className="text-sm font-medium text-red-800">Search Error</h3>
							<p className="text-sm text-red-700 mt-1">{searchError}</p>
						</div>
					</div>
				</div>
			);
		}

		if (searchResults.length > 0) {
			return (
				<div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
					<div className="flex items-center justify-between">
						<div className="flex items-center">
							<svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
								<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
							</svg>
							<span className="text-green-800 font-medium">
								Found {searchResults.length.toLocaleString()} cards
							</span>
						</div>
						<div className="text-sm text-green-700">
							Powered by backend API
						</div>
					</div>
				</div>
			);
		}

		return null;
	};

	if (isLoading && searchResults.length === 0) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading cards from backend...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<header className="bg-white shadow-sm border-b">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
					<div className="flex items-center justify-between">
						<h1 className="text-2xl font-bold text-gray-900">
							Altered Card Search
						</h1>
						<div className="text-sm text-gray-600">
							Backend API Search
						</div>
					</div>
				</div>
			</header>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
				<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
					{/* Search and Filters Sidebar */}
					<div className="lg:col-span-1">
						<div className="bg-white rounded-lg shadow p-6 sticky top-6">
							<APICardSearch onSearchResults={handleSearchResults} />
						</div>
					</div>

					{/* Main Content */}
					<div className="lg:col-span-3">
						{/* Controls Bar */}
						<div className="bg-white rounded-lg shadow p-4 mb-6">
							<div className="flex flex-wrap items-center justify-between gap-4">
								{/* Results Count */}
								<div className="text-sm text-gray-600">
									Showing {((currentPage - 1) * cardsPerPage) + 1}-{Math.min(currentPage * cardsPerPage, sortedResults.length)} of {sortedResults.length} cards
								</div>

								{/* View and Sort Controls */}
								<div className="flex items-center gap-4">
									{/* View Mode Toggle */}
									<div className="flex bg-gray-100 rounded-lg p-1">
										<button
											onClick={() => setViewMode('grid')}
											className={`px-3 py-1 rounded text-sm font-medium ${viewMode === 'grid'
													? 'bg-white text-gray-900 shadow-sm'
													: 'text-gray-600 hover:text-gray-900'
												}`}
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
									</div>

									{/* Sort Controls */}
									<select
										value={sortBy}
										onChange={(e) => setSortBy(e.target.value as SortOption)}
										className="border border-gray-300 rounded px-3 py-1 text-sm"
									>
										<option value="name">Name</option>
										<option value="mainCost">Main Cost</option>
										<option value="price">Price</option>
										<option value="rarity">Rarity</option>
										<option value="faction">Faction</option>
									</select>

									<button
										onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
										className="p-1 text-gray-600 hover:text-gray-900"
									>
										{sortDirection === 'asc' ? '↑' : '↓'}
									</button>

									{/* Cards per page */}
									<select
										value={cardsPerPage}
										onChange={(e) => setCardsPerPage(parseInt(e.target.value))}
										className="border border-gray-300 rounded px-3 py-1 text-sm"
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
							<div className="bg-white rounded-lg shadow p-8 text-center">
								<div className="text-gray-400 mb-4">
									<svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.083-2.327.653-.71 1.46-1.302 2.364-1.748A7.966 7.966 0 0112 9c2.34 0 4.47.881 6.083 2.327-.653.71-1.46 1.302-2.364 1.748z" />
									</svg>
								</div>
								<h3 className="text-lg font-medium text-gray-900 mb-2">No cards found</h3>
								<p className="text-gray-600">Try adjusting your search filters to find cards.</p>
							</div>
						) : (
							<>
								{/* Card Grid/List */}
								<div className={
									viewMode === 'grid'
										? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
										: 'space-y-4'
								}>
									{paginatedCards.map((card) => (
										<CardDisplay
											key={card.id}
											card={card}
											viewMode={viewMode}
										/>
									))}
								</div>

								{/* Pagination */}
								{totalPages > 1 && (
									<div className="mt-8 flex items-center justify-center">
										<nav className="flex items-center space-x-2">
											<button
												onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
												disabled={currentPage === 1}
												className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
														className={`px-3 py-2 text-sm font-medium rounded-md ${currentPage === pageNum
																? 'text-blue-600 bg-blue-50 border border-blue-300'
																: 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
															}`}
													>
														{pageNum}
													</button>
												);
											})}

											<button
												onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
												disabled={currentPage === totalPages}
												className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
			</div>
		</div>
	);
};

export default App;

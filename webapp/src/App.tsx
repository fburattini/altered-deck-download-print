import React, { useState, useEffect } from 'react';
import APICardSearch from './components/APICardSearch';
import CardTable from './components/CardTable';
import CardGridView from './components/CardGridView';
import CardPreview from './components/CardPreview';
import AvailableCardsList from './components/AvailableCardsList';
import { Card } from './types';
import { searchAPI, CardNameFaction } from './services/searchAPI';
import './styles/App.scss';
import './styles/AvailableCardsList.scss';

// Sorting options
type SortOption = 'name' | 'mainCost' | 'price' | 'rarity' | 'faction';
type SortDirection = 'asc' | 'desc';
type ViewType = 'table' | 'grid';

const App: React.FC = () => {
	const [searchResults, setSearchResults] = useState<Card[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [searchError, setSearchError] = useState<string | null>(null);
	// Available cards state
	const [availableCards, setAvailableCards] = useState<CardNameFaction[]>([]);
	const [availableCardsLoading, setAvailableCardsLoading] = useState(true);
	const [availableCardsError, setAvailableCardsError] = useState<string | null>(null);
	const [showAvailableCards, setShowAvailableCards] = useState(false);

	// Sorting state
	const [sortBy, setSortBy] = useState<SortOption>('name');
	const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

	// View state
	const [viewType, setViewType] = useState<ViewType>('grid');

	// State for hovered/selected card
	const [hoveredCard, setHoveredCard] = useState<Card | null>(null);

	// Fetch available cards on app startup
	useEffect(() => {
		const fetchAvailableCards = async () => {
			setAvailableCardsLoading(true);
			setAvailableCardsError(null);

			try {
				const response = await searchAPI.getCardsInDB();

				if (response.success) {
					setAvailableCards(response.data);
				} else {
					setAvailableCardsError(response.error || 'Failed to fetch available cards');
				}
			} catch (error) {
				setAvailableCardsError(error instanceof Error ? error.message : 'Unknown error');
			} finally {
				setAvailableCardsLoading(false);
			}
		};

		fetchAvailableCards();
	}, []);

	// Handle search results from APICardSearch component
	const handleSearchResults = (cards: Card[], loading: boolean, error?: string) => {
		setSearchResults(cards);
		setIsLoading(loading);
		setSearchError(error || null);
	};
	// Sort cards function
	const sortCards = (cards: Card[]) => {
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

	const handleSort = (column: SortOption) => {
		if (sortBy === column) {
			setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
		} else {
			setSortBy(column);
			setSortDirection('asc');
		}
	};

	const handleSortChange = (option: SortOption) => {
		setSortBy(option);
		setSortDirection('asc');
	};

	const sortedResults = sortCards(searchResults);

	if (isLoading && searchResults.length === 0) {
		return (
			<div className="app-container">
				<div className="loading-state">
					<div className="spinner"></div>
					<p>Loading cards from backend...</p>
				</div>
			</div>
		);
	} return (<div className="app-container">			{/* Top Search Bar */}
		<div className="top-search-bar">
			<div className="search-section">
				<APICardSearch onSearchResults={handleSearchResults} />
			</div>
		</div>{/* Available Cards List - Popup */}
		{showAvailableCards && (
			<AvailableCardsList
				cards={availableCards}
				loading={availableCardsLoading}
				error={availableCardsError}
				onClose={() => setShowAvailableCards(false)}
			/>
		)}{/* Main Content Area */}
		<div className="main-content">
			<div className="content-with-preview">
				<div className="results-area">
					{/* Controls Bar */}
					<div className="controls-bar">
						<div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '.5rem' }}>
							<div className="results-count">
								{sortedResults.length} cards
							</div>
							<div style={{border: '1px solid #334155', height: '1rem'}} />
							<div className="results-count">
								Avg. Price: {sortedResults.length > 0 ? `$${(sortedResults.reduce((sum, card) => sum + (card.pricing?.lowerPrice || 0), 0) / sortedResults.length).toFixed(2)}` : 'N/A'}
							</div>
							<div style={{border: '1px solid #334155', height: '1rem'}} />
							<div className="results-count">
								Min. Price: {sortedResults.length > 0 ? `$${Math.min(...sortedResults.map(card => card.pricing?.lowerPrice || 0)).toFixed(2)}` : 'N/A'}
							</div>
							<div style={{border: '1px solid #334155', height: '1rem'}} />
							<div className="results-count">
								Max. Price: {sortedResults.length > 0 ? `$${Math.max(...sortedResults.map(card => card.pricing?.lowerPrice || 0)).toFixed(2)}` : 'N/A'}
							</div>
						</div>
						{/* View and Sort Controls */}
						<div className="control-group">
							{/* Available Cards Button */}
							<button
								onClick={() => setShowAvailableCards(!showAvailableCards)}
								className="available-cards-button"
								disabled={availableCardsLoading}
							>
								{availableCardsLoading ? (
									<>
										<div className="mini-spinner"></div>
										Loading...
									</>
								) : (
									<>
										📋 Cards ({availableCards.length})
									</>
								)}
							</button>

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

							{/* View Type Controls */}
							<div className="view-type-controls">
								<button
									onClick={() => setViewType('table')}
									className={`view-type-button ${viewType === 'table' ? 'active' : ''}`}
								>
									📋
								</button>									<button
									onClick={() => setViewType('grid')}
									className={`view-type-button ${viewType === 'grid' ? 'active' : ''}`}
								>
									⊞
								</button>
							</div>
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
						</div>) : (
						<>								
						{/* Card Table or Grid View */}								
						{viewType === 'table' ? (
							<CardTable
								cards={sortedResults}
								hoveredCard={hoveredCard}
								onCardHover={setHoveredCard}
							/>) : (
							<CardGridView
								cards={sortedResults}
								onCardHover={setHoveredCard}
							/>
						)}</>
					)}
				</div>
				{viewType === 'table' && 
					<CardPreview hoveredCard={hoveredCard} />}
			</div>
		</div>
	</div>
	);
};

export default App;

import React, { useState, useEffect } from 'react';
import APICardSearch from './components/APICardSearch';
import CardTable from './components/CardTable';
import CardGridView from './components/CardGridView';
import CardPreview from './components/CardPreview';
import AvailableCardsList from './components/AvailableCardsList';
import BookmarksList from './components/BookmarksList';
import SortControls, { SortOption, SortDirection, sortCards } from './components/SortControls';
import { Card } from './types';
import { searchAPI, CardNameFaction, BookmarkEntry } from './services/searchAPI';
import './styles/App.scss';
import './styles/AvailableCardsList.scss';
import './styles/BookmarksList.scss';

type ViewType = 'table' | 'grid';

// Key for localStorage
const USER_ID_STORAGE_KEY = 'altered-deck-user-id';

const App: React.FC = () => {
	const [searchResults, setSearchResults] = useState<Card[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [searchError, setSearchError] = useState<string | null>(null);

	// Initialize user ID from localStorage or empty string
	const [currentUserId, setCurrentUserId] = useState<string>(() => {
		try {
			return localStorage.getItem(USER_ID_STORAGE_KEY) || '';
		} catch (error) {
			console.warn('Failed to read user ID from localStorage:', error);
			return '';
		}
	});
	const [userIdValid, setUserIdValid] = useState<boolean>(() => {
		const storedUserId = localStorage.getItem(USER_ID_STORAGE_KEY) || '';
		return storedUserId.length > 0 && /^[a-zA-Z0-9_-]+$/.test(storedUserId);
	});

	// Available cards state
	const [availableCards, setAvailableCards] = useState<CardNameFaction[]>([]);
	const [availableCardsLoading, setAvailableCardsLoading] = useState(true);
	const [availableCardsError, setAvailableCardsError] = useState<string | null>(null);
	const [showAvailableCards, setShowAvailableCards] = useState(false);

	// Bookmarks popup state
	const [showBookmarks, setShowBookmarks] = useState(false);

	// Bookmark state
	const [userBookmarks, setUserBookmarks] = useState<BookmarkEntry[]>([]);
	const [bookmarksLoading, setBookmarksLoading] = useState(true);
	const [bookmarksError, setBookmarksError] = useState<string | null>(null);

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

	// Fetch user bookmarks when user ID changes and is valid
	useEffect(() => {
		const fetchUserBookmarks = async () => {
			// Only fetch if we have a valid user ID
			if (!userIdValid || !currentUserId.trim()) {
				setUserBookmarks([]);
				setBookmarksLoading(false);
				setBookmarksError(null);
				return;
			}

			setBookmarksLoading(true);
			setBookmarksError(null);

			try {
				const response = await searchAPI.getUserBookmarks(currentUserId);

				if (response.success) {
					setUserBookmarks(response.bookmarks);
					console.log(`📚 Loaded ${response.bookmarks.length} bookmarks for user ${currentUserId}`);
				} else {
					setBookmarksError(response.error || 'Failed to fetch bookmarks');
				}
			} catch (error) {
				setBookmarksError(error instanceof Error ? error.message : 'Unknown error');
			} finally {
				setBookmarksLoading(false);
			}
		};

		fetchUserBookmarks();
	}, [currentUserId, userIdValid]); // Re-fetch when user ID or validity changes

	// Handle user ID change with validation
	const handleUserIdChange = (newUserId: string) => {
		const trimmedId = newUserId.trim();
		setCurrentUserId(trimmedId);

		// Basic validation - ensure user ID is not empty and contains valid characters
		const isValid = trimmedId.length > 0 && /^[a-zA-Z0-9_-]+$/.test(trimmedId);
		setUserIdValid(isValid);

		// Save to localStorage
		try {
			if (trimmedId) {
				localStorage.setItem(USER_ID_STORAGE_KEY, trimmedId);
			} else {
				localStorage.removeItem(USER_ID_STORAGE_KEY);
			}
		} catch (error) {
			console.warn('Failed to save user ID to localStorage:', error);
		}
	};

	// Handle search results from APICardSearch component
	const handleSearchResults = (cards: Card[], loading: boolean, error?: string) => {
		setSearchResults(cards);
		setIsLoading(loading);
		setSearchError(error || null);
	};

	// Bookmark helper functions
	const isCardBookmarked = (cardId: string): boolean => {
		return userBookmarks.some(bookmark => bookmark.cardId === cardId);
	};

	const toggleBookmark = async (card: Card): Promise<void> => {
		// Don't allow bookmark operations with invalid user ID
		if (!userIdValid || !currentUserId.trim()) {
			console.error('Cannot toggle bookmark: Invalid user ID');
			return;
		}

		try {
			const response = await searchAPI.toggleBookmark({
				userId: currentUserId,
				cardId: card.id,
				cardName: card.name,
				faction: card.mainFaction.reference
			});

			if (response.success) {
				// Update local bookmark state
				if (response.isBookmarked) {
					// Add bookmark
					const newBookmark: BookmarkEntry = {
						userId: currentUserId,
						cardId: card.id,
						cardName: card.name,
						faction: card.mainFaction.reference,
						bookmarkedAt: new Date().toISOString()
					};
					setUserBookmarks(prev => [...prev, newBookmark]);
				} else {
					// Remove bookmark
					setUserBookmarks(prev => prev.filter(bookmark => bookmark.cardId !== card.id));
				}
				console.log(`🔖 ${response.message}`);
			} else {
				console.error('Failed to toggle bookmark:', response.error);
			}
		} catch (error) {
			console.error('Error toggling bookmark:', error);
		}
	};

	// Bookmark toggle function for BookmarksList component (different signature)
	const toggleBookmarkById = async (cardId: string, cardName: string, faction: string): Promise<void> => {
		// Don't allow bookmark operations with invalid user ID
		if (!userIdValid || !currentUserId.trim()) {
			console.error('Cannot toggle bookmark: Invalid user ID');
			return;
		}

		try {
			const response = await searchAPI.toggleBookmark({
				userId: currentUserId,
				cardId: cardId,
				cardName: cardName,
				faction: faction
			});

			if (response.success) {
				// Update local bookmark state
				if (response.isBookmarked) {
					// Add bookmark
					const newBookmark: BookmarkEntry = {
						userId: currentUserId,
						cardId: cardId,
						cardName: cardName,
						faction: faction,
						bookmarkedAt: new Date().toISOString()
					};
					setUserBookmarks(prev => [...prev, newBookmark]);
				} else {
					// Remove bookmark
					setUserBookmarks(prev => prev.filter(bookmark => bookmark.cardId !== cardId));
				}
				console.log(`🔖 ${response.message}`);
			} else {
				console.error('Failed to toggle bookmark:', response.error);
			}
		} catch (error) {
			console.error('Error toggling bookmark:', error);
		}
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

	const handleDirectionToggle = () => {
		setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
	};

	const sortedResults = sortCards(searchResults, sortBy, sortDirection);

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
		</div>		{/* Available Cards List - Popup */}
		{showAvailableCards && (
			<AvailableCardsList
				cards={availableCards}
				loading={availableCardsLoading}
				error={availableCardsError}
				onClose={() => setShowAvailableCards(false)}
			/>
		)}

		{/* Bookmarks List - Popup */}
		{showBookmarks && (
			<BookmarksList
				bookmarks={userBookmarks}
				loading={bookmarksLoading}
				error={bookmarksError}
				currentUserId={currentUserId}
				userIdValid={userIdValid}
				onClose={() => setShowBookmarks(false)}
				onUserIdChange={handleUserIdChange}
				onToggleBookmark={toggleBookmarkById}
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
							<div style={{ border: '1px solid #334155', height: '1rem' }} />
							<div className="results-count">
								Avg. Price: {sortedResults.length > 0 ? `$${(sortedResults.reduce((sum, card) => sum + (card.pricing?.lowerPrice || 0), 0) / sortedResults.length).toFixed(2)}` : 'N/A'}
							</div>
							<div style={{ border: '1px solid #334155', height: '1rem' }} />
							<div className="results-count">
								Min. Price: {sortedResults.length > 0 ? `$${Math.min(...sortedResults.map(card => card.pricing?.lowerPrice || 0)).toFixed(2)}` : 'N/A'}
							</div>
							<div style={{ border: '1px solid #334155', height: '1rem' }} />
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

							{/* Bookmarks Button */}
							<button
								onClick={() => setShowBookmarks(!showBookmarks)}
								className={`bookmarks-button ${!userIdValid ? 'needs-setup' : ''}`}
								disabled={bookmarksLoading}
								title={!userIdValid ? "Enter a valid user ID to view bookmarks" : "View your bookmarks"}
							>
								{bookmarksLoading ? (
									<>
										<div className="mini-spinner"></div>
										Loading...
									</>
								) : (
									<>
										🔖 Bookmarks ({userBookmarks.length})
										{!userIdValid && <span className="setup-indicator"></span>}
									</>
								)}
							</button>

							{/* Sort Controls */}
							<SortControls
								sortBy={sortBy}
								sortDirection={sortDirection}
								onSortChange={handleSortChange}
								onDirectionToggle={handleDirectionToggle}
							/>

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
									userBookmarks={userBookmarks}
									onToggleBookmark={userIdValid ? toggleBookmark : undefined}
									isCardBookmarked={isCardBookmarked}
								/>) : (
								<CardGridView
									cards={sortedResults}
									onCardHover={setHoveredCard}
									userBookmarks={userBookmarks}
									onToggleBookmark={userIdValid ? toggleBookmark : undefined}
									isCardBookmarked={isCardBookmarked}
								/>
							)}
						</>
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

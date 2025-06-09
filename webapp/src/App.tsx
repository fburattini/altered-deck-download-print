import React, { useState, useEffect, useCallback } from 'react';
import APICardSearch from './components/APICardSearch';
import CardGridView from './components/CardGridView';
import AvailableCardsList from './components/AvailableCardsList';
import BookmarksList from './components/BookmarksList';
import WatchlistList from './components/WatchlistList';
import FilterControls from './components/FilterControls';
import SortControls, { SortOption, SortDirection, sortCards } from './components/SortControls';
import LeftMenu from './components/LeftMenu';
import SettingsModal from './components/SettingsModal';
import { Card } from './types';
import { searchAPI, CardNameFaction, BookmarkEntry, WatchlistEntry } from './services/searchAPI';
import './styles/App.scss';
import './styles/AvailableCardsList.scss';
import './styles/BookmarksList.scss';
import './styles/WatchlistList.scss';
import './styles/LeftMenu.scss';
import './styles/SettingsModal.scss';

// Key for localStorage
const USER_ID_STORAGE_KEY = 'altered-deck-user-id';
const BEARER_TOKEN_STORAGE_KEY = 'altered-deck-bearer-token';

const App: React.FC = () => {
	const [searchResults, setSearchResults] = useState<Card[]>([]);
	const [filteredResults, setFilteredResults] = useState<Card[]>([]);
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

	// Initialize bearer token from localStorage or empty string
	const [bearerToken, setBearerToken] = useState<string>(() => {
		try {
			return localStorage.getItem(BEARER_TOKEN_STORAGE_KEY) || '';
		} catch (error) {
			console.warn('Failed to read bearer token from localStorage:', error);
			return '';
		}
	});

	// Settings modal state
	const [showSettings, setShowSettings] = useState(false);

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

	// Watchlist popup state
	const [showWatchlist, setShowWatchlist] = useState(false);

	// Watchlist state
	const [userWatchlist, setUserWatchlist] = useState<WatchlistEntry[]>([]);
	const [watchlistLoading, setWatchlistLoading] = useState(true);
	const [watchlistError, setWatchlistError] = useState<string | null>(null);

	// Sorting state
	const [sortBy, setSortBy] = useState<SortOption>('name');
	const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

	// State for hovered/selected card
	const [hoveredCard, setHoveredCard] = useState<Card | null>(null);

	// Left menu state
	const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);

	const handleToggleMenu = () => {
		setIsMenuCollapsed(!isMenuCollapsed);
	};

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

	// Fetch user watchlist when user ID changes and is valid
	useEffect(() => {
		const fetchUserWatchlist = async () => {
			// Only fetch if we have a valid user ID
			if (!userIdValid || !currentUserId.trim()) {
				setUserWatchlist([]);
				setWatchlistLoading(false);
				setWatchlistError(null);
				return;
			}

			setWatchlistLoading(true);
			setWatchlistError(null);

			try {
				const response = await searchAPI.getUserWatchlist(currentUserId);

				if (response.success) {
					setUserWatchlist(response.watchlist);
					console.log(`📋 Loaded ${response.watchlist.length} watchlist items for user ${currentUserId}`);
				} else {
					setWatchlistError(response.error || 'Failed to fetch watchlist');
				}
			} catch (error) {
				setWatchlistError(error instanceof Error ? error.message : 'Unknown error');
			} finally {
				setWatchlistLoading(false);
			}
		};

		fetchUserWatchlist();
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

	// Handle bearer token change
	const handleBearerTokenChange = (newToken: string) => {
		const trimmedToken = newToken.trim();
		setBearerToken(trimmedToken);

		// Save to localStorage
		try {
			if (trimmedToken) {
				localStorage.setItem(BEARER_TOKEN_STORAGE_KEY, trimmedToken);
			} else {
				localStorage.removeItem(BEARER_TOKEN_STORAGE_KEY);
			}
		} catch (error) {
			console.warn('Failed to save bearer token to localStorage:', error);
		}
	};

	// Handle search results from APICardSearch component
	const handleSearchResults = (cards: Card[], loading: boolean, error?: string) => {
		setSearchResults(cards);
		setFilteredResults(cards); // Initialize filtered results with all search results
		setIsLoading(loading);
		setSearchError(error || null);
	};

	const handleFilteredCards = useCallback((cards: Card[]) => {
		setFilteredResults(cards);
	}, []);

	// Bookmark helper functions
	const isCardBookmarked = useCallback((cardId: string): boolean => {
		return userBookmarks.some(bookmark => bookmark.cardId === cardId);
	}, [userBookmarks])

	// Watchlist helper functions
	const isCardInWatchlist = useCallback((cardName: string, faction: string): boolean => {
		return userWatchlist.some(item => item.cardName === cardName && item.faction === faction);
	}, [userWatchlist])

	// Wrapper function for CardGridView compatibility
	const isCardInWatchlistById = useCallback((cardId: string): boolean => {
		// Find the card by ID to get name and faction
		const card = searchResults.find(c => c.id === cardId);
		if (!card) return false;
		return isCardInWatchlist(card.name, card.mainFaction.reference);
	}, [searchResults, isCardInWatchlist])

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

	// Watchlist toggle function for CardGridView component
	const toggleWatchlist = async (card: Card): Promise<void> => {
		// Don't allow watchlist operations with invalid user ID
		if (!userIdValid || !currentUserId.trim()) {
			console.error('Cannot toggle watchlist: Invalid user ID');
			return;
		}

		try {
			// Convert string MAIN_COST to number array
			const mainCostArray = card.elements.MAIN_COST ? [parseInt(card.elements.MAIN_COST, 10)] : [];
			
			const response = await searchAPI.toggleWatchlist({
				userId: currentUserId,
				cardName: card.name,
				faction: card.mainFaction.reference,
				mainCost: mainCostArray
			});

			if (response.success) {
				// Update local watchlist state
				if (response.isInWatchlist) {
					// Add to watchlist
					const newWatchlistItem: WatchlistEntry = {
						cardName: card.name,
						faction: card.mainFaction.reference,
						mainCost: mainCostArray,
						lastRefresh: new Date().toISOString()
					};
					setUserWatchlist(prev => [...prev, newWatchlistItem]);
				} else {
					// Remove from watchlist
					setUserWatchlist(prev => prev.filter(item => 
						!(item.cardName === card.name && item.faction === card.mainFaction.reference)
					));
				}
				console.log(`📋 ${response.message}`);
			} else {
				console.error('Failed to toggle watchlist:', response.error);
			}
		} catch (error) {
			console.error('Error toggling watchlist:', error);
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

	// Watchlist toggle function for WatchlistList component
	const toggleWatchlistById = async (cardName: string, faction: string, mainCost: number[]): Promise<void> => {
		// Don't allow watchlist operations with invalid user ID
		if (!userIdValid || !currentUserId.trim()) {
			console.error('Cannot toggle watchlist: Invalid user ID');
			return;
		}

		try {
			const response = await searchAPI.toggleWatchlist({
				userId: currentUserId,
				cardName: cardName,
				faction: faction,
				mainCost: mainCost
			});

			if (response.success) {
				// Update local watchlist state
				if (response.isInWatchlist) {
					// Add to watchlist
					const newWatchlistItem: WatchlistEntry = {
						cardName: cardName,
						faction: faction,
						mainCost: mainCost,
						lastRefresh: new Date().toISOString()
					};
					setUserWatchlist(prev => [...prev, newWatchlistItem]);
				} else {
					// Remove from watchlist
					setUserWatchlist(prev => prev.filter(item => 
						!(item.cardName === cardName && item.faction === faction)
					));
				}
				console.log(`📋 ${response.message}`);
			} else {
				console.error('Failed to toggle watchlist:', response.error);
			}
		} catch (error) {
			console.error('Error toggling watchlist:', error);
		}
	};

	const handleSortChange = (option: SortOption) => {
		setSortBy(option);
		setSortDirection('asc');
	};

	const handleDirectionToggle = () => {
		setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
	};

	const onLeftMenuItemClick = (menuItem: string) => {
		switch (menuItem) {
			case 'home': {
				// Clear search results and reset to home state
				setSearchResults([]);
				setFilteredResults([]);
				setHoveredCard(null);
				break;
			}
			case 'collection': {
				setShowAvailableCards(true)
				break;
			}
			case 'bookmarks': {
				setShowBookmarks(true)
				break;
			}
			case 'watchlist': {
				setShowWatchlist(true)
				break;
			}
			case 'settings': {
				setShowSettings(true)
				break;
			}
		}
	}

	const sortedResults = sortCards(filteredResults, sortBy, sortDirection);

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
			{/* Left Menu */}
			<LeftMenu
				isCollapsed={isMenuCollapsed}
				currentView="search"
				bookmarks={userBookmarks}
				database={availableCards}
				watchlist={userWatchlist}
				onToggleCollapse={handleToggleMenu}
				onMenuItemClick={onLeftMenuItemClick}
			/>

			{/* Main Content Container */}
			<div className={`main-container ${isMenuCollapsed ? 'menu-collapsed' : 'menu-expanded'}`}>
				{/* Top Search Bar */}
				<div className="top-search-bar">
					<div className="search-section">
						<APICardSearch 
							onSearchResults={handleSearchResults} 
							bearerToken={bearerToken}
							currentUserId={currentUserId}
							userIdValid={userIdValid}
							onToggleWatchlist={userIdValid ? toggleWatchlistById : undefined}
							isCardInWatchlist={isCardInWatchlist}
						/>
					</div>
				</div>

				{/* Available Cards List - Popup */}
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
				)}

				{/* Watchlist List - Popup */}
				{showWatchlist && (
					<WatchlistList
						watchlist={userWatchlist}
						loading={watchlistLoading}
						error={watchlistError}
						currentUserId={currentUserId}
						userIdValid={userIdValid}
						onClose={() => setShowWatchlist(false)}
						onUserIdChange={handleUserIdChange}
						onToggleWatchlist={toggleWatchlistById}
					/>
				)}

				{/* Settings Modal */}
				{showSettings && (
					<SettingsModal
						isOpen={showSettings}
						onClose={() => setShowSettings(false)}
						currentUserId={currentUserId}
						bearerToken={bearerToken}
						onUserIdChange={handleUserIdChange}
						onBearerTokenChange={handleBearerTokenChange}
						userIdValid={userIdValid}
					/>
				)}

				{/* Main Content Area */}
				<div className="main-content">
					<div className="content-with-preview">
						<div className="results-area">
							{/* Statistics Section */}
							<div className="statistics-section">
								<div className="statistics-bar">
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
							</div>

							{/* Controls Bar */}
							<div className="controls-bar">
								{/* Left Section - Filter Controls */}
								<div className="control-group">
									<FilterControls
										cards={searchResults}
										onFilteredCards={handleFilteredCards}
										isCardBookmarked={isCardBookmarked}
									/>
								</div>

								{/* Right Section - View and Sort Controls */}
								<div className="control-group">
									{/* Sort Controls */}
									<SortControls
										sortBy={sortBy}
										sortDirection={sortDirection}
										onSortChange={handleSortChange}
										onDirectionToggle={handleDirectionToggle}
									/>
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
								</div>
							) : (
								<CardGridView
									cards={sortedResults}
									onToggleBookmark={userIdValid ? toggleBookmark : undefined}
									isCardBookmarked={isCardBookmarked}
								/>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default App;

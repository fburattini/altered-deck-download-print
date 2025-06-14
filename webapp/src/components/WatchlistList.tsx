import React, { useState, useEffect } from 'react';
import { WatchlistEntry } from '../services/searchAPI';
import { FACTION_COLORS, FACTIONS } from '../services/utils';
import WatchlistRefresh from './WatchlistRefresh';
import { Card } from '../types';

interface WatchlistListProps {
    watchlist: WatchlistEntry[];
    loading: boolean;
    error: string | null;
    currentUserId: string;
    userIdValid: boolean;
    bearerToken?: string;
    onClose: () => void;
    onUserIdChange: (userId: string) => void;
    onToggleWatchlist: (cardName: string, faction: string, mainCost: number[]) => Promise<void>;
    onRefreshComplete?: () => void;
    onTriggerSearch?: (cardName: string, faction: string, mainCost?: number[]) => void;
    onCardsUpdate?: (cards: Card[]) => void; // New callback to pass cards back to App
}

const WatchlistList: React.FC<WatchlistListProps> = ({
    watchlist,
    loading,
    error,
    currentUserId,
    userIdValid,
    bearerToken,
    onClose,
    onUserIdChange,
    onToggleWatchlist,
    onRefreshComplete,
    onTriggerSearch,
    onCardsUpdate
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showRefresh, setShowRefresh] = useState(false);
    const [selectedFactions, setSelectedFactions] = useState<string[]>([]);

    // Filter watchlist based on search term and selected factions
    const filteredWatchlist = watchlist.filter(item => {
        const matchesSearch = item.cardName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.faction?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFaction = selectedFactions.length === 0 || selectedFactions.includes(item.faction);
        return matchesSearch && matchesFaction;
    });

    const handleRemoveWatchlist = async (item: WatchlistEntry) => {
        await onToggleWatchlist(item.cardName, item.faction, item.mainCost);
    };

    const handleCardClick = (item: WatchlistEntry) => {
        if (onTriggerSearch) {
            onTriggerSearch(item.cardName, item.faction, item.mainCost);
        }
    };

    const toggleFactionFilter = (factionRef: string) => {
        setSelectedFactions(prev => {
            const newFactions = prev.includes(factionRef)
                ? prev.filter(f => f !== factionRef)
                : [...prev, factionRef];
            return newFactions;
        });
    };

    const clearAllFilters = () => {
        setSearchTerm('');
        setSelectedFactions([]);
    };

    // Handle ESC key to close the popup
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        // Cleanup function to remove event listener
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    if (loading) {
        return (
            <div className="watchlist-loading">
                <div className="spinner"></div>
                <p>Loading watchlist...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="watchlist-error">
                <h3>Error loading watchlist</h3>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="watchlist-popup">
            <div className="popup-overlay" onClick={onClose}></div>
            <div className="popup-content">
                <div className="popup-header">
                    <div className="header-info">
                        <h3>My Watchlist</h3>
                        <span className="card-count">
                            {filteredWatchlist.length !== watchlist.length ? 
                                `${filteredWatchlist.length} of ${watchlist.length} cards` : 
                                `${watchlist.length} cards`}
                        </span>
                        {(searchTerm || selectedFactions.length > 0) && (
                            <span className="filter-indicator">
                                {selectedFactions.length > 0 && (
                                    <span className="faction-filter-count">
                                        {selectedFactions.length} faction{selectedFactions.length !== 1 ? 's' : ''}
                                    </span>
                                )}
                                {searchTerm && (
                                    <span className="search-filter-indicator">
                                        search: "{searchTerm}"
                                    </span>
                                )}
                            </span>
                        )}
                    </div>
                    <div className="header-actions">
                        <button className="close-button" onClick={onClose} aria-label="Close">
                            ✕
                        </button>
                    </div>
                </div>

                <div className="popup-filters">
                    <input
                        type="text"
                        placeholder="Search watchlist..."
                        autoFocus
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    
                    {/* Faction Filters */}
                    <div className="faction-filters">
                        <div className="filter-label">Filter by Faction:</div>
                        <div className="faction-buttons">
                            {FACTIONS.map(faction => {
                                const isSelected = selectedFactions.includes(faction.ref);
                                return (
                                    <button
                                        key={faction.ref}
                                        type="button"
                                        onClick={() => toggleFactionFilter(faction.ref)}
                                        className={`faction-button ${isSelected ? 'active' : ''}`}
                                        style={{
                                            backgroundColor: isSelected ? faction.color : '',
                                            border: `2px solid ${faction.color}`,
                                            color: isSelected ? 'white' : faction.color,
                                        }}
                                    >
                                        {faction.ref}
                                    </button>
                                );
                            })}
                        </div>
                        
                        {/* Clear filters button */}
                        {(searchTerm || selectedFactions.length > 0) && (
                            <button
                                onClick={clearAllFilters}
                                className="clear-filters-button"
                            >
                                Clear All Filters
                            </button>
                        )}
                    </div>
                </div>                
                <div className="popup-filters">
                    {/* Watchlist Refresh Component */}
                    <WatchlistRefresh
                        watchlist={filteredWatchlist}
                        bearerToken={bearerToken}
                        onTriggerSearch={onTriggerSearch}
                        onCardsUpdate={onCardsUpdate}
                        isFiltered={filteredWatchlist.length !== watchlist.length}
                        totalWatchlistCount={watchlist.length}
                        onRefreshComplete={() => {
                            setShowRefresh(false);
                            if (onRefreshComplete) {
                                onRefreshComplete();
                            }
                        }}
                    />
                </div>

                <div className="popup-cards-content">
                    {!userIdValid ? (
                        <div className="no-cards-message">
                            <p>Please enter a valid user ID to view watchlist.</p>
                        </div>
                    ) : filteredWatchlist.length === 0 ? (
                        <div className="no-cards-message">
                            {watchlist.length === 0 ? (
                                <p>No cards in watchlist. Start adding cards to watch for price changes!</p>
                            ) : (searchTerm || selectedFactions.length > 0) ? (
                                <div>
                                    <p>No watchlist items match your search criteria.</p>
                                    <button onClick={clearAllFilters} className="clear-filters-link">
                                        Clear all filters to show all {watchlist.length} items
                                    </button>
                                </div>
                            ) : (
                                <p>No watchlist items match your search criteria.</p>
                            )}
                        </div>
                    ) : (
                        <div className="watchlist-list">
                            {filteredWatchlist
                                .sort((a, b) => new Date(b.lastRefresh).getTime() - new Date(a.lastRefresh).getTime())
                                .map((item, index) => (
                                    <div key={`${item.cardName}-${item.faction}-${index}`} className="watchlist-card-item">
                                        <div className="watchlist-card-info">
                                            <span 
                                                className={`card-name ${onTriggerSearch ? 'clickable' : ''}`}
                                                onClick={() => onTriggerSearch && handleCardClick(item)}
                                                style={{ cursor: onTriggerSearch ? 'pointer' : 'default' }}
                                                title={onTriggerSearch ? 'Click to search for this card' : undefined}
                                            >
                                                {item.cardName?.replaceAll('-', ' ')}
                                            </span>
                                            <div className="watchlist-meta">
                                                <span
                                                    className="card-faction"
                                                    style={{ backgroundColor: FACTION_COLORS[item.faction] || '#64748b' }}
                                                >
                                                    {item.faction}
                                                </span>
                                                <span className="main-cost">
                                                    Cost: {item.mainCost.join(', ')}
                                                </span>
                                                <span className="last-refresh">
                                                    Updated: {new Date(item.lastRefresh).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            className="remove-watchlist-button"
                                            onClick={() => handleRemoveWatchlist(item)}
                                            aria-label="Remove from watchlist"
                                            title="Remove from watchlist"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>

                {userIdValid && filteredWatchlist.length > 0 && filteredWatchlist.length !== watchlist.length && (
                    <div className="popup-footer">
                        Showing {filteredWatchlist.length} of {watchlist.length} watchlist items
                        {(searchTerm || selectedFactions.length > 0) && (
                            <span> (filtered)</span>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

export default WatchlistList;

import React, { useState } from 'react';
import { WatchlistEntry } from '../services/searchAPI';
import { FACTION_COLORS } from '../services/utils';

interface WatchlistListProps {
    watchlist: WatchlistEntry[];
    loading: boolean;
    error: string | null;
    currentUserId: string;
    userIdValid: boolean;
    onClose: () => void;
    onUserIdChange: (userId: string) => void;
    onToggleWatchlist: (cardName: string, faction: string, mainCost: number[]) => Promise<void>;
}

const WatchlistList: React.FC<WatchlistListProps> = ({ 
    watchlist, 
    loading, 
    error, 
    currentUserId,
    userIdValid,
    onClose, 
    onUserIdChange,
    onToggleWatchlist 
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [localUserId, setLocalUserId] = useState(currentUserId);
    
    // Filter watchlist based on search term
    const filteredWatchlist = watchlist.filter(item => {
        const matchesSearch = item.cardName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             item.faction?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const handleUserIdSubmit = () => {
        if (localUserId.trim() && localUserId !== currentUserId) {
            onUserIdChange(localUserId.trim());
        }
    };

    const handleUserIdKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleUserIdSubmit();
        }
    };

    const handleRemoveWatchlist = async (item: WatchlistEntry) => {
        await onToggleWatchlist(item.cardName, item.faction, item.mainCost);
    };

    const isUserIdInputValid = (userId: string) => {
        return /^[a-zA-Z0-9_-]+$/.test(userId) && userId.length > 0;
    };

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
                        <span className="card-count">{watchlist.length} cards</span>
                    </div>
                    <button className="close-button" onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>        
                
                <div className="popup-user-section">
                    <div className="user-id-input-group">
                        <label htmlFor="watchlist-user-id">User ID:</label>
                        <div className="user-id-controls">
                            <input
                                id="watchlist-user-id"
                                type="text"
                                placeholder="Enter your user ID"
                                value={localUserId}
                                onChange={(e) => setLocalUserId(e.target.value)}
                                onKeyPress={handleUserIdKeyPress}
                                className={`user-id-input ${isUserIdInputValid(localUserId) ? 'valid' : 'invalid'}`}
                            />
                            {localUserId !== currentUserId && (
                                <button 
                                    onClick={handleUserIdSubmit}
                                    disabled={!isUserIdInputValid(localUserId)}
                                    className="apply-user-id-button"
                                >
                                    Apply
                                </button>
                            )}
                        </div>
                        {!userIdValid && (
                            <span className="user-id-error">User ID must contain only letters, numbers, underscores, or hyphens</span>
                        )}
                    </div>
                </div>

                <div className="popup-filters">
                    <input
                        type="text"
                        placeholder="Search watchlist..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
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
                                            <span className="card-name">{item.cardName?.replaceAll('-', ' ')}</span>
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
                    </div>
                )}
            </div>
        </div>
    );
};

export default WatchlistList;

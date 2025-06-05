import React, { useState } from 'react';
import { BookmarkEntry } from '../services/searchAPI';
import { FACTION_COLORS } from '../services/utils';

interface BookmarksListProps {
    bookmarks: BookmarkEntry[];
    loading: boolean;
    error: string | null;
    currentUserId: string;
    userIdValid: boolean;
    onClose: () => void;
    onUserIdChange: (userId: string) => void;
    onToggleBookmark: (cardId: string, cardName: string, faction: string) => Promise<void>;
}

const BookmarksList: React.FC<BookmarksListProps> = ({ 
    bookmarks, 
    loading, 
    error, 
    currentUserId,
    userIdValid,
    onClose, 
    onUserIdChange,
    onToggleBookmark 
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [localUserId, setLocalUserId] = useState(currentUserId);
    
    // Filter bookmarks based on search term
    const filteredBookmarks = bookmarks.filter(bookmark => {
        const matchesSearch = bookmark.cardName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             bookmark.faction?.toLowerCase().includes(searchTerm.toLowerCase());
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

    const handleRemoveBookmark = async (bookmark: BookmarkEntry) => {
        await onToggleBookmark(bookmark.cardId, bookmark.cardName, bookmark.faction);
    };

    const isUserIdInputValid = (userId: string) => {
        return /^[a-zA-Z0-9_-]+$/.test(userId) && userId.length > 0;
    };

    if (loading) {
        return (
            <div className="bookmarks-loading">
                <div className="spinner"></div>
                <p>Loading bookmarks...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bookmarks-error">
                <h3>Error loading bookmarks</h3>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="bookmarks-popup">
            <div className="popup-overlay" onClick={onClose}></div>
            <div className="popup-content">
                <div className="popup-header">
                    <div className="header-info">
                        <h3>My Bookmarks</h3>
                        <span className="card-count">{bookmarks.length} cards</span>
                    </div>
                    <button className="close-button" onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>        
                
                <div className="popup-user-section">
                    <div className="user-id-input-group">
                        <label htmlFor="bookmark-user-id">User ID:</label>
                        <div className="user-id-controls">
                            <input
                                id="bookmark-user-id"
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
                        placeholder="Search bookmarks..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="popup-cards-content">
                    {!userIdValid ? (
                        <div className="no-cards-message">
                            <p>Please enter a valid user ID to view bookmarks.</p>
                        </div>
                    ) : filteredBookmarks.length === 0 ? (
                        <div className="no-cards-message">
                            {bookmarks.length === 0 ? (
                                <p>No bookmarks found. Start bookmarking cards from the main search!</p>
                            ) : (
                                <p>No bookmarks match your search criteria.</p>
                            )}
                        </div>
                    ) : (
                        <div className="bookmarks-list">
                            {filteredBookmarks
                                .sort((a, b) => new Date(b.bookmarkedAt).getTime() - new Date(a.bookmarkedAt).getTime())
                                .map((bookmark, index) => (
                                    <div key={`${bookmark.cardId}-${index}`} className="bookmark-card-item">
                                        <div className="bookmark-card-info">
                                            <span className="card-name">{bookmark.cardName?.replaceAll('-', ' ')}</span>
                                            <div className="bookmark-meta">
                                                <span
                                                    className="card-faction"
                                                    style={{ backgroundColor: FACTION_COLORS[bookmark.faction] || '#64748b' }}
                                                >
                                                    {bookmark.faction}
                                                </span>
                                                <span className="bookmark-date">
                                                    {new Date(bookmark.bookmarkedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            className="remove-bookmark-button"
                                            onClick={() => handleRemoveBookmark(bookmark)}
                                            aria-label="Remove bookmark"
                                            title="Remove bookmark"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>

                {userIdValid && filteredBookmarks.length > 0 && filteredBookmarks.length !== bookmarks.length && (
                    <div className="popup-footer">
                        Showing {filteredBookmarks.length} of {bookmarks.length} bookmarks
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookmarksList;

import React, { useState, useEffect } from 'react';
import { CardNameFaction } from '../services/searchAPI';
import { FACTION_COLORS, FACTIONS } from '../services/utils';

interface AvailableCardsListProps {
    cards: CardNameFaction[];
    loading: boolean;
    error: string | null;
    onClose: () => void;
}

const AvailableCardsList: React.FC<AvailableCardsListProps> = ({ cards, loading, error, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFactions, setSelectedFactions] = useState<string[]>([]);
    
    // Filter cards based on search term and selected factions
    const filteredCards = cards.filter(card => {
        const matchesSearch = card.cardName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFaction = selectedFactions.length === 0 || selectedFactions.includes(card.cardFaction);
        return matchesSearch && matchesFaction;
    });

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
            <div className="available-cards-loading">
                <div className="spinner"></div>
                <p>Loading available cards...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="available-cards-error">
                <h3>Error loading available cards</h3>
                <p>{error}</p>
            </div>
        );
    }
    return (
        <div className="available-cards-popup">
            <div className="popup-overlay" onClick={onClose}></div>
            <div className="popup-content">
                <div className="popup-header">
                    <div className="header-info">
                        <h3>Available Cards</h3>
                        <span className="card-count">
                            {filteredCards.length !== cards.length ? 
                                `${filteredCards.length} of ${cards.length} cards` : 
                                `${cards.length} cards`}
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
                    <button className="close-button" onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>        
                <div className="popup-filters">
                    <input
                        type="text"
                        placeholder="Search cards..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    
                    {/* Faction Filters */}
                    <div className="faction-filters">
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

                <div className="popup-cards-content">
                    {filteredCards.length === 0 ? (
                        <div className="no-cards-message">
                            {cards.length === 0 ? (
                                <p>No cards available.</p>
                            ) : (searchTerm || selectedFactions.length > 0) ? (
                                <div>
                                    <p>No cards found matching your criteria.</p>
                                    <button onClick={clearAllFilters} className="clear-filters-link">
                                        Clear all filters to show all {cards.length} cards
                                    </button>
                                </div>
                            ) : (
                                <p>No cards found matching your criteria.</p>
                            )}
                        </div>
                    ) : (
                        <div className="all-cards-list">
                            {filteredCards
                                .sort((a, b) => a.cardName.localeCompare(b.cardName))
                                .map((card, index) => (<div key={`${card.cardName}-${card.cardFaction}-${index}`} className="simple-card-item">
                                    <span className="card-name">{card.cardName?.replaceAll('-', ' ')}</span>
                                    <span
                                        className="card-faction"
                                        style={{ backgroundColor: FACTION_COLORS[card.cardFaction] || '#64748b' }}
                                    >
                                        {card.cardFaction}
                                    </span>
                                </div>
                                ))}
                        </div>
                    )}
                </div>

                {filteredCards.length > 0 && filteredCards.length !== cards.length && (
                    <div className="popup-footer">
                        Showing {filteredCards.length} of {cards.length} cards
                        {(searchTerm || selectedFactions.length > 0) && (
                            <span> (filtered)</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AvailableCardsList;

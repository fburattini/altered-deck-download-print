import React, { useState } from 'react';
import { CardNameFaction } from '../services/searchAPI';
import { FACTION_COLORS } from '../services/utils';

interface AvailableCardsListProps {
    cards: CardNameFaction[];
    loading: boolean;
    error: string | null;
    onClose: () => void;
}

const AvailableCardsList: React.FC<AvailableCardsListProps> = ({ cards, loading, error, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    // Filter cards based on search term only
    const filteredCards = cards.filter(card => {
        const matchesSearch = card.cardName?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

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
                        <span className="card-count">{cards.length} cards</span>
                    </div>
                    <button className="close-button" onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>        <div className="popup-filters">
                    <input
                        type="text"
                        placeholder="Search cards..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="popup-cards-content">
                    {filteredCards.length === 0 ? (
                        <div className="no-cards-message">
                            <p>No cards found matching your criteria.</p>
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
                    </div>
                )}
            </div>
        </div>
    );
};

export default AvailableCardsList;

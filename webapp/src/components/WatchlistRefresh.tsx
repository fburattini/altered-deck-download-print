import React, { useState, useCallback } from 'react';
import { WatchlistEntry } from '../services/searchAPI';
import { searchAPI } from '../services/searchAPI';
import { Card } from '../types';

interface RefreshProgress {
    currentIndex: number;
    totalItems: number;
    currentCard?: string;
    isRefreshing: boolean;
    errors: string[];
    completedItems: number;
    startTime?: Date;
    newCardsCount?: number;
    priceUpdatesCount?: number;
    noChangesCount?: number;
    soldCardsCount?: number;
    isComplete?: boolean;
    newCards?: string[];
    priceUpdatedCards?: string[];
    noChangeCards?: string[];
    soldCards?: string[];
}

interface WatchlistRefreshProps {
    watchlist: WatchlistEntry[];
    bearerToken?: string;
    onRefreshComplete?: () => void;
    onCardsUpdate?: (cards: Card[]) => void; // New callback to pass cards back to App
    disabled?: boolean;
    onTriggerSearch?: (cardName: string, faction: string, mainCost?: number[]) => void;
    isFiltered?: boolean;
    totalWatchlistCount?: number;
}

const WatchlistRefresh: React.FC<WatchlistRefreshProps> = ({
    watchlist,
    bearerToken,
    onRefreshComplete,
    onCardsUpdate,
    disabled = false,
    onTriggerSearch,
    isFiltered = false,
    totalWatchlistCount = 0
}) => {
    const [progress, setProgress] = useState<RefreshProgress>({
        currentIndex: 0,
        totalItems: 0,
        isRefreshing: false,
        errors: [],
        completedItems: 0,
        newCardsCount: 0,
        priceUpdatesCount: 0,
        noChangesCount: 0,
        soldCardsCount: 0,
        isComplete: false,
        newCards: [],
        priceUpdatedCards: [],
        noChangeCards: [],
        soldCards: []
    }); const [expandedSections, setExpandedSections] = useState<{
        newCards: boolean;
        priceUpdates: boolean;
        noChanges: boolean;
        soldCards: boolean;
    }>({
        newCards: false,
        priceUpdates: false,
        noChanges: false,
        soldCards: false
    });

    const refreshWatchlistData = useCallback(async () => {
        if (!watchlist.length || !bearerToken?.trim()) {
            console.error('Cannot refresh: watchlist is empty or bearer token is missing');
            return;
        }

        const startTime = new Date(); setProgress({
            currentIndex: 0,
            totalItems: watchlist.length,
            isRefreshing: true,
            errors: [],
            completedItems: 0,
            startTime,
            newCardsCount: 0,
            priceUpdatesCount: 0,
            noChangesCount: 0,
            soldCardsCount: 0,
            isComplete: false,
            newCards: [],
            priceUpdatedCards: [],
            noChangeCards: [],
            soldCards: []
        });
        
        // Reset expanded sections when starting a new refresh
        setExpandedSections({
            newCards: false,
            priceUpdates: false,
            noChanges: false,
            soldCards: false
        }); 
        
        let completedCount = 0;
        let newCardsCount = 0;
        let priceUpdatesCount = 0;
        let noChangesCount = 0;
        let soldCardsCount = 0;
        const errors: string[] = [];
        const newCards: string[] = [];
        const priceUpdatedCards: string[] = [];
        const noChangeCards: string[] = [];
        const soldCards: string[] = [];
        const allCards: Card[] = []; // Collect all cards from scrape responses

        try {
            for (let i = 0; i < watchlist.length; i++) {
                const item = watchlist[i];

                setProgress(prev => ({
                    ...prev,
                    currentIndex: i + 1,
                    currentCard: item.cardName
                }));

                try {
                    // Convert watchlist entry to scraper filters
                    const scrapeFilters = {
                        CARD_NAME: item.cardName,
                        FACTION: item.faction,
                        MAIN_COST: item.mainCost.length > 0 ? item.mainCost.join(',') : undefined,
                        RARITY: 'UNIQUE',
                        ONLY_FOR_SALE: true
                    };

                    // Use the scraper API to get fresh data
                    const response = await searchAPI.scrapeCards(scrapeFilters, bearerToken); 
                    if (response.success) {
                        completedCount++;

                        // Collect cards from the response if available
                        if (response.cards && response.cards.length > 0) {                            // Filter for cards with new data or price updates only
                            const relevantCards = response.cards.filter(card => {
                                // Include cards that have pricing (indicating they're for sale)
                                return card.pricing && card.pricing.lowerPrice > 0;
                            });
                            allCards.push(...relevantCards);
                            console.log(`📦 Collected ${relevantCards.length} cards from: ${item.cardName}`);
                        }

                        // Use the actual API response data to track changes
                        const apiNewCards = response.newCards || 0;
                        const apiCardsWithPricingChanges = response.cardsWithPricingChanges || 0;
                        const apiCardsWithoutChanges = response.cardsWithoutChanges || 0;
                        const apiCardsSold = response.cardsSold || 0;

                        // Track the totals
                        newCardsCount += apiNewCards;
                        priceUpdatesCount += apiCardsWithPricingChanges;
                        noChangesCount += apiCardsWithoutChanges;
                        soldCardsCount += apiCardsSold;

                        // Add to appropriate arrays based on what changed
                        if (apiNewCards > 0) {
                            newCards.push(item.cardName);
                            console.log(`🆕 ${apiNewCards} new cards found for: ${item.cardName}`);
                        }
                        if (apiCardsWithPricingChanges > 0) {
                            priceUpdatedCards.push(item.cardName);
                            console.log(`💰 ${apiCardsWithPricingChanges} price updates found for: ${item.cardName}`);
                        }
                        if (apiCardsWithoutChanges > 0) {
                            noChangeCards.push(item.cardName);
                            console.log(`✅ ${apiCardsWithoutChanges} cards with no changes for: ${item.cardName}`);
                        }
                        if (apiCardsSold > 0) {
                            soldCards.push(item.cardName);
                            console.log(`🛍️ ${apiCardsSold} cards sold for: ${item.cardName}`);
                        }
                    } else {
                        const errorMsg = `Failed to refresh ${item.cardName}: ${response.error || 'Unknown error'}`;
                        errors.push(errorMsg);
                        console.error(errorMsg);
                    }
                } catch (error) {
                    const errorMsg = `Error refreshing ${item.cardName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                    errors.push(errorMsg);
                    console.error(errorMsg);
                }

                setProgress(prev => ({
                    ...prev,
                    completedItems: completedCount,
                    errors: [...errors],
                    newCardsCount,
                    priceUpdatesCount,
                    noChangesCount,
                    soldCardsCount,
                    newCards: [...newCards],
                    priceUpdatedCards: [...priceUpdatedCards],
                    noChangeCards: [...noChangeCards],
                    soldCards: [...soldCards]
                }));
            } 
            console.log(`🎉 Watchlist refresh complete! Successfully refreshed ${completedCount}/${watchlist.length} items`);
            console.log(`📊 Summary: ${newCardsCount} new cards, ${priceUpdatesCount} price updates, ${noChangesCount} no changes, ${soldCardsCount} sold cards`);

            if (errors.length > 0) {
                console.warn(`⚠️ Encountered ${errors.length} errors during refresh`);
            }            
            
            // Call completion callback if provided
            if (onRefreshComplete) {
                onRefreshComplete();
            }

            // Pass collected cards back to App component if we have cards with updates or new cards
            if (onCardsUpdate && allCards.length > 0) {
                const cardsWithChanges = allCards.filter(x => x.scrapeMetadata?.changeType === 'new'
                    || x.scrapeMetadata?.changeType === 'pricing_changed'
                    || x.scrapeMetadata?.changeType === 'sold'
                )

                if (cardsWithChanges.length > 0) {
                    console.log(`🎯 Showing ${cardsWithChanges.length} cards with updates/new listings to user`);
                    onCardsUpdate(cardsWithChanges);
                } else {
                    console.log(`📋 No relevant cards to display (${cardsWithChanges.length} total cards collected)`);
                }
            }

        } catch (error) {
            console.error('Critical error during watchlist refresh:', error);
            errors.push(`Critical error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setProgress(prev => ({
                ...prev,
                isRefreshing: false,
                currentCard: undefined,
                isComplete: true,
                newCardsCount,
                priceUpdatesCount,
                noChangesCount,
                soldCardsCount,
                newCards: [...newCards],
                priceUpdatedCards: [...priceUpdatedCards],
                noChangeCards: [...noChangeCards],
                soldCards: [...soldCards]
            }));
        }
    }, [watchlist, bearerToken, onRefreshComplete, onCardsUpdate]);

    const formatElapsedTime = () => {
        if (!progress.startTime) return '';
        const elapsed = Math.round((Date.now() - progress.startTime.getTime()) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
    };

    const getProgressPercentage = () => {
        if (progress.totalItems === 0) return 0;
        return Math.round((progress.completedItems / progress.totalItems) * 100);
    }; const toggleSection = (section: 'newCards' | 'priceUpdates' | 'noChanges' | 'soldCards') => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleCardClick = (cardName: string) => {
        if (onTriggerSearch) {
            // Try to find the faction and mainCost for this card from the watchlist
            const watchlistItem = watchlist.find(item => item.cardName === cardName);
            const faction = watchlistItem?.faction || 'AX'; // Default to AX if not found
            const mainCost = watchlistItem?.mainCost;
            onTriggerSearch(cardName, faction, mainCost);
        }
    };

    const canRefresh = !disabled && !progress.isRefreshing && watchlist.length > 0 && bearerToken?.trim();

    return (
        <div className="watchlist-refresh">
            <div className="refresh-controls">
                <button
                    onClick={refreshWatchlistData}
                    disabled={!canRefresh}
                    className={`refresh-button ${progress.isRefreshing ? 'refreshing' : ''}`}
                    title={
                        !bearerToken?.trim() ? 'Bearer token required for refresh' :
                            watchlist.length === 0 ? 'No watchlist items to refresh' :
                                progress.isRefreshing ? 'Refresh in progress...' :
                                    isFiltered ? `Refresh ${watchlist.length} filtered items` :
                                        'Refresh all watchlist data'
                    }
                >
                    <div className="refresh-icon">
                        {progress.isRefreshing ? (
                            <div className="spinner-small"></div>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="23,4 23,10 17,10"></polyline>
                                <polyline points="1,20 1,14 7,14"></polyline>
                                <path d="m3.51,9a9,9,0,0,1,14.85-3.36L23,10M1,14l4.64,4.36A9,9,0,0,0,20.49,15"></path>
                            </svg>
                        )}
                    </div>
                    <span className="refresh-text">
                        {progress.isRefreshing ? 'Refreshing...' :
                            isFiltered ? `Refresh ${watchlist.length} Filtered` : 'Refresh All'}
                    </span>
                </button>

                {progress.isRefreshing && (
                    <div className="refresh-stats">
                        <span className="progress-text">
                            {progress.currentIndex}/{progress.totalItems}
                            {isFiltered && totalWatchlistCount > progress.totalItems && (
                                <span className="filtered-note"> (filtered)</span>
                            )}
                        </span>
                        <span className="elapsed-time">
                            {formatElapsedTime()}
                        </span>
                    </div>
                )}
            </div>

            {progress.isRefreshing && (
                <div className="refresh-progress">
                    <div className="progress-header">
                        <div className="progress-info">
                            <span className="current-card">
                                {progress.currentCard ? `Refreshing: ${progress.currentCard}` : 'Preparing...'}
                            </span>
                            <span className="progress-percentage">
                                {getProgressPercentage()}%
                            </span>
                        </div>
                    </div>

                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${getProgressPercentage()}%` }}
                        ></div>
                    </div>

                    <div className="progress-details">
                        <span className="completed-count">
                            Completed: {progress.completedItems}
                        </span>
                        {progress.errors.length > 0 && (
                            <span className="error-count">
                                Errors: {progress.errors.length}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {!progress.isRefreshing && progress.errors.length > 0 && (
                <div className="refresh-errors">
                    <div className="errors-header">
                        <span className="error-icon">⚠️</span>
                        <span>Refresh completed with {progress.errors.length} error(s):</span>
                    </div>
                    <div className="errors-list">
                        {progress.errors.slice(0, 3).map((error, index) => (
                            <div key={index} className="error-item">
                                {error}
                            </div>
                        ))}
                        {progress.errors.length > 3 && (
                            <div className="error-item">
                                ... and {progress.errors.length - 3} more errors
                            </div>
                        )}
                    </div>
                </div>
            )}

            {progress.isComplete && !progress.isRefreshing && (
                <div className="refresh-summary">
                    <div className="summary-header">
                        <span className="success-icon">✅</span>
                        <span className="summary-title">Refresh Complete!</span>
                        <button
                            className="dismiss-summary"
                            onClick={() => {
                                setProgress(prev => ({ ...prev, isComplete: false })); setExpandedSections({
                                    newCards: false,
                                    priceUpdates: false,
                                    noChanges: false,
                                    soldCards: false
                                });
                            }}
                            title="Dismiss summary"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="summary-stats">
                        <div className="summary-grid">
                            <div
                                className={`stat-item new-cards ${(progress.newCards?.length || 0) > 0 ? 'clickable' : ''}`}
                                onClick={() => (progress.newCards?.length || 0) > 0 && toggleSection('newCards')}
                                title={(progress.newCards?.length || 0) > 0 ? 'Click to see which cards' : ''}
                            >
                                <div className="stat-icon">🆕</div>
                                <div className="stat-content">
                                    <div className="stat-number">{progress.newCardsCount || 0}</div>
                                    <div className="stat-label">New Cards</div>
                                </div>
                                {(progress.newCards?.length || 0) > 0 && (
                                    <div className="expand-icon">
                                        {expandedSections.newCards ? '▼' : '▶'}
                                    </div>
                                )}
                            </div>

                            <div
                                className={`stat-item price-updates ${(progress.priceUpdatedCards?.length || 0) > 0 ? 'clickable' : ''}`}
                                onClick={() => (progress.priceUpdatedCards?.length || 0) > 0 && toggleSection('priceUpdates')}
                                title={(progress.priceUpdatedCards?.length || 0) > 0 ? 'Click to see which cards' : ''}
                            >
                                <div className="stat-icon">💰</div>
                                <div className="stat-content">
                                    <div className="stat-number">{progress.priceUpdatesCount || 0}</div>
                                    <div className="stat-label">Price Updates</div>
                                </div>
                                {(progress.priceUpdatedCards?.length || 0) > 0 && (
                                    <div className="expand-icon">
                                        {expandedSections.priceUpdates ? '▼' : '▶'}
                                    </div>
                                )}
                            </div>

                            <div
                                className={`stat-item no-changes ${(progress.noChangeCards?.length || 0) > 0 ? 'clickable' : ''}`}
                                onClick={() => (progress.noChangeCards?.length || 0) > 0 && toggleSection('noChanges')}
                                title={(progress.noChangeCards?.length || 0) > 0 ? 'Click to see which cards' : ''}
                            >
                                <div className="stat-icon">📊</div>
                                <div className="stat-content">
                                    <div className="stat-number">{progress.noChangesCount || 0}</div>
                                    <div className="stat-label">No Changes</div>
                                </div>
                                {(progress.noChangeCards?.length || 0) > 0 && (
                                    <div className="expand-icon">
                                        {expandedSections.noChanges ? '▼' : '▶'}
                                    </div>
                                )}                            </div>

                            <div
                                className={`stat-item sold-cards ${(progress.soldCards?.length || 0) > 0 ? 'clickable' : ''}`}
                                onClick={() => (progress.soldCards?.length || 0) > 0 && toggleSection('soldCards')}
                                title={(progress.soldCards?.length || 0) > 0 ? 'Click to see which cards' : ''}
                            >
                                <div className="stat-icon">🛍️</div>
                                <div className="stat-content">
                                    <div className="stat-number">{progress.soldCardsCount || 0}</div>
                                    <div className="stat-label">Cards Sold</div>
                                </div>
                                {(progress.soldCards?.length || 0) > 0 && (
                                    <div className="expand-icon">
                                        {expandedSections.soldCards ? '▼' : '▶'}
                                    </div>
                                )}
                            </div>

                            {progress.errors.length > 0 && (
                                <div className="stat-item errors">
                                    <div className="stat-icon">⚠️</div>
                                    <div className="stat-content">
                                        <div className="stat-number">{progress.errors.length}</div>
                                        <div className="stat-label">Errors</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Expandable card details */}
                        {expandedSections.newCards && (progress.newCards?.length || 0) > 0 && (
                            <div className="card-details-section">
                                <div className="details-header">
                                    <span className="details-icon">🆕</span>
                                    <span className="details-title">Cards with New Listings:</span>
                                </div>
                                <div className="card-list">
                                    {progress.newCards?.map((cardName, index) => (
                                        <div
                                            key={index}
                                            className={`card-name ${onTriggerSearch ? 'clickable' : ''}`}
                                            onClick={() => handleCardClick(cardName)}
                                            title={onTriggerSearch ? 'Click to search for this card' : ''}
                                        >
                                            {cardName}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {expandedSections.priceUpdates && (progress.priceUpdatedCards?.length || 0) > 0 && (
                            <div className="card-details-section">
                                <div className="details-header">
                                    <span className="details-icon">💰</span>
                                    <span className="details-title">Cards with Price Updates:</span>
                                </div>
                                <div className="card-list">
                                    {progress.priceUpdatedCards?.map((cardName, index) => (
                                        <div
                                            key={index}
                                            className={`card-name ${onTriggerSearch ? 'clickable' : ''}`}
                                            onClick={() => handleCardClick(cardName)}
                                            title={onTriggerSearch ? 'Click to search for this card' : ''}
                                        >
                                            {cardName}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {expandedSections.noChanges && (progress.noChangeCards?.length || 0) > 0 && (
                            <div className="card-details-section">
                                <div className="details-header">
                                    <span className="details-icon">📊</span>
                                    <span className="details-title">Cards with No Changes:</span>
                                </div>
                                <div className="card-list">
                                    {progress.noChangeCards?.map((cardName, index) => (
                                        <div
                                            key={index}
                                            className={`card-name ${onTriggerSearch ? 'clickable' : ''}`}
                                            onClick={() => handleCardClick(cardName)}
                                            title={onTriggerSearch ? 'Click to search for this card' : ''}
                                        >
                                            {cardName}
                                        </div>
                                    ))}
                                </div>
                            </div>)}

                        {expandedSections.soldCards && (progress.soldCards?.length || 0) > 0 && (
                            <div className="card-details-section">
                                <div className="details-header">
                                    <span className="details-icon">🛍️</span>
                                    <span className="details-title">Cards Recently Sold:</span>
                                </div>
                                <div className="card-list">
                                    {progress.soldCards?.map((cardName, index) => (
                                        <div
                                            key={index}
                                            className={`card-name ${onTriggerSearch ? 'clickable' : ''}`}
                                            onClick={() => handleCardClick(cardName)}
                                            title={onTriggerSearch ? 'Click to search for this card' : ''}
                                        >
                                            {cardName}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="summary-footer">
                            <div className="completion-time">
                                Completed in {formatElapsedTime()}
                            </div>
                            <div className="total-processed">
                                {progress.completedItems}/{progress.totalItems} items processed
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WatchlistRefresh;

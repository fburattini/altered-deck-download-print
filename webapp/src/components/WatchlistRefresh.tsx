import React, { useState, useCallback } from 'react';
import { WatchlistEntry } from '../services/searchAPI';
import { searchAPI } from '../services/searchAPI';

interface RefreshProgress {
    currentIndex: number;
    totalItems: number;
    currentCard?: string;
    isRefreshing: boolean;
    errors: string[];
    completedItems: number;
    startTime?: Date;
}

interface WatchlistRefreshProps {
    watchlist: WatchlistEntry[];
    bearerToken?: string;
    onRefreshComplete?: () => void;
    disabled?: boolean;
}

const WatchlistRefresh: React.FC<WatchlistRefreshProps> = ({
    watchlist,
    bearerToken,
    onRefreshComplete,
    disabled = false
}) => {
    const [progress, setProgress] = useState<RefreshProgress>({
        currentIndex: 0,
        totalItems: 0,
        isRefreshing: false,
        errors: [],
        completedItems: 0
    });

    const refreshWatchlistData = useCallback(async () => {
        if (!watchlist.length || !bearerToken?.trim()) {
            console.error('Cannot refresh: watchlist is empty or bearer token is missing');
            return;
        }

        const startTime = new Date();
        setProgress({
            currentIndex: 0,
            totalItems: watchlist.length,
            isRefreshing: true,
            errors: [],
            completedItems: 0,
            startTime
        });

        let completedCount = 0;
        const errors: string[] = [];

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

                    console.log(`🔄 Refreshing watchlist item ${i + 1}/${watchlist.length}: ${item.cardName} (${item.faction})`);

                    // Use the scraper API to get fresh data
                    const response = await searchAPI.scrapeCards(scrapeFilters, bearerToken);

                    if (response.success) {
                        completedCount++;
                        console.log(`✅ Successfully refreshed: ${item.cardName}`);
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
                    errors: [...errors]
                }));
            }

            console.log(`🎉 Watchlist refresh complete! Successfully refreshed ${completedCount}/${watchlist.length} items`);

            if (errors.length > 0) {
                console.warn(`⚠️ Encountered ${errors.length} errors during refresh`);
            }

            // Call completion callback if provided
            if (onRefreshComplete) {
                onRefreshComplete();
            }

        } catch (error) {
            console.error('Critical error during watchlist refresh:', error);
            errors.push(`Critical error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setProgress(prev => ({
                ...prev,
                isRefreshing: false,
                currentCard: undefined
            }));
        }
    }, [watchlist, bearerToken, onRefreshComplete]);

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
                        {progress.isRefreshing ? 'Refreshing...' : 'Refresh All'}
                    </span>
                </button>

                {progress.isRefreshing && (
                    <div className="refresh-stats">
                        <span className="progress-text">
                            {progress.currentIndex}/{progress.totalItems}
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
        </div>
    );
};

export default WatchlistRefresh;

import * as fs from 'fs-extra';
import * as path from 'path';
import { CardDetail } from '../market/market-types';

export interface BookmarkEntry {
    userId: string;
    cardId: string;
    cardName: string;
    faction: string;
    bookmarkedAt: string; // ISO 8601 timestamp
}

export interface UserBookmarks {
    userId: string;
    bookmarks: BookmarkEntry[];
    lastUpdated: string; // ISO 8601 timestamp
}

export class BookmarkManager {
    private bookmarkDbPath: string;

    constructor(basePath: string = process.cwd()) {
        this.bookmarkDbPath = path.join(basePath, 'bookmark_db');
    }

    /**
     * Initialize the bookmark database directory
     */
    private async ensureBookmarkDbExists(): Promise<void> {
        await fs.ensureDir(this.bookmarkDbPath);
    }

    /**
     * Get the file path for a user's bookmarks
     */
    private getUserBookmarkFilePath(userId: string): string {
        const sanitizedUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
        return path.join(this.bookmarkDbPath, `bookmarks-${sanitizedUserId}.jsonl`);
    }

    /**
     * Load all bookmarks for a specific user
     */
    async getUserBookmarks(userId: string): Promise<BookmarkEntry[]> {
        await this.ensureBookmarkDbExists();
        const filePath = this.getUserBookmarkFilePath(userId);
        
        try {
            if (!await fs.pathExists(filePath)) {
                return [];
            }

            const content = await fs.readFile(filePath, 'utf8');
            const lines = content.trim().split('\n').filter(line => line.length > 0);
            const bookmarks: BookmarkEntry[] = [];

            for (const line of lines) {
                try {
                    const bookmark = JSON.parse(line) as BookmarkEntry;
                    bookmarks.push(bookmark);
                } catch (parseError) {
                    console.warn(`Failed to parse bookmark line for user ${userId}: ${line}`, parseError);
                }
            }

            return bookmarks;
        } catch (error) {
            console.error(`Error loading bookmarks for user ${userId}:`, error);
            return [];
        }
    }

    /**
     * Check if a card is bookmarked by a user
     */
    async isCardBookmarked(userId: string, cardId: string): Promise<boolean> {
        const bookmarks = await this.getUserBookmarks(userId);
        return bookmarks.some(bookmark => bookmark.cardId === cardId);
    }

    /**
     * Add a bookmark for a user
     */
    async addBookmark(userId: string, card: CardDetail): Promise<void> {
        await this.ensureBookmarkDbExists();
        
        // Check if already bookmarked
        if (await this.isCardBookmarked(userId, card.id)) {
            console.log(`Card ${card.name} (${card.id}) is already bookmarked by user ${userId}`);
            return;
        }

        const filePath = this.getUserBookmarkFilePath(userId);
        const now = new Date().toISOString();

        const newBookmark: BookmarkEntry = {
            userId,
            cardId: card.id,
            cardName: card.name,
            faction: card.mainFaction.reference,
            bookmarkedAt: now
        };

        try {
            // Load existing bookmarks
            const existingBookmarks = await this.getUserBookmarks(userId);
            existingBookmarks.push(newBookmark);

            // Write all bookmarks back to file
            const jsonlContent = existingBookmarks.map(bookmark => JSON.stringify(bookmark)).join('\n');
            await fs.writeFile(filePath, jsonlContent, 'utf8');

            console.log(`Added bookmark for card ${card.name} (${card.id}) for user ${userId}`);
        } catch (error) {
            console.error(`Error adding bookmark for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Remove a bookmark for a user
     */
    async removeBookmark(userId: string, cardId: string): Promise<void> {
        await this.ensureBookmarkDbExists();
        const filePath = this.getUserBookmarkFilePath(userId);

        try {
            // Load existing bookmarks
            const existingBookmarks = await this.getUserBookmarks(userId);
            const bookmarkIndex = existingBookmarks.findIndex(bookmark => bookmark.cardId === cardId);

            if (bookmarkIndex === -1) {
                console.log(`Card ${cardId} is not bookmarked by user ${userId}`);
                return;
            }

            // Remove the bookmark
            const removedBookmark = existingBookmarks.splice(bookmarkIndex, 1)[0];

            // Write remaining bookmarks back to file
            const jsonlContent = existingBookmarks.map(bookmark => JSON.stringify(bookmark)).join('\n');
            await fs.writeFile(filePath, jsonlContent, 'utf8');

            console.log(`Removed bookmark for card ${removedBookmark.cardName} (${cardId}) for user ${userId}`);
        } catch (error) {
            console.error(`Error removing bookmark for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Toggle bookmark status for a card (add if not bookmarked, remove if bookmarked)
     */
    async toggleBookmark(userId: string, card: CardDetail): Promise<boolean> {
        const isBookmarked = await this.isCardBookmarked(userId, card.id);
        
        if (isBookmarked) {
            await this.removeBookmark(userId, card.id);
            return false; // Now unbookmarked
        } else {
            await this.addBookmark(userId, card);
            return true; // Now bookmarked
        }
    }

    /**
     * Get bookmark statistics for a user
     */
    async getUserBookmarkStats(userId: string): Promise<{
        totalBookmarks: number;
        factionCounts: Record<string, number>;
        oldestBookmark?: string;
        newestBookmark?: string;
    }> {
        const bookmarks = await this.getUserBookmarks(userId);
        
        const factionCounts: Record<string, number> = {};
        let oldestDate: string | undefined;
        let newestDate: string | undefined;

        for (const bookmark of bookmarks) {
            // Count by faction
            factionCounts[bookmark.faction] = (factionCounts[bookmark.faction] || 0) + 1;

            // Track oldest and newest
            if (!oldestDate || bookmark.bookmarkedAt < oldestDate) {
                oldestDate = bookmark.bookmarkedAt;
            }
            if (!newestDate || bookmark.bookmarkedAt > newestDate) {
                newestDate = bookmark.bookmarkedAt;
            }
        }

        return {
            totalBookmarks: bookmarks.length,
            factionCounts,
            oldestBookmark: oldestDate,
            newestBookmark: newestDate
        };
    }

    /**
     * Get all users who have bookmarks
     */
    async getAllUsersWithBookmarks(): Promise<string[]> {
        await this.ensureBookmarkDbExists();
        
        try {
            const files = await fs.readdir(this.bookmarkDbPath);
            const bookmarkFiles = files.filter(file => file.startsWith('bookmarks-') && file.endsWith('.jsonl'));
            
            const userIds: string[] = [];
            for (const file of bookmarkFiles) {
                // Extract userId from filename: bookmarks-{userId}.jsonl
                const userId = file.substring('bookmarks-'.length, file.length - '.jsonl'.length);
                userIds.push(userId);
            }
            
            return userIds;
        } catch (error) {
            console.error('Error getting users with bookmarks:', error);
            return [];
        }
    }

    /**
     * Get bookmark counts across all users for analytics
     */
    async getGlobalBookmarkStats(): Promise<{
        totalUsers: number;
        totalBookmarks: number;
        topBookmarkedCards: Array<{ cardId: string; cardName: string; bookmarkCount: number }>;
        topFactions: Array<{ faction: string; bookmarkCount: number }>;
    }> {
        const userIds = await this.getAllUsersWithBookmarks();
        const cardBookmarkCounts: Record<string, { name: string; count: number }> = {};
        const factionCounts: Record<string, number> = {};
        let totalBookmarks = 0;

        for (const userId of userIds) {
            const bookmarks = await this.getUserBookmarks(userId);
            totalBookmarks += bookmarks.length;

            for (const bookmark of bookmarks) {
                // Count card bookmarks
                if (!cardBookmarkCounts[bookmark.cardId]) {
                    cardBookmarkCounts[bookmark.cardId] = { name: bookmark.cardName, count: 0 };
                }
                cardBookmarkCounts[bookmark.cardId].count++;

                // Count faction bookmarks
                factionCounts[bookmark.faction] = (factionCounts[bookmark.faction] || 0) + 1;
            }
        }

        // Sort top bookmarked cards
        const topBookmarkedCards = Object.entries(cardBookmarkCounts)
            .map(([cardId, data]) => ({ cardId, cardName: data.name, bookmarkCount: data.count }))
            .sort((a, b) => b.bookmarkCount - a.bookmarkCount)
            .slice(0, 10);

        // Sort top factions
        const topFactions = Object.entries(factionCounts)
            .map(([faction, count]) => ({ faction, bookmarkCount: count }))
            .sort((a, b) => b.bookmarkCount - a.bookmarkCount);

        return {
            totalUsers: userIds.length,
            totalBookmarks,
            topBookmarkedCards,
            topFactions
        };
    }

    /**
     * Clean up orphaned bookmark files (for users with no bookmarks)
     */
    async cleanupEmptyBookmarkFiles(): Promise<number> {
        await this.ensureBookmarkDbExists();
        let cleanedCount = 0;

        try {
            const files = await fs.readdir(this.bookmarkDbPath);
            const bookmarkFiles = files.filter(file => file.startsWith('bookmarks-') && file.endsWith('.jsonl'));

            for (const file of bookmarkFiles) {
                const filePath = path.join(this.bookmarkDbPath, file);
                const content = await fs.readFile(filePath, 'utf8');
                const lines = content.trim().split('\n').filter(line => line.length > 0);

                if (lines.length === 0) {
                    await fs.remove(filePath);
                    cleanedCount++;
                    console.log(`Removed empty bookmark file: ${file}`);
                }
            }
        } catch (error) {
            console.error('Error during cleanup:', error);
        }

        return cleanedCount;
    }
}
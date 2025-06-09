import fs from 'fs-extra';
import path from 'path';

export interface UserWatchlist {
  cardName: string
  faction: string
  mainCost: number[]
  lastRefresh: string
}

// Add watchlist entry interface for adding/removing items
export interface WatchlistEntry {
  cardName: string;
  faction: string;
  mainCost: number[];
}

export interface UserData {
  userId: string;
  watchlist: UserWatchlist[]
}

export interface UserCreationData {
  userId: string;
}

export class UserManager {
  private userDbPath: string;

  constructor(basePath: string = process.cwd()) {
    this.userDbPath = path.join(basePath, 'user_db');
    this.ensureUserDbDirectory();
  }

  private ensureUserDbDirectory = (): void => {
    if (!fs.existsSync(this.userDbPath)) {
      fs.mkdirSync(this.userDbPath, { recursive: true });
    }
  };

  private getUserFilePath = (userId: string): string => {
    return path.join(this.userDbPath, `user-${userId}.json`);
  };

  private saveUserFile = async (userId: string, userData: UserData): Promise<void> => {
    const filePath = this.getUserFilePath(userId);
    const jsonData = JSON.stringify(userData, null, 2);
    await fs.writeFile(filePath, jsonData);
  };

  private createDefaultUser = async (userId: string): Promise<UserData> => {
    const defaultUser: UserData = {
      userId,
      watchlist: []
    };
    await this.saveUserFile(userId, defaultUser);
    return defaultUser;
  };

  createUser = async (userData: UserCreationData): Promise<UserData> => {
    const newUser: UserData = {
      userId: userData.userId,
      watchlist: []
    };

    await this.saveUserFile(userData.userId, newUser);
    return newUser;
  };

  getUserData = async (userId: string): Promise<UserData | null> => {
    const filePath = this.getUserFilePath(userId);
    
    if (!fs.existsSync(filePath)) {
      // Create default user if file doesn't exist
      return await this.createDefaultUser(userId);
    }

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const userData: UserData = JSON.parse(content);
      return userData;
    } catch (error) {
      console.error(`Error reading user data for ${userId}:`, error);
      // If file is corrupted, create a new default user
      return await this.createDefaultUser(userId);
    }
  };

  updateUser = async (userId: string, updates: Partial<UserData>): Promise<UserData | null> => {
    const existingUser = await this.getUserData(userId);
    
    if (!existingUser) {
      return null;
    }

    const updatedUser: UserData = {
      ...existingUser,
      ...updates,
    };

    await this.saveUserFile(userId, updatedUser);
    return updatedUser;
  };

  deleteUser = async (userId: string): Promise<boolean> => {
    const filePath = this.getUserFilePath(userId);
    
    try {
      if (fs.existsSync(filePath)) {
        await fs.unlink(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error deleting user ${userId}:`, error);
      return false;
    }
  };

  getAllUserIds = async (): Promise<string[]> => {
    try {
      const files = await fs.readdir(this.userDbPath);
      return files
        .filter(file => file.startsWith('user-') && file.endsWith('.json'))
        .map(file => file.replace('user-', '').replace('.json', ''));
    } catch (error) {
      console.error('Error reading user directory:', error);
      return [];
    }
  };

  /**
   * Add a card to the user's watchlist
   */
  addToWatchlist = async (userId: string, entry: WatchlistEntry): Promise<UserData | null> => {
    const existingUser = await this.getUserData(userId);
    
    if (!existingUser) {
      // Create user if doesn't exist
      const newUser = await this.createUser({ userId });
      const watchlistEntry: UserWatchlist = {
        ...entry,
        lastRefresh: new Date().toISOString()
      };
      
      const updatedUser = await this.updateUser(userId, {
        watchlist: [watchlistEntry]
      });
      
      return updatedUser;
    }

    // Check if card is already in watchlist
    const existingIndex = existingUser.watchlist.findIndex(
      item => item.cardName === entry.cardName && item.faction === entry.faction
    );

    let updatedWatchlist: UserWatchlist[];

    if (existingIndex >= 0) {
      // Update existing entry
      updatedWatchlist = [...existingUser.watchlist];
      updatedWatchlist[existingIndex] = {
        ...entry,
        lastRefresh: new Date().toISOString()
      };
    } else {
      // Add new entry
      const watchlistEntry: UserWatchlist = {
        ...entry,
        lastRefresh: new Date().toISOString()
      };
      updatedWatchlist = [...existingUser.watchlist, watchlistEntry];
    }

    const updatedUser = await this.updateUser(userId, {
      watchlist: updatedWatchlist
    });

    return updatedUser;
  };

  /**
   * Remove a card from the user's watchlist
   */
  removeFromWatchlist = async (userId: string, cardName: string, faction: string): Promise<UserData | null> => {
    const existingUser = await this.getUserData(userId);
    
    if (!existingUser) {
      return null;
    }

    // Filter out the card to remove
    const updatedWatchlist = existingUser.watchlist.filter(
      item => !(item.cardName === cardName && item.faction === faction)
    );

    // Only update if something was actually removed
    if (updatedWatchlist.length !== existingUser.watchlist.length) {
      const updatedUser = await this.updateUser(userId, {
        watchlist: updatedWatchlist
      });
      return updatedUser;
    }

    return existingUser;
  };

  /**
   * Get the user's full watchlist
   */
  getUserWatchlist = async (userId: string): Promise<UserWatchlist[]> => {
    const userData = await this.getUserData(userId);
    return userData?.watchlist || [];
  };

  /**
   * Toggle a card in the user's watchlist (add if not present, remove if present)
   */
  toggleWatchlist = async (userId: string, entry: WatchlistEntry): Promise<UserData | null> => {
    const isInWatchlist = await this.isCardInWatchlist(userId, entry.cardName, entry.faction);
    
    if (isInWatchlist) {
      return await this.removeFromWatchlist(userId, entry.cardName, entry.faction);
    } else {
      return await this.addToWatchlist(userId, entry);
    }
  };

  /**
   * Check if a card is in the user's watchlist
   */
  isCardInWatchlist = async (userId: string, cardName: string, faction: string): Promise<boolean> => {
    const watchlist = await this.getUserWatchlist(userId);
    return watchlist.some(item => item.cardName === cardName && item.faction === faction);
  };

  /**
   * Update the last refresh time for a specific watchlist entry
   */
  updateWatchlistEntryRefreshTime = async (userId: string, cardName: string, faction: string): Promise<UserData | null> => {
    const existingUser = await this.getUserData(userId);
    
    if (!existingUser) {
      return null;
    }

    const entryIndex = existingUser.watchlist.findIndex(
      item => item.cardName === cardName && item.faction === faction
    );

    if (entryIndex >= 0) {
      const updatedWatchlist = [...existingUser.watchlist];
      updatedWatchlist[entryIndex] = {
        ...updatedWatchlist[entryIndex],
        lastRefresh: new Date().toISOString()
      };

      const updatedUser = await this.updateUser(userId, {
        watchlist: updatedWatchlist
      });

      return updatedUser;
    }

    return existingUser;
  };

  /**
   * Clear the entire watchlist for a user
   */
  clearWatchlist = async (userId: string): Promise<UserData | null> => {
    const existingUser = await this.getUserData(userId);
    
    if (!existingUser) {
      return null;
    }

    const updatedUser = await this.updateUser(userId, {
      watchlist: []
    });

    return updatedUser;
  };

  /**
   * Get watchlist statistics for a user
   */
  getWatchlistStats = async (userId: string): Promise<{
    totalCards: number;
    factionCounts: Record<string, number>;
    mainCostCounts: Record<number, number>;
    oldestEntry?: string;
    newestEntry?: string;
  }> => {
    const watchlist = await this.getUserWatchlist(userId);
    
    const factionCounts: Record<string, number> = {};
    const mainCostCounts: Record<number, number> = {};
    let oldestDate: string | undefined;
    let newestDate: string | undefined;

    for (const entry of watchlist) {
      // Count by faction
      factionCounts[entry.faction] = (factionCounts[entry.faction] || 0) + 1;

      // Count by main cost
      for (const cost of entry.mainCost) {
        mainCostCounts[cost] = (mainCostCounts[cost] || 0) + 1;
      }

      // Track oldest and newest refresh times
      if (!oldestDate || entry.lastRefresh < oldestDate) {
        oldestDate = entry.lastRefresh;
      }
      if (!newestDate || entry.lastRefresh > newestDate) {
        newestDate = entry.lastRefresh;
      }
    }

    return {
      totalCards: watchlist.length,
      factionCounts,
      mainCostCounts,
      oldestEntry: oldestDate,
      newestEntry: newestDate
    };
  };
}
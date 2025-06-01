import fs from 'fs';
import path from 'path';

export interface CardDataResponse {
  cards: any[];
  fileCount: number;
  cardCount: number;
  errors: string[];
}

/**
 * Load card data from JSONL files in the card_db directory
 */
export async function loadCardDataFromFiles(): Promise<CardDataResponse> {
  const result: CardDataResponse = {
    cards: [],
    fileCount: 0,
    cardCount: 0,
    errors: []
  };

  try {
    const cardDbPath = path.join(process.cwd(), 'card_db');
    
    if (!fs.existsSync(cardDbPath)) {
      throw new Error('card_db directory not found');
    }

    const files = fs.readdirSync(cardDbPath)
      .filter(file => file.endsWith('.jsonl'))
      .sort((a, b) => {
        // Prioritize files with "latest" in the name
        if (a.includes('latest') && !b.includes('latest')) return -1;
        if (!a.includes('latest') && b.includes('latest')) return 1;
        // Sort by modification time, newest first
        const aStats = fs.statSync(path.join(cardDbPath, a));
        const bStats = fs.statSync(path.join(cardDbPath, b));
        return bStats.mtime.getTime() - aStats.mtime.getTime();
      });

    console.log(`Found ${files.length} JSONL files in card_db`);
    
    const cardIds = new Set<string>();
    
    for (const file of files.slice(0, 5)) { // Limit to 5 most recent files
      try {
        const filePath = path.join(cardDbPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.trim().split('\n').filter(line => line.trim());
        
        console.log(`Processing ${file}: ${lines.length} lines`);
        
        let newCards = 0;
        for (const line of lines) {
          try {
            const card = JSON.parse(line);
            if (!cardIds.has(card.id)) {
              cardIds.add(card.id);
              result.cards.push(card);
              newCards++;
            }
          } catch (parseError) {
            result.errors.push(`Failed to parse line in ${file}: ${parseError}`);
          }
        }
        
        console.log(`Added ${newCards} unique cards from ${file}`);
        result.fileCount++;
        
      } catch (fileError) {
        result.errors.push(`Failed to read file ${file}: ${fileError}`);
      }
    }
    
    result.cardCount = result.cards.length;
    console.log(`Total unique cards loaded: ${result.cardCount}`);
    
  } catch (error) {
    result.errors.push(`Failed to load card data: ${error}`);
  }

  return result;
}

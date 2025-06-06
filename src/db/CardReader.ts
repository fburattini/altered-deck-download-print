import * as fs from 'fs-extra';
import * as path from 'path';
import { CardDetail } from '../market/market-types';

export class CardReader {
    private cardDbPath: string;

    constructor(basePath: string = process.cwd()) {
        this.cardDbPath = path.join(basePath, 'card_db');
    }

    /**
     * Loads all cards from the .jsonl files in the card_db directory.
     * Each .jsonl file contains multiple card objects, one per line.
     */
    async loadAllCards(): Promise<CardDetail[]> {
        const allCards: CardDetail[] = [];
        try {
            await fs.ensureDir(this.cardDbPath);
            const files = await fs.readdir(this.cardDbPath);
            const jsonlFiles = files.filter(file => file.startsWith('cards-') && file.endsWith('.jsonl'));

            for (const file of jsonlFiles) {
                const filePath = path.join(this.cardDbPath, file);
                try {
                    const content = await fs.readFile(filePath, 'utf8');
                    const lines = content.trim().split('\n').filter(line => line.length > 0);
                    
                    for (const line of lines) {
                        try {
                            const card = JSON.parse(line) as CardDetail;
                            allCards.push(card);
                        } catch (parseError) {
                            console.error(`Error parsing JSON from line in ${file}: ${line}`, parseError);
                        }
                    }
                } catch (readError) {
                    console.error(`Error reading file ${file}:`, readError);
                }
            }
            console.log(`Loaded ${allCards.length} cards from ${jsonlFiles.length} files.`);
        } catch (dirError) {
            console.error(`Error accessing card_db directory at ${this.cardDbPath}:`, dirError);
        }
        return allCards;
    }

    /**
     * Returns a list of objects containing card name and faction, derived from the filenames
     * in the card_db directory.
     * Filename format is expected to be 'cards-${sanitizedName}-${faction}.jsonl'.
     * The function extracts '${sanitizedName}' as cardName and '${faction}' as cardFaction.
     */
    async getCardNameFactions(): Promise<{ cardName: string; cardFaction: string }[]> {
        const cardNameFactions: { cardName: string; cardFaction: string }[] = [];
        try {
            await fs.ensureDir(this.cardDbPath);
            const files = await fs.readdir(this.cardDbPath);
            const jsonlFiles = files.filter(file => file.startsWith('cards-') && file.endsWith('.jsonl'));

            for (const file of jsonlFiles) {
                // Remove 'cards-' prefix
                let nameFactionPart = file.substring('cards-'.length);
                // Remove '.jsonl' suffix
                nameFactionPart = nameFactionPart.substring(0, nameFactionPart.length - '.jsonl'.length);

                const lastHyphenIndex = nameFactionPart.lastIndexOf('-');
                if (lastHyphenIndex === -1 || lastHyphenIndex === 0 || lastHyphenIndex === nameFactionPart.length - 1) {
                    console.warn(`Could not properly parse card name and faction from filename: ${file}. Skipping.`);
                    continue;
                }

                const cardName = nameFactionPart.substring(0, lastHyphenIndex);
                const cardFaction = nameFactionPart.substring(lastHyphenIndex + 1);

                cardNameFactions.push({ cardName, cardFaction });
            }
            console.log(`Found ${cardNameFactions.length} card-name-faction identifiers.`);
        } catch (dirError) {
            console.error(`Error accessing card_db directory at ${this.cardDbPath}:`, dirError);
        }
        return cardNameFactions;
    }
}

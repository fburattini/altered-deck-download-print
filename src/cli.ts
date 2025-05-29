import promptSync from 'prompt-sync';
import { downloadDeckImages } from './index';
import { listAvailableDecks, generatePDFForDeck } from './pdf-generator';
import { createScraper } from './market/scraper';

const prompt = promptSync({ sigint: true });

const printMenu = (): void => {
    console.log('\n=== Altered Deck Download and Print Tool ===');
    console.log('1. Download a new deck');
    console.log('2. List downloaded decks');
    console.log('3. Generate PDF for a deck');
    console.log('4. Download and generate PDF in one step');
    console.log('5. Test API scraper');
    console.log('6. Analyze API filters');
    console.log('7. Run full card scrape');
    console.log('8. Run filtered card scrape');
    console.log('0. Exit');
    console.log('========================================');
};

const downloadDeck = async (): Promise<string | null> => {
    console.log('\n--- Download a New Deck ---');
    const deckId = prompt('Enter the deck ID (the last part of the URL): ');
    
    if (!deckId) {
        console.log('No deck ID provided. Returning to main menu.');
        return null;
    }
    
    try {
        const deckName = await downloadDeckImages(deckId);
        return deckName;
    } catch (error) {
        console.error('Error downloading deck:', error);
        return null;
    }
};

const listDecks = async (): Promise<void> => {
    console.log('\n--- Downloaded Decks ---');
    const decks = await listAvailableDecks();
    
    if (decks.length === 0) {
        console.log('No decks found. Download a deck first.');
        return;
    }
    
    console.log('Available decks:');
    decks.forEach((deck, index) => {
        console.log(`${index + 1}. ${deck}`);
    });
};

const generatePDF = async (): Promise<void> => {
    console.log('\n--- Generate PDF for a Deck ---');
    const decks = await listAvailableDecks();
    
    if (decks.length === 0) {
        console.log('No decks found. Download a deck first.');
        return;
    }
    
    console.log('Select a deck to generate PDF:');
    decks.forEach((deck, index) => {
        console.log(`${index + 1}. ${deck}`);
    });
    
    const selection = prompt('Enter deck number (or 0 to cancel): ');
    const deckIndex = parseInt(selection, 10) - 1;
    
    if (isNaN(deckIndex) || deckIndex < 0 || deckIndex >= decks.length) {
        console.log('Invalid selection. Returning to main menu.');
        return;
    }
    
    const selectedDeck = decks[deckIndex];
    console.log(`Generating PDF for deck: ${selectedDeck}`);
    
    const pdfPath = await generatePDFForDeck(selectedDeck);
    
    if (pdfPath) {
        console.log(`PDF generated successfully at: ${pdfPath}`);
    } else {
        console.log('Failed to generate PDF.');
    }
};

const downloadAndGeneratePDF = async (): Promise<void> => {
    console.log('\n--- Download and Generate PDF ---');
    const deckId = prompt('Enter the deck ID (the last part of the URL): ');
    
    if (!deckId) {
        console.log('No deck ID provided. Returning to main menu.');
        return;
    }
    
    try {
        console.log('Step 1: Downloading deck...');
        const deckName = await downloadDeckImages(deckId);
        
        if (!deckName) {
            console.log('Failed to download deck. PDF generation canceled.');
            return;
        }
        
        console.log('Step 2: Generating PDF...');
        const pdfPath = await generatePDFForDeck(deckName);
        
        if (pdfPath) {
            console.log(`PDF generated successfully at: ${pdfPath}`);
        } else {
            console.log('Failed to generate PDF.');
        }
    } catch (error) {
        console.error('Error downloading deck and generating PDF:', error);
    }
};

const testScraper = async (): Promise<void> => {
    console.log('\n--- Test API Scraper ---');
    try {
        const scraper = createScraper();
        await scraper.runTestScrape();
    } catch (error) {
        console.error('Test scraper failed:', error);
    }
};

const analyzeFilters = async (): Promise<void> => {
    console.log('\n--- Analyze API Filters ---');
    try {
        const scraper = createScraper();
        await scraper.analyzeFilters();
    } catch (error) {
        console.error('Filter analysis failed:', error);
    }
};

const runFullCardScrape = async (): Promise<void> => {
    console.log('\n--- Run Full Card Scrape ---');
    console.log('This will scrape ALL unique cards from the API. This may take a while.');
    
    const confirm = prompt('Continue? (y/N): ');
    if (confirm?.toLowerCase() !== 'y') {
        console.log('Full scrape cancelled.');
        return;
    }
    
    // Ask about checkpoint resume
    console.log('\nCheckpoint options:');
    console.log('1. Resume from checkpoint (if available)');
    console.log('2. Start fresh (ignore checkpoint)');
    
    const checkpointChoice = prompt('Choose option (1/2): ');
    let resumeFromCheckpoint = true;
    
    switch (checkpointChoice) {
        case '1':
            resumeFromCheckpoint = true;
            console.log('Will resume from checkpoint if available...');
            break;
        case '2':
            resumeFromCheckpoint = false;
            console.log('Starting fresh scrape...');
            break;
        default:
            console.log('Invalid choice, defaulting to resume from checkpoint...');
            resumeFromCheckpoint = true;
            break;
    }
    
    try {
        const scraper = createScraper();
        await scraper.runFullScrape(resumeFromCheckpoint);
    } catch (error) {
        console.error('Full scrape failed:', error);
    }
};

const runFilteredCardScrape = async (): Promise<void> => {
    console.log('\n--- Run Filtered Card Scrape ---');
    console.log('Configure your custom filters to scrape specific cards.');
    console.log('Leave fields empty to skip that filter.\n');

    const filters: any = {};

    // Rarity filter
    console.log('Available rarities: COMMON, RARE, UNIQUE');
    const rarityInput = prompt('Rarity (comma-separated, e.g., UNIQUE,RARE): ');
    if (rarityInput && rarityInput.trim()) {
        filters.rarity = rarityInput.split(',').map(r => r.trim().toUpperCase());
    }

    // Card Set filter
    console.log('\nAvailable card sets: CORE, ALIZE');
    const cardSetInput = prompt('Card Set (comma-separated, e.g., CORE,ALIZE): ');
    if (cardSetInput && cardSetInput.trim()) {
        filters.cardSet = cardSetInput.split(',').map(cs => cs.trim().toUpperCase());
    }

    // Faction filter
    console.log('\nAvailable factions: AX, BR, LY, MU, OR, YZ');
    const factionInput = prompt('Factions (comma-separated, e.g., AX,BR): ');
    if (factionInput && factionInput.trim()) {
        filters.factions = factionInput.split(',').map(f => f.trim().toUpperCase());
    }

    // Cost filters
    console.log('\nCost range: 0-10');
    const mainCostInput = prompt('Main Cost (comma-separated, e.g., 1,2,3): ');
    if (mainCostInput && mainCostInput.trim()) {
        filters.mainCost = mainCostInput.split(',').map(c => parseInt(c.trim(), 10)).filter(c => !isNaN(c));
    }

    const recallCostInput = prompt('Recall Cost (comma-separated, e.g., 1,2): ');
    if (recallCostInput && recallCostInput.trim()) {
        filters.recallCost = recallCostInput.split(',').map(c => parseInt(c.trim(), 10)).filter(c => !isNaN(c));
    }

    // Power filters
    console.log('\nPower range: 0-10');
    const forestPowerInput = prompt('Forest Power (comma-separated, e.g., 0,1,2): ');
    if (forestPowerInput && forestPowerInput.trim()) {
        filters.forestPower = forestPowerInput.split(',').map(p => parseInt(p.trim(), 10)).filter(p => !isNaN(p));
    }

    const mountainPowerInput = prompt('Mountain Power (comma-separated, e.g., 2,3): ');
    if (mountainPowerInput && mountainPowerInput.trim()) {
        filters.mountainPower = mountainPowerInput.split(',').map(p => parseInt(p.trim(), 10)).filter(p => !isNaN(p));
    }

    const oceanPowerInput = prompt('Ocean Power (comma-separated, e.g., 1,2,3): ');
    if (oceanPowerInput && oceanPowerInput.trim()) {
        filters.oceanPower = oceanPowerInput.split(',').map(p => parseInt(p.trim(), 10)).filter(p => !isNaN(p));
    }
    
    filters.inSale = true;

    // Show configured filters
    console.log('\n--- Configured Filters ---');
    console.log(JSON.stringify(filters, null, 2));
    
    if (Object.keys(filters).length === 0) {
        console.log('No filters configured. This will scrape ALL cards (equivalent to full scrape).');
    }

    const confirm = prompt('\nProceed with these filters? (y/N): ');
    if (confirm?.toLowerCase() !== 'y') {
        console.log('Filtered scrape cancelled.');
        return;
    }

    // Ask about checkpoint resume
    console.log('\nCheckpoint options:');
    console.log('1. Resume from checkpoint (if available)');
    console.log('2. Start fresh (ignore checkpoint)');
    
    const checkpointChoice = prompt('Choose option (1/2): ');
    let resumeFromCheckpoint = true;
    
    switch (checkpointChoice) {
        case '1':
            resumeFromCheckpoint = true;
            console.log('Will resume from checkpoint if available...');
            break;
        case '2':
            resumeFromCheckpoint = false;
            console.log('Starting fresh scrape...');
            break;
        default:
            console.log('Invalid choice, defaulting to resume from checkpoint...');
            resumeFromCheckpoint = true;
            break;
    }
    
    try {
        const scraper = createScraper();
        await scraper.runFilteredScrape(filters, resumeFromCheckpoint);
    } catch (error) {
        console.error('Filtered scrape failed:', error);
    }
};

const main = async (): Promise<void> => {
    while (true) {
        printMenu();
        const choice = prompt('Select an option: ');
        
        switch (choice) {
            case '0':
                console.log('Exiting program. Goodbye!');
                return;
                
            case '1':
                await downloadDeck();
                break;
                
            case '2':
                await listDecks();
                break;
                
            case '3':
                await generatePDF();
                break;
                
            case '4':
                await downloadAndGeneratePDF();
                break;
                
            case '5':
                await testScraper();
                break;
                
            case '6':
                await analyzeFilters();
                break;
                
            case '7':
                await runFullCardScrape();
                break;
                
            case '8':
                await runFilteredCardScrape();
                break;
                
            default:
                console.log('Invalid option. Please try again.');
                break;
        }
    }
};

main().catch(error => {
    console.error('An unexpected error occurred:', error);
    process.exit(1);
});

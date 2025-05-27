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
    const confirm = prompt('This will scrape ALL unique cards from the API. This may take a while. Continue? (y/N): ');
    
    if (confirm?.toLowerCase() !== 'y') {
        console.log('Full scrape cancelled.');
        return;
    }
    
    try {
        const scraper = createScraper();
        await scraper.runFullScrape();
    } catch (error) {
        console.error('Full scrape failed:', error);
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

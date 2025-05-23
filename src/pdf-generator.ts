import * as fs from 'fs-extra';
import * as path from 'path';
import PDFDocument from 'pdfkit';
import { createCanvas, loadImage } from 'canvas';

// Define dimensions for Magic: The Gathering/Pokémon cards (2.5" x 3.5")
// Standard trading card game size
// A4 paper size in points: 595 x 842 (or in mm: 210 x 297)
// We'll convert inches to points (1 inch = 72 points)
const CARD_WIDTH_PT = 2.5 * 72; // 180 points (63.5mm)
const CARD_HEIGHT_PT = 3.5 * 72; // 252 points (88.9mm)
const PAGE_WIDTH_PT = 595.28; // A4 width in points
const PAGE_HEIGHT_PT = 841.89; // A4 height in points
const MARGIN_PT = 15; // Slightly reduced margin for better fit

// Card positions on A4 (will fit 3x3 = 9 cards per page)
const CARDS_PER_ROW = 3;
const CARDS_PER_COL = 3;
const CARDS_PER_PAGE = CARDS_PER_ROW * CARDS_PER_COL;

// Calculate spacing - with slightly reduced spacing for better fit
// This helps ensure the cards have cleaner cut lines
const CARD_SPACING_X = (PAGE_WIDTH_PT - (2 * MARGIN_PT) - (CARDS_PER_ROW * CARD_WIDTH_PT)) / (CARDS_PER_ROW - 1);
const CARD_SPACING_Y = (PAGE_HEIGHT_PT - (2 * MARGIN_PT) - (CARDS_PER_COL * CARD_HEIGHT_PT)) / (CARDS_PER_COL - 1);

// Function to get position of a card on the page
const getCardPosition = (index: number): { x: number; y: number } => {
    const row = Math.floor(index / CARDS_PER_ROW);
    const col = index % CARDS_PER_ROW;
    
    const x = MARGIN_PT + (col * (CARD_WIDTH_PT + CARD_SPACING_X));
    const y = MARGIN_PT + (row * (CARD_HEIGHT_PT + CARD_SPACING_Y));
    
    return { x, y };
};

// Function to generate PDF with images
export const generateCardsPDF = async (
    deckName: string, 
    imagesPaths: string[], 
    outputDir: string
): Promise<string> => {
    console.log(`Generating PDF for ${deckName} with ${imagesPaths.length} cards...`);
    
    // Create PDF document
    const pdfFileName = `${deckName}_cards.pdf`;
    const pdfFilePath = path.join(outputDir, pdfFileName);
    
    const doc = new PDFDocument({
        size: 'A4',
        margin: 0,
        info: {
            Title: `${deckName} - Cards`,
            Author: 'Altered Deck Downloader',
            CreationDate: new Date()
        }
    });
    
    // Create write stream for the PDF
    const writeStream = fs.createWriteStream(pdfFilePath);
    doc.pipe(writeStream);
    
    // Add a title page with deck information
    doc.fontSize(24)
       .text(`Deck: ${deckName}`, MARGIN_PT, MARGIN_PT * 2)
       .fontSize(14)
       .moveDown()
       .text(`Total cards: ${imagesPaths.length}`, MARGIN_PT, MARGIN_PT * 4)
       .moveDown()
       .text(`Generated on: ${new Date().toLocaleString()}`, MARGIN_PT)
       .moveDown()
       .text('Instructions:', MARGIN_PT)
       .fontSize(12)
       .moveDown()
       .text('1. Print this document double-sided if your cards have backs', MARGIN_PT + 10)
       .moveDown()
       .text('2. Cut along the card borders with scissors or a paper cutter', MARGIN_PT + 10)
       .moveDown()
       .text('3. For best results, print on cardstock paper (160-200 gsm)', MARGIN_PT + 10);
    
    doc.addPage();
    
    // Organize images by type
    const organizedImagesByType: { [key: string]: string[] } = {};
    
    for (const imagePath of imagesPaths) {
        const dirName = path.dirname(imagePath).split(path.sep).pop() || 'other';
        
        if (!organizedImagesByType[dirName]) {
            organizedImagesByType[dirName] = [];
        }
        
        organizedImagesByType[dirName].push(imagePath);
    }
    
    // Track current position on the page
    let currentPageIndex = 0;
    
    // Process each type of card
    for (const [cardType, cardImages] of Object.entries(organizedImagesByType)) {        
        doc.fontSize(10);
        
        // Process each card image
        for (let i = 0; i < cardImages.length; i++) {
            // If we've filled a page, add a new one (account for section title on first page)
            if ((i > 0 && i % CARDS_PER_PAGE === 0) || 
                (i === 0 && currentPageIndex >= CARDS_PER_PAGE)) {
                doc.addPage();
                currentPageIndex = 0;
            }
            
            const imagePath = cardImages[i];
            
            try {
                // Get the position for this card
                const { x, y } = getCardPosition(currentPageIndex);
                
                // Load and add the image
                const image = await loadImage(imagePath);
                
                // Fit the image into the card dimensions while preserving aspect ratio
                // This maintains the proper trading card game ratio
                doc.image(imagePath, x, y, {
                    fit: [CARD_WIDTH_PT, CARD_HEIGHT_PT],
                    align: 'center',
                    valign: 'center'
                });
                
                // Add a border around each card to help with cutting
                // Use a slightly thinner line for more precise cutting guides
                doc.rect(x, y, CARD_WIDTH_PT, CARD_HEIGHT_PT)
                   .lineWidth(0.8)
                   .stroke('#666666');
                                
                currentPageIndex++;
            } catch (error) {
                console.error(`Error processing image ${imagePath}:`, error);
            }
        }
        
        // Start a new page for the next card type
        if (Object.keys(organizedImagesByType).indexOf(cardType) < Object.keys(organizedImagesByType).length - 1) {
            doc.addPage();
            currentPageIndex = 0;
        }
    }
    
    // Finalize the PDF and end the stream
    doc.end();
    
    return new Promise((resolve, reject) => {
        writeStream.on('finish', () => {
            console.log(`✅ PDF created: ${pdfFilePath}`);
            resolve(pdfFilePath);
        });
        
        writeStream.on('error', (err) => {
            console.error('Error creating PDF:', err);
            reject(err);
        });
    });
};

// Function to find all images in a deck directory
export const findDeckImages = async (deckDir: string): Promise<string[]> => {
    const images: string[] = [];
    
    try {
        // Check if directory exists
        if (!await fs.pathExists(deckDir)) {
            console.error(`Directory not found: ${deckDir}`);
            return images;
        }
        
        // Read all subdirectories
        const subDirs = await fs.readdir(deckDir);
        
        for (const subDir of subDirs) {
            const subDirPath = path.join(deckDir, subDir);
            const stats = await fs.stat(subDirPath);
            
            if (stats.isDirectory()) {
                // Find all image files
                const files = await fs.readdir(subDirPath);
                
                for (const file of files) {
                    const filePath = path.join(subDirPath, file);
                    const fileStats = await fs.stat(filePath);
                    
                    if (fileStats.isFile() && ['.jpg', '.jpeg', '.png'].includes(path.extname(file).toLowerCase())) {
                        images.push(filePath);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error finding deck images:', error);
    }
    
    return images;
};

// Function to generate PDF for a specific deck
export const generatePDFForDeck = async (deckName: string): Promise<string | null> => {
    try {
        const decksDir = path.join(process.cwd(), 'decks');
        const deckDir = path.join(decksDir, deckName);
        
        // Check if the deck directory exists
        if (!await fs.pathExists(deckDir)) {
            console.error(`Deck directory not found: ${deckDir}`);
            return null;
        }
        
        // Find all images for this deck
        const imagesPaths = await findDeckImages(deckDir);
        
        if (imagesPaths.length === 0) {
            console.error(`No images found in deck: ${deckName}`);
            return null;
        }
        
        console.log(`Found ${imagesPaths.length} images for deck ${deckName}`);
        
        // Create a PDFs directory if it doesn't exist
        const pdfsDir = path.join(decksDir, 'pdfs');
        await fs.ensureDir(pdfsDir);
        
        // Generate the PDF
        const pdfPath = await generateCardsPDF(deckName, imagesPaths, pdfsDir);
        
        return pdfPath;
    } catch (error) {
        console.error('Error generating PDF for deck:', error);
        return null;
    }
};

// Function to list available decks
export const listAvailableDecks = async (): Promise<string[]> => {
    const decksDir = path.join(process.cwd(), 'decks');
    const decks: string[] = [];
    
    try {
        // Check if decks directory exists
        if (!await fs.pathExists(decksDir)) {
            console.error('Decks directory not found');
            return decks;
        }
        
        // Read all subdirectories (each is a deck)
        const dirs = await fs.readdir(decksDir);
        
        for (const dir of dirs) {
            const dirPath = path.join(decksDir, dir);
            const stats = await fs.stat(dirPath);
            
            if (stats.isDirectory() && dir !== 'pdfs') {
                decks.push(dir);
            }
        }
    } catch (error) {
        console.error('Error listing decks:', error);
    }
    
    return decks;
};

import * as cheerio from 'cheerio';
import * as path from 'path';
import * as fs from 'fs-extra';
import promptSync from 'prompt-sync';
import {
	TableImage,
	createFolder,
	downloadImage,
	getDeckName,
	scrapeAllImagesFromPage,
	scrapeImagesFromTable,
	fetchDeckPage
} from './scraper';

const prompt = promptSync({ sigint: true });

export const downloadDeckImages = async (deckId: string): Promise<string> => {
	try {
		// Fetch the website HTML
		const html = await fetchDeckPage(deckId);
		
		// Load HTML into cheerio
		const $ = cheerio.load(html);
		
		// Get the deck name from the page
		const deckName = getDeckName($);
		console.log(`Found deck: ${deckName}`);

		// List of table IDs to search for
		const tableIds = ['spell-table', 'permanent-table', 'character-table'];

		// Create main decks folder
		await createFolder('decks');
		
		// Create folder for this deck's images
		const sanitizedDeckName = deckName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
		const imagesFolder = await createFolder(path.join('decks', sanitizedDeckName));

		let totalImagesDownloaded = 0;
		const websiteUrl = `https://altered.ajordat.com/en/decks/${deckId}/`;

		// Process each table
		for (const tableId of tableIds) {
			console.log(`\nSearching for images in table: ${tableId}`);

			const tableFolderPath = path.join(imagesFolder, tableId);
			await fs.ensureDir(tableFolderPath);

			// Scrape images from the table
			const images = scrapeImagesFromTable($, tableId, websiteUrl);

			if (images.length > 0) {
				console.log(`Found ${images.length} images in ${tableId}`);

				// Download each image
				for (let i = 0; i < images.length; i++) {
					const image = images[i];

					// Create a valid filename from the alt text or use a default name
					const sanitizedName = image.altText
						.replace(/[^a-z0-9]/gi, '_')
						.toLowerCase()
						.substring(0, 40);

					const extension = path.extname(image.imageSrc) || '.jpg';
					const fileName = `${sanitizedName}${extension}`;
					const filePath = path.join(tableFolderPath, fileName);

					console.log(`Downloading image ${i + 1}/${images.length} from ${tableId}...`);

					try {
						await downloadImage(image.imageSrc, filePath);
						console.log(`✅ Downloaded: ${fileName}`);
						totalImagesDownloaded++;
					} catch (error) {
						console.error(`❌ Failed to download ${image.imageSrc}`);
					}
				}
			} else {
				console.log(`No images found in table: ${tableId}`);
			}
		}

		// If no images were found in the specific tables, scrape all images from the page
		if (totalImagesDownloaded === 0) {
			console.log(`\nNo images found in specified tables. Scraping all images from the page...`);

			const allImages = scrapeAllImagesFromPage($, websiteUrl);

			if (allImages.length > 0) {
				console.log(`Found ${allImages.length} images on the page`);

				// Create a folder for all images
				const allImagesFolder = await createFolder(path.join(imagesFolder, 'all-images'));

				// Download each image
				for (let i = 0; i < allImages.length; i++) {
					const image = allImages[i];

					// Create a valid filename from the alt text or use a default name
					const sanitizedName = image.altText
						.replace(/[^a-z0-9]/gi, '_')
						.toLowerCase()
						.substring(0, 50);

					const extension = path.extname(image.imageSrc) || '.jpg';
					const fileName = `${sanitizedName}${extension}`;
					const filePath = path.join(allImagesFolder, fileName);

					console.log(`Downloading image ${i + 1}/${allImages.length} from all images...`);

					try {
						await downloadImage(image.imageSrc, filePath);
						console.log(`✅ Downloaded: ${fileName}`);
						totalImagesDownloaded++;
					} catch (error) {
						console.error(`❌ Failed to download ${image.imageSrc}`);
					}
				}
			} else {
				console.log(`No images found on the page.`);
			}
		}

		console.log(`\n✅ Download complete! Total images downloaded: ${totalImagesDownloaded}`);
		
		// Return the sanitized deck name for use by other modules
		return sanitizedDeckName;

	} catch (error) {
		console.error('An error occurred:', error);
		throw error;
	}
};

const main = async (): Promise<void> => {
	try {
		// Ask user for just the deck ID
		const deckId = prompt('Enter the deck ID (the last part of the URL): ');

		if (!deckId) {
			throw new Error('No deck ID provided.');
		}
		
		await downloadDeckImages(deckId);
		
	} catch (error) {
		console.error('An error occurred:', error);
	}
};

// main();

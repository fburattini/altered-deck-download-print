import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface TableImage {
	imageSrc: string;
	altText: string;
	tableName: string;
}

export const createFolder = async (folderName: string): Promise<string> => {
	const folderPath = path.join(process.cwd(), folderName);
	await fs.ensureDir(folderPath);
	console.log(`Created folder: ${folderPath}`);
	return folderPath;
};

export const downloadImage = async (url: string, destPath: string): Promise<void> => {
	try {
		const response = await axios({
			method: 'GET',
			url: url,
			responseType: 'stream'
		});

		const writer = fs.createWriteStream(destPath);
		response.data.pipe(writer);

		return new Promise<void>((resolve, reject) => {
			writer.on('finish', resolve);
			writer.on('error', reject);
		});
	} catch (error) {
		console.error(`Error downloading image from ${url}:`, error);
		throw error;
	}
};

export const getFullUrl = (baseUrl: string, src: string): string => {
	if (src.startsWith('http')) {
		return src;
	}

	try {
		const url = new URL(baseUrl);
		if (src.startsWith('/')) {
			return `${url.protocol}//${url.host}${src}`;
		} else {
			// Remove the file part of the path if it exists
			const basePath = url.pathname.endsWith('/') ? url.pathname : url.pathname.substring(0, url.pathname.lastIndexOf('/') + 1);
			return `${url.protocol}//${url.host}${basePath}${src}`;
		}
	} catch (error) {
		console.error('Error parsing URL:', error);
		return src;
	}
};

export const scrapeImagesFromTable = ($: cheerio.CheerioAPI, tableId: string, websiteUrl: string): TableImage[] => {
	const images: TableImage[] = [];
	const table = $(`#${tableId}`);

	if (table.length === 0) {
		console.log(`Table with ID "${tableId}" not found.`);
		return images;
	}

	// Look for table rows that have the data-image-url attribute
	table.find('tr').each((_, row) => {
		const imageUrl = $(row).attr('data-image-url');
		
		if (imageUrl) {
			// Get quantity from first column
			const quantityText = $(row).find('td').eq(0).text().trim();
			const quantity = parseInt(quantityText, 10) || 1; // Default to 1 if parsing fails
			
			// Get card name from second column
			let cardName = $(row).find('td').eq(1).text().trim();
			if (!cardName || cardName.length === 0) {
				cardName = `Card-${tableId}-${images.length + 1}`;
			}
			
			const fullUrl = getFullUrl(websiteUrl, imageUrl);
			
			// Add an entry for each copy
			for (let i = 0; i < quantity; i++) {
				images.push({
					imageSrc: fullUrl,
					altText: `${cardName}_${i+1}`,
					tableName: tableId
				});
			}
		} else {
			// As a fallback, also check for img tags inside the row
			$(row).find('img').each((_, img) => {
				const imageSrc = $(img).attr('src');
				const altText = $(img).attr('alt') || `Image-${tableId}-${images.length + 1}`;
				
				if (imageSrc) {
					const fullUrl = getFullUrl(websiteUrl, imageSrc);
					images.push({
						imageSrc: fullUrl,
						altText,
						tableName: tableId
					});
				}
			});
		}
	});

	return images;
};

export const scrapeAllImagesFromPage = ($: cheerio.CheerioAPI, websiteUrl: string): TableImage[] => {
	const images: TableImage[] = [];
	
	// Find all images on the page
	$('img').each((_, img) => {
		const imageSrc = $(img).attr('src');
		const altText = $(img).attr('alt') || `Image-page-${images.length + 1}`;
		
		if (imageSrc) {
			const fullUrl = getFullUrl(websiteUrl, imageSrc);
			images.push({
				imageSrc: fullUrl,
				altText,
				tableName: 'all-images'
			});
		}
	});
	
	return images;
};

export const getDeckName = ($: cheerio.CheerioAPI): string => {
	// Try to find the deck name from the element with id "deckName"
	const deckNameElement = $('#deckName');
	if (deckNameElement.length > 0) {
		const deckName = deckNameElement.text().trim();
		if (deckName) {
			return deckName;
		}
	}
	
	// Fallback: Try to find the page title
	const pageTitle = $('title').text().trim();
	if (pageTitle) {
		return pageTitle;
	}
	
	// If all else fails, use a timestamp
	return `deck-${Date.now()}`;
};

export const fetchDeckPage = async (deckId: string): Promise<string> => {
	const baseUrl = 'https://altered.ajordat.com/en/decks/';
	const websiteUrl = `${baseUrl}${deckId}/`;
	console.log(`Fetching data from ${websiteUrl}...`);
	
	const response = await axios.get(websiteUrl);
	return response.data;
};

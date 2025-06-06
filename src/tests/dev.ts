import { getBearerToken } from "../config/auth";
import { CardReader } from "../db/CardReader";
import { FilterOptions } from "../market/api-client";
import { createScraper } from "../market/scraper";

const main = async () => {
    const cardReader = new CardReader();
		const existingCards = await cardReader.loadAllCards();

    console.log(existingCards.length)
}

main()
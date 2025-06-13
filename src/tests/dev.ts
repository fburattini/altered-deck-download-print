import { getBearerToken } from "../config/auth";
import { CardReader } from "../db/CardReader";
import { FilterOptions } from "../market/api-client";
import { createScraper } from "../market/scraper";

const main = async () => {
    const filters: FilterOptions = {
        factions: ['YZ'],
        cardName: 'Monolith Legate',
        mainCost: [3],
        recallCost: [3],
        forestPower: [3],
        mountainPower: [0],
        oceanPower: [1],
        inSale: false
    }

    const locale = 'en-us'
    const token = getBearerToken();
    const scraper = createScraper(locale, token);
    const scrapeResult = await scraper.runFilteredScrapeWithPricing(filters, false);

    console.log(scrapeResult)
}

main()
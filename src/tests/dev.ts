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
    // const scrapeResult = await scraper.runFilteredScrapeWithPricing(filters, false);

    // https://www.altered.gg/cards/ALT_COREKS_B_OR_08_U_2382
    const ttt = await scraper.apiClient.getCardDetail('ALT_COREKS_B_OR_08_U_2382')
    console.log(ttt)


    const lll = await scraper.apiClient.getCardStats(filters)
    console.log(lll)

    // https://www.altered.gg/cards/ALT_COREKS_B_OR_08_U_2382

    // console.log(scrapeResult)
}

main()
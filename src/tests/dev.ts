import { getBearerToken } from "../config/auth";
import { FilterOptions } from "../market/api-client";
import { createScraper } from "../market/scraper";

const main = async () => {
    const filters: FilterOptions = {
      cardName: 'nisse',
      rarity: ['UNIQUE'],
      factions: ['LY'],
      mainCost: [3],
      recallCost: [3]
    }
    //ALT_ALIZE_B_LY_36_U_7398
    // ALT_ALIZE_B_LY_36_U_17376

    const token = getBearerToken()

    const scraper = createScraper('en-US', token);
    // await scraper.runFilteredScrapeWithPricing(filters, false);

    const ttt = await scraper.getCardStatsForFilters(filters)
    console.log('Card Stats:', ttt);
    const ddd = ttt.stats.find(x => x["@id"].includes('ALT_ALIZE_B_LY_36_U_7398'))
    console.log('Card Stats for specific card:', ddd);
}

main()
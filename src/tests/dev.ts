import { getBearerToken } from "../config/auth";
import { CardReader } from "../db/CardReader";
import { FilterOptions } from "../market/api-client";
import { createScraper } from "../market/scraper";
import CardAnalyzer from '../../analysis/CardAnalyzer'

const main = async () => {
    await CardAnalyzer.analyze()
}

main()
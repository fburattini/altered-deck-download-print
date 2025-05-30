import { AlteredApiClient, FilterOptions } from "./api-client"
import { getBearerToken } from "../config/auth"

const main = async () => {
    // https://api.altered.gg/cards/stats?factions%5B%5D=YZ&inSale=true&mainCost%5B%5D=1&mainCost%5B%5D=2&mainCost%5B%5D=3&order%5Bprice%5D=ASC&rarity%5B%5D=UNIQUE&translations.name=snowball&itemsPerPage=36&locale=en-us
    // https://api.altered.gg/cards?factions%5B%5D=YZ&inSale=true&mainCost%5B%5D=1&mainCost%5B%5D=2&mainCost%5B%5D=3&order%5Bprice%5D=ASC&rarity%5B%5D=UNIQUE&translations.name=snowball&itemsPerPage=36&locale=en-us

    const name = ''
    const faction = ''
    const costs: number[] = []

    const api = 'https://api.altered.gg/cards'

    const client = new AlteredApiClient('en-US', getBearerToken())
    const filters: FilterOptions = {
        cardName: name,
        factions: [faction],
        mainCost: costs,
        rarity: ['UNIQUE']
    }

    const res = await client.scrapeWithFilters(filters, false, `targeted-${name}`)

    const url = `${api}/factions[]=${faction}&inSale=true&mainCost[]=`
}

main()
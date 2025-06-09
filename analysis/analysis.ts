import { CardReader } from '../src/db/CardReader'
import CardAnalyzer from './CardAnalyzer'
import UtilityScorer from './UtilityScorer'

const main = async () => {
    await CardAnalyzer.analyze()

    // const reader = new CardReader()
    // const allCards = await reader.loadAllCards()

    // const cards = allCards
    //     .filter(x => x.pricing?.inSale === 1)
    //     .filter(x => x.name.toLowerCase().includes('baba yaga'))

    // for (const card of cards) {
    //     UtilityScorer.score(card)
    // }
}

main()
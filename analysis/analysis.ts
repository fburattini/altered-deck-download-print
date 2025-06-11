import { CardReader } from '../src/db/CardReader'
import CardAnalyzer from './CardAnalyzer'
import UtilityScorer from './UtilityScorer'

const main = async () => {
    // await CardAnalyzer.analyze()

    const thingy = () => {
        const splits = [
            '{J}',
            '{R}',
            '{H}',
            'At Dusk —',
            'At Noon —',
            'When I leave the Expedition zone —',
            'When I go to Reserve from the Expedition zone —'
        ]

        const fake = '{J} draw a card. {J} discard. {H} bubu. At Dusk — resupply.'

        function splitByTriggers(text: string, triggers: string[]): string[] {
            const matches: { index: number; trigger: string }[] = [];

            // Find all trigger positions
            for (const trigger of triggers) {
                const escapedTrigger = trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(escapedTrigger, 'g');
                let match;
                while ((match = regex.exec(text)) !== null) {
                    matches.push({ index: match.index, trigger });
                }
            }

            // Sort matches by index
            matches.sort((a, b) => a.index - b.index);

            const result: string[] = [];
            for (let i = 0; i < matches.length; i++) {
                const start = matches[i].index;
                const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
                const segment = text.slice(start, end).trim();
                if (segment) result.push(segment);
            }

            return result;
        }

        const ttt = splitByTriggers(fake, splits)
        console.log(ttt)
    }


    thingy()
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
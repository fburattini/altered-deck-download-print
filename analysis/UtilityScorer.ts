import { CardDetail } from "../src/market/market-types"

class UtilityScorerClass {
    handCostLossWeigth = 1.1
    
    score = (card: CardDetail) => {
        const dims = this._getCardDimensions(card)

        const statsEval = this._evalStats(dims)

        console.log(statsEval)
    }

    _evalStats = (dims: CardDimensions) => {
        const { handCost, recallCost, forest, mountain, ocean } = dims
        
        const actualTotalStats = forest + mountain + ocean

        const baseHandTotalStats = handCost * 3
        const baseReserveTotalStats = recallCost * 3

        const handLoss = (actualTotalStats - baseHandTotalStats) * this.handCostLossWeigth
        const reserveLoss = actualTotalStats - baseReserveTotalStats

        return { handLoss, reserveLoss }
    }

    _getCardDimensions = (card: CardDetail): CardDimensions => {
        const {
            elements: { FOREST_POWER, MAIN_COST, MOUNTAIN_POWER, OCEAN_POWER, RECALL_COST },
            pricing,
            mainFaction: { reference }
        } = card
        const lowerPrice = pricing?.lowerPrice

        return {
            forest: parseInt(FOREST_POWER),
            mountain: parseInt(MOUNTAIN_POWER),
            ocean: parseInt(OCEAN_POWER),
            handCost: parseInt(MAIN_COST),
            recallCost: parseInt(RECALL_COST),
            faction: reference,
            lowerPrice
        } as CardDimensions
    }
}

const UtilityScorer = new UtilityScorerClass()
export default UtilityScorer

interface CardDimensions {
    forest: number
    mountain: number
    ocean: number
    handCost: number
    recallCost: number
    lowerPrice: number
    faction: string
}

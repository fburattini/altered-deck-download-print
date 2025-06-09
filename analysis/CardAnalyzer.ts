import { pipeline } from '@xenova/transformers';
import { RandomForestRegression as RF } from 'ml-random-forest';
import { CardReader } from '../src/db/CardReader';

class CardAnalyzerClass {
    analyze = async () => {
        const reader = new CardReader()
        const allCards = await reader.loadAllCards()

        const cards = allCards
            .filter(x => x.pricing.inSale)
            .filter(x => x.name.toLowerCase().includes('baba yaga'))

        const embedEffects = async (texts: string[]) => {
            const extractor = await pipeline('feature-extraction', 'Xenova/all-mpnet-base-v2');
            const vectors: number[][] = [];

            for (const text of texts) {
                const result = await extractor(text, { pooling: 'mean', normalize: true });
                // Convert Tensor to array
                const tensorData = result.data as Float32Array;
                const embeddingSize = result.dims[result.dims.length - 1];
                const embedding = Array.from(tensorData.slice(0, embeddingSize));
                vectors.push(embedding);
            }

            return vectors;
        };

        // Combine effects
        const effectTexts = cards.map(card => `${card.elements.MAIN_EFFECT} ${card.elements.ECHO_EFFECT}`);

        // Generate embeddings
        const effectVectors = await embedEffects(effectTexts); // shape: [num_cards, embedding_dim]

        // Prepare numeric features
        const numericFeatures = cards.map(card => [
            parseInt(card.elements.MAIN_COST) || 0,
            parseInt(card.elements.RECALL_COST) || 0,
            parseInt(card.elements.MOUNTAIN_POWER) || 0,
            parseInt(card.elements.FOREST_POWER) || 0,
            parseInt(card.elements.OCEAN_POWER) || 0,
        ]);

        // Combine all features
        const X = numericFeatures.map((nums, i) => [...nums, ...effectVectors[i]]);
        const y = cards.map(card => card.pricing?.lowerPrice || 0);

        // Train regression model
        // Fit Random Forest Regressor
        const rf = new RF({
            nEstimators: 100,
            maxFeatures: 0.7,
            replacement: true,
            seed: 42,
        });

        rf.train(X, y);

        // Predict and classify - Random Forest predict expects 2D array
        const predictions = rf.predict(X);

        cards.forEach((card, i) => {
            const predicted = predictions[i];
            const actualPrice = card.pricing?.lowerPrice || 0;

            if (actualPrice === 0) {
                console.log(`Card ${i + 1}: No pricing data available for ${card.name}`);
                return;
            }

            const ratio = actualPrice / predicted;
            let valuation: string;

            if (ratio < 0.8) valuation = 'Undervalued';
            else if (ratio > 1.2) valuation = 'Overvalued';
            else valuation = 'At-value';

            console.log(`Card ${i + 1}: Sale = ${actualPrice}, Predicted = ${predicted.toFixed(2)} → ${valuation} (${card.reference})`);
        });
    }
}

const CardAnalyzer = new CardAnalyzerClass()
export default CardAnalyzer
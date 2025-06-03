// Card types based on the existing data structure
export interface Card {
	id: string;
	name: string;
	'@id': string;
	'@context': string;
	'@type': string;
	cardType: {
		'@id': string;
		'@type': string;
		reference: string;
		id: string;
		name: string;
	};
	cardSubTypes: Array<{
		'@type': string;
		'@id': string;
		reference: string;
		id: string;
		name: string;
	}>;
	cardSet: {
		'@id': string;
		'@type': string;
		id: string;
		reference: string;
		name: string;
	};
	rarity: {
		'@id': string;
		'@type': string;
		reference: string;
		id: string;
		name: string;
	};
	cardRulings: any[];
	imagePath: string;
	assets: {
		WEB: string[];
	};
	lowerPrice: number;
	qrUrlDetail: string;
	isSuspended: boolean;
	reference: string;
	mainFaction: {
		'@id': string;
		'@type': string;
		reference: string;
		color: string;
		id: string;
		name: string;
	};
	allImagePath: Record<string, string>;
	loreEntries: any[];
	elements: {
		MAIN_COST: string;
		RECALL_COST: string;
		MOUNTAIN_POWER: string;
		OCEAN_POWER: string;
		FOREST_POWER: string;
		MAIN_EFFECT?: string;
		ECHO_EFFECT?: string;
	};
	pricing?: {
		lowerPrice: number;
		lastSale: number;
		inSale: number;
		numberCopyAvailable: number;
		inMyTradelist: number;
		inMyCollection: number;
		inMyWantlist: boolean;
		foiled: boolean;
		isExclusive: boolean;
	};
}

export interface SearchFilters {
	name?: string;
	rarity?: string[];
	cardSet?: string[];
	factions?: string[];
	cardType?: string[];
	mainCost?: number[];
	recallCost?: number[];
	forestPower?: number[];
	mountainPower?: number[];
	oceanPower?: number[];
	inSale?: boolean;
	priceRange?: {
		min?: number;
		max?: number;
	};
}

export interface FilterOptions {
	label: string;
	value: string;
	color?: string;
}

export const RARITIES: FilterOptions[] = [
	{ label: 'Unique', value: 'UNIQUE' }
];

export const CARD_SETS: FilterOptions[] = [
	{ label: 'Core (Beyond the Gates)', value: 'CORE' }
];

export const FACTIONS: FilterOptions[] = [
	{ label: 'Bravos', value: 'BR', color: '#c32637' },
	{ label: 'Lyra', value: 'LY', color: '#16a34a' },
	{ label: 'Yzmir', value: 'YZ', color: '#764891' }
];

export const CARD_TYPES: FilterOptions[] = [
	{ label: 'Character', value: 'CHARACTER' },
	{ label: 'Spell', value: 'SPELL' },
	{ label: 'Permanent', value: 'PERMANENT' }
];

export const COST_OPTIONS = Array.from({ length: 11 }, (_, i) => i);
export const POWER_OPTIONS = Array.from({ length: 11 }, (_, i) => i);

export type CardCollection = {
  "@context": string;
  "@id": string;
  "@type": string;
  "hydra:totalItems": number;
  "hydra:member": Card[];
  "hydra:view": HydraView;
  "hydra:search": HydraSearch;
};

export type Card = {
  id: string;
  cardType: CardType;
  cardSet: CardSet;
  cardSubTypes: any[]; // If known, replace `any` with a specific type
  rarity: Rarity;
  imagePath: string;
  assets: any[]; // If known, replace `any` with a specific type
  qrUrlDetail: string;
  mainFaction: Faction;
  name: string;
  elements: {
    MAIN_COST: string;
    RECALL_COST: string;
    MOUNTAIN_POWER: string;
    OCEAN_POWER: string;
    FOREST_POWER: string;
  };
  isSuspended: boolean;
  reference: string;
  "@id": string;
};

export type CardType = {
  "@id": string;
  "@type": string;
  reference: string;
  id: string;
  name: string;
};

export type CardSet = {
  "@id": string;
  "@type": string;
  id: string;
  reference: string;
  name: string;
};

export type Rarity = {
  "@id": string;
  "@type": string;
  reference: string;
  id: string;
  name: string;
};

export type Faction = {
  "@id": string;
  "@type": string;
  reference: string;
  color: string;
  id: string;
  name: string;
};

export type HydraView = {
  "@id": string;
  "@type": string;
  "hydra:first"?: string;
  "hydra:last"?: string;
  "hydra:previous"?: string;
  "hydra:next"?: string;
};

export type HydraSearch = {
  "@type": string;
  "hydra:template": string;
  "hydra:variableRepresentation": string;
  "hydra:mapping": HydraMapping[];
};

export type HydraMapping = {
  "@type": string;
  variable: string;
  property: string;
  required: boolean;
};

export type CardDetail = {
  "@context": string;
  "@id": string;
  "@type": "Card";
  id: string;
  reference: string;
  name: string;
  isSuspended: boolean;
  lowerPrice: number;
  qrUrlDetail: string;
  imagePath: string;
  allImagePath: Record<string, string>;
  assets: {
    WEB: string[];
  };
  loreEntries: any[]; // If there's a schema for lore entries, replace `any`
  cardRulings: any[]; // Same as above
  cardType: {
    "@id": string;
    "@type": "CardType";
    id: string;
    reference: string;
    name: string;
  };
  cardSubTypes: {
    "@type": "CardSubType";
    "@id": string;
    id: string;
    reference: string;
    name: string;
  }[];
  cardSet: {
    "@id": string;
    "@type": "CardSet";
    id: string;
    reference: string;
    name: string;
  };
  rarity: {
    "@id": string;
    "@type": "Rarity";
    id: string;
    reference: string;
    name: string;
  };
  mainFaction: {
    "@id": string;
    "@type": "Faction";
    id: string;
    reference: string;
    name: string;
    color: string;
  };
  elements: {
    MAIN_COST: string;
    RECALL_COST: string;
    MOUNTAIN_POWER: string;
    OCEAN_POWER: string;
    FOREST_POWER: string;
    MAIN_EFFECT: string;
    ECHO_EFFECT: string;
  };
  pricing?: CardDetailPricing;
  scrapeMetadata?: CardDetailScrapeMetadata
};

export type CardDetailPricing = {
  lowerPrice: number;
  lastSale: number;
  inSale: number;
  numberCopyAvailable: number;
  inMyTradelist: number;
  inMyCollection: number;
  inMyWantlist: boolean;
  foiled: boolean;
  isExclusive: boolean;
}

export type CardDetailScrapeMetadata = {
  firstScrapedAt: string; // ISO 8601 date string
    lastUpdatedAt: string; // ISO 8601 date string
    pricingLastUpdatedAt?: string; // ISO 8601 date string - only when pricing changes
    changeType?: 'new' | 'pricing_changed' | 'unchanged'; // Type of change in last scrape
    priceHistory?: ScrapeMetadataPriceHistory[];
}

export type ScrapeMetadataPriceHistory = {
  date: string; // ISO 8601 date string
  lowerPrice: number;
  lastSale: number;
  inSale: number;
  numberCopyAvailable: number;
}

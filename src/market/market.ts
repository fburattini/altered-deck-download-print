/**
 * Main api endpoint: https://api.altered.gg/cards
 */
// https://api.altered.gg/cards?inSale=true&rarity%5B%5D=UNIQUE&itemsPerPage=36&locale=en-us
// https://api.altered.gg/cards?page=4&inSale=true&rarity%5B%5D=UNIQUE&itemsPerPage=36&locale=en-us

/**
 * card set: CORE, ALIZE
 * forest, mountain, ocean power: 0,1,2,3,4,5,6,7,8,9,10
 * hand cost: 0,1,2,3,4,5,6,7,8,9,10
 * recall cost: 0,1,2,3,4,5,6,7,8,9,10
 */

/**
 * rarity[]=UNIQUE
 * cardSet[]=CORE
 * 
 * forestPower[]=2
 * mountainPower[]=2
 * oceanPower[]=2
 * 
 * mainCost[]=2
 * recallCost[]=1
 * 
 * factions[]=AX&factions[]=BR&factions[]=LY&factions[]=MU&factions[]=OR&factions[]=YZ
 */

/**
 * Card detail API endpoint: https://api.altered.gg/cards
 * The id of the card is found in the response to the above research (each item has one)
 */
// https://api.altered.gg/cards/ALT_ALIZE_B_AX_32_U_1?locale=en-us

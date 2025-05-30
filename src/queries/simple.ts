#!/usr/bin/env npx tsx

/**
 * 🚀 SUPER SIMPLE QUERY RUNNER
 * 
 * Just change the values below and run!
 * No complex syntax, no arrays - just simple options.
 */

import { createScraper } from '../market/scraper';

// ============================================
// 🎯 SIMPLE CONFIGURATION
// ============================================

// Which rarity? (leave blank for all)
const RARITY = 'UNIQUE';              // Options: 'COMMON', 'RARE', 'UNIQUE', or ''

// Which card set? (leave blank for all)  
const CARD_SET = '';              // Options: 'CORE', 'ALIZE', or ''

// Which faction? (leave blank for all)
const FACTION = 'YZ';                 // Options: 'AX', 'BR', 'LY', 'MU', 'OR', 'YZ', or ''

// What main cost? (leave blank for all, or use ranges like '1-3')
const MAIN_COST = '3-4';              // Examples: '1', '1-3', '5-10', or ''

// What recall cost? (leave blank for all, or use ranges like '1-2')
const RECALL_COST: string = '';            // Examples: '1', '1-2', '0-5', or ''

// What card name? (leave blank for all, use partial name matching)
const CARD_NAME = 'belasenka';                     // Examples: 'Kelon', 'Dragon', 'Elemental', or ''

// Only cards for sale?
const ONLY_FOR_SALE = true;           // true or false

// ============================================
// 🔄 AUTO-CONVERSION TO FILTERS
// ============================================

const filters: any = {};

if (RARITY) filters.rarity = [RARITY];
if (CARD_SET) filters.cardSet = [CARD_SET];
if (FACTION) filters.factions = [FACTION];
if (CARD_NAME) filters.cardName = CARD_NAME;
if (ONLY_FOR_SALE) filters.inSale = true;

// Handle cost ranges
if (MAIN_COST) {
  if (MAIN_COST.includes('-')) {
    const [min, max] = MAIN_COST.split('-').map(Number);
    filters.mainCost = Array.from({length: max - min + 1}, (_, i) => min + i);
  } else {
    filters.mainCost = [Number(MAIN_COST)];
  }
}

if (RECALL_COST) {
  if (RECALL_COST.includes('-')) {
    const [min, max] = RECALL_COST.split('-').map(Number);
    filters.recallCost = Array.from({length: max - min + 1}, (_, i) => min + i);
  } else {
    filters.recallCost = [Number(RECALL_COST)];
  }
}

// ============================================
// 🚀 RUN THE QUERY
// ============================================

const runSimpleQuery = async () => {
  console.log('🎯 Running Simple Query');
  console.log('=======================');
  
  // Show what we're searching for in plain English
  let description = 'Searching for';
  if (RARITY) description += ` ${RARITY.toLowerCase()}`;
  if (FACTION) description += ` ${FACTION}`;
  if (CARD_SET) description += ` from ${CARD_SET}`;
  description += ' cards';
  if (CARD_NAME) description += ` with name containing "${CARD_NAME}"`;
  if (MAIN_COST) description += ` with main cost ${MAIN_COST}`;
  if (RECALL_COST) description += ` and recall cost ${RECALL_COST}`;
  if (ONLY_FOR_SALE) description += ' that are for sale';
  
  console.log(`📝 ${description}`);
  console.log('');
  console.log('🔍 Technical filters:');
  console.log(JSON.stringify(filters, null, 2));
  console.log('');
  
  try {
    const locale = 'en-us'
    const token = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJDMFo0V3JVWE1xT2JtMy1CTU8xRFV5YktidFA2bldLb2VvWmE1UGJuZHhZIn0.eyJleHAiOjE3NDg2MTM2MTcsImlhdCI6MTc0ODYwNjQxNywiYXV0aF90aW1lIjoxNzQ3ODM3MzU3LCJqdGkiOiI0Yzg3MmUwNy0xNzI2LTQ0NmMtYWM1Yy02OGJmYmEyYmY1ZDkiLCJpc3MiOiJodHRwczovL2F1dGguYWx0ZXJlZC5nZy9yZWFsbXMvcGxheWVycyIsImF1ZCI6ImFjY291bnQiLCJzdWIiOiJiYmUzMGI4Yi1mNjhlLTRjYjQtYWMxMS0zZjY5ZmM5ZjBlN2MiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJ3ZWIiLCJzaWQiOiI0OTRmMjg1Ni05OWZlLTQxYzEtYTU2YS1lNDI2NDkyZmRhZGUiLCJhY3IiOiIxIiwiYWxsb3dlZC1vcmlnaW5zIjpbImh0dHBzOi8vYXV0aC5hbHRlcmVkLmdnIiwiaHR0cHM6Ly93d3cuYWx0ZXJlZC5nZyJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib3RwX2VtYWlsIiwiZGVmYXVsdC1yb2xlcy1wbGF5ZXJzIiwib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoib3BlbmlkIG9mZmxpbmVfYWNjZXNzIHByb2ZpbGUgZW1haWwiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicHJlZmVycmVkX3VzZXJuYW1lIjoiZi5idXJhdHRpbmk5N0BnbWFpbC5jb20iLCJlbWFpbCI6ImYuYnVyYXR0aW5pOTdAZ21haWwuY29tIn0.uNwGSxAXbDEiqn0G6nSfPVSRM-w5ATIM_8_aBm4ibwCzah0RhEBJYFI35_YkVySl56f7fnlPWxCD3C9Z6NtxlW4qri-XVYIg_WpcX1a3TXG4hzxgw7n6B_0gObc5VzglVcpGiucLNl6gnO7LVeCiGlDX2Iv17Cl8D1zB8wYt0EROKXu2pfovma1fayhbs374k3-zzOBRLGnlwtIjsddk-l6XafHVM8uFu4FGy733-VO4KmJCajf8QxpZvaPXFySJA5SPQkHM-gv1xhSyPZUeh_nOlRKyFwaK4c8E5mPMycrwPxoKuU1FNEkXJ-xPgO1Gjmx7ECnfMIz0so1wxS1k3g'

    const scraper = createScraper(locale, token);
    const startTime = Date.now();
    
    await scraper.runFilteredScrape(filters, true);
    
    const duration = (Date.now() - startTime) / 1000;
    console.log('');
    console.log(`🎉 Query completed in ${duration.toFixed(2)} seconds!`);
    
  } catch (error) {
    console.error('❌ Query failed:', error);
    process.exit(1);
  }
};

runSimpleQuery();

# Quick Query Scripts

This folder contains easy-to-use scripts for running filtered card scrapes without having to use the CLI or remember command-line arguments.

## Scripts

### 🔧 `run-query.ts` - Custom Query Builder
The main script for creating your own custom queries. Simply edit the `QUERY_FILTERS` object and run!

**Usage:**
```bash
npx tsx src/queries/run-query.ts
```

**How to use:**
1. Open `run-query.ts`
2. Modify the `QUERY_FILTERS` object with your desired filters
3. Optionally change the `CONFIG` settings
4. Run the script!

### 📚 `examples.ts` - Pre-made Example Queries
Contains several common query examples that you can quickly run.

**Usage:**
```bash
npx tsx src/queries/examples.ts
```

**How to use:**
1. Open `examples.ts`
2. Look at the available example queries
3. Change the `SELECTED_QUERY` variable to the example you want
4. Run the script!

## Quick Reference

### Available Filters

| Filter | Type | Options | Example |
|--------|------|---------|---------|
| `rarity` | string[] | `'COMMON'`, `'RARE'`, `'UNIQUE'` | `['UNIQUE']` |
| `cardSet` | string[] | `'CORE'`, `'ALIZE'` | `['CORE', 'ALIZE']` |
| `factions` | string[] | `'AX'`, `'BR'`, `'LY'`, `'MU'`, `'OR'`, `'YZ'` | `['AX', 'BR']` |
| `mainCost` | number[] | `0-10` | `[1, 2, 3]` |
| `recallCost` | number[] | `0-10` | `[1, 2]` |
| `forestPower` | number[] | `0-10` | `[2, 3, 4]` |
| `mountainPower` | number[] | `0-10` | `[0, 1, 2]` |
| `oceanPower` | number[] | `0-10` | `[1, 2, 3]` |
| `inSale` | boolean | `true`, `false` | `true` |

### Example Filter Combinations

**Get all unique AX cards:**
```typescript
{
  rarity: ['UNIQUE'],
  factions: ['AX']
}
```

**Find budget cards (low cost):**
```typescript
{
  mainCost: [1, 2, 3],
  recallCost: [0, 1, 2],
  inSale: true
}
```

**High-power forest cards:**
```typescript
{
  forestPower: [5, 6, 7, 8, 9, 10],
  rarity: ['UNIQUE']
}
```

**Latest set only:**
```typescript
{
  cardSet: ['ALIZE']
}
```

## Tips

- **Be specific**: More filters = faster queries
- **Use checkpoints**: Set `resumeFromCheckpoint: true` to resume interrupted queries
- **Check output**: Results are saved in the `card_db/` folder with descriptive filenames
- **Test first**: Try small queries first to make sure your filters work as expected

## Output Files

Results are automatically saved with descriptive names:
- `card_db/altered-cards-filtered-{description}-{timestamp}.json`
- `card_db/scrape-summary-filtered-{description}-{timestamp}.json`

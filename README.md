# Altered Deck Download and Print Tool

This tool allows you to download and print card decks from the Altered website.

## Features

- Download deck images from altered.ajordat.com
- Extract card images from tables with specific IDs
- Organize downloaded images by card type
- Generate printable A4 PDF files with card images arranged for easy cutting

## Project Description

This tool allows users to:
- Enter a deck ID from altered.ajordat.com
- The application searches for tables with specific IDs: `spell-table`, `permanent-table`, and `character-table`
- For each table found, it extracts all card images and downloads them to local folders
- Generate printable PDF files for easy printing and cutting of cards

## Project Structure

```
/
├── src/                    # Source code
│   ├── index.ts            # Main script for downloading decks
│   ├── scraper.ts          # Web scraping functionality
│   ├── pdf-generator.ts    # PDF generation for printing
│   └── cli.ts              # Command-line interface
├── decks/                  # Downloaded deck images
│   ├── [deck-name]/        # Each deck has its own folder
│   │   ├── spell-table/    # Spell cards
│   │   ├── permanent-table/# Permanent cards
│   │   └── character-table/# Character cards
│   └── pdfs/               # Generated PDF files
├── package.json            # Project configuration
└── tsconfig.json           # TypeScript configuration
```

## Available Scripts

- `npm start` - Run the application directly using tsx
- `npm run dev` - Run the application in development mode with hot-reload
- `npm run build` - Build the TypeScript code into JavaScript

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Run the application:
   ```
   npm start
   ```

3. Enter the website URL when prompted.

## Dependencies

- axios - For making HTTP requests
- cheerio - For HTML parsing and manipulation
- fs-extra - For file system operations
- prompt-sync - For command line input
# altered-deck-download-print

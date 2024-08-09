# Curius Scripts

This directory contains scripts for managing Curius links data.

## Scrape Curius Links

To scrape Curius links, run:

```bash
npm run start:script src/scripts/curius/scrapingLinks.ts
```

Add full text column to curius links

```bash
npm run start:script src/scripts/curius/addFullTextColumn.ts  2>src/scripts/curius/temp.log
```

## Seed Top Curius Links

To seed the top Curius links with full text and chunks, run:

```bash
npm run start:script src/scripts/curius/seeder/exportTopLinks.ts
npm run start:script src/scripts/curius/seeder/seedTopLinks.ts
```

Which will create or import `topLinks.json`

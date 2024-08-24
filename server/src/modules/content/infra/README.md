This folder has a few services to modify the content entity.

-   [scrapeContentTextService.ts](scrapeContentTextService.ts) is used to get the websete text content and add some other properties to the content with info if it has been scraped
-   [openGraphService.ts](openGraphService.ts) is used to get the thumbnail and some other meta data
-   [audioService.ts](audioService.ts) is used to create the TTS audio

These are combined/utilized in some files like [contentFromUrlService.ts](contentFromUrlService.ts)

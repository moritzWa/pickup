# URL Saver Chrome Extension

This Chrome extension allows users to save the current URL to their queue using a GraphQL API.

## Setup

1. Install dependencies:

   ```
   npm install
   ```

2. Build the extension:

   ```
   npm run build
   ```

3. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner
   - Click "Load unpacked" and select the `build` folder in the `chrome-extension` directory

## Development

To work on the extension:

1. Run the development server:

   ```
   npm start
   ```

2. Make changes to the code in the `src` folder
3. The extension will automatically rebuild when changes are detected
4. Reload the extension in Chrome to see the changes

## Building for Production

To create a production build:

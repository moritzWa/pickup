import { LinkingOptions, useNavigation } from "@react-navigation/native";
import { Alert, Linking } from "react-native";
import * as ExpoLinking from "expo-linking";

export const LINKING: LinkingOptions<ReactNavigation.RootParamList> = {
  prefixes: [
    ExpoLinking.createURL("/"),
    "awaken://",
    "https://awaken.trade",
    // "https://awaken.tax", // ?
    "awaken.trading.staging://",
  ],
  config: {
    screens: {},
  },
  // Custom function to subscribe to incoming links
  subscribe(listener) {
    // Listen to incoming links from deep linking
    const linkingSubscription = Linking.addEventListener(
      "url",
      async ({ url }) => {
        listener(url);

        console.log("=== deep link ===");
        console.log(url);
      }
    );

    return () => {
      // Clean up the event listeners
      linkingSubscription.remove();
    };
  },
};

import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  DefaultOptions,
  ApolloLink,
} from "@apollo/client";
import { constants } from "src/config";
import { setContext } from "@apollo/client/link/context";
import { RetryLink } from "@apollo/client/link/retry";
import { success } from "src/core";
import { Alert, Platform } from "react-native";
import { getAuthToken } from "src/utils/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onError } from "apollo-link-error";
import {
  loadErrorMessages,
  loadErrorMessageHandler,
  loadDevMessages,
} from "@apollo/client/dev";
import DeviceInfo from "react-native-device-info";

const uri = `${constants.apiUrl}/graphql`;
const LOG_GQL_ERRORS = false && __DEV__;

const defaultOptions: DefaultOptions = {
  watchQuery: {
    errorPolicy: "all",
  },
  query: {
    fetchPolicy: "no-cache",
  },
};

const cache = new InMemoryCache({
  // resultCacheMaxSize: Math.pow(2, 6), // max things allowed in cache, default is 2^16
});

const httpLink = createHttpLink({
  uri,
});

const retryLink = new RetryLink({
  delay: {
    initial: 500,
    max: Infinity,
    jitter: true,
  },
  attempts: {
    max: 5,
    retryIf: (error) => {
      return !!error;
    },
  },
});

const _getDeviceId = async (): Promise<string | null> => {
  try {
    return DeviceInfo.getUniqueId();
  } catch (err) {
    return null;
  }
};

const authLink = setContext(async (_, { headers }) => {
  const token = await getAuthToken();
  const deviceId = await _getDeviceId();
  const platform = Platform.OS;

  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      Authorization: token ? `Bearer ${token}` : "",
      "x-app-version": constants.version,
      "x-device-id": deviceId || "",
      "x-mobile-platform": platform || "",
    },
  };
});

export function handleGraphqlError(error: any) {
  // Log the full error
  try {
    if (!LOG_GQL_ERRORS) {
      return;
    }

    // console.error("Apollo Error:", error);

    // Log specific error details if available
    if (error.networkError) {
      console.error("Network error:", error.networkError);
    }
    if (error.graphQLErrors) {
      error.graphQLErrors.forEach((err: any) =>
        console.error("GraphQL error:", JSON.stringify(err, null, 2))
      );
    }
  } catch (err) {
    // Sentry.captureException(err);
    console.error("Error logging error:", err);
  }

  // Add any additional logging or error handling logic here
}

const link = ApolloLink.from([retryLink, authLink, httpLink]);

if (__DEV__) {
  // Adds messages only in a dev environment
  loadDevMessages();
  loadErrorMessages();
}

export const apolloClient = new ApolloClient({
  // does auth link and then after does http request
  link: link,
  cache,
  defaultOptions,
});

import { Platform } from "react-native";
import VersionNumber from "react-native-version-number";

const FIREBASE_DEV_WEB_CLIENT =
  "85484920800-0v8gfdu63893tl2539sm3sjl674c16qi.apps.googleusercontent.com";

const FIREBASE_PROD_WEB_CLIENT =
  "309044622588-k89nt9103d5i96gdutffev8nkjmrpp12.apps.googleusercontent.com";

const WEB_CLIENT_ID = __DEV__
  ? FIREBASE_DEV_WEB_CLIENT
  : FIREBASE_PROD_WEB_CLIENT;

const SEGMENT_DEV_KEY = "FAKE_li8kwJXfeZQXrfZL0wUqrj6vQSNSpHtu";
const SEGMENT_PROD_KEY = "FAKE_AcDfCneDRg4qHGCqBejNqcUyu4SlDdlt"; // "NCFMzL2AsnHCBGbP6qhImOWEh3kHxuJ6";
const SEGMENT_WRITE_KEY = __DEV__ ? SEGMENT_DEV_KEY : SEGMENT_PROD_KEY;

const API_URL = __DEV__
  ? "http://localhost:8888"
  : "https://api.talkpickup.com"; // ? "https://68c7a93084a8.ngrok.app" // "http://localhost:8888"

const ONE_SIGNAL_APP_ID = "42bfa89f-bfc6-472c-ab88-b73491ed37fe";

// const DEV_URL = "https://3695-107-195-70-9.ngrok-free.app"; // "http://localhost:3000";
const DEV_URL = "localhost:3000";
const PROD_URL = "https://talkpickup.com";
const WEBSITE_URL = __DEV__ ? DEV_URL : PROD_URL;

const MAGIC_DEV_PK = "pk_live_40FA3E4BBB288DE9";
const MAGIC_PROD_PK = "pk_live_DC48B09D2F1F4D02";
const MAGIC_PK = __DEV__ ? MAGIC_DEV_PK : MAGIC_PROD_PK;

const VERSION = VersionNumber.appVersion;
const BUILD = VersionNumber.buildVersion;

export const IS_IPAD = Platform.OS === "ios" && Platform.isPad;
export const IS_ANDROID = Platform.OS === "android";

export const GOOGLE_PLAY_URL =
  "https://play.google.com/store/apps/details?id=com.pickup.app";

export const APPLE_URL =
  "https://apps.apple.com/us/app/pickup-app/id6563153026";

const DOWNLOAD_URL = "https://talkpickup.com";

export const constants = {
  environment: __DEV__ ? "development" : "production",
  apiUrl: API_URL,
  appStoreUrl: DOWNLOAD_URL,
  deeplinkUrl: "pickup://",
  sentryDsnUrl:
    "https://5c0fa148c6f735c2979c48908368744f@o4507365158617088.ingest.us.sentry.io/4507365171789824",
  oneSignalAppId: ONE_SIGNAL_APP_ID,
  version: VERSION,
  build: BUILD,
  bundle: VersionNumber.bundleIdentifier,
  websiteUrl: WEBSITE_URL,
  segmentWriteKey: SEGMENT_WRITE_KEY,
  firebase: {
    webClientId: WEB_CLIENT_ID,
  },
  redux: {
    logger: false,
  },
};

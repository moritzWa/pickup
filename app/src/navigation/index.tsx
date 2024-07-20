// react native navigation
import * as React from "react";
import {
  NavigationContainer,
  NavigationState,
  PartialState,
  useNavigation,
  DefaultTheme,
} from "@react-navigation/native";
import {
  NativeStackNavigationProp,
  createNativeStackNavigator,
} from "@react-navigation/native-stack";
import Login from "../views/Authentication/Login";
import Signup from "../views/Authentication/Signup";
import { useDispatch, useSelector } from "react-redux";
import {
  getUserAuthStatus,
  setUserAuthStateChanged,
} from "../redux/reducers/user";
import Welcome from "src/views/Authentication/Welcome";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { TabBar } from "./TabBar";
import { useOneSignal } from "src/hooks/useOneSignal";
import { useMutation, useQuery } from "@apollo/client";
import { api } from "src/api";
import { OneSignal } from "react-native-onesignal";
import { useTheme } from "src/hooks/useTheme";
import { View } from "react-native";
import { useMe } from "src/hooks";
import { LINKING } from "./linking";

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();
const PortfolioStack = createNativeStackNavigator();

export type WebViewParams = {
  url: string;
};

export type RootStackParamList = {
  Login: undefined; // params
  Signup: undefined; // params
  Welcome: undefined;
  Main: undefined;
  Update?: undefined;
  Portfolio: undefined;
  CategoryDetails?: { categorySlug: string };
  CategoryTokens?: { categorySlug: string };
  Categories?: undefined;
  PhoneVerification: {
    nextRoute: keyof RootStackParamList | null;
    subtitle?: string;
    doNotNavigateOnSuccess?: boolean;
    onVerify?: () => void;
  };
  VerifyCode?: {
    phoneNumber: string;
    nextRoute: keyof RootStackParamList;
    doNotNavigateOnSuccess?: boolean;
    onVerify?: () => void;
  };
  WebView?: WebViewParams;
  PushNotificationsModal?: {
    isSignupFlow: boolean;
    isAirdropFlow: boolean;
    subtitle?: string;
    onAccept: () => void;
    onDeny?: () => void;
    onOverrideAccept?: () => void;
    onOverrideDeny?: () => void;
    hideHeader?: boolean;
  };
  EnablePushNotifications?: {
    isSignupFlow: boolean;
    isAirdropFlow: boolean;
    subtitle?: string;
    onAccept: () => void;
    onDeny?: () => void;
    onOverrideAccept?: () => void;
    onOverrideDeny?: () => void;
    hideHeader?: boolean;
  };
  Settings: undefined;
  Profile: undefined;
  EditProfile?: undefined;
  UserProfile?: { username: string };
  ClaimCode?: undefined;
  Authentication: undefined;
};

export type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

const AuthenticationNavigationStack = () => {
  return (
    <Stack.Navigator initialRouteName="Welcome">
      <Stack.Screen
        name="Welcome"
        component={Welcome}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Login"
        component={Login}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="Signup"
        component={Signup}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

const MainTabNavigation = () => {
  const navigation = useNavigation<NavigationProps>();

  // try to auto-sync new txns while the app is open
  // useAutoSyncTransactions();
  // useClientListener(activeClient?.id ?? null);

  return (
    <Tabs.Navigator
      tabBar={(props) => <TabBar {...props} />}
      initialRouteName="Discovery"
    >
      <Tabs.Screen
        name="Portfolio"
        options={{
          headerShown: false,
        }}
        component={Login}
      />
    </Tabs.Navigator>
  );
};

export const MainNavigationStack = () => {
  const dispatch = useDispatch();
  const [routeName, setRouteName] = React.useState("Unknown");
  const [updateUser] = useMutation(api.users.update);
  const authStatus = useSelector(getUserAuthStatus);
  const { me } = useMe();
  const navigationRef = React.useRef(null);
  const theme = useTheme();

  useOneSignal();

  const _syncHasEnabledPush = React.useCallback(async () => {
    if (authStatus !== "LOGGED_IN") return;

    const setInitialPermission = async () => {
      const permission = OneSignal.Notifications.hasPermission();
      const hasPushNotifications = permission;

      await updateUser({
        variables: {
          hasMobile: true,
          hasPushNotifications,
        },
      });
    };

    // FIXME: Hack to get correct value from `hasPermission()`
    // @see https://github.com/OneSignal/react-native-onesignal/issues/1506#issuecomment-1706332448
    setTimeout(setInitialPermission, 0);
  }, [authStatus]);

  // update the user hasMobile and hasPushNotifications
  React.useEffect(() => {
    _syncHasEnabledPush();
  }, [_syncHasEnabledPush]);

  const initialRouteName =
    authStatus === "LOGGED_IN" ? "Main" : "Authentication";

  const navTheme = {
    dark: theme.theme === "dark",
    colors: {
      ...DefaultTheme.colors,
      background: theme.background,
    },
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <NavigationContainer
        linking={LINKING}
        ref={navigationRef}
        theme={navTheme}
        onStateChange={(state) => {
          const newRouteName = getActiveRouteName(state);

          if (routeName !== newRouteName) {
            // segment.screen(newRouteName);
            setRouteName(newRouteName);
          }
        }}
      >
        <Stack.Navigator initialRouteName={initialRouteName}>
          <Stack.Screen
            name="Authentication"
            component={AuthenticationNavigationStack}
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />

          <Stack.Screen
            name="Main"
            component={MainTabNavigation}
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />

          {/* MODALS */}

          {/* <Stack.Group
            screenOptions={{
              presentation: "modal",
              animation: "default",
            }}
          >
            
          </Stack.Group> */}
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
};

const getActiveRouteName = (
  state: NavigationState | PartialState<NavigationState> | undefined
): string => {
  if (!state || typeof state.index !== "number") {
    return "Unknown";
  }

  const route = state.routes[state.index];

  if (route.state) {
    return getActiveRouteName(route.state);
  }

  return route.name;
};

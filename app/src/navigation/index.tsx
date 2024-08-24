// react native navigation
import { useMutation } from "@apollo/client";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  DefaultTheme,
  NavigationContainer,
  NavigationState,
  PartialState,
  useNavigation,
} from "@react-navigation/native";
import {
  NativeStackNavigationProp,
  createNativeStackNavigator,
} from "@react-navigation/native-stack";
import * as React from "react";
import { View } from "react-native";
import { OneSignal } from "react-native-onesignal";
import { useDispatch, useSelector } from "react-redux";
import { api } from "src/api";
import { useMe } from "src/hooks";
import { useOneSignal } from "src/hooks/useOneSignal";
import { useTheme } from "src/hooks/useTheme";
import EnablePushNotifications from "src/views/Authentication/EnablePushNotifications";
import FullName from "src/views/Authentication/FullName";
import Interests from "src/views/Authentication/Interests";
import Welcome from "src/views/Authentication/Welcome";
import AudioPlayer from "src/views/Main/AudioPlayer";
import CourseDetails from "src/views/Main/CourseDetails";
import Home from "src/views/Main/Home";
import {
  default as Lesson,
  default as LessonDetails,
} from "src/views/Main/LessonDetails";
import LessonSession from "src/views/Main/LessonSession";
import { UserProfile } from "src/views/Main/Profile";
import Settings from "src/views/Main/Settings";
import { getUserAuthStatus } from "../redux/reducers/user";
import Login from "../views/Authentication/Login";
import Signup from "../views/Authentication/Signup";
import { LINKING } from "./linking";
import { TabBar } from "./TabBar";
import Queue from "src/views/Main/Queue";
import QueueTab from "src/views/Main/QueueTab";
import ContentDetails from "src/views/Main/ContentDetails";
import { BaseContentFields } from "src/api/fragments";
import Friends from "src/views/Main/Friends";
import EditProfile from "src/views/Main/EditProfile";
import { Followers } from "src/views/Main/Followers";
import { PhoneNumber } from "src/views/Authentication/PhoneNumber";
import Notifications from "src/views/Main/Notifications";

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();
const PortfolioStack = createNativeStackNavigator();

export type WebViewParams = {
  url: string;
};

export type RootStackParamList = {
  Login: undefined; // params
  Followers?: { username: string; defaultMode: "followers" | "following" };
  ContentDetails: { content?: BaseContentFields };
  Signup: undefined; // params
  Welcome: undefined;
  CarMode?: { contentId: string; isCarMode: boolean };
  Main: undefined;
  AudioPlayer?: { contentId: string };
  LessonDetails?: { lessonId: string };
  LessonSession?: { lessonId: string };
  Update?: undefined;
  CourseDetails?: { courseId: string };
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
  Queue: undefined;
  EditProfile?: undefined;
  UserProfile?: { username: string; forceBackButton?: boolean };
  ClaimCode?: undefined;
  Authentication: { screen?: string } | undefined;
  Interests?: undefined;
  PhoneNumber?: {
    onSuccess?: () => void;
  };
  FullName?: undefined;
  Friends?: undefined;
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

      <Stack.Screen
        name="EnablePushNotifications"
        component={EnablePushNotifications}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="FullName"
        component={FullName}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="Interests"
        component={Interests}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="PhoneNumber"
        component={PhoneNumber}
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
      initialRouteName="Home"
    >
      <Tabs.Screen
        name="Home"
        options={{
          headerShown: false,
        }}
        component={Home}
      />

      {/* <Tabs.Screen
        name="CarMode"
        options={{
          headerShown: false,
        }}
        component={ContentSession}
      /> */}

      <Tabs.Screen
        name="Activity"
        options={{
          headerShown: false,
        }}
        component={QueueTab}
      />

      <Tabs.Screen
        name="Notifications"
        options={{
          headerShown: false,
        }}
        component={Notifications}
      />

      <Tabs.Screen
        name="Profile"
        options={{
          headerShown: false,
        }}
        component={UserProfile}
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

          <Stack.Screen
            name="Lesson"
            options={{
              headerShown: false,
            }}
            component={Lesson}
          />

          <Stack.Screen
            name="CourseDetails"
            options={{
              headerShown: false,
            }}
            component={CourseDetails}
          />

          <Stack.Screen
            name="Settings"
            component={Settings}
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="PhoneNumber"
            component={PhoneNumber}
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="EnablePushNotifications"
            component={EnablePushNotifications}
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="LessonDetails"
            options={{
              headerShown: false,
            }}
            component={LessonDetails}
          />

          <Stack.Screen
            name="LessonSession"
            options={{
              headerShown: false,
            }}
            component={LessonSession}
          />

          <Stack.Screen
            name="UserProfile"
            options={{
              headerShown: false,
            }}
            component={UserProfile}
          />

          <Stack.Screen
            name="Followers"
            options={{
              headerShown: false,
            }}
            component={Followers}
          />

          <Stack.Screen
            name="Friends"
            options={{
              headerShown: false,
            }}
            component={Friends}
          />

          {/* MODALS */}
          <Stack.Group
            screenOptions={{
              presentation: "modal",
              animation: "default",
            }}
          >
            <Stack.Screen
              name="AudioPlayer"
              options={{
                headerShown: false,
              }}
              component={AudioPlayer}
            />

            <Stack.Screen
              name="EditProfile"
              options={{
                headerShown: false,
              }}
              component={EditProfile}
            />

            <Stack.Screen
              name="Queue"
              component={Queue}
              options={{
                headerShown: false,
              }}
            />

            <Stack.Screen
              name="ContentDetails"
              component={ContentDetails}
              options={{
                headerShown: false,
              }}
            />
          </Stack.Group>

          {/* <Stack.Group
            screenOptions={{
              presentation: "fullScreenModal",
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

import { ApolloProvider, useQuery } from "@apollo/client";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_900Black,
} from "@expo-google-fonts/inter";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { PortalProvider } from "@gorhom/portal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppContext } from "context";
import { Audio } from "expo-av";
import * as Font from "expo-font";
import React, { useEffect, useRef } from "react";
import { LogBox, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-get-random-values";
import changeNavigationBarColor from "react-native-navigation-bar-color";
import { OneSignal } from "react-native-onesignal";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import SplashScreen from "react-native-splash-screen";
import Toast, { ToastConfig } from "react-native-toast-message";
import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
} from "react-native-track-player";
import { Provider, useSelector } from "react-redux";
import { IS_ANDROID } from "src/config";
import { useMe } from "src/hooks";
import { useAudio } from "src/hooks/useAudio";
import { useTheme } from "src/hooks/useTheme";
import { setTheme } from "src/redux/reducers/globalState";
import {
  getUserAuthStatus,
  setUserAuthStateChanged,
} from "src/redux/reducers/user";
import { auth } from "src/utils/firebase";
import { api, apolloClient } from "./src/api";
import { MainNavigationStack } from "./src/navigation";
import { store } from "./src/redux";

LogBox.ignoreLogs(["Warning: ..."]); // Ignore log notification by message
LogBox.ignoreAllLogs(); //Ignore all log notifications

// if (__DEV__) {
//   // Adds messages only in a dev environment
//   loadDevMessages();
//   loadErrorMessages();
// }

function App() {
  const [isLoaded] = Font.useFonts({});

  const authStatus = useSelector(getUserAuthStatus);
  const { theme, header, background, secondaryBackground } = useTheme();
  const insets = useSafeAreaInsets();
  const { me, refetchMe } = useMe("network-only");

  const sound = useRef(new Audio.Sound());

  // just cache this on app load so this info is faster elsewhere
  useQuery(api.categories.list);

  const setupPlayer = async () => {
    await TrackPlayer.setupPlayer();

    TrackPlayer.updateOptions({
      progressUpdateEventInterval: 1,
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.JumpForward,
        Capability.JumpBackward,
        Capability.SeekTo,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
      android: {
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback,
      },
    });
  };

  useEffect(() => {
    setupPlayer();
  }, []);

  useEffect(() => {
    store.dispatch(setUserAuthStateChanged("LOADING"));

    auth().onAuthStateChanged(async (u) => {
      // console.log("auth state changed");
      // console.log(u);

      try {
        if (u) {
          const me = await refetchMe();

          if (me) {
            store.dispatch(setUserAuthStateChanged("LOGGED_IN"));
          } else {
            store.dispatch(setUserAuthStateChanged("NOT_LOGGED_IN"));
          }
        } else {
          store.dispatch(setUserAuthStateChanged("NOT_LOGGED_IN"));
        }
      } catch (err) {
        store.dispatch(setUserAuthStateChanged("NOT_LOGGED_IN"));
      }
    });
  }, []);

  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync({
          "Inter-Regular": Inter_400Regular,
          "Inter-Medium": Inter_500Medium,
          "Inter-SemiBold": Inter_600SemiBold,
          "Inter-Bold": Inter_700Bold,
          "Inter-Black": Inter_900Black,
        });
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
      }
    }

    prepare();
  }, []);

  const _initUser = async () => {
    if (!me) return;

    // Sentry.setUser(me);
  };

  const _initIntercom = async () => {
    // if (me && me.intercomMobileUserHash) {
    //   // console.log(
    //   //   `[intercom: logging in ${me.id} with hash ${me.intercomMobileUserHash}]`
    //   // );
    // } else {
    //   console.log("[intercom: logging in as un-indentified]");
    // }
  };

  const _initOneSignal = async () => {
    if (!me) return;

    if (me.id) {
      OneSignal.login(me.id);
      OneSignal.User.addEmail(me.email);
    }
  };

  const _initBranch = async () => {
    if (!me || !me.id) return;

    // TODO(seankwalker): This package needs android setup to run
    // branch.setIdentity(me.id);
  };

  useEffect(() => {
    _initIntercom();
    _initOneSignal();
    _initUser();
    _initBranch();
  }, [me]);

  const _loadInitialState = async () => {
    try {
      // await AsyncStorage.removeItem("theme"); just using to test
      const theme = await AsyncStorage.getItem("theme");

      if (theme !== null) {
        store.dispatch(setTheme(theme as any));
        return;
      }

      store.dispatch(setTheme("dark"));
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    _loadInitialState();
  }, []);

  const toastConfig: ToastConfig = {
    success: (props) => (
      <View
        style={{
          height: 45,
          borderRadius: 10,
          display: "flex",
          bottom: insets.bottom + 25,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          width: "95%",
          backgroundColor: header,
        }}
      >
        <Text
          style={{
            color: background,
            fontSize: 16,
            fontFamily: "Inter-Semibold",
          }}
        >
          {props.text1}
        </Text>
      </View>
    ),
  };

  const isNotReady =
    !isLoaded || authStatus === "NOT_LOADED" || authStatus === "LOADING";
  // (authStatus === "LOGGED_IN" && !hasClearedBiometric);

  const audio = useAudio();

  useEffect(() => {
    if (!isNotReady) return;
    SplashScreen.hide();
  }, [isNotReady]);

  useEffect(() => {
    if (!IS_ANDROID) return;
    changeNavigationBarColor(background);
  }, [theme, background]);

  if (isNotReady) {
    return (
      <View
        style={{
          backgroundColor: background,
          flex: 1,
        }}
      />
    );
  }

  return (
    <AppContext.Provider value={{ audio }}>
      <BottomSheetModalProvider>
        <MainNavigationStack />
      </BottomSheetModalProvider>

      <Toast config={toastConfig} />
    </AppContext.Provider>
  );
}

const AppWithRedux = () => {
  return (
    <ActionSheetProvider useNativeDriver>
      <SafeAreaProvider>
        <Provider store={store}>
          <ApolloProvider client={apolloClient}>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <PortalProvider>
                <App />
              </PortalProvider>
            </GestureHandlerRootView>
          </ApolloProvider>
        </Provider>
      </SafeAreaProvider>
    </ActionSheetProvider>
  );
};

export default AppWithRedux;

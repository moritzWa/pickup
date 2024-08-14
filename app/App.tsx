import "react-native-get-random-values";
import React, { createContext, useMemo, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import {
  Appearance,
  StyleSheet,
  Text,
  View,
  LogBox,
  Alert,
} from "react-native";
import { MainNavigationStack } from "./src/navigation";
import SplashScreen from "react-native-splash-screen";
import * as Font from "expo-font";
import { useCallback, useEffect, useState } from "react";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_900Black,
} from "@expo-google-fonts/poppins";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  ApolloProvider,
  useLazyQuery,
  useMutation,
  useQuery,
} from "@apollo/client";
import { api, apolloClient } from "./src/api";
import { Provider, useSelector } from "react-redux";
import { store } from "./src/redux";
import {
  getUserAuthStatus,
  setUserAuthStateChanged,
} from "src/redux/reducers/user";
import { LogLevel, OneSignal } from "react-native-onesignal";
import { IS_ANDROID, constants } from "src/config";
import { useOneSignal } from "src/hooks/useOneSignal";
import { PortalProvider } from "@gorhom/portal";
import { useTheme } from "src/hooks/useTheme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setTheme } from "src/redux/reducers/globalState";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useMe } from "src/hooks";
import Toast, {
  ToastConfig,
  BaseToast,
  ErrorToast,
} from "react-native-toast-message";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { colors } from "src/components";
import { auth } from "src/utils/firebase";
import changeNavigationBarColor from "react-native-navigation-bar-color";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import { getCurrentAudioUrl } from "src/redux/reducers/audio";
import { useAudio, UseAudioReturn } from "src/hooks/useAudio";
import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
} from "react-native-track-player";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { AppContext } from "context";

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
          "Poppins-Regular": Poppins_400Regular,
          "Poppins-Medium": Poppins_500Medium,
          "Poppins-Semibold": Poppins_600SemiBold,
          "Poppins-Bold": Poppins_700Bold,
          "Poppins-Black": Poppins_900Black,
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
      <BaseToast
        {...props}
        style={{ borderLeftColor: colors.positive }}
        contentContainerStyle={{
          paddingHorizontal: 15,
          paddingVertical: 10,
          backgroundColor: secondaryBackground,
        }}
        text1Style={{
          fontSize: 14,
          color: header,
          fontFamily: "Poppins-Semibold",
        }}
      />
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

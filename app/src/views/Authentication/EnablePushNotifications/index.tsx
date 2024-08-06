import {
  CommonActions,
  RouteProp,
  useIsFocused,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Animated,
  Dimensions,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "src/hooks/useTheme";
import { NavigationProps, RootStackParamList } from "src/navigation";
import * as Haptics from "expo-haptics";
import { colors } from "src/components";
import { OneSignal } from "react-native-onesignal";
import Header from "src/components/Header";
import Close from "src/components/Close";

const EnablePushNotifications = () => {
  const { height } = Dimensions.get("window");
  const insets = useSafeAreaInsets();
  const { theme, header, text, background } = useTheme();
  const glowAnim = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation<NavigationProps>();
  const { params } =
    useRoute<RouteProp<RootStackParamList, "EnablePushNotifications">>();
  const isSignupFlow = params?.isSignupFlow ?? true;
  const isAirdropFlow = params?.isAirdropFlow ?? false;
  const subtitle = params?.subtitle ?? null;
  const onAccept = params?.onAccept ?? null;
  const onDeny = params?.onDeny ?? null;
  const onOverrideDeny = params?.onOverrideDeny ?? null;
  const onOverrideAccept = params?.onOverrideAccept ?? null;
  const hideHeader = params?.hideHeader ?? false;

  const _onAllow = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // prompt for push notifications
    const permission = await OneSignal.Notifications.requestPermission(true);

    if (permission) {
      // segment.track("Trading Push Notifications Enabled");
    }

    if (onOverrideAccept) {
      return onOverrideAccept();
    }

    navigation.navigate("Main");

    if (onAccept) {
      onAccept();
    }
  };

  const _onDeny = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (onOverrideDeny) {
      return onOverrideDeny();
    }

    navigation.navigate("Main");

    if (onDeny) {
      onDeny();
    }
  };

  return (
    <View
      style={{
        backgroundColor: background,
        flex: 1,
        height,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {hideHeader ? null : !isSignupFlow && <Header hasBackButton />}

      {hideHeader && (
        <Close
          style={{
            zIndex: 100,
            right: 15,
            top: 15,
          }}
        />
      )}

      <LinearGradient
        style={{
          flex: 1,
        }}
        // vertical gradient from top to bottom
        start={[0, 0]}
        end={[0, 1]}
        locations={[0.7, 1]}
        colors={[
          background,
          theme === "light" ? colors.lightBlue90 : colors.lightBlue10,
        ]}
      >
        <View
          style={{
            paddingTop: 0,
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            padding: 25,
          }}
        >
          {isSignupFlow && (
            <TouchableOpacity
              style={{
                position: "absolute",
                top: 5,
                right: 15,
                zIndex: 100,
              }}
              onPress={_onDeny}
              activeOpacity={0.75}
            >
              <Text
                style={{
                  color: text,
                  fontSize: 16,
                  fontFamily: "Mona-Sans-Regular",
                }}
              >
                Skip
              </Text>
            </TouchableOpacity>
          )}

          <View
            style={{
              width: "100%",
              position: "absolute",
              top: isSignupFlow ? 125 : 50,
            }}
          >
            <Text
              style={{
                color: header,
                fontSize: 26,
                fontFamily: "Mona-Sans-Expanded-SemiBold",
              }}
            >
              Enable Notifications
            </Text>

            <Text
              style={{
                marginTop: 20,
                color: text,
                fontSize: 18,
                fontFamily: "Mona-Sans-Regular",
              }}
            >
              {subtitle ||
                "We'll notify you if you have eligible airdrops or if someone follows you."}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <PushNotificationPrompt onAllow={_onAllow} onDeny={_onDeny} />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const PushNotificationPrompt = ({
  onAllow,
  onDeny,
}: {
  onAllow: () => void;
  onDeny: () => void;
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, {}]}>
      <View
        style={[
          styles.dialogBox,
          {
            width: 275,
            backgroundColor: theme === "dark" ? colors.gray80 : colors.gray95,
            borderColor: colors.gray80,
            borderWidth: 1,
          },
        ]}
      >
        <Text
          style={[
            styles.title,
            {
              fontFamily: "Mona-Sans-SemiBold",
            },
          ]}
        >
          Enable Notifications
        </Text>

        <Text
          style={[
            styles.message,
            {
              fontFamily: "Mona-Sans-Regular",
              paddingBottom: 20,
            },
          ]}
        >
          Would you like to enable push notifications to stay updated?
        </Text>

        <View
          style={{
            backgroundColor: colors.gray80,
            height: 1,
            width: "100%",
          }}
        />

        <View
          style={{
            display: "flex",
            flexDirection: "row",
          }}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              padding: 13,
              alignItems: "center",
              borderRightColor: colors.gray80,
              borderRightWidth: 1,
            }}
            onPress={onDeny}
            activeOpacity={0.75}
          >
            <Text
              style={{
                color: "#007bff",
                fontSize: 16,
                fontFamily: "Mona-Sans-Regular",
              }}
            >
              No Thanks
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.75}
            style={{
              flex: 1,
              padding: 13,
              alignItems: "center",
            }}
            onPress={onAllow}
          >
            <Text
              style={{
                color: "#007bff",
                fontSize: 16,
                fontFamily: "Mona-Sans-SemiBold",
              }}
            >
              Yes, Enable
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  dialogBox: {
    width: "80%",
    backgroundColor: colors.gray80,
    borderRadius: 15,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    paddingTop: 25,
    fontWeight: "bold",
  },
  message: {
    fontSize: 14,
    padding: 10,
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    borderTopColor: colors.gray60,
    borderTopWidth: 1,
  },
  button: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
    margin: 5,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default EnablePushNotifications;

import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "src/components/Button";
import { Text } from "src/components/Text";
import { IS_IPAD } from "src/config";
import { useTheme } from "src/hooks";
import { NavigationProps } from "src/navigation";

const Welcome = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProps>();

  const signIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("Login");
  };

  const signUp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("Signup");
    // navigation.navigate("Interests");
  };

  const theme = useTheme();

  return (
    <View
      style={{
        backgroundColor: theme.background,
        flexDirection: "column",
        display: "flex",
        height: "100%",
        alignItems: "center",
      }}
    >
      {/* <View
        style={{
          position: "absolute",
          backgroundColor: colors.gray10,
          width: "100%",
          height: "100%",
        }}
      /> */}

      {/* <FastImage
        style={[
          {
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            width: "100%",
            height: "100%",
          },
        ]}
        resizeMode="cover"
        source={require("src/assets/images/background.png")}
      /> */}
      {/* black overlay */}

      {/* <View
        style={{
          position: "absolute",
          backgroundColor: "rgba(0,0,0,0.25)",
          width: "100%",
          height: "100%",
          // blur
        }}
      /> */}

      <View
        style={{
          paddingHorizontal: 25,
          paddingBottom: insets.bottom + 25,
        }}
      >
        <View
          style={{
            paddingTop: insets.top + 50,
          }}
        >
          <Text
            style={{
              fontSize: IS_IPAD ? 48 : 32,
              textAlign: "center",
              fontFamily: "Inter-Bold",
              color: theme.header,
            }}
          >
            Welcome to Pickup
          </Text>

          <Text
            style={{
              fontSize: 20,
              marginTop: 15,
              textAlign: "center",
              fontFamily: "Inter-Medium",
              color: theme.text,
            }}
          >
            Endless audio content, tailored to your tastes. Just press play 🎧
          </Text>
        </View>

        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        ></View>

        <View
          style={{
            width: "100%",
          }}
        >
          <Button
            style={{
              marginBottom: 15,
            }}
            textProps={{
              style: {
                // fontFamily: "Inter-Semibold",
              },
            }}
            onPress={signUp}
            label="Create an account"
          />

          <Button
            style={{
              backgroundColor: theme.secondaryBackground,
              marginBottom: 15,
            }}
            textProps={{
              style: {
                color: theme.text,
                // fontFamily: "Inter-Semibold",
              },
            }}
            onPress={signIn}
            label="Log in"
          />
        </View>
      </View>
    </View>
  );
};

export default Welcome;

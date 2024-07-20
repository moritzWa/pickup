import { View, Image, Animated } from "react-native";
import React, { useEffect, useRef } from "react";
import Button from "src/components/Button";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { NavigationProps, RootStackParamList } from "src/navigation";
import { colors } from "src/components";
import { Text } from "src/components/Text";
import FastImage from "react-native-fast-image";
import { IS_IPAD } from "src/config";

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
  };

  return (
    <View
      style={{
        backgroundColor: "#fdfdfd",
        flexDirection: "column",
        display: "flex",
        height: "100%",
        alignItems: "center",
      }}
    >
      <View
        style={{
          position: "absolute",
          backgroundColor: colors.gray10,
          width: "100%",
          height: "100%",
        }}
      />

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

      <View
        style={{
          position: "absolute",
          backgroundColor: "rgba(0,0,0,0.25)",
          width: "100%",
          height: "100%",
          // blur
        }}
      />

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
              fontSize: IS_IPAD ? 48 : 26,
              textAlign: "center",
              fontFamily: "Mona-Sans-Semibold",
              color: colors.white,
            }}
          >
            fuck yes
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
                fontFamily: "Mona-Sans-Semibold",
              },
            }}
            onPress={signUp}
            label="Sign up"
          />

          <Button
            style={{
              backgroundColor: colors.white,
              marginBottom: 15,
            }}
            textProps={{
              style: {
                color: colors.black,
                fontFamily: "Mona-Sans-Semibold",
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

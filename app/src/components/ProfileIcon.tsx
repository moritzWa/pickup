import {
  View,
  Text,
  StyleProp,
  ViewStyle,
  TouchableOpacity,
} from "react-native";
import React from "react";
import FastImage from "react-native-fast-image";
import { colors } from ".";
import { TextStyle } from "react-native";
import { getGradientById } from "src/utils/helpers";
import { LinearGradient } from "expo-linear-gradient";

const ProfileIcon = ({
  initials,
  profileImageUrl,
  size = 40,
  textStyle,
  style,
  onPress,
}: {
  initials?: string | null;
  profileImageUrl?: string | null;
  size?: number;
  textStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) => {
  const gradient = getGradientById(initials || "");

  if (profileImageUrl) {
    // return the fast image
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={[style, { borderRadius: 100 }]}
      >
        <FastImage
          source={{ uri: profileImageUrl }}
          style={[
            {
              height: size,
              width: size,
              borderRadius: 100,
            },
            ,
          ]}
        />
      </TouchableOpacity>
    );
  }

  return (
    <LinearGradient
      colors={gradient}
      style={[
        {
          height: size,
          width: size,
          borderRadius: 100,
          backgroundColor: colors.red50,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[]}>
        <Text
          style={[
            {
              fontSize: 16,
              fontFamily: "Raleway-Bold",
              color: colors.black,
            },
            textStyle,
          ]}
        >
          {initials}
        </Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

export default ProfileIcon;

import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  StyleProp,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import FastImage from "react-native-fast-image";
import { getGradientById } from "src/utils/helpers";
import { colors } from ".";

const ProfileIcon = ({
  initials,
  profileImageUrl,
  id,
  size = 40,
  textStyle,
  style,
  onPress,
}: {
  initials?: string | null;
  id: string;
  profileImageUrl?: string | null;
  size?: number;
  textStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) => {
  const gradient = getGradientById(id || initials || "");

  if (profileImageUrl) {
    // return the fast image
    return (
      <TouchableOpacity
        activeOpacity={1}
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
      <TouchableOpacity activeOpacity={1} onPress={onPress} style={[]}>
        <Text
          style={[
            {
              fontSize: 16,
              fontFamily: "Inter-Bold",
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

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
  onPress: () => void;
}) => {
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
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
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
      <Text
        style={[
          {
            fontSize: 20,
            fontFamily: "Raleway-Bold",
            color: colors.white,
          },
          textStyle,
        ]}
      >
        {initials}
      </Text>
    </TouchableOpacity>
  );
};

export default ProfileIcon;

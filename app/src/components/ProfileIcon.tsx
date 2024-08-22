import { View, Text, StyleProp } from "react-native";
import React from "react";
import FastImage from "react-native-fast-image";
import { colors } from ".";
import { TextStyle } from "react-native";

const ProfileIcon = ({
  initials,
  profileImageUrl,
  size = 40,
  textStyle,
}: {
  initials?: string | null;
  profileImageUrl?: string | null;
  size?: number;
  textStyle?: StyleProp<TextStyle>;
}) => {
  if (profileImageUrl) {
    // return the fast image
    return (
      <FastImage
        source={{ uri: profileImageUrl }}
        style={{
          height: size,
          width: size,
          borderRadius: 100,
        }}
      />
    );
  }

  return (
    <View
      style={{
        height: size,
        width: size,
        borderRadius: 100,
        backgroundColor: colors.red50,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
      }}
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
    </View>
  );
};

export default ProfileIcon;

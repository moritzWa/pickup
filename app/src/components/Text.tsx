// react native text component
import React from "react";
import { Text as RNText, TextProps, useColorScheme } from "react-native";
import { colors } from ".";

type Props = {
  children: string;
} & TextProps;

export const Text = ({ children, ...other }: Props) => {
  const schema = useColorScheme();
  const color = schema === "dark" ? colors.white : colors.black;

  return (
    <RNText
      {...other}
      style={[
        {
          fontFamily: "Inter-Regular",
          color,
        },
        other.style,
      ]}
    >
      {children}
    </RNText>
  );
};

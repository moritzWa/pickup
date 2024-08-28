import React from "react";
import { Text } from "react-native";
import { BaseContentFields } from "src/api/fragments";
import { useTheme } from "src/hooks";
import { getDescription } from "./contentHelpers";

export const ContentDescription = ({
  content,
}: {
  content: BaseContentFields;
}) => {
  const theme = useTheme();

  return (
    <Text
      style={{
        color: theme.text,
        fontSize: 14,
        fontWeight: "100",
        // marginRight: 50,
        fontFamily: "Inter-Medium",
      }}
      numberOfLines={2}
    >
      {getDescription(content)}
    </Text>
  );
};

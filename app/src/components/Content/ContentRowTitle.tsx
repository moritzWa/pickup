import React from "react";
import { Text, View } from "react-native";
import { BaseContentFields } from "src/api/fragments";
import { useTheme } from "src/hooks";
import { colors } from "..";

export const ContentRowTitle = ({
  content,
  isActive,
}: {
  content: BaseContentFields;
  isActive: boolean;
}) => {
  const theme = useTheme();

  return (
    <View
      style={{
        marginLeft: 10,
        marginRight: 10,
        flex: 1,
        alignItems: "flex-start",
        justifyContent: "center",
      }}
    >
      <Text
        numberOfLines={2}
        style={{
          color: isActive
            ? theme.theme === "dark"
              ? colors.purple90 // Use a lighter color for dark mode
              : colors.primary
            : theme.header,
          fontSize: 16,
          // underline it if active
          // textDecorationLine: isActive ? "underline" : "none",
          // marginRight: 20,
          fontFamily: "Inter-Semibold",
        }}
      >
        {content.title}
      </Text>
    </View>
  );
};

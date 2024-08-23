import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { useTheme } from "src/hooks/useTheme";

export const TabOption = ({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress?: () => void;
}) => {
  const theme = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={{
        paddingVertical: 7,
        paddingHorizontal: 15,
        borderRadius: 100,
        backgroundColor: isActive ? theme.secondaryBackground : "transparent",
        marginRight: 5,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Text
        style={{
          fontFamily: "Inter-Semibold",
          fontSize: 16,
          color: isActive ? theme.textPrimary : theme.textSecondary,
        }}
      >
        {label}
      </Text>

      {/* <View
        style={{
          height: 3,
          backgroundColor: isActive ? theme.header : "transparent",
          marginTop: 10,
          borderRadius: 100,
          width: 60,
        }}
      /> */}
    </TouchableOpacity>
  );
};

import React from "react";
import { View } from "react-native";
import { TabOption } from "src/components/tabs";
import { useTheme } from "src/hooks/useTheme";
import { TabType } from "./TabType";

type Props = {
  tabs: TabType[];
};

export const TabBar = ({ tabs }: Props) => {
  const { secondaryBackground } = useTheme();

  return (
    <View
      style={{
        paddingTop: 25,
        paddingHorizontal: 15,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        // borderBottomWidth: 1,
        // borderBottomColor: secondaryBackground,
        paddingBottom: 0,
        marginBottom: 15,
      }}
    >
      {tabs.map((tab) => (
        <TabOption
          key={tab.name}
          onPress={tab.onClick}
          label={tab.name}
          isActive={tab.isActive}
        />
      ))}
    </View>
  );
};

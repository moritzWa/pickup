import React from "react";
import {
  ApolloError,
  useLazyQuery,
  useMutation,
  useQuery,
} from "@apollo/client";
import {
  CommonActions,
  RouteProp,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Platform,
  RefreshControl,
  SectionList,
  SectionListData,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "src/hooks/useTheme";
import { last, noop } from "lodash";
import { TabOption } from "src/components/tabs";
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
          onPress={tab.onClick}
          label={tab.name}
          isActive={tab.isActive}
        />
      ))}
    </View>
  );
};

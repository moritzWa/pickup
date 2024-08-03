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
import { api, apolloClient } from "src/api";
import { MutationUpdateUserArgs, Query } from "src/api/generated/types";
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
        paddingHorizontal: 5,
        marginRight: 15,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Text
        style={{
          fontFamily: isActive ? "Raleway-Bold" : "Raleway-Regular",
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

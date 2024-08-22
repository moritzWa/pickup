import {
  ApolloError,
  useLazyQuery,
  useMutation,
  useQuery,
} from "@apollo/client";
import {
  CommonActions,
  RouteProp,
  useIsFocused,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { View } from "react-native";
import { useTheme } from "src/hooks/useTheme";
import Header from "src/components/Header";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SearchBar } from "@rneui/base";
import { SearchResults } from "./SearchResults";

const SearchIcon = require("src/assets/icons/search.png");

const Friends = () => {
  const fullTheme = useTheme();
  const { theme, header, text, background } = fullTheme;

  return (
    <View style={{ flex: 1, backgroundColor: background }}>
      <Header
        containerStyle={{
          paddingTop: 15,
        }}
        hasBackButton
        title="Find Friends"
      />

      <SearchResults />
    </View>
  );
};

export default Friends;

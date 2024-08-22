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
import { Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "src/hooks/useTheme";
import Header from "src/components/Header";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SearchBar } from "@rneui/base";
import { SearchResults } from "./SearchResults";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "src/components";
import { NavigationProps } from "src/navigation";
import * as Haptics from "expo-haptics";
import { useMe } from "src/hooks";

const Friends = () => {
  const fullTheme = useTheme();
  const { theme, header, text, background } = fullTheme;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProps>();
  const { me } = useMe();

  const _onPressFriends = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    navigation.navigate("Followers", {
      defaultMode: "following",
      username: me?.username || "",
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: background }}>
      <Header
        hasBackButton
        title="Find Friends"
        rightIcon={
          <TouchableOpacity activeOpacity={0.9} onPress={_onPressFriends}>
            <Text
              style={{
                color: colors.lightBlue50,
                fontSize: 16,
                fontFamily: "Raleway-Medium",
                textAlign: "center",
                paddingVertical: 5,
              }}
            >
              My friends
            </Text>
          </TouchableOpacity>
        }
      />

      <SearchResults />
    </View>
  );
};

export default Friends;

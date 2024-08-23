import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "src/components";
import Header from "src/components/Header";
import { useMe } from "src/hooks";
import { useTheme } from "src/hooks/useTheme";
import { NavigationProps } from "src/navigation";
import { SearchResults } from "./SearchResults";

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
                fontFamily: "Inter-Medium",
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

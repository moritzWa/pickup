import { useQuery } from "@apollo/client";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import React, { useMemo } from "react";
import { Text, TouchableOpacity, View, ViewProps } from "react-native";
import { api } from "src/api";
import { Query, QueryGetProfileArgs } from "src/api/generated/types";
import { useTheme } from "src/hooks/useTheme";
import { NavigationProps } from "src/navigation";

export const FollowersInfo = ({
  containerStyle,
  username,
}: {
  username: null | string;
  containerStyle?: ViewProps["style"];
}) => {
  const theme = useTheme();

  const variables = useMemo(
    (): QueryGetProfileArgs => ({
      username,
    }),
    [username]
  );

  const { data: getProfileData, loading: loadingProfile } = useQuery<
    Pick<Query, "getProfile">
  >(api.users.getProfile, {
    skip: !variables.username,
    variables,
  });

  const profile = useMemo(() => getProfileData?.getProfile, [getProfileData]);

  const navigation = useNavigation<NavigationProps>();

  const _onPress = (mode: "following" | "followers") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("Followers", {
      username: username || "",
      defaultMode: mode,
    });
  };

  return (
    <View
      style={[
        {
          alignSelf: "center",
          flexDirection: "row",
          marginTop: 25,
        },
        containerStyle,
      ]}
    >
      <TouchableOpacity
        onPress={() => _onPress("followers")}
        activeOpacity={0.8}
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          marginHorizontal: 10,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            color: theme.textPrimary,
            marginRight: 5,
            fontFamily: "Inter-Bold",
          }}
        >
          {profile?.numFollowers || 0}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: theme.textSecondary,
            fontFamily: "Inter-Regular",
          }}
        >
          followers
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => _onPress("following")}
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          marginHorizontal: 10,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            color: theme.textPrimary,
            marginRight: 5,
            fontFamily: "Inter-Bold",
          }}
        >
          {profile?.numFollowing || 0}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: theme.textSecondary,
            fontFamily: "Inter-Regular",
          }}
        >
          following
        </Text>
      </TouchableOpacity>
    </View>
  );
};

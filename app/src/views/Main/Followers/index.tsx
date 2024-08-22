import React from "react";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "src/api";
import { useTheme } from "src/hooks/useTheme";
import { NavigationProps, RootStackParamList } from "src/navigation";
import Header from "src/components/Header";
import Close from "src/components/Close";
import * as Haptics from "expo-haptics";
import { Profile, Query } from "src/api/generated/types";
import { ProfileService } from "src/modules/profileService";
import ProfileIcon from "src/components/ProfileIcon";

export const Followers = () => {
  const { params } = useRoute<RouteProp<RootStackParamList, "Followers">>();
  const username = params?.username;

  const [mode, setMode] = useState<"followers" | "following">("followers");

  const {
    background,
    textPrimary,
    border,
    activityIndicator,
    text,
    textSecondary,
    header,
  } = useTheme();

  const { data: getProfileData, loading: loadingProfile } = useQuery<
    Pick<Query, "getProfile">
  >(api.users.getProfile, {
    skip: !username,
    variables: {
      username,
    },
  });

  const profile = useMemo(() => getProfileData?.getProfile, [getProfileData]);

  if (loadingProfile) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: background,
          alignItems: "center",
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="small" color={activityIndicator} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: background,
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Header containerStyle={{ paddingTop: 15 }} hasBackButton />

        <Text
          style={{
            color: textPrimary,
            fontSize: 18,
            flex: 1,
            alignSelf: "center",
            marginTop: 100,
            fontFamily: "Mona-Sans-Regular",
          }}
        >
          Profile not found.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: background,
      }}
    >
      <Close style={{ top: 15 }} />

      {/* <ProfileImage name={profile?.name} /> */}

      <View
        style={{
          alignItems: "center",
          marginTop: 50,
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <View
          style={{
            padding: 5,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setMode("followers")}
            style={{
              flex: 1,
              alignItems: "center",
              padding: 15,
              borderBottomWidth: 2,
              borderBottomColor: mode === "followers" ? header : "transparent",
            }}
          >
            <Text
              style={{
                fontFamily: "Mona-Sans-SemiBold",
                fontSize: 16,
                color: textPrimary,
              }}
            >
              Followers
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setMode("following")}
            style={{
              flex: 1,
              alignItems: "center",
              padding: 15,
              borderBottomWidth: 2,
              borderBottomColor: mode === "following" ? header : "transparent",
            }}
          >
            <Text
              style={{
                fontFamily: "Mona-Sans-SemiBold",
                fontSize: 16,
                color: textPrimary,
              }}
            >
              Following
            </Text>
          </TouchableOpacity>
        </View>

        {!!username ? <Following mode={mode} username={username} /> : null}
      </View>
    </View>
  );
};

const Following = ({
  username,
  mode,
}: {
  username: string;
  mode: "followers" | "following";
}) => {
  const variables = useMemo(
    () => ({
      username,
    }),
    [username]
  );

  const navigation = useNavigation<NavigationProps>();

  const { data: getFollowsData, loading: loadingFollows } = useQuery<
    Pick<Query, "getFollows">
  >(api.users.getFollows, {
    skip: !variables.username,
    variables,
  });

  const onSelectUser = (user: Profile) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const routes = navigation.getState().routes;

    const newRoutes = routes.slice(0, routes.length - 1);

    // navigation.reset({
    //   index: newRoutes.length,
    //   routes: [
    //     ...newRoutes,
    //     {
    //       name: "UserProfile",
    //       params: {
    //         username: user.username,
    //       },
    //     },
    //   ],
    // });
  };

  const follows = useMemo(() => getFollowsData?.getFollows, [getFollowsData]);
  const data = useMemo(
    () => (mode === "followers" ? follows?.followers : follows?.following),
    [follows, mode]
  );

  return (
    <View style={{ flex: 1, width: "100%" }}>
      <FlatList
        data={data ?? []}
        keyExtractor={(e) => e.username}
        renderItem={({ item }) => (
          <UserRow user={item} onSelectUser={onSelectUser} />
        )}
        initialNumToRender={8}
        // make it efficiently render
        removeClippedSubviews
        maxToRenderPerBatch={8}
        windowSize={8}
        style={{ flex: 1, width: "100%" }}
      />
    </View>
  );
};

const UserRow = React.memo(
  ({
    onSelectUser,
    user,
  }: {
    user: Profile;
    onSelectUser: (user: Profile) => void;
  }) => {
    const theme = useTheme();

    const _onClick = () => {
      onSelectUser(user);
    };

    const initials = useMemo(
      () => ProfileService.getInitials(user.name, user.username),
      [user]
    );

    return (
      <TouchableOpacity
        style={{
          display: "flex",
          flexDirection: "row",
          backgroundColor: theme.background,
          paddingHorizontal: 15,
          paddingVertical: 15,
          flex: 1,
          width: "100%",
          // borderBottomWidth: 1,
          // borderBottomColor: theme.border,
        }}
        onPress={_onClick}
        activeOpacity={0.9}
      >
        <ProfileIcon
          initials={initials}
          profileImageUrl={user.avatarImageUrl || null}
        />

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: "Mona-Sans-Expanded-SemiBold",
              fontSize: 16,
              marginBottom: 5,
              color: theme.textPrimary,
            }}
          >
            {user.name || "[unnamed]"}
          </Text>
          <Text
            style={{
              fontFamily: "Mona-Sans-Regular",
              fontSize: 16,
              color: theme.textSecondary,
            }}
          >
            @{user.username}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }
);

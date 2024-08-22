import { useQuery } from "@apollo/client";
import { faChevronRight } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { noop } from "lodash";
import React, { useMemo, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "src/api";
import { Profile, Query } from "src/api/generated/types";
import Header from "src/components/Header";
import ProfileIcon from "src/components/ProfileIcon";
import { useTheme } from "src/hooks/useTheme";
import { ProfileService } from "src/modules/profileService";
import { NavigationProps, RootStackParamList } from "src/navigation";

export const Followers = () => {
  const { params } = useRoute<RouteProp<RootStackParamList, "Followers">>();
  const username = params?.username;
  const defaultMode = params?.defaultMode;

  const [mode, setMode] = useState<"followers" | "following">(
    defaultMode ?? "followers"
  );

  const fullTheme = useTheme();

  const {
    background,
    textPrimary,
    border,
    activityIndicator,
    text,
    textSecondary,
    header,
  } = fullTheme;

  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: background,
      }}
    >
      <Header
        hasBackButton
        backProps={{
          hideBack: true,
        }}
        title={
          <View
            style={{
              padding: 0,
              flex: 6,
              paddingHorizontal: 0,
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
                padding: 10,
                borderRadius: 10,
                backgroundColor:
                  mode === "followers"
                    ? fullTheme.medBackground
                    : fullTheme.background,
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter-Bold",
                  fontSize: 14,
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
                padding: 10,
                borderRadius: 10,
                backgroundColor:
                  mode === "following"
                    ? fullTheme.medBackground
                    : fullTheme.background,
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter-Bold",
                  fontSize: 14,
                  color: textPrimary,
                }}
              >
                Following
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
      {/* <Close style={{ marginTop: insets.top + 10 }} /> */}

      {/* <ProfileImage name={profile?.name} /> */}

      {!!username ? <Following mode={mode} username={username} /> : null}
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

    navigation.navigate("UserProfile", {
      username: user?.username || "",
    });
  };

  const follows = useMemo(() => getFollowsData?.getFollows, [getFollowsData]);
  const data = useMemo(
    () => (mode === "followers" ? follows?.followers : follows?.following),
    [follows, mode]
  );

  return (
    <FlatList
      data={data ?? []}
      keyExtractor={(e) => e.username}
      renderItem={({ item }) => (
        <UserRow user={item} onSelectUser={onSelectUser} />
      )}
      initialNumToRender={8}
      contentContainerStyle={{
        paddingTop: 10,
        paddingBottom: 100,
      }}
      // make it efficiently render
      removeClippedSubviews
      maxToRenderPerBatch={8}
      windowSize={8}
    />
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
          alignItems: "center",
          justifyContent: "center",
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
          onPress={noop}
        />

        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text
            style={{
              fontFamily: "Inter-Semibold",
              fontSize: 16,
              color: theme.textPrimary,
            }}
          >
            {user.name || "[unnamed]"}
          </Text>
          <Text
            style={{
              fontFamily: "Inter-Regular",
              fontSize: 14,
              marginTop: 5,
              color: theme.textSecondary,
            }}
          >
            @{user.username}
          </Text>
        </View>

        <View>
          <FontAwesomeIcon icon={faChevronRight} color={theme.text} />
        </View>
      </TouchableOpacity>
    );
  }
);

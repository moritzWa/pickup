import { useMutation } from "@apollo/client";
import { faChevronRight } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import React, { useMemo } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { api } from "src/api";
import {
  Mutation,
  UserContactProfile,
  UserSearchResult,
} from "src/api/generated/types";
import { Button } from "src/components";
import ProfileIcon from "src/components/ProfileIcon";
import { useTheme } from "src/hooks";
import { ProfileService } from "src/modules/profileService";

export const UserRow = React.memo(
  ({
    onSelectUser,
    user,
  }: {
    user: UserSearchResult | UserContactProfile;
    onSelectUser: (u: UserSearchResult | UserContactProfile) => void;
  }) => {
    const theme = useTheme();

    const _onPress = () => {
      onSelectUser(user);
    };

    const [followProfile, { loading: loadingFollow }] = useMutation<
      Pick<Mutation, "followProfile">
    >(api.users.follow);

    const [unfollowProfile, { loading: loadingUnfollow }] = useMutation<
      Pick<Mutation, "unfollowProfile">
    >(api.users.unfollow);

    const followUser = async () => {
      try {
        await followProfile({
          variables: {
            username: user.username,
          },
          refetchQueries: [
            api.users.getProfile,
            api.users.getUserContacts,
            api.users.search,
          ],
        });

        // Alert.alert("Success", `Successfully followed ${profile?.name}.`);
      } catch (e) {
        console.error(e);

        Alert.alert(
          "Error",
          (e as any)?.message || "An error occurred. Please try again."
        );
      }
    };

    const unfollowUser = async () => {
      try {
        await unfollowProfile({
          variables: {
            username: user.username,
          },
          refetchQueries: [
            api.users.getProfile,
            api.users.getUserContacts,
            api.users.search,
          ],
        });
      } catch (e) {
        console.error(e);

        Alert.alert(
          "Error",
          (e as any)?.message || "An error occurred. Please try again."
        );
      }
    };

    const initials = useMemo(() => {
      const initials = ProfileService.getInitials(
        user.name || "",
        user.username || ""
      );

      return initials;
    }, [user]);

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={_onPress}
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.background,
          paddingHorizontal: 15,
          paddingVertical: 15,
          // borderBottomWidth: 1,
          // borderBottomColor: theme.border,
        }}
      >
        <ProfileIcon
          initials={initials}
          profileImageUrl={user.avatarImageUrl}
        />

        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text
            style={{
              fontFamily: "Inter-Semibold",
              fontSize: 16,
              marginBottom: 5,
              color: theme.textPrimary,
            }}
          >
            {user.name}
          </Text>
          <Text
            style={{
              fontFamily: "Inter-Regular",
              fontSize: 16,
              color: theme.textSecondary,
            }}
          >
            {user.username || "-"}
          </Text>
        </View>

        {/* <Button
          style={{
            borderRadius: 100,
            height: 35,
            paddingVertical: 0,
            padding: 0,
            alignSelf: "center",
            width: 85,
            paddingHorizontal: 0,
            borderWidth: user.isFollowing ? 1 : 0,
            borderColor: theme.borderDark,
            backgroundColor: user.isFollowing ? theme.background : theme.header,
          }}
          textProps={{
            style: {
              fontSize: 14,
              color: user.isFollowing ? theme.textPrimary : theme.background,
            },
          }}
          onPress={user.isFollowing ? unfollowUser : followUser}
          loading={loadingFollow || loadingUnfollow}
          label={user.isFollowing ? "Unfollow" : "Follow"}
        /> */}

        <FontAwesomeIcon icon={faChevronRight} color={theme.text} />
      </TouchableOpacity>
    );
  },
  (prev, next) => {
    return JSON.stringify(prev.user) === JSON.stringify(next.user);
  }
);

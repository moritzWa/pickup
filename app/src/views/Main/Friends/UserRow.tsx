import { faChevronRight } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import React, { useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { UserSearchResult } from "src/api/generated/types";
import ProfileIcon from "src/components/ProfileIcon";
import { useTheme } from "src/hooks";
import { ProfileService } from "src/modules/profileService";

export const UserRow = React.memo(
  ({
    onSelectUser,
    user,
  }: {
    user: UserSearchResult;
    onSelectUser: (u: UserSearchResult) => void;
  }) => {
    const theme = useTheme();

    const _onPress = () => {
      onSelectUser(user);
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
              fontFamily: "Raleway-SemiBold",
              fontSize: 16,
              marginBottom: 5,
              color: theme.textPrimary,
            }}
          >
            {user.name}
          </Text>
          <Text
            style={{
              fontFamily: "Raleway-Regular",
              fontSize: 16,
              color: theme.textSecondary,
            }}
          >
            {user.username || "-"}
          </Text>
        </View>

        <FontAwesomeIcon icon={faChevronRight} color={theme.text} />
      </TouchableOpacity>
    );
  }
);

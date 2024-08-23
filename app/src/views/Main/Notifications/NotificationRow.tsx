import React, { useCallback, useMemo } from "react";
import { noop } from "lodash";
import { Alert, Image, Text, TouchableOpacity, View } from "react-native";
import { BaseNotificationFields } from "src/api/fragments";
import { useTheme } from "src/hooks/useTheme";
import { abbreviateFromNow } from "src/utils/helpers";
import moment from "moment-timezone";
import { IS_IPAD } from "src/config";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";
import { NavigationProps } from "src/navigation";

const MessageIcon = require("src/assets/icons/message-filled.png");
const BellIcon = require("src/assets/icons/bell-solid.png");
const CircleAdd = require("src/assets/icons/circle-add.png");
const Friends = require("src/assets/icons/friends.png");

export const NotificationRow = ({
  notification,
}: {
  notification: BaseNotificationFields;
}) => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProps>();

  const subtitle = notification.subtitle;
  const createdAt = notification.createdAt;
  const iconImageUrl = notification.iconImageUrl;
  const image = _getImage(theme, notification);

  // hack for now
  const isFollow = useMemo(
    (): boolean =>
      notification.subtitle.toLowerCase().includes("follow") ||
      notification.title.toLowerCase().includes("follow"),
    [notification]
  );

  const isClickable = useMemo(() => {
    // const hasToken =
    //   !!notification.tokenContractAddress && !!notification.tokenProvider;
    // if (hasToken) return true;

    return true;
  }, [notification]);

  const _onPress = useCallback(() => {
    if (title.toLowerCase().includes("new podcast")) {
      // go to home page
      navigation.navigate("Home");
      return;
    }
    // if (username) {
    //   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    //   navigation.navigate("UserProfile", { username });
    //   return;
    // }
    // if (notification.tokenContractAddress && notification.tokenProvider) {
    //   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    //   _goToAsset();
    //   return;
    // }
  }, [notification]);

  const title = useMemo(() => {
    // if (isFollow && notification.followerUserName && username) {
    //   return `${notification.followerUserName} (@${username})`;
    // }

    return notification.title;
  }, [notification]);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      disabled={!isClickable}
      onPress={_onPress}
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        padding: 15,
      }}
    >
      {iconImageUrl ? (
        <Image
          source={{ uri: iconImageUrl }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 100,
          }}
          resizeMode="contain"
        />
      ) : (
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            width: 40,
            height: 40,
            justifyContent: "center",
            backgroundColor: theme.header,
            borderRadius: 100,
          }}
        >
          {image}
        </View>
      )}

      <View
        style={{
          flex: 1,
          marginLeft: 15,
          marginRight: 15,
        }}
      >
        <View>
          <Text
            style={{
              fontFamily: "Inter-SemiBold",
              fontSize: IS_IPAD ? 22 : 16,
              color: theme.textPrimary,
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>

        <Text
          style={{
            marginTop: 5,
            fontFamily: "Inter-Regular",
            fontSize: IS_IPAD ? 22 : 16,
            color: theme.textSecondary,
          }}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      </View>

      <View
        style={{
          alignItems: "flex-end",
        }}
      >
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
          }}
          activeOpacity={0.8}
          onPress={noop}
        >
          <Text
            style={{
              color: theme.header,
              fontSize: 16,
              fontFamily: "Inter-Medium",
            }}
            numberOfLines={1}
          >
            {abbreviateFromNow(moment(createdAt)).replace(" ago", "")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* <View style={{ marginLeft: 5 }}>
              <FontAwesomeIcon
                icon={faChevronRight}
                size={12}
                color={fullTheme.textSecondary}
              />
            </View> */}
    </TouchableOpacity>
  );
};

const _getImage = (
  theme: ReturnType<typeof useTheme>,
  notification: BaseNotificationFields
) => {
  if (notification.subtitle.includes("follow")) {
    return (
      <Image
        source={Friends}
        style={{
          width: 18,
          height: 18,
        }}
        tintColor={theme.background}
        resizeMode="contain"
      />
    );
  }

  return (
    <Image
      source={BellIcon}
      style={{
        width: 18,
        height: 18,
      }}
      tintColor={theme.background}
      resizeMode="contain"
    />
  );
};

import React, { useMemo } from "react";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Text, TouchableOpacity, View, Image, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { useTheme } from "src/hooks/useTheme";
import { IS_IPAD } from "src/config";
import { Maybe } from "src/core";
import { Descriptor, Route } from "@react-navigation/native";
import { useQuery } from "@apollo/client";
import { api } from "src/api";
import { useMe } from "src/hooks";
import { colors } from "src/components";
import { hasIn, isNil } from "lodash";
import { CurrentAudio } from "src/components/CurrentAudio";
import { useSelector } from "react-redux";
import { getCurrentContent } from "src/redux/reducers/audio";
import { Query } from "src/api/generated/types";

const HomeIcon = require("src/assets/icons/home.png");
const HomeIconFilled = require("src/assets/icons/home-filled.png");
const SettingsIcon = require("src/assets/icons/settings.png");
const SettingsIconFilled = require("src/assets/icons/settings-filled.png");
const ProfileIcon = require("src/assets/icons/profile.png");
const ProfileIconFilled = require("src/assets/icons/profile-filled.png");
const SearchIcon = require("src/assets/icons/search.png");
const SearchIconFilled = require("src/assets/icons/search-filled.png");
const ClockIcon = require("src/assets/icons/clock.png");
const ClockIconFilled = require("src/assets/icons/clock-filled.png");
const BellIcon = require("src/assets/icons/bell.png");
const BellIconFilled = require("src/assets/icons/bell-solid.png");
const FriendsIcon = require("src/assets/icons/friends-outline.png");
const FriendsIconFilled = require("src/assets/icons/friends.png");
const PortfolioIcon = require("src/assets/icons/portfolio.png");
const PortfolioIconFilled = require("src/assets/icons/portfolio-solid.png");
const CarIcon = require("src/assets/icons/car-regular.png");
const CarIconFilled = require("src/assets/icons/car-solid.png");
const InboxIcon = require("src/assets/icons/inbox-regular.png");
const InboxIconFilled = require("src/assets/icons/inbox-solid.png");

function _TabBar(tabBarProps: BottomTabBarProps) {
  const { state, descriptors } = tabBarProps;
  const fullTheme = useTheme();
  const {
    secondaryBackground,
    text,
    textSecondary,
    medBackground,
    background,
    theme,
    header,
  } = fullTheme;
  const { me } = useMe();

  const { data: queueData, refetch: refetchQueue } = useQuery<
    Pick<Query, "getQueue">
  >(api.queue.list, {
    variables: {},
    fetchPolicy: "cache-and-network",
  });

  const queueCount = queueData?.getQueue?.queue?.length ?? 0;

  return (
    <>
      <CurrentAudio />

      <BlurView
        intensity={75} // You can adjust the intensity of the blur
        tint={theme === "light" ? "extraLight" : "dark"}
        style={{
          flexDirection: "column",
          width: "100%",
          zIndex: 100,
          position: "absolute",
          bottom: 0,
          left: 0,
          // borderTopWidth: 1,
          // backgroundColor: background,
          // borderTopColor: medBackground,
        }}
      >
        {/* <InternetConnection /> */}

        <View
          style={{
            paddingTop: 20,
            paddingHorizontal: 20,
            maxWidth: 375,
            alignSelf: "center",
            flexDirection: "row",
            paddingBottom: 0,
            // backgroundColor: background,
          }}
        >
          {state.routes.map((route, index) => {
            return (
              <SingleTab
                key={route.key}
                index={index}
                tabBarProps={tabBarProps}
                route={route}
                badgeCount={index === 1 ? queueCount : null}
                badgeColor={index === 1 ? colors.primary : null}
              />
            );
          })}
        </View>
      </BlurView>
    </>
  );
}

const SingleTab = ({
  tabBarProps,
  route,
  index,
  badgeCount,
  badgeColor,
}: {
  tabBarProps: BottomTabBarProps;
  index: number;
  route: BottomTabBarProps["state"]["routes"][number];
  badgeCount: number | null;
  badgeColor?: string | null;
}) => {
  const fullTheme = useTheme();
  const { descriptors, navigation, state } = tabBarProps;
  const { options } = descriptors[route.key];
  const _label =
    options.tabBarLabel !== undefined
      ? options.tabBarLabel
      : options.title !== undefined
      ? options.title
      : route.name;
  const label = _label === "Profile" ? "Settings" : _label;

  const insets = useSafeAreaInsets();
  const paddingBottom = 15 + (insets.bottom ? insets.bottom - 0 : 0);
  const isFocused = state.index === index;

  const onPress = () => {
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  };

  const image = _getImage(route.name);
  const hasBadge: boolean = !isNil(badgeCount) && badgeCount! > 0;

  return (
    <TouchableOpacity
      key={index}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={options.tabBarAccessibilityLabel}
      testID={options.tabBarTestID}
      onPress={onPress}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
        paddingBottom,
        position: "relative",
      }}
      activeOpacity={1}
    >
      {/* <View
        style={{
          height: 3,
          borderRadius: 100,
          top: 5,
          width: 50,
          marginBottom: 20,
          alignSelf: "center",
          backgroundColor: isFocused
            ? theme === "light"
              ? colors.black
              : colors.white
            : "transparent",
        }}
      /> */}

      <Image
        style={{
          alignSelf: "center",
          width: 24,
          height: 24,
        }}
        resizeMode="contain"
        tintColor={isFocused ? fullTheme.textPrimary : fullTheme.textSubtle}
        source={isFocused ? image?.active : image?.image}
      />

      {hasBadge ? (
        <View
          style={{
            width: 20,
            height: 20,
            backgroundColor: badgeColor ?? colors.red50,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 100,
            position: "absolute",
            right: 30,
            bottom: paddingBottom - 10,
            borderColor: fullTheme.background,
            borderWidth: 1,
          }}
        >
          {/* hack for friends tab to not show color */}
          {badgeColor !== colors.yellow50 ? (
            <Text
              style={{
                fontFamily: "sans-serif",
                color: colors.white,
                fontSize: 12,
                fontWeight: "900",
              }}
            >
              {badgeCount}
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* <Text
          style={{
            textAlign: "center",
            fontSize: 12,
            fontFamily: "Raleway-Semibold",
            color: isFocused
              ? theme === "light"
                ? colors.positive
                : colors.positive
              : theme === "light"
              ? colors.black
              : colors.white,
          }}
        >
          {label || ""}
        </Text> */}
    </TouchableOpacity>
  );
};

const _getImage = (
  routeName: string
): Maybe<{ image: any; active: any; icon?: any }> => {
  switch (routeName) {
    case "Home":
      return {
        image: HomeIcon,
        active: HomeIconFilled,
      };
    case "CarMode":
      return {
        image: CarIcon,
        active: CarIconFilled,
      };
    case "Activity":
      return {
        image: InboxIcon,
        active: InboxIconFilled,
      };
    case "Profile":
      return {
        image: ProfileIcon,
        active: ProfileIconFilled,
      };
    default:
      return null;
  }
};

export const TabBar = React.memo(_TabBar);

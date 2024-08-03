import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  RefreshControl,
  Alert,
  Image,
  Animated,
} from "react-native";
import React, { useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "src/hooks";
import { useMutation, useQuery } from "@apollo/client";
import { api } from "src/api";
import { Query } from "src/api/generated/types";
import { NavigationProps } from "src/navigation";
import { BaseContentFields, BaseCourseFields } from "src/api/fragments";
import { colors } from "src/components";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faArrowRight,
  faCar,
  faCarBolt,
  faHeadphones,
  faHeadphonesAlt,
  faPlay,
} from "@fortawesome/pro-solid-svg-icons";
import { Impressions } from "./Github";
import { ContentRow } from "../../../components/Content/ContentRow";
import { LinearGradient } from "expo-linear-gradient";
import Header from "src/components/Header";
import FastImage from "react-native-fast-image";
import { BlurView } from "expo-blur";

const generateImpressionsData = () => {
  const impressions = [];
  for (let i = 0; i < 365; i++) {
    impressions.push({ completed: Math.random() > 0.5 });
  }
  return impressions;
};

const impressionsData = generateImpressionsData();

const Home = () => {
  const navigation = useNavigation<NavigationProps>();
  const theme = useTheme();

  const { data, refetch, error } = useQuery<Pick<Query, "getContentFeed">>(
    api.content.feed
  );

  const [startCourse] = useMutation(api.courses.start);

  const content = (data?.getContentFeed ?? []) as BaseContentFields[];

  const onRefresh = async () => {
    await refetch();
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View
        style={{
          alignItems: "center",
        }}
      >
        <Options />
      </View>

      <FlatList
        data={content}
        refreshControl={
          <RefreshControl
            tintColor={theme.activityIndicator}
            refreshing={false}
            onRefresh={onRefresh}
          />
        }
        keyExtractor={(c) => c.id}
        // hide scrollbar
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 10,
          paddingTop: 15,
          paddingBottom: 150,
        }}
        renderItem={({ item: c }) => <ContentRow content={c} />}
      />

      <CurrentAudio content={content} />
    </SafeAreaView>
  );
};

const SingleFilter = ({
  label,
  onPress,
  isActive,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) => {
  const theme = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={{ flexDirection: "row", padding: 10 }}
    >
      <Text
        style={{
          color: isActive ? theme.header : theme.text,
          fontFamily: isActive ? "Raleway-Bold" : "Raleway-Regular",
          fontSize: 18,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export enum DiscoveryTab {
  All = "all",
  Unread = "unread",
  Popular = "popular",
}

const Options = () => {
  const theme = useTheme();
  const activeTab = DiscoveryTab.All;
  const animation = useRef(new Animated.Value(1)).current; // Initial scale value of 1

  const onPressIn = () => {
    Animated.spring(animation, {
      toValue: 0.9, // Scale down to 90%
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(animation, {
      toValue: 1, // Scale back to original size
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const onPress = () => {
    // TODO:
  };

  return (
    <View
      style={{
        paddingHorizontal: 5,
        paddingBottom: 5,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <View
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <SingleFilter
          onPress={onPress}
          isActive={DiscoveryTab.All === activeTab}
          label="For you"
        />

        <SingleFilter
          onPress={onPress}
          isActive={DiscoveryTab.Popular === activeTab}
          label="Popular"
        />
      </View>

      <Animated.View
        style={{
          marginRight: 10,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 100,
          paddingHorizontal: 10,
          paddingVertical: 5,
          backgroundColor: colors.primary,
          alignSelf: "center",
          transform: [{ scale: animation }],
        }}
      >
        <TouchableOpacity
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={onPress}
          activeOpacity={1}
          style={{
            display: "flex",
            alignItems: "center",
            flexDirection: "row",
            padding: 5,
            borderRadius: 100,
          }}
        >
          <Text
            style={{
              color: colors.white,
              fontFamily: "Raleway-Bold",
              fontSize: 16,
              marginRight: 5,
            }}
          >
            Start
          </Text>

          <FontAwesomeIcon
            icon={faPlay}
            color={colors.white}
            size={14}
            style={{ position: "relative", right: -2 }}
          />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const CurrentAudio = ({ content }: { content: BaseContentFields[] }) => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProps>();

  const animation = useRef(new Animated.Value(1)).current; // Initial scale value of 1

  const color = colors.purple90;

  const handlePressIn = () => {
    Animated.spring(animation, {
      toValue: 0.8, // Scale down to 90%
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(animation, {
      toValue: 1, // Scale back to original size
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <BlurView
      style={{
        position: "absolute",
        bottom: 100,
        overflow: "hidden",
        padding: 15,
        paddingHorizontal: 0,
        paddingBottom: 0,
        backgroundColor: theme.theme === "light" ? "#DFDCFB" : "#050129",
        display: "flex",
        alignSelf: "center",
        opacity: 0.97,
        borderRadius: 15,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        width: "97%",
        borderWidth: 1,
        borderColor: theme.medBackground,
        // shadow
      }}
      intensity={75} // You can adjust the intensity of the blur
      tint={theme.theme}
      // colors={
      //   theme.theme === "dark"
      //     ? [colors.back, colors.primary, colors.pink70]
      //     : [colors.pink70, colors.primary, colors.pink70]
      // }
      // start={{ x: 0, y: 0 }}
      // end={{ x: 1, y: 0 }}
    >
      <TouchableOpacity
        onPress={() => {
          // just go to the first content
          navigation.navigate("CarMode", {
            contentId: content[0]?.id || "",
            isCarMode: true,
          });
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{
          paddingHorizontal: 10,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          flexDirection: "row",
        }}
        activeOpacity={1}
      >
        <Image
          source={{
            uri: "https://firebasestorage.googleapis.com/v0/b/learning-dev-ai.appspot.com/o/uploads%2Fpm.png?alt=media&token=3581d334-5f19-4ecc-a465-f7628b678a50",
          }}
          style={{ width: 40, height: 40, borderRadius: 10 }}
        />

        <View
          style={{
            marginLeft: 10,
            flex: 1,
            alignItems: "flex-start",
          }}
        >
          <Text
            style={{
              flex: 1,
              color: theme.header,
              fontFamily: "Raleway-SemiBold",
              textAlign: "center",
              fontSize: 16,
            }}
            numberOfLines={1}
          >
            Social game: how to win and influencer
          </Text>

          <View
            style={{
              display: "flex",
              marginTop: 5,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <FontAwesomeIcon
              icon={faHeadphonesAlt}
              color={theme.text}
              size={12}
              style={{ marginRight: 5 }}
            />

            <Text
              style={{
                color: theme.text,
                fontFamily: "Raleway-Medium",
                textAlign: "center",
                fontSize: 14,
              }}
              numberOfLines={1}
            >
              2min left
            </Text>
          </View>
        </View>

        <Animated.View
          style={{
            marginLeft: 15,
            width: 40,
            height: 40,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 100,
            backgroundColor: colors.primary,
            alignSelf: "center",
            transform: [{ scale: animation }],
          }}
        >
          <FontAwesomeIcon
            icon={faPlay}
            color={colors.white}
            size={18}
            style={{ position: "relative", right: -2 }}
          />
        </Animated.View>
      </TouchableOpacity>

      {/* make a progress bar */}
      <View
        style={{
          width: "100%",
          height: 4,
          marginBottom: 0,
          marginHorizontal: 5,
          alignSelf: "center",
          backgroundColor: theme.background,
          borderRadius: 10,
          marginTop: 10,
          overflow: "hidden",
        }}
      >
        <LinearGradient
          colors={[colors.primary, colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            width: "30%",
            height: 4,
            borderTopRightRadius: 10,
            borderBottomRightRadius: 10,
          }}
        />
      </View>
    </BlurView>
  );
};

export default Home;

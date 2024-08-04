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
import { api, apolloClient } from "src/api";
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
import { CurrentAudio } from "./CurrentAudio";

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
    apolloClient.refetchQueries({
      include: [api.content.current],
    });
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

export default Home;

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
import React, { useMemo, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "src/hooks";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import { api, apolloClient } from "src/api";
import {
  ContentFeedFilter,
  Mutation,
  Query,
  QueryGetContentFeedArgs,
} from "src/api/generated/types";
import { NavigationProps } from "src/navigation";
import { BaseContentFields } from "src/api/fragments";
import { colors } from "src/components";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowRight, faPlay } from "@fortawesome/pro-solid-svg-icons";
import { Impressions } from "./Github";
import { ContentRow } from "../../../components/Content/ContentRow";
import { CurrentAudio } from "../../../components/CurrentAudio";
import { useDispatch, useSelector } from "react-redux";
import { getHomeFilter, setHomeFilter } from "src/redux/reducers/globalState";
import * as Haptics from "expo-haptics";

const Home = () => {
  const navigation = useNavigation<NavigationProps>();
  const theme = useTheme();
  const filter = useSelector(getHomeFilter);

  const [showMore] = useMutation(api.content.showMore);

  const variables = useMemo(
    (): QueryGetContentFeedArgs => ({
      filter: filter,
      limit: 10,
    }),
    [filter]
  );

  const { data, refetch, error } = useQuery<Pick<Query, "getContentFeed">>(
    api.content.feed,
    {
      variables,
      fetchPolicy: "cache-and-network",
    }
  );

  const onShowMorePress = async () => {
    await showMore();
  };

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
        ListFooterComponent={
          // Show more
          <TouchableOpacity
            style={{
              padding: 10,
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
            activeOpacity={0.8}
            onPress={onShowMorePress}
          >
            <Text
              style={{
                color: colors.primary,
                fontFamily: "Raleway-Bold",
                fontSize: 16,
                textAlign: "center",
                padding: 10,
              }}
            >
              Show more 👀
            </Text>
            {/* <FontAwesomeIcon icon={faArrowRight} size={16} color={theme.text} /> */}
          </TouchableOpacity>
        }
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
  const filter = useSelector(getHomeFilter);
  const animation = useRef(new Animated.Value(1)).current; // Initial scale value of 1

  const dispatch = useDispatch();
  const navigation = useNavigation<NavigationProps>();
  const [startListening] = useMutation<Pick<Mutation, "startListening">>(
    api.content.startListening
  );

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

  const onPress = async (feed: ContentFeedFilter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    dispatch(setHomeFilter(feed));
  };

  const onStartListening = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const { data } = await startListening({
      variables: {
        contentId: null,
      },
    });

    const session = data?.startListening;

    if (!session) {
      Alert.alert("Error", "Failed to start listening");
      return;
    }

    navigation.navigate("AudioPlayer", {
      contentId: session.contentId,
    });
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
          onPress={() => onPress(ContentFeedFilter.ForYou)}
          isActive={filter === ContentFeedFilter.ForYou}
          label="For you"
        />

        {/* <SingleFilter
          onPress={() => onPress(ContentFeedFilter.Popular)}
          isActive={filter === ContentFeedFilter.Popular}
          label="Popular"
        /> */}

        {/* <SingleFilter
          onPress={() => onPress(ContentFeedFilter.Queue)}
          isActive={filter === ContentFeedFilter.Queue}
          label="Queue"
        /> */}
      </View>

      {/* <Animated.View
        style={{
          marginRight: 10,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 100,
          backgroundColor: colors.primary,
          alignSelf: "center",
          transform: [{ scale: animation }],
        }}
      >
        <TouchableOpacity
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={onStartListening}
          activeOpacity={1}
          style={{
            display: "flex",
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            // padding: 5,
            height: 35,
            width: 35,
            borderRadius: 100,
          }}
        >

          <FontAwesomeIcon
            icon={faPlay}
            color={colors.white}
            size={16}
            style={{ position: "relative", right: -1 }}
          />
        </TouchableOpacity>
      </Animated.View> */}
    </View>
  );
};

export default Home;

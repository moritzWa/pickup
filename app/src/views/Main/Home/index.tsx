import { useMutation, useQuery } from "@apollo/client";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  RefreshControl,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { api, apolloClient } from "src/api";
import { BaseContentFields } from "src/api/fragments";
import {
  ContentFeedFilter,
  GetQueueResponse,
  Mutation,
  MutationSetCommuteTimeArgs,
  Query,
  QueryGetFeedArgs,
} from "src/api/generated/types";
import { colors } from "src/components";
import { useMe, useTheme } from "src/hooks";
import { NavigationProps } from "src/navigation";
import { setHomeFilter } from "src/redux/reducers/globalState";
import { ReduxState } from "src/redux/types";
import { ContentRow } from "../../../components/Content/ContentRow";
import { CurrentAudio } from "../../../components/CurrentAudio";
import { useAudio } from "src/hooks/useAudio";
import { setCurrentContent } from "src/redux/reducers/audio";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faCar } from "@fortawesome/pro-solid-svg-icons";
import { LinearGradient } from "expo-linear-gradient";
import DatePicker from "react-native-date-picker";
import moment from "moment";
import { hasValue } from "src/core";

const Home = () => {
  const theme = useTheme();
  // const filter = useSelector(getHomeFilter, shallowEqual);
  const filter = useSelector((state: ReduxState) => state.global.homeFilter);

  const [showMore] = useMutation(api.content.showMore);
  const { downloadAndPlayContent, toggle } = useAudio();
  const dispatch = useDispatch();
  const navigation = useNavigation<NavigationProps>();

  const variables = useMemo(
    (): QueryGetFeedArgs => ({
      filter: ContentFeedFilter.ForYou,
      limit: 100,
    }),
    []
  );

  const { data, refetch, error } = useQuery<Pick<Query, "getFeed">>(
    api.content.feed,
    {
      variables,
      fetchPolicy: "cache-and-network",
    }
  );

  const { data: queueData, refetch: refetchQueue } = useQuery<
    Pick<Query, "getQueue">
  >(api.queue.list, {
    variables,
    fetchPolicy: "cache-and-network",
  });

  const onShowMorePress = async () => {
    await showMore();
  };

  const content = useMemo((): BaseContentFields[] => {
    if (filter === ContentFeedFilter.Queue) {
      return (queueData?.getQueue?.queue ?? [])
        .map((q) => q.content as BaseContentFields)
        .filter(hasValue);
    }

    return (data?.getFeed ?? []) as BaseContentFields[];
  }, [data, filter]);

  const onPressContent = async (content: BaseContentFields) => {
    navigation.navigate("AudioPlayer", {
      contentId: content.id,
    });
  };

  const onPlayContent = async (content: BaseContentFields) => {
    // alert("play");
    await downloadAndPlayContent(content);
    dispatch(setCurrentContent(content));
  };

  const onTogglePlayOrPause = async (content: BaseContentFields) => {
    // alert("toggle");
    await toggle();
    dispatch(setCurrentContent(content));
  };

  const onRefresh = async () => {
    await refetch();
    apolloClient.refetchQueries({
      include: [api.content.current, api.users.me, api.queue.list],
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
          // padding: 10,
          // paddingTop: 15,
          paddingBottom: 150,
        }}
        ListHeaderComponent={<HomeHeader />}
        renderItem={({ item: c }) => (
          <ContentRow
            onPlay={() => onPlayContent(c)}
            togglePlayOrPause={() => onTogglePlayOrPause(c)}
            onPress={() => onPressContent(c)}
            content={c}
          />
        )}
        ListFooterComponent={
          // Show more
          <TouchableOpacity
            style={{
              padding: 5,
              margin: 15,
              borderRadius: 15,
              backgroundColor: theme.secondaryBackground,
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

      {/* <CurrentAudio content={content} /> */}
    </SafeAreaView>
  );
};

const HomeHeader = () => {
  const theme = useTheme();

  const { me } = useMe();
  const [open, setOpen] = useState(false);
  const [setCommuteTime] = useMutation(api.users.setCommuteTime);

  const onConfirm = async (date: Date) => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const time = moment(date).format("HH:mm");

      const variables: MutationSetCommuteTimeArgs = {
        timezone,
        commuteTime: time,
      };

      const response = await setCommuteTime({
        variables,
        refetchQueries: [api.users.me],
      });

      setOpen(false);
      // Alert.alert("Success", "Commute time set successfully");
    } catch (err) {
      console.log(JSON.stringify(err, null, 2));
    }
  };

  const commuteTime = useMemo(() => {
    if (me?.commuteTime) {
      return {
        formatted: moment(me.commuteTime, "HH:mm").format("h:mm A"),
        time: moment(me.commuteTime, "HH:mm").toDate(),
      };
    }
    return null;
  }, [me]);

  if (!!me?.commuteTime) {
    return null;
  }

  return (
    <>
      <DatePicker
        modal
        open={open}
        date={commuteTime?.time ?? new Date()}
        mode="time"
        onConfirm={onConfirm}
        onCancel={() => {
          setOpen(false);
        }}
      />

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          setOpen(true);
        }}
      >
        <LinearGradient
          colors={[colors.purple70, colors.primary]}
          start={[0, 0]}
          end={[1, 1]}
          style={{
            marginTop: 5,
            padding: 10,
            paddingHorizontal: 15,
            borderRadius: 0,
            marginHorizontal: 0,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 50,
              height: 50,
              backgroundColor: colors.white,
              borderRadius: 100,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FontAwesomeIcon icon={faCar} size={24} color={colors.purple70} />
          </View>

          <View style={{ marginLeft: 10, flex: 1 }}>
            {commuteTime ? (
              <Text
                style={{
                  color: colors.white,
                  fontFamily: "Raleway-Bold",
                  fontSize: 16,
                  marginBottom: 0,
                }}
              >
                Commute save {commuteTime}.
              </Text>
            ) : (
              <>
                <Text
                  style={{
                    color: colors.white,
                    fontFamily: "Raleway-Bold",
                    fontSize: 16,
                    marginBottom: 0,
                  }}
                >
                  Do you commute to work?
                </Text>
                <Text
                  style={{
                    color: colors.white,
                    fontFamily: "Raleway-Regular",
                    fontSize: 14,
                    marginTop: 5,
                  }}
                >
                  If so, let us know and we'll have content ready to go.
                </Text>
              </>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </>
  );
};

const SingleFilter = ({
  label,
  onPress,
  isActive,
  count,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
  count?: number;
}) => {
  const theme = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={{
        flexDirection: "row",
        display: "flex",
        alignItems: "center",
        padding: 10,
      }}
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

      {count ? (
        <View
          style={{
            backgroundColor: colors.primary,
            borderRadius: 100,
            width: 20,
            position: "relative",
            top: 1,
            height: 20,
            marginLeft: 7,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: colors.white,
              fontFamily: "sans-serif",
              fontSize: 12,
              fontWeight: "900",
              position: "relative",
              top: 0,
            }}
          >
            {count}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

export enum DiscoveryTab {
  All = "all",
  Unread = "unread",
  Popular = "popular",
}

const Options = () => {
  const filter = useSelector((state: ReduxState) => state.global.homeFilter);
  const animation = useRef(new Animated.Value(1)).current; // Initial scale value of 1

  const [open, setOpen] = useState(false);
  const { me } = useMe();

  const theme = useTheme();
  const dispatch = useDispatch();
  const navigation = useNavigation<NavigationProps>();

  const [startListening] = useMutation<Pick<Mutation, "startListening">>(
    api.content.startListening
  );
  const [setCommuteTime] = useMutation(api.users.setCommuteTime);

  const { data: queueData, refetch: refetchQueue } = useQuery<
    Pick<Query, "getQueue">
  >(api.queue.list, {
    variables: {},
    fetchPolicy: "cache-and-network",
  });

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

  const onConfirm = async (date: Date) => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const time = moment(date).format("HH:mm");

      const variables: MutationSetCommuteTimeArgs = {
        timezone,
        commuteTime: time,
      };

      const response = await setCommuteTime({
        variables,
        refetchQueries: [api.users.me],
      });

      setOpen(false);
      // Alert.alert("Success", "Commute time set successfully");
    } catch (err) {
      console.log(JSON.stringify(err, null, 2));
    }
  };

  const commuteTime = useMemo(() => {
    if (me?.commuteTime) {
      return {
        formatted: moment(me.commuteTime, "HH:mm").format("h:mm A"),
        time: moment(me.commuteTime, "HH:mm").toDate(),
      };
    }
    return null;
  }, [me]);

  const queueCount = queueData?.getQueue?.total ?? 0;

  return (
    <>
      {commuteTime ? (
        <DatePicker
          modal
          open={open}
          date={commuteTime?.time ?? new Date()}
          mode="time"
          onConfirm={onConfirm}
          onCancel={() => {
            setOpen(false);
          }}
        />
      ) : null}

      <View
        style={{
          paddingHorizontal: 10,
          paddingBottom: 5,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <View
          style={{
            flex: 1,
            // paddingHorizontal: 5,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <SingleFilter
            onPress={() => onPress(ContentFeedFilter.ForYou)}
            isActive={filter === ContentFeedFilter.ForYou}
            label="Feed"
          />

          {/* <SingleFilter
          onPress={() => onPress(ContentFeedFilter.Popular)}
          isActive={filter === ContentFeedFilter.Popular}
          label="Popular"
        /> */}

          <SingleFilter
            onPress={() => onPress(ContentFeedFilter.Queue)}
            isActive={filter === ContentFeedFilter.Queue}
            label="Queue"
            count={queueCount}
          />

          {/* <SingleFilter
            onPress={() => onPress(ContentFeedFilter.Archived)}
            isActive={filter === ContentFeedFilter.Archived}
            label="Archived"
          /> */}
        </View>

        {commuteTime ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setOpen(true)}
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              borderRadius: 100,
              marginRight: 10,
              paddingVertical: 7,
              padding: 10,
              backgroundColor: theme.bgPrimary,
            }}
          >
            <FontAwesomeIcon
              style={{ marginRight: 5 }}
              icon={faCar}
              size={16}
              color={colors.primary}
            />
            <Text
              style={{
                color: colors.primary,
                fontFamily: "Raleway-Bold",
                fontSize: 16,
              }}
            >
              {commuteTime.formatted}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </>
  );
};

export default Home;

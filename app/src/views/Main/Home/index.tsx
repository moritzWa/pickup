import { useMutation, useQuery } from "@apollo/client";
import {
  faCar,
  faPlus,
  faSatelliteDish,
  faUserPlus,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useNavigation } from "@react-navigation/native";
import { AppContext } from "context";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { throttle, uniqBy } from "lodash";
import moment from "moment";
import React, { useContext, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  RefreshControl,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DatePicker from "react-native-date-picker";
import { useDispatch, useSelector } from "react-redux";
import { api, apolloClient } from "src/api";
import { BaseContentFields } from "src/api/fragments";
import {
  ContentFeedFilter,
  Mutation,
  MutationSetCommuteTimeArgs,
  Query,
  QueryGetFeedArgs,
} from "src/api/generated/types";
import { colors } from "src/components";
import ProfileIcon from "src/components/ProfileIcon";
import { useMe, useTheme } from "src/hooks";
import { ProfileService } from "src/modules/profileService";
import { NavigationProps } from "src/navigation";
import { setCurrentContent } from "src/redux/reducers/audio";
import { setHomeFilter } from "src/redux/reducers/globalState";
import { ReduxState } from "src/redux/types";
import { ContentRow } from "../../../components/Content/ContentRow";

const LIMIT = 10;

const Home = () => {
  const theme = useTheme();
  // const filter = useSelector(getHomeFilter, shallowEqual);
  const filter = useSelector((state: ReduxState) => state.global.homeFilter);

  const { startPlayingContent, toggle } = useContext(AppContext).audio!;
  const dispatch = useDispatch();
  const navigation = useNavigation<NavigationProps>();

  const [list, setList] = useState<BaseContentFields[]>([]);
  const [page, setPage] = useState<number>(0);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [clear] = useMutation(api.queue.clear);

  const variables = useMemo(
    (): QueryGetFeedArgs => ({
      filter: filter,
      limit: LIMIT,
      page,
    }),
    [page, filter]
  );

  const { data, refetch, fetchMore, error, loading } = useQuery<
    {
      getFeed: BaseContentFields[];
    },
    QueryGetFeedArgs
  >(api.content.feed, {
    variables,
    fetchPolicy: "cache-and-network",
    onCompleted: (newData) => {
      const newItems = newData.getFeed ?? [];
      if (page === 0) {
        setList(newItems);
      } else {
        setList((prevList) => uniqBy([...prevList, ...newItems], (i) => i.id));
      }
      setHasMore(newItems.length === LIMIT); // Assume that if fewer items than the limit are returned, there's no more data
    },
  });

  // console.log(JSON.stringify(error, null, 2));

  const loadMoreData = throttle(() => {
    if (!loading && hasMore) {
      console.log(`[fetching page ${page + 1}]`);
      // console.log(`[total items: ${list.length}]`);

      fetchMore({
        variables: {
          page: page + 1,
          limit: LIMIT,
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) return previousResult;

          const newItems = fetchMoreResult.getFeed ?? [];
          setPage(page + 1);
          setList((prev) => uniqBy([...prev, ...newItems], (i) => i.id));

          if (newItems.length < LIMIT) {
            setHasMore(false);
          }

          return fetchMoreResult;
        },
      });
    }
  }, 300); // 300ms throttle to prevent rapid firing

  const content = useMemo((): BaseContentFields[] => {
    return uniqBy(data?.getFeed ?? [], (i) => i.id) as BaseContentFields[];
  }, [data]);

  const onPressContent = async (content: BaseContentFields) => {
    navigation.navigate("AudioPlayer", {
      contentId: content.id,
    });
  };

  const onPlayContent = async (content: BaseContentFields) => {
    // alert("play");
    await startPlayingContent(content);
  };

  const onTogglePlayOrPause = async (content: BaseContentFields) => {
    // alert("toggle");
    await toggle();
    dispatch(setCurrentContent(content));
  };

  const clearQueue = async () => {
    await clear({
      refetchQueries: [api.queue.list, api.content.feed],
    });
  };

  const onPressTab = async () => {
    try {
      setPage(0);
      setHasMore(true);
      await refetch({
        page: 0,
        limit: LIMIT,
        filter,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const onPressMore = async () => {
    try {
      setPage(0);
      setHasMore(true);
      await refetch({
        page: 0,
        limit: LIMIT,
        filter,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      setPage(0);
      setHasMore(true);
      await refetch({
        page: 0,
        limit: LIMIT,
        filter,
      });
      apolloClient.refetchQueries({ include: [api.users.friends] });
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={{ padding: 10 }}>
        <ActivityIndicator size="large" />
      </View>
    );
  };

  console.log(filter, list.length);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View
        style={{
          alignItems: "center",
        }}
      >
        <Options onPressMore={onPressMore} onPressTab={onPressTab} />
      </View>

      <FlatList
        extraData={filter}
        data={list}
        refreshControl={
          <RefreshControl
            tintColor={theme.activityIndicator}
            refreshing={isRefreshing}
            onRefresh={onRefresh}
          />
        }
        keyExtractor={(c) => c.id}
        // hide scrollbar
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          // padding: 10,
          paddingTop: 10,
          paddingBottom: 150,
        }}
        ListHeaderComponent={
          <>
            <HomeHeader />
            {filter === ContentFeedFilter.Queue ? (
              <View
                style={{
                  marginTop: 10,
                  marginBottom: 10,
                  marginHorizontal: 20,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                {content.length > 0 ? (
                  <Text
                    style={{
                      flex: 1,
                      color: theme.header,
                      fontFamily: "Inter-Bold",
                      fontSize: 24,
                      textAlign: "left",
                    }}
                  >
                    Next up...
                  </Text>
                ) : (
                  <Text
                    style={{
                      flex: 1,
                      paddingVertical: 25,
                      color: theme.header,
                      fontFamily: "Inter-Bold",
                      fontSize: 24,
                      textAlign: "left",
                    }}
                  >
                    Queue is empty.
                  </Text>
                )}
                {content.length > 0 ? (
                  <TouchableOpacity activeOpacity={0.9} onPress={clearQueue}>
                    <Text
                      style={{
                        color: theme.text,
                        fontFamily: "Inter-Bold",
                        fontSize: 16,
                        textAlign: "center",
                        padding: 10,
                      }}
                    >
                      Clear Queue
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}

            <FriendsScroller />
          </>
        }
        renderItem={({ item: c }) => (
          <ContentRow
            onPlay={() => onPlayContent(c)}
            togglePlayOrPause={() => onTogglePlayOrPause(c)}
            onPress={() => onPressContent(c)}
            content={c}
            filter={filter}
          />
        )}
        // ListFooterComponent={
        //   // Show more
        //   filter === ContentFeedFilter.ForYou ? (
        //     <TouchableOpacity
        //       style={{
        //         padding: 5,
        //         margin: 15,
        //         borderRadius: 15,
        //         backgroundColor: theme.secondaryBackground,
        //         flexDirection: "row",
        //         justifyContent: "center",
        //         alignItems: "center",
        //       }}
        //       activeOpacity={0.8}
        //       onPress={onShowMorePress}
        //     >
        //       <Text
        //         style={{
        //           color: colors.primary,
        //           fontFamily: "Inter-Bold",
        //           fontSize: 16,
        //           textAlign: "center",
        //           padding: 10,
        //         }}
        //       >
        //         Show more 👀
        //       </Text>
        //       {/* <FontAwesomeIcon icon={faArrowRight} size={16} color={theme.text} /> */}
        //     </TouchableOpacity>
        //   ) : null
        // }
        onEndReached={loadMoreData}
        onEndReachedThreshold={0.5} // Adjust this value based on when you want to trigger loading more data
        ListFooterComponent={
          hasMore ? (
            renderFooter()
          ) : list.length > LIMIT ? (
            <Text
              style={{
                textAlign: "center",
                padding: 10,
                color: theme.text,
                fontFamily: "Inter-Regular",
                fontSize: 16,
              }}
            >
              No more data
            </Text>
          ) : null
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

  return null;

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
                  fontFamily: "Inter-Bold",
                  fontSize: 16,
                  marginBottom: 0,
                }}
              >
                Commute save {commuteTime?.formatted}.
              </Text>
            ) : (
              <>
                <Text
                  style={{
                    color: colors.white,
                    fontFamily: "Inter-Bold",
                    fontSize: 16,
                    marginBottom: 0,
                  }}
                >
                  Do you commute to work?
                </Text>
                <Text
                  style={{
                    color: colors.white,
                    fontFamily: "Inter-Regular",
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
      activeOpacity={1}
      style={{
        flexDirection: "row",
        display: "flex",
        alignItems: "center",
        padding: 7,
        paddingHorizontal: 10,
        backgroundColor: isActive ? theme.secondaryBackground : "transparent",
        marginRight: 3,
        borderRadius: 100,
      }}
    >
      <Text
        style={{
          color: isActive ? theme.header : theme.text,
          fontFamily: "Inter-Medium",
          fontSize: 16,
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

const Options = ({
  onPressMore,
  onPressTab,
}: {
  onPressMore: () => void;
  onPressTab: () => void;
}) => {
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
  const [showMore, { loading: loadingShowMore }] = useMutation(
    api.content.showMore
  );
  const [createContentFromUrl] = useMutation(api.content.createFromUrl);

  const { data: queueData, refetch: refetchQueue } = useQuery<
    Pick<Query, "getQueue">
  >(api.queue.list, {
    variables: {},
    fetchPolicy: "cache-and-network",
  });

  const onPress = async (feed: ContentFeedFilter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    dispatch(setHomeFilter(feed));

    onPressTab();
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

  const _onPressMore = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    await showMore({});

    onPressMore();
  };

  const onOpenFriends = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    navigation.navigate("Friends");
  };

  const onAddContentFromUrl = () => {
    Alert.prompt(
      "Add Content",
      "Enter the URL of the content you want to add:",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Add",
          onPress: async (url) => {
            if (url) {
              try {
                const { data } = await createContentFromUrl({
                  variables: { url },
                  refetchQueries: [api.content.feed, api.queue.list],
                });
                if (data) {
                  Alert.alert("Success", "Content added to queue");
                }
              } catch (error) {
                Alert.alert("Error", "Failed to add content");
              }
            }
          },
        },
      ],
      "plain-text"
    );
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
          width: "100%",
        }}
      >
        <View
          style={{
            flex: 3,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start",
          }}
        >
          <SingleFilter
            onPress={() => {
              onPress(ContentFeedFilter.ForYou);
            }}
            isActive={filter === ContentFeedFilter.ForYou}
            label="For you"
          />

          <SingleFilter
            onPress={() => {
              onPress(ContentFeedFilter.New);
            }}
            isActive={filter === ContentFeedFilter.New}
            label="New"
          />

          <SingleFilter
            onPress={() => {
              onPress(ContentFeedFilter.Friends);
            }}
            isActive={filter === ContentFeedFilter.Friends}
            label="Friends"
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
            count={queueCount}
          /> */}

          {/* <SingleFilter
            onPress={() => onPress(ContentFeedFilter.Archived)}
            isActive={filter === ContentFeedFilter.Archived}
            label="Archived"
          /> */}
        </View>

        <View
          style={{
            flex: 2,
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
          }}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onOpenFriends}
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              borderRadius: 100,
              height: 35,
              // paddingVertical: 7,
              paddingHorizontal: 12,
              backgroundColor: colors.primary,
            }}
          >
            <FontAwesomeIcon
              style={{ position: "relative", right: -2 }}
              icon={faUserPlus}
              size={18}
              color={colors.white}
            />
            <Text
              style={{
                marginLeft: 5,
                color: colors.white,
                fontFamily: "Inter-Medium",
                fontSize: 16,
              }}
            >
              Friends
            </Text>
          </TouchableOpacity>

          {/* <TouchableOpacity
            activeOpacity={0.9}
            onPress={onAddContentFromUrl}
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              borderRadius: 100,
              padding: 7,
              backgroundColor: theme.secondaryBackground,
            }}
          >
            <FontAwesomeIcon
              // style={{ marginRight: 5 }}
              icon={faPlus}
              size={18}
              color={theme.text}
            />
            
          </TouchableOpacity> */}

          {/* <TouchableOpacity
            activeOpacity={0.9}
            onPress={_onPressMore}
            disabled={loadingShowMore}
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              borderRadius: 100,
              justifyContent: "center",
              width: 35,
              height: 35,
              marginLeft: 5,
              backgroundColor: theme.bgPrimaryLight,
            }}
          >
            <FontAwesomeIcon
              // style={{ marginRight: 5 }}
              icon={faSatelliteDish}
              size={16}
              color={theme.header}
            />
          </TouchableOpacity> */}
        </View>
      </View>
    </>
  );
};

const FriendsScroller = () => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProps>();

  const { data, error } = useQuery<Pick<Query, "getFriends">>(
    api.users.friends
  );

  const onPressUsername = (username: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    navigation.navigate("UserProfile", {
      username,
    });
  };

  const friends = data?.getFriends ?? [];

  if (!friends.length) {
    return null;
  }

  return (
    <View
      style={{
        paddingLeft: 10,
        paddingVertical: 10,
        marginHorizontal: 10,
        borderRadius: 15,
        marginBottom: 25,
        backgroundColor: theme.secondaryBackground,
      }}
    >
      <View style={{ padding: 0, marginBottom: 10 }}>
        <Text
          style={{
            color: theme.header,
            fontFamily: "Inter-Bold",
            fontSize: 12,
            marginBottom: 0,
            textTransform: "uppercase",
          }}
        >
          Your Friends
        </Text>
      </View>

      <FlatList
        horizontal
        style={
          {
            // backgroundColor: "red",
            // borderTopWidth: 1,
            // borderColor: theme.border,
            // borderBottomWidth: 1,
          }
        }
        data={friends}
        renderItem={({ item: f }) => (
          <ProfileIcon
            style={{
              marginRight: 10,
              // borderWidth: 2,
              // borderColor: theme.border,
            }}
            size={50}
            onPress={() => onPressUsername(f.profile.username || "")}
            profileImageUrl={f.profile.avatarImageUrl}
            textStyle={{ fontSize: 18 }}
            initials={ProfileService.getInitials(
              f.profile.name,
              f.profile.username
            )}
          />
        )}
      />
    </View>
  );
};

export default Home;

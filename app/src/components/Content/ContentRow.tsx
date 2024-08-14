import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  RefreshControl,
  Alert,
  Animated,
  Image,
} from "react-native";
import React, { useEffect, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "src/hooks";
import { useMutation, useQuery } from "@apollo/client";
import { api } from "src/api";
import {
  ContentFeedFilter,
  Mutation,
  MutationAddToQueueArgs,
  MutationArchiveContentArgs,
  MutationRemoveFromQueueArgs,
  Query,
} from "src/api/generated/types";
import { NavigationProps } from "src/navigation";
import { BaseContentFields } from "src/api/fragments";
import { colors } from "src/components";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faArchive,
  faArrowRight,
  faCircle,
  faCircle0,
  faCircleNotch,
  faClock,
  faHeadSide,
  faHourglass,
  faHourglass1,
  faHourglass3,
  faHourglassClock,
  faPause,
  faPerson,
  faPlay,
  faPodcast,
  faTypewriter,
  faVolumeMedium,
} from "@fortawesome/pro-solid-svg-icons";
import { Impressions } from "../../views/Main/Home/Github";
import FastImage from "react-native-fast-image";
import { useSelector } from "react-redux";
import {
  getCurrentContent,
  getIsPlaying,
  getQueue,
  getQueueContentIdSet,
} from "src/redux/reducers/audio";
import { noop } from "lodash";
import { Swipeable } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";

export const ContentRow = ({
  content: c,
  onPress,
  onPlay,
  togglePlayOrPause,
  filter,
}: {
  content: BaseContentFields;
  onPress: () => void;
  onPlay: () => void;
  togglePlayOrPause: () => void;
  filter?: ContentFeedFilter;
}) => {
  const navigation = useNavigation<NavigationProps>();
  const theme = useTheme();

  const swipeableRef = useRef<Swipeable>(null);

  const [startContent, { error }] = useMutation(api.content.start);
  const animation = useRef(new Animated.Value(1)).current; // Initial scale value of 1

  const contentIds = useSelector(getQueueContentIdSet);
  const activeContent = useSelector(getCurrentContent);
  const isActive = activeContent?.id === c.id;
  const isPlaying = useSelector(getIsPlaying);
  const isQueued = contentIds.has(c.id);

  const [addToQueue] = useMutation<Pick<Mutation, "addToQueue">>(
    api.content.addToQueue
  );

  const [removeFromQueue] = useMutation<Pick<Mutation, "removeFromQueue">>(
    api.content.removeFromQueue
  );

  const [archiveContent] = useMutation<Pick<Mutation, "archiveContent">>(
    api.content.archive
  );

  const onArchiveContent = async () => {
    try {
      const variables: MutationArchiveContentArgs = {
        contentId: c.id,
      };

      await archiveContent({
        variables,
        refetchQueries: [
          api.content.addToQueue,
          api.queue.list,
          api.content.feed,
        ],
      });
    } catch (err) {
      console.log(err);
    }
  };

  const onAddOrRemoveContentToQueue = async () => {
    try {
      const variables: MutationAddToQueueArgs | MutationRemoveFromQueueArgs = {
        contentId: c.id,
      };

      if (isQueued) {
        const response = await removeFromQueue({
          variables,
          refetchQueries: [api.content.addToQueue, api.queue.list],
        });
        console.log("removed from queue");
      } else {
        await addToQueue({
          variables,
          refetchQueries: [api.content.addToQueue, api.queue.list],
        });
        console.log("added to queue");
      }
    } catch (err) {
      console.log(err);
    }
  };

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
      tension: 37,
      useNativeDriver: true,
    }).start();
  };

  const start = async () => {
    try {
      if (onPress) onPress();

      // navigation.navigate("AudioPlayer", {
      //   contentId: c.id,
      // });
    } catch (err) {
      console.log(err);
      Alert.alert(
        "Error",
        "There was an error starting the course. Please try again."
      );
    }
  };

  const playOrPause = async () => {
    if (isActive) {
      togglePlayOrPause();
    } else {
      onPlay();
    }
  };

  const renderRightActions = () => (
    <View
      style={{
        alignItems: "center",
        paddingHorizontal: 20,
        display: "flex",
        height: "100%",
        backgroundColor: isQueued ? theme.bgRed : theme.bgPrimary,
        flexDirection: "row",
      }}
    >
      <TouchableOpacity
        onPress={onAddOrRemoveContentToQueue}
        activeOpacity={0.9}
        style={{
          justifyContent: "center",
          alignItems: "center",
          display: "flex",
          flexDirection: "row",
          width: 75,
          height: 75,
          borderRadius: 50,
          marginTop: 10,
          marginBottom: 10,
        }}
      >
        {isQueued ? (
          <Image
            source={require("src/assets/icons/solid-list-circle-minus.png")}
            tintColor={colors.red50}
            resizeMode="contain"
            style={{
              width: 30,
              height: 30,
            }}
          />
        ) : (
          <Image
            source={require("src/assets/icons/solid-list-circle-plus.png")}
            tintColor={colors.primary}
            resizeMode="contain"
            style={{
              width: 30,
              height: 30,
            }}
          />
        )}
      </TouchableOpacity>
    </View>
  );

  const renderLeftActions = () => (
    <View
      style={{
        alignItems: "center",
        paddingHorizontal: 20,
        display: "flex",
        height: "100%",
        backgroundColor: theme.medBackground,
        flexDirection: "row",
      }}
    >
      <TouchableOpacity
        onPress={onArchiveContent}
        activeOpacity={0.9}
        style={{
          justifyContent: "center",
          alignItems: "center",
          display: "flex",
          flexDirection: "row",
          width: 75,
          height: 75,
          borderRadius: 50,
          marginTop: 10,
          marginBottom: 10,
        }}
      >
        <FontAwesomeIcon icon={faArchive} color={theme.text} size={24} />
      </TouchableOpacity>
    </View>
  );

  useEffect(() => {
    swipeableRef.current?.close();
  }, [filter]);

  const estimatedLen = Math.ceil(c.lengthSeconds / 60);

  return (
    <Swipeable
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      overshootRight={false}
      overshootLeft={false}
      ref={swipeableRef}
    >
      <View
        style={{
          padding: 20,
          borderRadius: 0,
          borderColor: isActive
            ? theme.bgPrimaryLight
            : theme.secondaryBackground,
          borderBottomWidth: 1,
          backgroundColor: isActive ? theme.bgPrimaryLight : theme.background,
          // shadow
          // shadowColor: "#000",
          // shadowOffset: {
          //   width: 0,
          //   height: 0,
          // },
          // shadowOpacity: 0.05,
          // shadowRadius: 4,
          // elevation: 5,
          // marginBottom: 15,
        }}
      >
        <View>
          <View
            style={{
              marginBottom: 10,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              flex: 1,
            }}
          >
            <ContentRowImage content={c} />

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={start}
              style={{
                marginLeft: 10,
                marginRight: 10,
                flex: 1,
                alignItems: "flex-start",
                justifyContent: "center",
              }}
            >
              <Text
                numberOfLines={2}
                style={{
                  color: isActive ? colors.primary : theme.header,
                  fontSize: 16,
                  // underline it if active
                  // textDecorationLine: isActive ? "underline" : "none",
                  // marginRight: 20,
                  fontFamily: "Raleway-SemiBold",
                }}
              >
                {c.title}
              </Text>
            </TouchableOpacity>

            <Animated.View
              style={{
                width: 37,
                height: 37,
                marginRight: 0,
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
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={playOrPause}
                activeOpacity={1}
              >
                <FontAwesomeIcon
                  icon={isActive && isPlaying ? faPause : faPlay}
                  color={colors.white}
                  size={16}
                  style={{
                    position: "relative",
                    right: isActive && isPlaying ? 0 : -1,
                  }}
                />
              </TouchableOpacity>
            </Animated.View>
          </View>

          <View style={{}}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: theme.text,
                    fontSize: 14,
                    // marginRight: 50,
                    fontFamily: "Raleway-Medium",
                  }}
                  numberOfLines={2}
                >
                  {c.summary}
                </Text>

                <View
                  style={{
                    marginTop: 15,
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  {/* <Text
                  style={{
                    flex: 1,
                    color: theme.text,
                    fontSize: 14,
                    fontFamily: "Raleway-Medium",
                  }}
                >
                  {c.authorName}
                </Text> */}

                  <View
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      marginRight: 30,
                      flex: 1,
                    }}
                  >
                    {/* <FontAwesomeIcon
                    icon={faHeadSide}
                    color={theme.text}
                    size={14}
                    style={{ marginRight: 5 }}
                  /> */}

                    <Text
                      style={{
                        color: theme.text,
                        fontSize: 14,
                        fontFamily: "Raleway-Medium",
                      }}
                    >
                      {c.authorName}
                    </Text>
                  </View>

                  <View
                    style={{
                      display: "flex",
                      marginLeft: 15,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faClock}
                      color={theme.textSecondary}
                      size={12}
                      style={{ marginRight: 5 }}
                    />

                    <Text
                      style={{
                        color: theme.textSecondary,
                        fontSize: 14,
                        fontFamily: "Raleway-Medium",
                      }}
                    >
                      {estimatedLen}m
                    </Text>
                  </View>

                  {c.contentSession?.percentFinished ? (
                    <View
                      style={{
                        display: "flex",
                        marginLeft: 15,
                        flexDirection: "row",
                        alignItems: "center",
                        // marginRight: 15,
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faCircleNotch}
                        color={theme.text}
                        size={14}
                        style={{ marginRight: 5 }}
                      />

                      <Text
                        style={{
                          color: theme.text,
                          fontSize: 14,
                          fontFamily: "Raleway-SemiBold",
                        }}
                      >
                        {c.contentSession?.percentFinished}%
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Swipeable>
  );
};

const ContentRowImage = ({ content: c }: { content: BaseContentFields }) => {
  const gradient = getGradientById(c.id);

  if (c.thumbnailImageUrl) {
    return (
      <FastImage
        source={{
          uri: c.thumbnailImageUrl,
        }}
        style={{
          width: 37,
          height: 37,
          borderRadius: 5,
        }}
      />
    );
  }

  return (
    <LinearGradient
      colors={gradient}
      style={{
        width: 37,
        height: 37,
        borderRadius: 5,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
      }}
      // start left -> right
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <FontAwesomeIcon icon={faPodcast} color={"white"} size={24} />
    </LinearGradient>
  );
};

function getGradientById(id: string) {
  function stringToNumber(id: string) {
    let num = 0;
    for (let i = 0; i < id.length; i++) {
      num += id.charCodeAt(i);
    }
    return num;
  }

  const gradients = [
    ["#FF5F6D", "#FFC371"], // Gradient 1
    ["#36D1DC", "#5B86E5"], // Gradient 2
    ["#FFAFBD", "#ffc3a0"], // Gradient 3
    ["#2193b0", "#6dd5ed"], // Gradient 4
    ["#cc2b5e", "#753a88"], // Gradient 5
    ["#ee9ca7", "#ffdde1"], // Gradient 6
    ["#bdc3c7", "#2c3e50"], // Gradient 7
    ["#e96443", "#904e95"], // Gradient 8
    ["#de6262", "#ffb88c"], // Gradient 9
    ["#f46b45", "#eea849"], // Gradient 10
    ["#a8ff78", "#78ffd6"], // Gradient 11
    ["#ff0844", "#ffb199"], // Gradient 12
    ["#96e6a1", "#d4fc79"], // Gradient 13
    ["#56ab2f", "#a8e063"], // Gradient 14
    ["#108dc7", "#ef8e38"], // Gradient 15
    ["#fc00ff", "#00dbde"], // Gradient 16
    ["#74ebd5", "#ACB6E5"], // Gradient 17
    ["#16A085", "#F4D03F"], // Gradient 18
    ["#7F00FF", "#E100FF"], // Gradient 19
    ["#ff7e5f", "#feb47b"], // Gradient 20
  ];

  // Use the id to pick a gradient, using modulo to wrap around if id exceeds array length
  const index = stringToNumber(id) % gradients.length;
  return gradients[index];
}

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
import React, { useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "src/hooks";
import { useMutation, useQuery } from "@apollo/client";
import { api } from "src/api";
import {
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

export const ContentRow = ({
  content: c,
  onPress,
  onPlay,
  togglePlayOrPause,
}: {
  content: BaseContentFields;
  onPress: () => void;
  onPlay: () => void;
  togglePlayOrPause: () => void;
}) => {
  const navigation = useNavigation<NavigationProps>();
  const theme = useTheme();

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
        await removeFromQueue({
          variables,
          refetchQueries: [api.content.addToQueue, api.queue.list],
        });
      } else {
        await addToQueue({
          variables,
          refetchQueries: [api.content.addToQueue, api.queue.list],
        });
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

  const estimatedLen = Math.ceil(c.lengthSeconds / 60);

  console.log(contentIds, c.id, isQueued);

  return (
    <Swipeable
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      overshootRight={false}
      overshootLeft={false}
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
            {c.thumbnailImageUrl ? (
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
            ) : null}

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

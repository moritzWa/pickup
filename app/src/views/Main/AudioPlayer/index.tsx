import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Animated,
  StyleSheet,
  Dimensions,
  Image,
  ScrollView,
} from "react-native";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import * as FileSystem from "expo-file-system";
import {
  AVPlaybackStatus,
  Audio,
  InterruptionModeAndroid,
  InterruptionModeIOS,
} from "expo-av";
import { useMe, useTheme } from "src/hooks";
import { Button, colors } from "src/components";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faBackward,
  faBackwardFast,
  faBackwardStep,
  faBookmark,
  faCaretLeft,
  faCaretRight,
  faChevronLeft,
  faChevronRight,
  faForward,
  faForwardStep,
  faHeadset,
  faHeart,
  faIslandTreePalm,
  faList,
  faPause,
  faPlay,
  faRedo,
  faReplyAll,
  faTree,
} from "@fortawesome/pro-solid-svg-icons";
import {
  RouteProp,
  useIsFocused,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { NavigationProps, RootStackParamList } from "src/navigation";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import {
  Mutation,
  Query,
  QueryGetContentArgs,
  QueryGetNextContentArgs,
  QueryGetPrevContentArgs,
} from "src/api/generated/types";
import { api, apolloClient } from "src/api";
import Back from "src/components/Back";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Voice from "@react-native-voice/voice";
import * as Speech from "expo-speech";
import { storage } from "src/utils/firebase";
import { noop } from "lodash";
import FastImage from "react-native-fast-image";
import Slider from "@react-native-community/slider";
import { useSpeech } from "./useSpeech";
import Close from "src/components/Close";
import { useAudio } from "src/hooks/useAudio";
import { AppContext } from "context";
import { Track } from "react-native-track-player";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { BaseContentFields } from "src/api/fragments";
import { useDispatch, useSelector } from "react-redux";
import {
  getCurrentContent,
  getQueue,
  setCurrentContent,
} from "src/redux/reducers/audio";
import { ContentRowImage } from "src/components/Content/ContentRow";
import { LinearGradient } from "expo-linear-gradient";

const SIZE = 65;

const AudioPlayer = () => {
  const route = useRoute<RouteProp<RootStackParamList, "AudioPlayer">>();
  const contentId = route.params?.contentId || "";

  const isFocused = useIsFocused();
  const animation = useRef(new Animated.Value(1)).current; // Initial scale value of 1

  const { width } = Dimensions.get("window");
  const navigation = useNavigation<NavigationProps>();
  const dispatch = useDispatch();

  const {
    startPlayingContent,
    setPosition,
    setSpeed,
    speed,
    toggle,
    currentMs,
    durationMs,
    isPlaying,
    audioUrl,
    skip,
  } = useContext(AppContext).audio!;

  const contentVariables = useMemo(
    (): QueryGetContentArgs => ({
      contentId,
    }),
    [contentId]
  );

  const [bookmark] = useMutation(api.content.bookmark);

  const {
    data: contentData,
    error,
    refetch: refetchContent,
  } = useQuery<Pick<Query, "getContent">>(api.content.get, {
    skip: !contentVariables.contentId,
    variables: contentVariables,
    fetchPolicy: "cache-and-network",
  });

  const theme = useTheme();
  const content = contentData?.getContent as BaseContentFields | null;
  const session = contentData?.getContent?.contentSession ?? null;
  const lengthFormatted = content?.lengthFormatted ?? null;

  const insets = useSafeAreaInsets();

  useEffect(() => void refetchContent(), [isFocused, contentId]);

  const bookmarkContent = async () => {
    try {
      const response = await bookmark({
        variables: {
          contentId: content?.id || "",
        },
        refetchQueries: [api.content.get, api.content.bookmarks],
      });

      const data = response.errors;
      // console.log(response.data);
      // console.log(JSON.stringify(data, null, 2));
    } catch (err) {
      console.log(JSON.stringify(err, null, 2));
    }
  };

  const playOrPause = async () => {
    if (!content) {
      return;
    }

    if (audioUrl !== content?.audioUrl) {
      const track: Track = {
        url: "",
        title: content?.title || "",
        artist: content?.authorName || "",
        artwork: content?.thumbnailImageUrl || "",
      };

      const response = await startPlayingContent(content);

      return;
    }

    await toggle();
  };

  const handlePressIn = () => {
    Animated.spring(animation, {
      toValue: 0.85, // Scale down to 90%
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

  const onSlidingComplete = async (value: number) => {
    await setPosition(value);
  };

  const { showActionSheetWithOptions } = useActionSheet();

  const setPlayerSpeed = () => {
    const options = ["1x", "1.25x", "1.5x", "2x", "2.5x", "3x", "Cancel"];

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: options.length - 1,
      },
      (selectedIndex?: number) => {
        // if last, cancel
        if (selectedIndex === options.length - 1) return;
        const val = options[selectedIndex];
        const speed = parseFloat(val.replace("x", ""));
        console.log("SPEED: " + speed);
        setSpeed(speed);
        return speed;
      }
    );
  };

  const formatTime = (timeMillis: number) => {
    const totalSeconds = Math.floor(timeMillis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  };

  const openQueue = () => {
    navigation.navigate("Queue");
  };

  useEffect(() => {
    dispatch(setCurrentContent(content));
  }, [content]);

  return (
    <LinearGradient
      colors={[colors.gray20, colors.black]}
      style={{
        flex: 1,
        // paddingBottom: insets.bottom + 15,
      }}
    >
      <ScrollView>
        <View
          style={{
            marginTop: 15,
            zIndex: 100,
          }}
        >
          <Close
            iconColor={colors.white}
            style={{
              backgroundColor: colors.gray30,
            }}
          />
        </View>

        <View
          style={{
            marginHorizontal: 15,
            marginTop: 10,
            alignItems: "center",
            // backgroundColor: "blue",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              // backgroundColor: theme.secondaryBackground,
              // borderRadius: 30,
              padding: 10,
            }}
          >
            {content ? (
              <ContentRowImage
                style={{
                  borderRadius: 10,
                }}
                size={175}
                content={content}
              />
            ) : null}
          </View>

          <View style={{ marginTop: 15 }}>
            <Text
              style={{
                color: colors.white,
                fontSize: 18,
                textAlign: "center",
                fontFamily: "Raleway-SemiBold",
              }}
              numberOfLines={2}
            >
              {content?.title}
            </Text>

            <Text
              style={{
                marginTop: 15,
                textAlign: "center",
                color: colors.gray50,
                fontSize: 16,
                marginHorizontal: 75,
                fontFamily: "Raleway-Medium",
              }}
              numberOfLines={1}
            >
              By {content?.authorName}
            </Text>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                if (!content) return;
                navigation.navigate("ContentDetails", {
                  content: content!,
                });
              }}
              style={{
                marginTop: 0,
              }}
            >
              <Text
                style={{
                  marginTop: 15,
                  textAlign: "center",
                  color: colors.white,
                  fontSize: 16,
                  fontFamily: "Raleway-Medium",
                }}
                ellipsizeMode="head"
                numberOfLines={2}
              >
                {content?.summary}.{" "}
                <Text
                  style={{
                    textAlign: "center",
                    color: colors.gray90,
                    fontSize: 16,
                    textDecorationLine: "underline",
                    fontFamily: "Raleway-Medium",
                  }}
                >
                  Read more.
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={{
            marginTop: 35,
            marginBottom: 10,
            maxWidth: 300,
            alignSelf: "center",
            display: "flex",
            paddingHorizontal: 25,
            width: "100%",
            alignItems: "center",
            justifyContent: "flex-start",
            flexDirection: "row",
          }}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            style={{
              padding: 25,
            }}
            onPress={() => skip(-15)}
          >
            <Image
              style={{
                width: SIZE / 2,
                height: SIZE / 2,
              }}
              tintColor={colors.white}
              resizeMode="contain"
              source={require("src/assets/icons/backward-15.png")}
            />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            {/* make a play button that is colors.pink and uses fontawesome */}
            <Animated.View
              style={{
                width: SIZE,
                height: SIZE,
                borderRadius: 100,
                backgroundColor: colors.secondaryPrimary,
                justifyContent: "center",
                alignItems: "center",
                alignSelf: "center",
                transform: [{ scale: animation }],
              }}
            >
              <TouchableOpacity
                style={{
                  width: SIZE,
                  height: SIZE,
                  borderRadius: 100,
                  backgroundColor: colors.white,
                  justifyContent: "center",
                  alignItems: "center",
                }}
                activeOpacity={1}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={playOrPause}
              >
                <FontAwesomeIcon
                  style={{
                    position: "relative",
                    right: isPlaying ? 0 : -3,
                  }}
                  icon={isPlaying ? faPause : faPlay}
                  color={colors.black}
                  size={SIZE / 2}
                />
              </TouchableOpacity>
            </Animated.View>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            style={{
              padding: 25,
            }}
            onPress={() => skip(15)}
          >
            <Image
              tintColor={colors.white}
              style={{
                width: SIZE / 2,
                height: SIZE / 2,
              }}
              resizeMode="contain"
              source={require("src/assets/icons/forward-15.png")}
            />
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.container,
            {
              marginBottom: 15,
            },
          ]}
        >
          <Slider
            style={{
              width: width * 1.75,
              alignSelf: "center",
              height: 35,
              transform: [{ scaleX: 0.5 }, { scaleY: 0.5 }],
            }}
            minimumValue={0}
            maximumValue={durationMs ?? 0}
            value={currentMs ?? 0}
            onSlidingComplete={onSlidingComplete}
            minimumTrackTintColor={colors.white}
            maximumTrackTintColor={colors.gray20}
            thumbTintColor={colors.white}
            // change the size of the thumb
          />

          <View
            style={{
              width: "87%",
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              marginHorizontal: 15,
            }}
          >
            <Text
              style={{
                color: colors.white,
                fontSize: 16,
                fontFamily: "Raleway-SemiBold",
              }}
            >
              {currentMs ? formatTime(currentMs) : "00:00"}
            </Text>

            <Text
              style={{
                color: colors.white,
                fontSize: 16,
                fontFamily: "Raleway-SemiBold",
              }}
            >
              {durationMs ? formatTime(durationMs) : "-"}
            </Text>
          </View>

          <View
            style={{
              marginTop: 25,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              width: "100%",
            }}
          >
            <View>
              <TouchableOpacity
                activeOpacity={0.9}
                style={{
                  padding: 10,
                  alignSelf: "flex-start",
                  marginLeft: 20,
                  marginBottom: 10,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 50,
                  // paddingRight: 15,
                  backgroundColor: session?.isBookmarked
                    ? colors.pink60
                    : "rgba(255, 255, 255, 0.1)",
                }}
                onPress={bookmarkContent}
              >
                <FontAwesomeIcon
                  icon={faHeart}
                  color={colors.white}
                  size={18}
                />

                {/* <Text
                  style={{
                    color: session?.isBookmarked ? colors.white : colors.white,
                    fontSize: 14,
                    fontFamily: "Raleway-Medium",
                    marginLeft: 5,
                  }}
                >
                  {session?.isBookmarked ? "Liked" : "Like"}
                </Text> */}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              style={{
                padding: 10,
                alignSelf: "flex-start",
                marginLeft: 10,
                marginBottom: 10,
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 50,
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              }}
              onPress={openQueue}
            >
              <FontAwesomeIcon icon={faList} color={colors.white} size={14} />

              <Text
                style={{
                  color: session?.isBookmarked ? colors.white : colors.white,
                  fontSize: 14,
                  fontFamily: "Raleway-Medium",
                  marginLeft: 5,
                }}
              >
                Queue
              </Text>
            </TouchableOpacity>

            <View style={{ flex: 1 }} />

            <TouchableOpacity
              activeOpacity={0.9}
              style={{
                padding: 10,
                width: 60,
                alignSelf: "flex-end",
                marginRight: 20,
                marginBottom: 10,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 50,
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              }}
              onPress={setPlayerSpeed}
            >
              <Text
                style={{
                  color: colors.white,
                  fontSize: 14,
                  fontFamily: "Raleway-Bold",
                }}
              >
                {speed}x
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <NextOrPrevButtons skip={skip} content={content ?? null} />

        <NextQueue content={content ?? null} />
      </ScrollView>
    </LinearGradient>
  );
};

const NextQueue = ({ content }: { content: BaseContentFields | null }) => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProps>();

  const currentContent = useSelector(getCurrentContent);
  const queue = useSelector(getQueue);

  // console.log("current: " + currentContent?.id);

  const nextContent = useMemo(() => {
    const currentIndex = queue.findIndex((q) => q.id === currentContent?.id);
    return queue[currentIndex + 1] ?? null;
  }, [queue, currentContent]);

  const { startPlayingContent } = useContext(AppContext).audio!;

  const [getNextContent] = useLazyQuery<Pick<Query, "getNextContent">>(
    api.content.next
  );

  const _onClickNext = async () => {
    try {
      if (!content) return;

      const variables: QueryGetNextContentArgs = {
        afterContentId: content.id,
      };

      const response = await getNextContent({
        variables,
      });

      // console.log(JSON.stringify(response.error, null, 2));

      const nextContentQueued = response.data?.getNextContent;

      if (!nextContentQueued?.content) {
        return;
      }

      // console.log(nextContentQueued);

      const nextContentId = nextContentQueued?.content?.id || "";

      console.log(`[starting ${nextContentQueued.content?.title}]`);

      // update the route params
      navigation.setParams({ contentId: nextContentId });

      startPlayingContent(nextContentQueued.content as BaseContentFields);
    } catch (err) {
      console.log(err);
    }
  };

  if (!nextContent) {
    return null;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={_onClickNext}
      style={{
        marginTop: 25,
        marginHorizontal: 20,
        padding: 10,
        borderRadius: 15,
        backgroundColor: theme.textPrimary,
      }}
    >
      <Text
        style={{
          color: theme.background,
          fontFamily: "Raleway-Black",
          fontSize: 12,
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        Up next...
      </Text>
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <ContentRowImage size={40} content={nextContent} />

        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text
            numberOfLines={1}
            style={{
              color: theme.background,
              fontFamily: "Raleway-Bold",
              fontSize: 16,
              marginBottom: 5,
            }}
          >
            {nextContent.title}
          </Text>

          <View
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-start",
            }}
          >
            <FontAwesomeIcon
              icon={faHeadset}
              style={{
                color: theme.secondaryBackground,
              }}
            />

            <Text
              style={{
                marginLeft: 5,
                color: theme.secondaryBackground,
                fontFamily: "Raleway-Regular",
                fontSize: 16,
              }}
            >
              {nextContent.lengthFormatted}
            </Text>
          </View>
        </View>

        <FontAwesomeIcon
          icon={faChevronRight}
          color={theme.background}
          size={18}
          style={{ marginRight: 5 }}
        />
      </View>
    </TouchableOpacity>
  );
};

const NextOrPrevButtons = ({
  content,
  skip,
}: {
  content: BaseContentFields | null;
  skip: (seconds: number) => void;
}) => {
  const { startPlayingContent } = useContext(AppContext).audio!;
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProps>();

  const [getNextContent] = useLazyQuery<Pick<Query, "getNextContent">>(
    api.content.next
  );

  const [getPrevContent] = useLazyQuery<Pick<Query, "getPrevContent">>(
    api.content.prev
  );

  const _onClickPrev = async () => {
    try {
      if (!content) return;

      const variables: QueryGetPrevContentArgs = {
        beforeContentId: content.id,
      };

      const response = await getPrevContent({
        variables,
      });

      const prevContentQueued = response.data?.getPrevContent;

      // console.log(prevContentQueued);

      if (!prevContentQueued?.content) {
        return;
      }

      const prevContentId = prevContentQueued?.content?.id || "";

      // update the route params
      navigation.setParams({ contentId: prevContentId });

      startPlayingContent(prevContentQueued.content as BaseContentFields);
    } catch (err) {
      console.log(err);
    }
  };

  const _onClickNext = async () => {
    try {
      if (!content) return;

      const variables: QueryGetNextContentArgs = {
        afterContentId: content.id,
      };

      const response = await getNextContent({
        variables,
      });

      // console.log(JSON.stringify(response.error, null, 2));

      const nextContentQueued = response.data?.getNextContent;

      if (!nextContentQueued?.content) {
        return;
      }

      // console.log(nextContentQueued);

      const nextContentId = nextContentQueued?.content?.id || "";

      console.log(`[starting ${nextContentQueued.content?.title}]`);

      // update the route params
      navigation.setParams({ contentId: nextContentId });

      startPlayingContent(nextContentQueued.content as BaseContentFields);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <View
      style={{
        display: "flex",
        flexDirection: "row",
        paddingHorizontal: 10,
        marginHorizontal: 10,
        // space between button
        justifyContent: "space-between",
      }}
    >
      <Button
        label="Previous"
        style={{
          flex: 1,
          marginRight: 5,
          backgroundColor: "rgba(255, 255, 255, 0.1)",
        }}
        onPress={_onClickPrev}
        activityColor={colors.white}
        labelStyle={{
          color: colors.white,
        }}
        iconPosition="left"
        icon={
          <FontAwesomeIcon
            icon={faBackwardStep}
            color={colors.white}
            size={18}
            style={{ position: "absolute", left: 15 }}
          />
        }
      />

      <Button
        label="Next"
        style={{
          flex: 1,
          marginLeft: 5,
          backgroundColor: "rgba(255, 255, 255, 0.1)",
        }}
        activityColor={colors.white}
        onPress={_onClickNext}
        iconPosition="right"
        labelStyle={{
          color: colors.white,
        }}
        icon={
          <FontAwesomeIcon
            icon={faForwardStep}
            color={colors.white}
            size={18}
            style={{ position: "absolute", right: 15 }}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
  },
  slider: {
    width: "90%",
    height: 40,
  },
  customThumb: {
    position: "absolute",
    top: 12,
    width: 40, // Adjust thumb size
    height: 40, // Adjust thumb size
    borderRadius: 20, // Make it circular
    justifyContent: "center",
    alignItems: "center",
  },
  innerThumb: {
    width: 20, // Inner thumb size
    height: 20, // Inner thumb size
    borderRadius: 10, // Make it circular
    backgroundColor: "#1EB1FC", // Thumb color
  },
});

export default AudioPlayer;

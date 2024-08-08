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
  faCaretLeft,
  faCaretRight,
  faChevronLeft,
  faForward,
  faIslandTreePalm,
  faPause,
  faPlay,
  faRedo,
  faReplyAll,
  faTree,
} from "@fortawesome/pro-solid-svg-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
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
import { AppContext } from "App";
import { Track } from "react-native-track-player";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { BaseContentFields } from "src/api/fragments";

const SIZE = 125;

const AudioPlayer = () => {
  const route = useRoute<RouteProp<RootStackParamList, "AudioPlayer">>();
  const contentId = route.params?.contentId || "";

  const animation = useRef(new Animated.Value(1)).current; // Initial scale value of 1

  const { width } = Dimensions.get("window");

  const {
    downloadAndPlay,
    setPosition,
    setSpeed,
    speed,
    toggle,
    currentMs,
    durationMs,
    isPlaying,
    audioUrl,
    skip,
  } = useAudio();

  const contentVariables = useMemo(
    (): QueryGetContentArgs => ({
      contentId,
    }),
    [contentId]
  );

  const { data: contentData, error } = useQuery<Pick<Query, "getContent">>(
    api.content.get,
    {
      skip: !contentVariables.contentId,
      variables: contentVariables,
    }
  );

  const theme = useTheme();
  const content = contentData?.getContent as BaseContentFields | null;
  const insets = useSafeAreaInsets();
  const estimatedLen = Math.ceil((durationMs || 0) / 60_000);

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

      const response = await downloadAndPlay(content.audioUrl, track);

      console.log(response);
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

  const listenForSpeech = async () => {
    try {
      Voice.onSpeechStart = () => {
        console.log("Speech started.");
      };

      Voice.onSpeechEnd = () => {
        console.log("Speech ended.");
      };

      Voice.onSpeechResults = (e) => {
        console.log("Speech results.");
        console.log(e);
        // console.log(e.value[0]);
      };

      await Voice.start("en-US");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <View
      style={{
        flex: 1,
      }}
    >
      <View
        style={{
          marginTop: 20,
          zIndex: 100,
        }}
      >
        <Close />
      </View>

      <View
        style={{
          marginHorizontal: 15,
          marginRight: 60,
          // backgroundColor: "blue",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            // backgroundColor: theme.secondaryBackground,
            // borderRadius: 30,
            padding: 10,
          }}
        >
          {content?.thumbnailImageUrl ? (
            <FastImage
              source={{
                uri: content?.thumbnailImageUrl,
              }}
              style={{
                width: 50,
                marginRight: 10,
                height: 50,
                borderRadius: 10,
              }}
            />
          ) : null}

          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: theme.header,
                fontSize: 18,
                fontFamily: "Raleway-Bold",
              }}
              numberOfLines={1}
            >
              {content?.title}
            </Text>

            <Text
              style={{
                marginTop: 7,
                color: theme.text,
                fontSize: 16,
                fontFamily: "Raleway-Medium",
              }}
            >
              {content?.authorName}
              {"  "}•{"  "}
              {estimatedLen} mins
            </Text>
          </View>
        </View>
      </View>

      <View
        style={{
          flex: 1,
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
              width: SIZE / 3,
              height: SIZE / 3,
            }}
            tintColor={theme.text}
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
              backgroundColor:
                theme.theme === "dark"
                  ? colors.lightBlue10
                  : colors.lightBlue90,
              justifyContent: "center",
              alignItems: "center",
              alignSelf: "center",
              transform: [{ scale: animation }],
            }}
          >
            <TouchableOpacity
              style={{
                width: SIZE - 15,
                height: SIZE - 15,
                borderRadius: 100,
                backgroundColor: colors.primary,
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
                  right: isPlaying ? 0 : -5,
                }}
                icon={isPlaying ? faPause : faPlay}
                color={colors.white}
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
            tintColor={theme.text}
            style={{
              width: SIZE / 3,
              height: SIZE / 3,
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
            marginBottom: 50,
          },
        ]}
      >
        <TouchableOpacity
          style={{
            padding: 10,
            width: 60,
            alignSelf: "flex-end",
            marginRight: 20,
            marginBottom: 10,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 50,
            backgroundColor: theme.secondaryBackground,
          }}
          onPress={setPlayerSpeed}
        >
          <Text
            style={{
              color: theme.text,
              fontSize: 14,
              fontFamily: "Raleway-Bold",
            }}
          >
            {speed}x
          </Text>
        </TouchableOpacity>

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
          minimumTrackTintColor={theme.text}
          maximumTrackTintColor={theme.secondaryBackground2}
          thumbTintColor={theme.text}
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
              color: theme.text,
              fontSize: 14,
              fontFamily: "Raleway-Medium",
            }}
          >
            {currentMs ? formatTime(currentMs) : "-"}
          </Text>

          <Text
            style={{
              color: theme.text,
              fontSize: 14,
              fontFamily: "Raleway-Medium",
            }}
          >
            {durationMs ? formatTime(durationMs) : "-"}
          </Text>
        </View>
      </View>

      <NextOrPrevButtons skip={skip} content={content ?? null} />
    </View>
  );
};

const NextOrPrevButtons = ({
  content,
  skip,
}: {
  content: BaseContentFields | null;
  skip: (seconds: number) => void;
}) => {
  const { downloadAndPlayContent } = useAudio();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProps>();

  const [getNextContent] = useLazyQuery<Pick<Query, "getNextContent">>(
    api.queue.next
  );

  const [getPrevContent] = useLazyQuery<Pick<Query, "getPrevContent">>(
    api.queue.prev
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

      console.log(prevContentQueued);

      if (!prevContentQueued?.content) {
        return;
      }

      const prevContentId = prevContentQueued?.content?.id || "";

      // update the route params
      navigation.setParams({ contentId: prevContentId });

      downloadAndPlayContent(prevContentQueued.content as BaseContentFields);
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

      console.log(variables);

      const response = await getPrevContent({
        variables,
      });

      const nextContentQueued = response.data?.getPrevContent;

      if (!nextContentQueued?.content) {
        return;
      }

      const nextContentId = nextContentQueued?.content?.id || "";

      // update the route params
      navigation.setParams({ contentId: nextContentId });

      downloadAndPlayContent(nextContentQueued.content as BaseContentFields);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <View
      style={{
        paddingBottom: insets.bottom + 15,
        display: "flex",
        flexDirection: "row",
        paddingHorizontal: 10,
        // space between button
        justifyContent: "space-between",
      }}
    >
      <Button
        label="Previous"
        style={{
          flex: 1,
          marginRight: 5,
          backgroundColor: theme.medBackground,
        }}
        onPress={_onClickPrev}
        activityColor={theme.text}
        labelStyle={{
          color: theme.text,
        }}
        iconPosition="left"
        icon={
          <FontAwesomeIcon
            icon={faBackward}
            color={theme.text}
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
          backgroundColor: theme.medBackground,
        }}
        activityColor={theme.text}
        onPress={_onClickNext}
        iconPosition="right"
        labelStyle={{
          color: theme.text,
        }}
        icon={
          <FontAwesomeIcon
            icon={faForward}
            color={theme.text}
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

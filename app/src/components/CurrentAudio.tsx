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
  DimensionValue,
  StyleSheet,
  Dimensions,
  Easing,
} from "react-native";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useTheme } from "src/hooks";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import { api } from "src/api";
import {
  Mutation,
  MutationUpdateContentSessionArgs,
  Query,
} from "src/api/generated/types";
import { NavigationProps } from "src/navigation";
import { BaseContentFields } from "src/api/fragments";
import { colors } from "src/components";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faArrowRight,
  faCar,
  faCarBolt,
  faHeadphones,
  faHeadphonesAlt,
  faPause,
  faPlay,
} from "@fortawesome/pro-solid-svg-icons";
import { Impressions } from "../views/Main/Home/Github";
import { ContentRow, ContentRowImage } from "./Content/ContentRow";
import { LinearGradient } from "expo-linear-gradient";
import Header from "src/components/Header";
import FastImage from "react-native-fast-image";
import { BlurView } from "expo-blur";
import { AppContext } from "context";
import { useDispatch, useSelector } from "react-redux";
import {
  getCurrentAudioUrl,
  getCurrentContent,
  getCurrentMs,
  getDurationMs,
  getIsPlaying,
  setAudioUrl,
  setIsPlaying,
} from "src/redux/reducers/audio";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import { useAudio } from "src/hooks/useAudio";
import BigNumber from "bignumber.js";
import { Track } from "react-native-track-player";

export const CurrentAudio = () => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProps>();

  const isPlaying = useSelector(getIsPlaying);

  const activeContent = useSelector(getCurrentContent);

  const [updateSession] = useMutation<
    Pick<Mutation, "updateContentSession">,
    MutationUpdateContentSessionArgs
  >(api.content.updateSession);

  const currentAudioUrl = useSelector(getCurrentAudioUrl);

  const [getCurrentSession] = useLazyQuery<
    Pick<Query, "getCurrentContentSession">
  >(api.content.current);

  const { startPlayingContent, toggle, percentFinished, leftTimeFormatted } =
    useContext(AppContext).audio!;

  const isFocused = useIsFocused();
  const animation = useRef(new Animated.Value(1)).current; // Initial scale value of 1

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

  const openContent = async () => {
    try {
      const contentId = activeContent?.id || "";

      if (!contentId) {
        return;
      }

      navigation.navigate("AudioPlayer", { contentId });
    } catch (err) {
      console.log(err);
      Alert.alert(
        "Error",
        "There was an error starting the course. Please try again."
      );
    }
  };

  const playOrPause = async () => {
    try {
      const audioUrl = activeContent?.audioUrl || "";

      void updateSession({
        variables: {
          contentSessionId: activeContent?.id || "",
          lastListenedAt: new Date(),
        },
      });

      // this will set it on the ref
      if (currentAudioUrl !== audioUrl) {
        const content = activeContent as BaseContentFields;

        await startPlayingContent(content);

        return;
      }

      await toggle();
    } catch (error) {
      console.log(error);
    }
  };

  const bg = theme.bgPrimary;
  const title = activeContent?.title;

  // if there is no active content or the active content is finished playing
  const shouldHide = useMemo(() => {
    if (!activeContent) {
      console.log("no active content");
      return true;
    }

    return false;
  }, [activeContent]);

  const _getStartingContent = async () => {
    const response = await getCurrentSession();

    const data = response.data?.getCurrentContentSession ?? null;

    if (data) {
      const content = data.content as BaseContentFields;

      if (content) {
        // load the content but don't play it to start
        await startPlayingContent(content, {
          startingTimeMs: data.currentMs ?? 0,
          shouldNotAutoPlay: true,
        });
      }
    }
  };

  useEffect(() => {
    _getStartingContent();
  }, []);

  if (shouldHide || !activeContent) {
    return null;
  }

  return (
    <View
      style={{
        bottom: 90,
        width: "100%",
        height: 75,
        paddingHorizontal: 0,
        paddingBottom: 0,
        backgroundColor: theme.background,
        opacity: 1,
        display: "flex",
        alignSelf: "center",
        position: "relative",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <BlurView
        style={{
          position: "absolute",
          bottom: 10,
          overflow: "hidden",
          padding: 8,
          paddingHorizontal: 0,
          paddingBottom: 0,
          backgroundColor: bg,
          display: "flex",
          alignSelf: "center",
          opacity: 0.97,
          borderRadius: 15,
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          width: "95%",
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
        {/* make a background rectangle that is  black representing progress */}
        <View
          style={{
            width: "100%",
            height: "105%",
            marginBottom: 0,
            marginHorizontal: 0,
            alignSelf: "center",
            backgroundColor: bg,
            borderRadius: 0,
            top: 0,
            overflow: "hidden",
            position: "absolute",
          }}
        >
          <LinearGradient
            colors={[colors.primary, colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              width: (percentFinished.toString() + "%") as DimensionValue,
              height: "100%",
              opacity: theme.theme === "dark" ? 0.4 : 0.1,
            }}
          />
        </View>

        <TouchableOpacity
          onPress={openContent}
          style={{
            paddingHorizontal: 5,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            flexDirection: "row",
          }}
          activeOpacity={1}
        >
          <ContentRowImage content={activeContent} />

          <View
            style={{
              marginLeft: 5,
              flex: 1,
              alignItems: "flex-start",
            }}
          >
            <MarqueeText title={title || ""} />

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
                {leftTimeFormatted} left
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={playOrPause}
            activeOpacity={1}
            style={{ marginRight: 5 }}
          >
            <Animated.View
              style={{
                marginLeft: 15,
                width: 35,
                height: 35,
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
                icon={isPlaying ? faPause : faPlay}
                color={colors.white}
                size={16}
                style={{ position: "relative", right: isPlaying ? 0 : -1 }}
              />
            </Animated.View>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* make a progress bar */}
        <View
          style={{
            width: "100%",
            height: 4,
            marginBottom: 0,
            marginHorizontal: 5,
            alignSelf: "center",
            backgroundColor: bg,
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
              width: (percentFinished.toString() + "%") as DimensionValue,
              height: 4,
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
            }}
          />
        </View>
      </BlurView>
    </View>
  );
};

const screenWidth = Dimensions.get("window").width;

const MarqueeText = ({ title }: { title: string }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [textWidth, setTextWidth] = useState(0);
  const theme = useTheme();

  useEffect(() => {
    if (title.length < 40) {
      return;
    }

    if (textWidth > screenWidth) {
      const duration = (textWidth / screenWidth) * 8000; // Duration proportional to text length

      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: duration, // Adjust the duration for the speed of scrolling
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: duration, // Same duration to scroll back to the start
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [animatedValue, textWidth, title]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -(textWidth - screenWidth)], // Moves from 0 to the difference between text width and screen width
  });

  return (
    <View style={styles.container}>
      <Animated.Text
        onLayout={(e) => setTextWidth(e.nativeEvent.layout.width)} // Get the actual width of the text
        style={[
          styles.text,
          {
            color: theme.header,
            // transform: [{ translateX }],
          },
        ]}
        numberOfLines={1}
      >
        {title}
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: screenWidth - 125,
    overflow: "hidden",
  },
  text: {
    fontSize: 16, // Adjust the font size as needed
    fontWeight: "bold",
    width: screenWidth * 1.5,
    fontFamily: "Raleway-Bold",
  },
});

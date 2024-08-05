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

export const CurrentAudio = ({ content }: { content: BaseContentFields[] }) => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProps>();

  const { data: contentData } = useQuery<
    Pick<Query, "getCurrentContentSession">
  >(api.content.current, {});

  const activeContent = contentData?.getCurrentContentSession ?? null;
  const animation = useRef(new Animated.Value(1)).current; // Initial scale value of 1

  const color = colors.purple90;
  const [startContent, { error }] = useMutation(api.content.start);

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
      const contentId = activeContent?.id;

      const response = await startContent({
        variables: {
          contentId: contentId,
        },
      });

      navigation.navigate("ContentSession", { contentId, isCarMode: false });
    } catch (err) {
      console.log(err);
      Alert.alert(
        "Error",
        "There was an error starting the course. Please try again."
      );
    }
  };

  const bg = theme.theme === "light" ? "#DFDCFB" : "#050129";
  const title = activeContent?.content?.title;
  const thumbnailImageUrl = activeContent?.content?.thumbnailImageUrl;
  const leftMs =
    (activeContent?.durationMs ?? 0) - (activeContent?.currentMs ?? 0);
  const leftMinutes = Math.floor(leftMs / 60000);
  const percentFinished = Math.max(activeContent?.percentFinished ?? 0, 5);

  if (!activeContent) {
    return null;
  }

  return (
    <BlurView
      style={{
        position: "absolute",
        bottom: 100,
        overflow: "hidden",
        padding: 15,
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
        onPress={openContent}
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
        {thumbnailImageUrl ? (
          <Image
            source={{
              uri: thumbnailImageUrl,
            }}
            style={{ width: 40, height: 40, borderRadius: 10 }}
          />
        ) : null}

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
            {title || ""}
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
              {leftMinutes}min left
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => Alert.alert("pause")}
          activeOpacity={1}
        >
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
            width: Math.floor(percentFinished).toString() + "%",
            height: 4,
            borderTopRightRadius: 10,
            borderBottomRightRadius: 10,
          }}
        />
      </View>
    </BlurView>
  );
};

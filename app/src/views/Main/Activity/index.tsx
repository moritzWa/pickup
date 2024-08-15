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
import React, { useContext, useMemo, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "src/hooks";
import { useMutation, useQuery } from "@apollo/client";
import { api } from "src/api";
import {
  ActivityFilter,
  Query,
  QueryGetActivityArgs,
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
  faPlay,
  faPlus,
} from "@fortawesome/pro-solid-svg-icons";
import { ContentRow } from "../../../components/Content/ContentRow";
import { LinearGradient } from "expo-linear-gradient";
import Header from "src/components/Header";
import FastImage from "react-native-fast-image";
import { BlurView } from "expo-blur";
import { useDispatch, useSelector } from "react-redux";
import {
  getActivityFilter,
  setActivityFilter,
} from "src/redux/reducers/globalState";
import * as Haptics from "expo-haptics";
import { CurrentAudio } from "src/components/CurrentAudio";
import { hasValue } from "src/core";
import { AppContext } from "context";
import { setCurrentContent } from "src/redux/reducers/audio";

const Activity = () => {
  const navigation = useNavigation<NavigationProps>();
  const theme = useTheme();

  const dispatch = useDispatch();
  const { downloadAndPlayContent, toggle } = useContext(AppContext).audio!;
  const [clear] = useMutation(api.queue.clear);

  const {
    data: queueData,
    error: queueError,
    refetch: refetchQueue,
  } = useQuery<Pick<Query, "getQueue">>(api.queue.list, {
    variables: {},
    fetchPolicy: "cache-and-network",
  });

  const content = useMemo((): BaseContentFields[] => {
    return (queueData?.getQueue?.queue ?? [])
      .map((q) => q.content as BaseContentFields)
      .filter(hasValue);
  }, [queueData?.getQueue?.queue]);

  const count = queueData?.getQueue?.total ?? 0;

  const onPlayContent = async (content: BaseContentFields) => {
    // alert("play");
    await downloadAndPlayContent(content);
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

  const onPressContent = async (content: BaseContentFields) => {
    navigation.navigate("AudioPlayer", {
      contentId: content.id,
    });
  };

  const onRefresh = async () => {
    await refetchQueue();
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: "row",
          display: "flex",
          alignItems: "center",
          padding: 10,
          paddingHorizontal: 20,
        }}
      >
        <Text
          style={{
            color: theme.header,
            fontFamily: "Raleway-Bold",
            fontSize: 24,
          }}
        >
          Your Queue
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
          paddingTop: 5,
          paddingBottom: 150,
        }}
        ListEmptyComponent={
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: theme.text,
                fontFamily: "Raleway-Bold",
                fontSize: 16,
              }}
            >
              Your queue is empty
            </Text>
          </View>
        }
        renderItem={({ item: c }) => (
          <ContentRow
            onPlay={() => onPlayContent(c)}
            togglePlayOrPause={() => onTogglePlayOrPause(c)}
            onPress={() => onPressContent(c)}
            content={c}
          />
        )}
      />
    </SafeAreaView>
  );
};

export default Activity;

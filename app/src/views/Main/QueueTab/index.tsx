import { useMutation, useQuery } from "@apollo/client";
import { useNavigation } from "@react-navigation/native";
import { AppContext } from "context";
import React, { useContext, useEffect, useMemo } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch } from "react-redux";
import { api } from "src/api";
import { BaseContentFields } from "src/api/fragments";
import { Query } from "src/api/generated/types";
import { colors } from "src/components";
import { hasValue } from "src/core";
import { useTheme } from "src/hooks";
import { NavigationProps } from "src/navigation";
import { setCurrentContent, setQueue } from "src/redux/reducers/audio";
import { ContentRow } from "../../../components/Content/ContentRow";
import { faPlus } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";

const Activity = () => {
  const navigation = useNavigation<NavigationProps>();
  const theme = useTheme();

  const dispatch = useDispatch();
  const { startPlayingContent, toggle } = useContext(AppContext).audio!;
  const [clear] = useMutation(api.queue.clear);

  const {
    data: queueData,
    error: queueError,
    refetch: refetchQueue,
  } = useQuery<Pick<Query, "getQueue">>(api.queue.list, {
    variables: {},
    fetchPolicy: "cache-and-network",
  });

  const [createContentFromUrl] = useMutation(api.content.createFromUrl);

  const content = useMemo((): BaseContentFields[] => {
    return (queueData?.getQueue?.queue ?? [])
      .map((q) => q.content as BaseContentFields)
      .filter(hasValue);
  }, [queueData?.getQueue?.queue]);

  const count = queueData?.getQueue?.total ?? 0;

  const onPlayContent = async (content: BaseContentFields) => {
    // alert("play");
    await startPlayingContent(content);
  };

  const onTogglePlayOrPause = async (content: BaseContentFields) => {
    // alert("toggle");
    await toggle();
    dispatch(setCurrentContent(content));
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

  useEffect(() => {
    const content = (queueData?.getQueue?.queue ?? [])
      .map((q) => q.content)
      .filter(hasValue) as BaseContentFields[];

    dispatch(setQueue(content));
  }, [1, JSON.stringify(queueData?.getQueue)]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: "row",
          display: "flex",
          alignItems: "center",
          padding: 0,
          paddingBottom: 15,
          paddingHorizontal: 20,
        }}
      >
        <Text
          style={{
            color: theme.header,
            fontFamily: "Inter-Bold",
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

        <View style={{ flex: 1, alignItems: "flex-end" }}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onAddContentFromUrl}
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              borderRadius: 100,
              padding: 7,
              paddingHorizontal: 12,
              backgroundColor: theme.secondaryBackground,
            }}
          >
            <FontAwesomeIcon
              style={{ marginRight: 5 }}
              icon={faPlus}
              size={18}
              color={theme.text}
            />
            <Text
              style={{
                color: theme.text,
                fontSize: 16,
                fontFamily: "Inter-Medium",
              }}
            >
              Add
            </Text>
          </TouchableOpacity>
        </View>
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
              paddingVertical: 100,
              paddingHorizontal: 30,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: theme.text,
                fontFamily: "Inter-Medium",
                fontSize: 18,
                textAlign: "center",
              }}
            >
              Go to the home tab and swipe to add content to the queue!
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

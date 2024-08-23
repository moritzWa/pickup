import {
  ApolloError,
  NetworkStatus,
  useLazyQuery,
  useMutation,
  useQuery,
} from "@apollo/client";
import {
  CommonActions,
  RouteProp,
  useIsFocused,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Touchable,
  TouchableOpacity,
  TextInput,
  Image,
  Animated,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
  Linking,
  Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { api } from "src/api";
import { Mutation, Query } from "src/api/generated/types";
import Back from "src/components/Back";
import { useInterval } from "src/hooks/useInterval";
import { useTheme } from "src/hooks/useTheme";
import { NavigationProps, RootStackParamList } from "src/navigation";
import {
  faCheck,
  faClone,
  faComment,
  faCopy,
  faExternalLink,
  faKey,
  faLink,
  faTimes,
} from "@fortawesome/pro-solid-svg-icons";
import { Button, colors } from "src/components";
import { Maybe } from "src/core";
import Close from "src/components/Close";
import Clipboard from "@react-native-clipboard/clipboard";
import Header from "src/components/Header";
import moment from "moment-timezone";
import { noop } from "lodash";
import { RefreshControl } from "react-native-gesture-handler";
import { NotificationRow } from "./NotificationRow";
import { BaseNotificationFields } from "src/api/fragments";

const Notifications = () => {
  const { height } = Dimensions.get("window");
  const insets = useSafeAreaInsets();
  const fullTheme = useTheme();
  const navigation = useNavigation<NavigationProps>();

  const { data, loading, refetch, networkStatus } = useQuery<
    Pick<Query, "getNotifications">
  >(api.notifications.list);

  const notifications = useMemo(
    () => (data?.getNotifications ?? []) as BaseNotificationFields[],
    [data]
  );
  const [loadedNotifs, setLoadedNotifs] = useState(false);
  const isFocused = useIsFocused();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // update read status
  const [readNotifications, { error }] = useMutation<
    Pick<Mutation, "readNotifications">
  >(api.notifications.markAsRead);

  console.log(error);
  const isRefetching = networkStatus === NetworkStatus.refetch;

  // if not focused, set loaded to false
  useEffect(() => {
    if (!isFocused) setLoadedNotifs(false);
  }, [isFocused]);

  useEffect(() => {
    if (isFocused) {
      void refetch();
    }
  }, [isFocused]);

  // mark as read after some time -- only the first time the page loads though!
  // E.g. if I get new notifications while on this page, we shouldn't mark them as read
  useEffect(() => {
    if (!notifications) {
      console.log("no notifications");
      return;
    }
    if (notifications.every((n) => n.hasRead)) {
      console.log("all has read");
      return;
    }

    if (loadedNotifs) {
      console.log("loaded notif");
      return;
    }

    setLoadedNotifs(true);

    const ids = notifications.filter((n) => !n.hasRead).map((n) => n.id);

    // console.log(`[marking as read ${ids.length} notifications]`);

    // console.log("calling timeout");

    readNotifications({
      variables: {
        notificationIds: ids,
      },
      refetchQueries: [api.notifications.unread],
    });
  }, [
    notifications,
    setLoadedNotifs,
    loadedNotifs,
    readNotifications,
    isFocused,
  ]);

  const _onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (error && __DEV__) {
    console.log(JSON.stringify(error, null, 2));
  }

  return (
    <View
      style={{
        backgroundColor: fullTheme.background,
        flex: 1,
        height,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Header title="Notifications" />

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        initialNumToRender={8}
        // render the rows efficiently:
        removeClippedSubviews={true}
        maxToRenderPerBatch={8}
        windowSize={8}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 5 }}
        refreshControl={
          <RefreshControl
            tintColor={fullTheme.activityIndicator}
            onRefresh={_onRefresh}
            refreshing={isRefreshing}
          />
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator
              style={{ marginTop: 20 }}
              size="large"
              color={fullTheme.textSecondary}
            />
          ) : (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 100,
              }}
            >
              <Text
                style={{
                  color: fullTheme.textSecondary,
                  fontFamily: "Mona-Sans-Medium",
                  fontSize: 18,
                  textAlign: "center",
                }}
              >
                No notifications yet.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => <NotificationRow notification={item} />}
      />
    </View>
  );
};

export default Notifications;

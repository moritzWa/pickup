import { useMutation } from "@apollo/client";
import { faArchive, faPodcast } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  Alert,
  Animated,
  Image,
  StyleProp,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import FastImage from "react-native-fast-image";
import { Swipeable } from "react-native-gesture-handler";
import { Circle, Svg, SvgUri } from "react-native-svg";
import Toast from "react-native-toast-message";
import { useSelector } from "react-redux";
import { api } from "src/api";
import { BaseContentFields } from "src/api/fragments";
import {
  ContentFeedFilter,
  ContentUserFollowingProfile,
  Mutation,
  MutationAddToQueueArgs,
  MutationArchiveContentArgs,
  MutationRemoveFromQueueArgs,
} from "src/api/generated/types";
import { colors } from "src/components";
import { Maybe } from "src/core";
import { useTheme } from "src/hooks";
import { NavigationProps } from "src/navigation";
import {
  getCurrentContent,
  getIsPlaying,
  getQueueContentIdSet,
} from "src/redux/reducers/audio";
import { getGradientById } from "src/utils/helpers";
import ProfileIcon from "../ProfileIcon";
import { ContentDescription } from "./ContentDescription";
import { ContentMetaData } from "./ContentMetaData";
import { ContentRowTitle } from "./ContentRowTitle";
import { PlayButton } from "./PlayButton";

const IMAGE_SIZE = 35;

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

  const [bookmark] = useMutation<Pick<Mutation, "bookmarkContent">>(
    api.content.bookmark
  );

  const [archiveContent] = useMutation<Pick<Mutation, "archiveContent">>(
    api.content.archive
  );

  const onArchiveContent = async () => {
    try {
      const variables: MutationArchiveContentArgs = {
        contentId: c.id,
      };

      // prompt to make sure
      Alert.alert(
        "Archive Content",
        `Are you sure you want to archive ${c.title}?`,
        [
          {
            text: "No",
            onPress: () => console.log("Cancel Pressed"),
            style: "cancel",
          },
          {
            text: "Yes, archive",
            onPress: async () => {
              swipeableRef.current?.close();

              await archiveContent({
                variables,
                refetchQueries: [
                  api.content.addToQueue,
                  api.queue.list,
                  api.content.feed,
                ],
              });
            },
          },
        ]
      );
    } catch (err) {
      console.log(err);
    }
  };

  const bookmarkContent = async () => {
    try {
      const response = await bookmark({
        variables: {
          contentId: c?.id || "",
        },
        refetchQueries: [
          api.content.get,
          api.content.bookmarks,
          api.content.feed,
        ],
      });

      const data = response.data?.bookmarkContent;

      swipeableRef.current?.close();

      Toast.show({
        type: "success",
        text1: `${data?.isBookmarked ? "Liked" : "Unliked"} ${c.title.slice(
          0,
          24
        )}`,
        position: "bottom",
      });
      // console.log(response.data);
      // console.log(JSON.stringify(data, null, 2));
    } catch (err) {
      console.log(JSON.stringify(err, null, 2));
    }
  };

  const onAddOrRemoveContentToQueue = async () => {
    try {
      const variables: MutationAddToQueueArgs | MutationRemoveFromQueueArgs = {
        contentId: c.id,
      };

      swipeableRef.current?.close();

      if (isQueued) {
        const response = await removeFromQueue({
          variables,
          refetchQueries: [api.content.addToQueue, api.queue.list],
        });
        console.log("removed from queue");

        Toast.show({
          type: "success",
          text1: "Removed from queue",
          position: "bottom",
        });
      } else {
        await addToQueue({
          variables,
          refetchQueries: [api.content.addToQueue, api.queue.list],
        });
        console.log("added to queue");
        Toast.show({
          type: "success",
          text1: "Added to queue ✅",
          position: "bottom",
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
      if (c.websiteUrl && c.type === "article") {
        navigation.navigate("InternalBrowser", { url: c.websiteUrl });
      } else if (c.audioUrl) {
        if (onPress) onPress();
      } else {
        console.log("No website URL or audio URL available");
      }
    } catch (err) {
      console.log(err);
      Alert.alert(
        "Error",
        "There was an error opening the content. Please try again."
      );
    }
  };

  const playOrPause = async () => {
    if (c.audioUrl) {
      if (isActive) {
        togglePlayOrPause();
      } else {
        onPlay();
      }
    } else if (c.websiteUrl) {
      navigation.navigate("InternalBrowser", { url: c.websiteUrl });
    }
  };

  const renderRightActions = () => (
    <View
      style={{
        alignItems: "center",
        paddingHorizontal: 20,
        display: "flex",
        height: "100%",
        backgroundColor: theme.secondaryBackground,
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
          marginRight: 10,
          flexDirection: "row",
          backgroundColor: isActive ? theme.text : theme.text,
          width: 55,
          height: 55,
          borderRadius: 50,
        }}
      >
        <FontAwesomeIcon
          icon={faArchive}
          color={theme.secondaryBackground}
          size={22}
        />
      </TouchableOpacity>

      {/* <TouchableOpacity
        onPress={bookmarkContent}
        activeOpacity={0.9}
        style={{
          justifyContent: "center",
          alignItems: "center",
          display: "flex",
          flexDirection: "row",
          backgroundColor: c.contentSession?.isBookmarked
            ? colors.pink50
            : theme.text,
          width: 55,
          marginRight: 10,
          height: 55,
          borderRadius: 50,
        }}
      >
        <FontAwesomeIcon
          icon={faHeart}
          color={
            c.contentSession?.isBookmarked
              ? colors.white
              : theme.secondaryBackground
          }
          size={22}
        />
      </TouchableOpacity> */}

      <TouchableOpacity
        onPress={onAddOrRemoveContentToQueue}
        activeOpacity={0.9}
        style={{
          justifyContent: "center",
          alignItems: "center",
          display: "flex",
          flexDirection: "row",
          backgroundColor: isQueued ? colors.red50 : colors.primary,
          width: 55,
          height: 55,
          borderRadius: 50,
          // marginTop: 5,
        }}
      >
        {isQueued ? (
          <Image
            source={require("src/assets/icons/solid-list-circle-minus.png")}
            tintColor={theme.secondaryBackground}
            resizeMode="contain"
            style={{
              width: 22,
              height: 22,
            }}
          />
        ) : (
          <Image
            source={require("src/assets/icons/solid-list-circle-plus.png")}
            tintColor={theme.secondaryBackground}
            resizeMode="contain"
            style={{
              width: 22,
              height: 22,
            }}
          />
        )}
      </TouchableOpacity>
    </View>
  );

  useEffect(() => {
    swipeableRef.current?.close();
  }, [filter]);

  return (
    <View
      style={{
        // shadowOffset: {
        //   width: 0,
        //   height: 0,
        // },
        // shadowOpacity: 0.1,
        // shadowRadius: 3,
        elevation: 5,
        marginBottom: 10,
        // shadowColor: isActive ? "transparent" : colors.gray30,
      }}
    >
      <Swipeable
        renderRightActions={renderRightActions}
        overshootRight={false}
        ref={swipeableRef}
        containerStyle={{
          marginHorizontal: 10,
          borderRadius: 15,
          backgroundColor: theme.ternaryBackground,
          borderColor: isActive ? theme.borderDark : theme.border,
          borderWidth: 2,
        }}
      >
        <TouchableOpacity
          onPress={start}
          activeOpacity={1}
          style={{
            padding: 15,
            backgroundColor: isActive ? theme.bgPrimaryLight : theme.background,
          }}
        >
          <View>
            <View
              style={{
                paddingRight: 50,
                marginBottom: 10,
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                flex: 1,
              }}
            >
              <ContentRowImage content={c} />
              <ContentRowTitle content={c} isActive={isActive} />
            </View>

            <View style={{}}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                }}
              >
                <View style={{ flex: 1 }}>
                  <ContentDescription content={c} />

                  <View
                    style={{
                      marginTop: 10,
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <View
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        marginRight: 10,
                        flex: 1,
                      }}
                    >
                      <ContentFriends friends={c.friends ?? []} />
                    </View>

                    <ContentMetaData content={c} />

                    {/* Do we still want this? It caused the UI to shift weirdly */}
                    {/* <ContentSessionProgress content={c} isActive={isActive} /> */}
                  </View>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        <PlayButton
          animation={animation}
          playOrPause={playOrPause}
          c={c}
          isActive={isActive}
          isPlaying={isPlaying}
        />
      </Swipeable>
    </View>
  );
};

export const ContentRowImage = ({
  content: c,
  size,
  style,
}: {
  content: BaseContentFields;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) => {
  const gradient = getGradientById(c.id);

  let thumbnailImageUrl: Maybe<string> | undefined = c.thumbnailImageUrl;

  // this fixes some images that otherwise fail to load
  if (thumbnailImageUrl && thumbnailImageUrl.startsWith("http://")) {
    thumbnailImageUrl = thumbnailImageUrl.replace("http", "https");
  }

  // TODO: permission error for learning---prod.appspot.com images
  // https://firebasestorage.googleapis.com/v0/b/learning---prod.appspot.com/o/images%2F68ced13e-65c4-4f3d-be3d-e5f2bff99ccf.jpeg?alt=media
  // https://firebasestorage.googleapis.com/v0/b/learning---prod.appspot.com/o/images%2F13e24d1e-8ce9-4138-a665-66cf1fbaecdc.jpeg?alt=media

  // if .svg in the url use SvgUri
  if (c.thumbnailImageUrl && c.thumbnailImageUrl.includes(".svg")) {
    return (
      <SvgUri
        width={size || IMAGE_SIZE}
        height={size || IMAGE_SIZE}
        uri={c.thumbnailImageUrl}
      />
    );
  } else if (c.thumbnailImageUrl) {
    // console.log(c.thumbnailImageUrl, c.title);

    return (
      <FastImage
        source={{
          // @ts-ignore
          uri: thumbnailImageUrl,
        }}
        style={{
          width: size || IMAGE_SIZE,
          height: size || IMAGE_SIZE,
          borderRadius: 5,
          // @ts-ignore
          ...style,
        }}
      />
    );
  }

  return (
    <LinearGradient
      colors={gradient}
      style={{
        width: size || IMAGE_SIZE,
        height: size || IMAGE_SIZE,
        borderRadius: 5,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        // @ts-ignore
        ...style,
      }}
      // start left -> right
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <FontAwesomeIcon icon={faPodcast} color={"white"} size={18} />
    </LinearGradient>
  );
};

export const CircularProgress = ({
  size,
  strokeWidth,
  percentage,
  bg,
}: {
  size: number;
  strokeWidth: number;
  percentage: number;
  bg: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          stroke={bg}
        />
        {/* Foreground circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          stroke={colors.primary}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        />
      </Svg>
    </View>
  );
};
const ContentFriends = ({
  friends,
}: {
  friends: ContentUserFollowingProfile[];
}) => {
  const theme = useTheme();
  const friendsToShow = (friends ?? []).slice(0, 3);
  const extraFriends = friends.length - friendsToShow.length;
  const navigation = useNavigation<NavigationProps>();

  // console.log(friendsToShow);

  const onPressUser = (f: ContentUserFollowingProfile) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    navigation.navigate("UserProfile", {
      username: f.username || "",
    });
  };

  if (!friends.length) return null;

  return (
    <View
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      {(friendsToShow ?? []).map((f, i) => (
        <ProfileIcon
          key={f.id}
          id={f.id}
          onPress={() => onPressUser(f)}
          size={25}
          style={{
            // negative left
            left: i === 0 ? 0 : -7,
            position: "relative",
            borderColor: theme.border,
            borderWidth: 1,
          }}
          initials={f.name?.charAt(0)}
          textStyle={{
            fontSize: 14,
            fontFamily: "Inter-ExtraBold",
          }}
          profileImageUrl={f.avatarImageUrl}
        />
      ))}

      {extraFriends > 0 ? (
        <Text
          style={{
            fontSize: 14,
            color: theme.text,
            marginLeft: 5,
            fontFamily: "Inter-Medium",
          }}
        >
          +{extraFriends} more
        </Text>
      ) : null}
    </View>
  );
};

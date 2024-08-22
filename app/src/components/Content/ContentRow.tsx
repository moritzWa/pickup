import { useMutation } from "@apollo/client";
import {
  faArchive,
  faPause,
  faPlay,
  faPodcast,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import moment from "moment";
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
import { Circle, Svg } from "react-native-svg";
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
import { IS_IPAD } from "src/config";
import { useTheme } from "src/hooks";
import { NavigationProps } from "src/navigation";
import {
  getCurrentContent,
  getIsPlaying,
  getQueueContentIdSet,
} from "src/redux/reducers/audio";
import { getGradientById } from "src/utils/helpers";
import ProfileIcon from "../ProfileIcon";
import { getDescription } from "./contentHelpers";

const IMAGE_SIZE = 32;

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
          flexDirection: "row",
          backgroundColor: isActive ? theme.text : theme.text,
          width: 55,
          height: 55,
          borderRadius: 50,
          marginTop: 10,
          marginBottom: 10,
        }}
      >
        <FontAwesomeIcon
          icon={faArchive}
          color={theme.secondaryBackground}
          size={22}
        />
      </TouchableOpacity>

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
          marginTop: 10,
          marginLeft: 15,
          marginBottom: 10,
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
        shadowOffset: {
          width: 0,
          height: 0,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 5,
        marginBottom: 10,
        shadowColor: isActive ? "transparent" : colors.gray30,
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
          borderColor: isActive ? theme.border : theme.border,
          borderWidth: 1,
        }}
      >
        <TouchableOpacity
          onPress={start}
          activeOpacity={0.9}
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

              <View
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
              </View>
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
                    {getDescription(c)}
                  </Text>

                  <View
                    style={{
                      marginTop: 10,
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
                        marginRight: 10,
                        flex: 1,
                      }}
                    >
                      {/* <FontAwesomeIcon
                    icon={faHeadSide}
                    color={theme.text}
                    size={14}
                    style={{ marginRight: 5 }}
                  /> */}

                      {/* <Text
                        style={{
                          color: theme.header,
                          fontSize: 14,
                          fontFamily: "Raleway-Medium",
                        }}
                        numberOfLines={1}
                      >
                        {c.authorName || extractDomain(c.websiteUrl)}
                      </Text> */}

                      <ContentFriends friends={c.friends ?? []} />
                    </View>

                    <View
                      style={{
                        display: "flex",
                        marginLeft: 15,
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: theme.textSecondary,
                          fontSize: 14,
                          fontFamily: "Raleway-Medium",
                        }}
                      >
                        {c.releasedAt
                          ? moment(c.releasedAt).format("MMM Do, YYYY") + " • "
                          : ""}
                        {c.lengthFormatted}{" "}
                        {c.contentSession?.percentFinished ? " • " : ""}
                      </Text>
                    </View>

                    {c.contentSession?.percentFinished ? (
                      <View
                        style={{
                          display: "flex",
                          marginLeft: 5,
                          flexDirection: "row",
                          alignItems: "center",
                          // marginRight: 15,
                        }}
                      >
                        <CircularProgress
                          size={IS_IPAD ? 26 : 14}
                          strokeWidth={IS_IPAD ? 5 : 3}
                          bg={isActive ? theme.textSubtle : theme.textSubtle}
                          percentage={c.contentSession?.percentFinished || 0}
                        />

                        <Text
                          style={{
                            marginLeft: 5,
                            color: theme.text,
                            fontSize: 14,
                            fontFamily: "Raleway-Medium",
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
        </TouchableOpacity>

        <Animated.View
          style={{
            width: IMAGE_SIZE,
            height: IMAGE_SIZE,
            marginRight: 0,
            position: "absolute",
            top: 15,
            right: 15,
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

  if (c.thumbnailImageUrl) {
    return (
      <FastImage
        source={{
          uri: c.thumbnailImageUrl,
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

const CircularProgress = ({
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
            fontFamily: "Raleway-ExtraBold",
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
            fontFamily: "Raleway-Medium",
          }}
        >
          +{extraFriends} more
        </Text>
      ) : null}
    </View>
  );
};

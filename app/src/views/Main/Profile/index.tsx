import React from "react";
import {
  ApolloError,
  useLazyQuery,
  useMutation,
  useQuery,
} from "@apollo/client";
import {
  CommonActions,
  RouteProp,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Platform,
  RefreshControl,
  SectionList,
  SectionListData,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api, apolloClient } from "src/api";
import {
  Mutation,
  MutationUpdateUserArgs,
  Profile as ProfileT,
  Query,
} from "src/api/generated/types";
import { useTheme } from "src/hooks/useTheme";
import { NavigationProps, RootStackParamList } from "src/navigation";
import Header from "src/components/Header";
import { Button, colors } from "src/components";
import { FollowersInfo } from "src/components/FollowersInfo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMe } from "src/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faPen,
  faPlus,
  faPlusCircle,
  faPlusLarge,
} from "@fortawesome/pro-solid-svg-icons";
import { hasValue } from "src/core";
import * as Haptics from "expo-haptics";
import { last, noop } from "lodash";
import { constants } from "src/config";
import Clipboard from "@react-native-clipboard/clipboard";
import { PERMISSIONS, RESULTS, check, request } from "react-native-permissions";
import ImagePicker, {
  Image as ImageResponse,
} from "react-native-image-crop-picker";
import ActionSheet from "react-native-action-sheet";
import { storage } from "src/utils/firebase";
import { v4 as uuidv4 } from "uuid";
import { TabBar } from "src/components/tabs";
import { BaseContentFields } from "src/api/fragments";
import { ContentRow } from "src/components/Content/ContentRow";

export const UserProfile = () => {
  const { me } = useMe();
  const { params } = useRoute<RouteProp<RootStackParamList, "UserProfile">>();
  const username = params?.username ?? me?.id;
  const insets = useSafeAreaInsets();
  const isME = username === me?.id;

  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    background,
    textPrimary,
    activityIndicator,
    secondaryBackground,
    header,
  } = useTheme();

  const {
    data: getProfileData,
    loading: loadingProfile,
    refetch,
    error: profileError,
  } = useQuery<{
    getProfile: ProfileT;
  }>(api.users.getProfile, {
    skip: !me,
    variables: {
      userId: me?.id || "",
    },
  });

  const profile = useMemo(() => getProfileData?.getProfile, [getProfileData]);

  const { data, error } = useQuery<Pick<Query, "getContentFeed">>(
    api.content.feed
  );

  const [startCourse] = useMutation(api.courses.start);

  const content = (data?.getContentFeed ?? []) as BaseContentFields[];

  const _onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        // TODO:
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  // if (profileError && __DEV__) {
  //   Alert.alert(JSON.stringify(profileError, null, 2));
  // }

  const contentSection: SectionListData<any | {}> = useMemo(
    () => ({
      key: "content-feed",
      data: [{}],
      renderItem: ({ item }) =>
        !content?.length ? (
          <View>
            <Text
              style={{
                color: textPrimary,
                fontSize: 18,
                flex: 1,
                alignSelf: "center",
                marginTop: 100,
                fontFamily: "Mona-Sans-Regular",
              }}
            >
              No content
            </Text>
          </View>
        ) : (
          <FlatList
            data={content}
            keyExtractor={(item) => item.id}
            style={{ padding: 10 }}
            renderItem={({ item }) => <ContentRow content={item} />}
          />
        ),
    }),
    [textPrimary, content]
  );

  const tabs = useMemo(() => {
    return [
      {
        name: "All",
        onClick: noop,
        isActive: true,
      },
      {
        name: "Bookmarks",
        onClick: () => Alert.alert("Coming soon 👀"),
        isActive: false,
      },
      {
        name: "Liked",
        onClick: () => Alert.alert("Coming soon 👀"),
        isActive: false,
      },
    ];
  }, []);

  const sections = useMemo(
    () => [
      {
        key: "profile",
        data: [{}],
        renderItem: () => <Profile username={username ?? null} />,
      },
      {
        data: [{}],
        renderItem: () => (
          // select between tabs
          <View style={{ marginBottom: 0 }}>
            <TabBar tabs={tabs} />
          </View>
        ),
      },
      contentSection,
    ],
    [contentSection, isME, profile, username, secondaryBackground]
  );

  //   if (__DEV__ && error) {
  //     console.error(JSON.stringify(error, null, 2));
  //   }

  // if (loadingProfile) {
  //   return (
  //     <View
  //       style={{
  //         flex: 1,
  //         backgroundColor: background,
  //         alignItems: "center",
  //         display: "flex",
  //         flexDirection: "row",
  //         justifyContent: "center",
  //       }}
  //     >
  //       <ActivityIndicator size="large" color={activityIndicator} />
  //     </View>
  //   );
  // }

  //   if (!profile) {
  //     return (
  //       <View
  //         style={{
  //           flex: 1,
  //           backgroundColor: background,
  //           alignItems: "center",
  //           display: "flex",
  //           flexDirection: "column",
  //           justifyContent: "center",
  //         }}
  //       >
  //         <Header hasBackButton />

  //         <Text
  //           style={{
  //             color: textPrimary,
  //             fontSize: 18,
  //             flex: 1,
  //             alignSelf: "center",
  //             marginTop: 100,
  //             fontFamily: "Mona-Sans-Regular",
  //           }}
  //         >
  //           Profile not found.
  //         </Text>
  //       </View>
  //     );
  //   }

  return (
    <View
      style={{
        flex: 1,
        paddingTop: isME ? insets.top : 0,
        backgroundColor: background,
      }}
    >
      {!isME ? <Header hasBackButton /> : null}

      {/* <ProfileImage name={profile?.name} /> */}

      <SectionList
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={_onRefresh}
            tintColor={activityIndicator}
          />
        }
        sections={sections}
      />
    </View>
  );
};

const Profile = ({ username }: { username: string | null }) => {
  const { me } = useMe();
  const isME = username === me?.id;

  const navigation = useNavigation<NavigationProps>();
  const fullTheme = useTheme();
  const {
    background,
    textPrimary,
    activityIndicator,
    text,
    theme,
    textSecondary,
  } = fullTheme;

  const {
    data: getProfileData,
    loading: loadingProfile,
    error: profileError,
  } = useQuery<{
    getProfile: ProfileT;
  }>(api.users.getProfile, {
    skip: !me,
    variables: {
      userId: me?.id || "",
    },
  });

  const profile = useMemo(() => getProfileData?.getProfile, [getProfileData]);

  //   const [followProfile, { loading: loadingFollow }] = useMutation<
  //     Pick<Mutation, "followProfile">
  //   >(api.profiles.follow);

  //   const [unfollowProfile, { loading: loadingUnfollow }] = useMutation<
  //     Pick<Mutation, "unfollowProfile">
  //   >(api.profiles.unfollow);

  //   const followUser = async () => {
  //     try {
  //       await followProfile({
  //         variables: {
  //           username,
  //         },
  //         refetchQueries: [api.profiles.getProfile],
  //       });

  //       // Alert.alert("Success", `Successfully followed ${profile?.name}.`);
  //     } catch (e) {
  //       console.error(e);

  //       Alert.alert(
  //         "Error",
  //         (e as any)?.message || "An error occurred. Please try again."
  //       );
  //     }
  //   };

  //   const unfollowUser = async () => {
  //     try {
  //       await unfollowProfile({
  //         variables: {
  //           username,
  //         },
  //         refetchQueries: [api.profiles.getProfile],
  //       });

  //       // Alert.alert(
  //       //   "Success",
  //       //   `Successfully un-followed ${profile?.name.trim() || "user"}.`
  //       // );
  //     } catch (e) {
  //       console.error(e);

  //       Alert.alert(
  //         "Error",
  //         (e as any)?.message || "An error occurred. Please try again."
  //       );
  //     }
  //   };

  const _editProfile = () => {
    navigation.navigate("EditProfile");
  };

  const _openSettings = () => {
    navigation.navigate("Settings");
  };

  return (
    <View
      style={{
        // borderBottomWidth: 1,
        paddingBottom: 5,
        // borderBottomColor: border,
      }}
    >
      <View>
        <View
          style={{
            alignItems: "flex-start",
            marginTop: 25,
            paddingHorizontal: 15,
          }}
        >
          <ProfilePicture profile={profile ?? null} />

          <View style={{ marginTop: 20, alignItems: "flex-start" }}>
            {!!profile?.name ? (
              <Text
                style={{
                  fontFamily: "Mona-Sans-Expanded-Bold",
                  fontSize: 18,
                  color: textPrimary,
                  textAlign: "center",
                }}
              >
                {profile?.name}
              </Text>
            ) : null}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                // copy to clipboard the username
                Clipboard.setString(profile?.username || "");
              }}
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 5,
              }}
            >
              <Text
                style={{
                  fontFamily: "Mona-Sans-Medium",
                  fontSize: 14,
                  marginTop: 5,
                  textAlign: "center",
                  color: textSecondary,
                }}
              >
                @{profile?.username}
              </Text>

              {/* <Image
                source={require("src/assets/icons/clone-filled.png")}
                style={{ width: 15, height: 15, marginLeft: 5 }}
                tintColor={textSecondary}
              /> */}
            </TouchableOpacity>

            {!!profile?.description ? (
              <Text
                style={{
                  fontFamily: "Mona-Sans-Regular",
                  fontSize: 16,
                  textAlign: "left",
                  marginTop: 20,
                  color: textSecondary,
                }}
                // numberOfLines={3}
              >
                {profile?.description}
              </Text>
            ) : null}
          </View>
        </View>

        <FollowersInfo
          containerStyle={{
            alignSelf: "flex-start",
            padding: 5,
            marginTop: 20,
            paddingBottom: 15,
            paddingTop: 0,
          }}
          username={username ?? null}
        />
      </View>
      {isME ? (
        <View
          style={{
            position: "absolute",
            top: 25,
            right: 15,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            style={{
              borderRadius: 100,
              height: 35,
              width: 35,
              marginRight: 5,
              alignSelf: "center",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 0,
              borderWidth: 1,
              borderColor: fullTheme.borderDark,
              backgroundColor: background,
            }}
            onPress={_openSettings}
          >
            <Image
              source={require("src/assets/icons/settings-filled.png")}
              style={{
                width: 18,
                height: 18,
              }}
              tintColor={textPrimary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            style={{
              borderRadius: 100,
              height: 35,
              width: 35,
              marginRight: 5,
              alignSelf: "center",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 0,
              borderWidth: 1,
              borderColor: fullTheme.borderDark,
              backgroundColor: background,
            }}
            onPress={_editProfile}
          >
            <Image
              source={require("src/assets/icons/pen-solid.png")}
              style={{
                width: 15,
                height: 15,
              }}
              tintColor={textPrimary}
            />
          </TouchableOpacity>
          {/* <TouchableOpacity
            activeOpacity={0.8}
            style={{
              borderRadius: 100,
              height: 35,
              width: 35,
              marginRight: 5,
              alignSelf: "center",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 0,
              borderWidth: 1,
              borderColor: fullTheme.borderDark,
              backgroundColor: background,
            }}
            onPress={_shareProfile}
          >
            <Image
              source={require("src/assets/icons/share.png")}
              style={{
                width: 15,
                height: 15,
              }}
              tintColor={textPrimary}
            />
          </TouchableOpacity> */}
        </View>
      ) : (
        <View
          style={{
            position: "absolute",
            top: 25,
            right: 15,
            display: "flex",
            flexDirection: "row",
          }}
        >
          {/* <Button
            style={{
              borderRadius: 100,
              height: 35,
              paddingVertical: 0,
              padding: 0,
              alignSelf: "center",
              width: 85,
              paddingHorizontal: 0,
              borderWidth: profile?.isFollowing ? 1 : 0,
              borderColor: fullTheme.borderDark,
              backgroundColor: profile?.isFollowing ? background : header,
            }}
            textProps={{
              style: {
                fontSize: 14,
                color: profile?.isFollowing ? textPrimary : background,
              },
            }}
            onPress={profile?.isFollowing ? unfollowUser : followUser}
            loading={loadingFollow || loadingUnfollow}
            label={profile?.isFollowing ? "Unfollow" : "Follow"}
          /> */}
        </View>
      )}
    </View>
  );
};

const ProfilePicture = ({ profile }: { profile?: ProfileT | null }) => {
  const fullTheme = useTheme();

  const { me } = useMe();
  const [profileUrl, setProfileUrl] = useState<string | null>(null);
  const [updateUser] = useMutation<Mutation, MutationUpdateUserArgs>(
    api.users.update
  );
  const [isLoading, setLoading] = useState(false);

  const isME = me && me.id === profile?.id;

  const initials = useMemo(() => {
    if (!profile) {
      return "";
    }

    const name = profile?.name || profile?.username || "";

    const names = name.split(" ");

    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }

    return names
      .slice(0, 2)
      .map((n: string) => n.charAt(0).toUpperCase())
      .join("");
  }, [profile]);

  const _handleCamera = async () => {
    const CAMERA_PERMISSION = Platform.select({
      ios: PERMISSIONS.IOS.CAMERA,
      android: PERMISSIONS.ANDROID.CAMERA,
      default: PERMISSIONS.IOS.CAMERA,
    });

    const cameraPermission = await check(CAMERA_PERMISSION);

    if (cameraPermission === RESULTS.BLOCKED) {
      await Linking.openSettings();
      return;
    }

    if (cameraPermission !== RESULTS.GRANTED) {
      const permission = await request(CAMERA_PERMISSION);

      if (permission !== RESULTS.GRANTED) {
        return;
      }
    }

    ImagePicker.openCamera({
      width: 300,
      height: 300,
      cropping: true,
      multiple: false,
      includeBase64: true,
    }).then(async (response) => {
      if (response) {
        await uploadProfilePhoto(response as ImageResponse);
      }
    });
  };

  const _handlePhotos = async () => {
    const PHOTO_PERMISSION = Platform.select({
      ios: PERMISSIONS.IOS.PHOTO_LIBRARY,
      android: PERMISSIONS.ANDROID.READ_MEDIA_IMAGES,
      default: PERMISSIONS.IOS.PHOTO_LIBRARY,
    });

    const photosPermission = await check(PHOTO_PERMISSION);

    if (photosPermission === RESULTS.BLOCKED) {
      await Linking.openSettings();
      return;
    }

    // if it isn't granted or limited -> ask them
    if (
      photosPermission !== RESULTS.GRANTED &&
      photosPermission !== RESULTS.LIMITED
    ) {
      const permission = await request(PHOTO_PERMISSION);

      // if (permission === RESULTS.BLOCKED) {
      //   await Linking.openSettings();
      //   return;
      // }

      if (permission !== RESULTS.GRANTED) {
        return;
      }
    }

    ImagePicker.openPicker({
      width: 300,
      height: 300,
      cropping: true,
      multiple: false,
      includeBase64: true,
      mediaType: "photo",
    }).then(async (response) => {
      if (response) {
        await uploadProfilePhoto(response as ImageResponse);
      }
    });
  };

  const _removePhoto = async () => {
    try {
      setLoading(true);

      const variables: MutationUpdateUserArgs = {
        avatarImageUrl: "", // empty string is removing it
      };

      await updateUser({
        variables,
        refetchQueries: [api.users.me],
      });

      setProfileUrl(null);
    } catch (err) {
      console.error(err);
      if (err instanceof ApolloError) {
        Alert.alert(err.message);
        return;
      }

      Alert.alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const showActionSheet = () => {
    const hasProfileUrl = !!me?.avatarImageUrl;

    const options = Platform.select({
      ios: [
        "Take Photo...",
        "Choose from Library...",
        hasProfileUrl ? "Remove Photo" : "",
        "Cancel",
      ],
      android: [
        "Take Photo...",
        "Choose from Library...",
        hasProfileUrl ? "Remove Photo" : "",
        "Cancel",
      ],
      default: [
        "Take Photo...",
        "Choose from Library...",
        hasProfileUrl ? "Remove Photo" : "",
        "Cancel",
      ],
    }).filter((o) => o as string);

    ActionSheet.showActionSheetWithOptions(
      {
        options,
        title: "Select Profile",
        tintColor: colors.lightBlue50,
        cancelButtonIndex: options.length - 1,
      },
      async (buttonIndex) => {
        if (buttonIndex === 0) {
          await _handleCamera();
        } else if (buttonIndex === 1) {
          await _handlePhotos();
        } else if (buttonIndex === 2 && hasProfileUrl) {
          await _removePhoto();
        }
      }
    );
  };

  const uploadProfilePhoto = async (result: ImageResponse) => {
    setLoading(true);

    try {
      // the part after the period, egt the png jpg etc...
      const ext = result.mime.split("/")[1];

      // random string
      const fileRef = storage().ref(
        `users/${me?.authProviderId}/avatars/${uuidv4()}.${ext}`
      );

      const upload = fileRef.putFile(result.path);

      await upload.then(async () => {
        const profileUrl = await fileRef.getDownloadURL();

        const variables = {
          avatarImageUrl: profileUrl,
        };

        await updateUser({
          variables,
          refetchQueries: [api.users.me],
        });
      });

      Alert.alert("Success", "Profile photo updated.");
    } catch (err) {
      Alert.alert("ERROR");
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(
    () => setProfileUrl(me?.avatarImageUrl || ""),
    [me?.avatarImageUrl]
  );

  //   if (__DEV__ && error) {
  //     console.log(JSON.stringify(error, null, 2));
  //   }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={!isME}
      style={{ position: "relative" }}
      onPress={showActionSheet}
    >
      <Image
        style={{
          height: 75,
          width: 75,
          borderRadius: 100,
          borderWidth: 2,
          borderColor: fullTheme.borderDark,
        }}
        source={{
          uri: profileUrl || "",
        }}
      />

      {isME && (
        <View
          style={{
            position: "absolute",
            bottom: -5,
            right: -5,
            backgroundColor: fullTheme.background,
            borderRadius: 100,
            height: 30,
            width: 30,
            padding: 5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: fullTheme.borderDark,
          }}
        >
          {isLoading ? (
            <ActivityIndicator
              style={{
                // make it 0.8 the size
                transform: [{ scale: 0.8 }],
              }}
              color={fullTheme.activityIndicator}
              size={15}
            />
          ) : (
            <FontAwesomeIcon
              icon={faPen}
              color={fullTheme.textPrimary}
              size={15}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

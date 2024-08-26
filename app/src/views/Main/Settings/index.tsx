import {
  ApolloError,
  useApolloClient,
  useLazyQuery,
  useMutation,
} from "@apollo/client";
import { faPhone, faUndo, faUser } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faBookmark,
  faBullhorn,
  faComment,
  faHeart,
  faMoon,
  faServer,
  faSignOut,
} from "@fortawesome/sharp-solid-svg-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused, useNavigation } from "@react-navigation/core";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import FastImage from "react-native-fast-image";
import InAppReview from "react-native-in-app-review";
import { OneSignal } from "react-native-onesignal";
import { useDispatch } from "react-redux";
import { api, apolloClient } from "src/api";
import { BaseUserFields } from "src/api/fragments";
import { Query } from "src/api/generated/types";
import { colors } from "src/components";
import Header from "src/components/Header";
import Section from "src/components/Section";
import { constants, X_USER_EMAIL_KEY } from "src/config";
import { Maybe } from "src/core";
import { useMe } from "src/hooks";
import { useTheme } from "src/hooks/useTheme";
import { NavigationProps } from "src/navigation";
import { auth } from "src/utils/firebase";

const Profile = () => {
  const navigation = useNavigation<NavigationProps>();
  const { me, refetchMe } = useMe("cache-first");

  const canLeaveReview = InAppReview.isAvailable();
  const [hasPush, setHasPush] = useState(false);
  const dispatch = useDispatch();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [updateUser] = useMutation(api.users.update);

  const [hasEnabledFaceId, setHasEnabledFaceId] = useState(false);
  const apolloClient = useApolloClient();
  const [getIntercomMobileToken] = useLazyQuery<
    Pick<Query, "getIntercomMobileToken">
  >(api.users.getIntercomHash);
  const [deleteMe, { loading: loadingDelete }] = useMutation(
    api.users.deleteMe
  );
  const isFocused = useIsFocused();

  const {
    toggleDarkMode,
    background,
    secondaryBackground,
    text,
    header,
    theme,
    border,
  } = useTheme();

  const _navigateToInterests = () => {
    navigation.navigate("Authentication", { screen: "Interests" });
  };

  const _logout = async () => {
    try {
      await Promise.all([auth().signOut(), OneSignal.logout()]);
    } catch (err) {
      console.log(err);
    }

    navigation.navigate("Authentication", { screen: "Welcome" });
  };

  const _leaveReview = () => {
    InAppReview.RequestInAppReview()
      .then((hasFlowFinishedSuccessfully) => {
        // when return true then flow finished successfully
      })
      .catch((error) => {
        //we continue our app flow.
        // we have some error could happen while lanuching InAppReview,
        // Check table for errors and code number that can return in catch.
        console.log(error);
      });
  };

  const _requestNotificationPermission = async () => {
    navigation.navigate("EnablePushNotifications", {
      isSignupFlow: false,
      isAirdropFlow: false,
      hideHeader: true,
      onAccept: () => {
        // Handle accept action
      },
      onDeny: () => {
        // Handle deny action
      },
    });
  };

  const _refreshMe = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsRefreshing(true);
    try {
      await refetchMe();
    } finally {
      setIsRefreshing(false);
    }
  };

  const _leaveFeedback = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const data = await getIntercomMobileToken();
    const hash = data?.data?.getIntercomMobileToken;

    if (!hash) {
      Alert.alert("Error", "Please try again later");
      return;
    }
  };

  const _updatePhoneNumber = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    navigation.navigate("PhoneNumber", {
      onSuccess: () => navigation.goBack(),
    });
  };

  const _deleteMyAccount = async () => {
    try {
      await deleteMe();

      try {
        await Promise.all([
          auth().signOut(),
          // Intercom.logout(),
          OneSignal.logout(),
        ]);
      } catch (err) {
        console.log(err);
      }

      navigation.navigate("Authentication", { screen: "Welcome" });
    } catch (err) {
      if (err instanceof ApolloError) {
        Alert.alert("Error", err.message);
      }

      Alert.alert("Error", "Please try again later");
    }
  };

  const _requestDeleteAccount = () => {
    // prompt user
    Alert.alert(
      "Are you sure?",
      "This action cannot be undone. All your data will be deleted.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: async () => _deleteMyAccount(),
        },
      ]
    );
  };

  const onShare = async () => {
    try {
      const result = await Share.share({
        title: "Pickup",
        message:
          "Track all your crypto across wallets, exchanges, and DeFi in one place.",
        url: "https://apps.apple.com/us/app/awaken-portfolio/id6472827013",
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
        } else {
          // shared
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
      }
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  useEffect(() => {
    refetchMe();
  }, [isFocused]);

  useEffect(() => {
    (async () => {
      const hasPermission = await OneSignal.Notifications.hasPermission();
      setHasPush(hasPermission);
    })();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: background,
      }}
    >
      <Header hasBackButton title="Settings" />
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            tintColor={header}
            onRefresh={_refreshMe}
          />
        }
        contentContainerStyle={{
          paddingBottom: 100,
          backgroundColor: background,
        }}
      >
        {/* <LinearGradient
          colors={[colors.lightBlue80, colors.lightBlue60]}
          start={[0, 0]}
          end={[1, 1]}
          style={{
            flex: 1,
          }}
        >
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
            onPress={onShare}
            activeOpacity={0.8}
          >
            <Text
              style={{
                flex: 1,
                textAlign: "center",
                fontFamily: "Inter-Semibold",
                color: colors.white,
                fontSize: 16,
                padding: 15,
              }}
            >
              Share Pickup with a friend
            </Text>
            <FontAwesomeIcon
              style={{
                right: 15,
                position: "absolute",
              }}
              icon={faShareAll}
              color={colors.white}
              size={24}
            />
          </TouchableOpacity>
        </LinearGradient> */}

        <View
          style={{
            alignItems: "center",
            paddingVertical: 25,
            paddingHorizontal: 20,
            backgroundColor: background,
            borderBottomWidth: 1,
            borderBottomColor: border,
            width: "100%",
          }}
        >
          {/* <View>
            <ProfilePicture user={me} />
          </View> */}

          <View style={{ alignItems: "center" }}>
            <Text
              style={[
                styles.email,
                {
                  color: text,
                  fontSize: 13,
                },
              ]}
            >
              Logged in as {me?.email || ""}
            </Text>
          </View>
        </View>

        <View
          style={{
            marginTop: 25,
            flex: 1,
            width: "100%",
            flexDirection: "column",
            display: "flex",
          }}
        >
          <Section
            onPress={() => {
              Linking.openURL(
                "https://chromewebstore.google.com/detail/pickup/dncdlmhejngpacajdfcjdgakjinohlab?authuser=0&hl=en"
              );
            }}
            icon={<FontAwesomeIcon icon={faBookmark} color={text} />}
            name="Get Chrome Extension"
          />
          <Section
            onPress={_navigateToInterests}
            icon={<FontAwesomeIcon icon={faHeart} color={text} />}
            name="Update Interests"
          />
          <Section
            onPress={_leaveFeedback}
            icon={<FontAwesomeIcon icon={faComment} color={text} />}
            name="Leave Feedback"
          />
          <Section
            onPress={_updatePhoneNumber}
            icon={<FontAwesomeIcon icon={faPhone} color={text} />}
            name="Change Phone Number"
          />
          {canLeaveReview && (
            <Section
              onPress={_leaveReview}
              icon={<FontAwesomeIcon icon={faHeart} color={text} />}
              name="Leave a Review"
            />
          )}
          {/* <Section
            onPress={_enableFaceID}
            imageComponent={
              <Image
                style={{
                  width: 15,
                  height: 15,
                }}
                source={require("src/assets/social/faceid.png")}
                tintColor={text}
              />
            }
            name={hasEnabledFaceId ? "Face ID Enabled ✅" : "Enable Face ID"}
          /> */}

          <Section
            onPress={_requestNotificationPermission}
            icon={<FontAwesomeIcon icon={faBullhorn} color={text} />}
            name="Enable Push Notifications"
          />

          <Section
            onPress={_navigateToInterests}
            icon={<FontAwesomeIcon icon={faHeart} color={text} />}
            name="Update Interests"
          />

          <Section
            icon={<FontAwesomeIcon icon={faMoon} color={text} />}
            name={"Dark mode"}
            rightIcon={
              <Switch
                trackColor={{
                  true: colors.primary,
                  false: theme === "dark" ? colors.gray20 : colors.gray60,
                }}
                value={theme === "dark"}
                onChange={() => toggleDarkMode()}
              />
            }
          />

          <View style={{ height: 1, backgroundColor: secondaryBackground }} />
          <Section
            onPress={_logout}
            icon={<FontAwesomeIcon icon={faSignOut} color={colors.red50} />}
            name="Logout"
            nameStyle={{ color: colors.red50, fontFamily: "Inter-Regular" }}
            showRightIcon={false}
          />
          <View style={{ height: 1, backgroundColor: secondaryBackground }} />

          <AdminSection />

          <View style={{ marginTop: 35, alignItems: "center" }}>
            <Text
              style={{
                fontSize: 14,
                color: text,
              }}
            >
              Version {constants.version} ({constants.build})
            </Text>

            <TouchableOpacity
              onPress={_requestDeleteAccount}
              style={{ marginTop: 15, marginBottom: 25 }}
            >
              <Text style={{ color: colors.red50, fontSize: 16 }}>
                Delete Account
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      {/* More user details or actions can be added here */}
    </View>
  );
};

const _numToFormat = (n: number) => {
  // 1 = 1st, 2 = 2nd, 3 = 3rd, 4 = 4th, etc.
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) {
    return n + "st";
  }
  if (j === 2 && k !== 12) {
    return n + "nd";
  }
  if (j === 3 && k !== 13) {
    return n + "rd";
  }
  return n + "th";
};

const AdminSection = () => {
  const { me, refetchMe } = useMe();

  const fullTheme = useTheme();
  const { secondaryBackground, header, text, background } = fullTheme;

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const key = X_USER_EMAIL_KEY;

  const _onPressSection = useCallback(async () => {
    if (userEmail) {
      await AsyncStorage.removeItem(key);

      apolloClient.refetchQueries({ include: "all" });

      return;
    }

    // prompt the user for the email

    Alert.prompt(
      "Enter the user's email",
      undefined,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "OK",
          onPress: async (email) => {
            if (!email) return;

            await AsyncStorage.setItem(key, email);
            setUserEmail(email);

            // reload the entire app

            apolloClient.refetchQueries({ include: "all" });
          },
        },
      ],
      "plain-text"
    );
  }, [userEmail]);

  const _removeUser = useCallback(async () => {
    await AsyncStorage.removeItem(key);

    await refetchMe();
    // reload the entire app
    apolloClient.refetchQueries({ include: "all" });
  }, []);

  const _setEmailFromLocalStorage = useCallback(async () => {
    const email = await AsyncStorage.getItem(key);
    setUserEmail(email);
  }, []);

  useEffect(() => {
    _setEmailFromLocalStorage();
  }, []);

  // if there is a user email, let them unset it
  if (userEmail) {
    return (
      <View>
        <Section
          onPress={_removeUser}
          icon={<FontAwesomeIcon icon={faUndo} color={text} />}
          name="Unset user"
        />
      </View>
    );
  }

  if (!me?.isSuperuser) {
    return null;
  }

  return (
    <View>
      <Text
        style={{
          fontSize: 12,
          paddingVertical: 10,
          paddingHorizontal: 30,
          fontFamily: "Mona-Sans-Bold",
          backgroundColor: secondaryBackground,
          color: header,
        }}
      >
        Admin Only 🕵️‍♂️
      </Text>
      <View style={{ height: 1, backgroundColor: secondaryBackground }} />
      <Section
        onPress={_onPressSection}
        icon={<FontAwesomeIcon icon={faUser} color={text} />}
        name="Set User"
      />
      <Section
        onPress={() =>
          Alert.alert("Nvm, going to add this later bc would be helpful.")
        }
        icon={<FontAwesomeIcon icon={faServer} color={text} />}
        name="Server API Url"
      />
      <View style={{ height: 1, backgroundColor: secondaryBackground }} />
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50, // Makes it circular
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 8,
  },
  email: {
    fontSize: 16,
    color: "gray",
    marginTop: 5,
  },
  bio: {
    textAlign: "center",
    marginVertical: 8,
  },
});

export default Profile;

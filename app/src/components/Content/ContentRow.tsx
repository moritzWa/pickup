import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  RefreshControl,
  Alert,
  Animated,
  Image,
} from "react-native";
import React, { useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "src/hooks";
import { useMutation, useQuery } from "@apollo/client";
import { api } from "src/api";
import { Query } from "src/api/generated/types";
import { NavigationProps } from "src/navigation";
import { BaseContentFields, BaseCourseFields } from "src/api/fragments";
import { colors } from "src/components";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faArrowRight,
  faCircle,
  faCircle0,
  faCircleNotch,
  faClock,
  faHourglass,
  faHourglass1,
  faHourglass3,
  faHourglassClock,
  faPlay,
  faVolumeMedium,
} from "@fortawesome/pro-solid-svg-icons";
import { Impressions } from "../../views/Main/Home/Github";
import FastImage from "react-native-fast-image";

export const ContentRow = ({ content: c }: { content: BaseContentFields }) => {
  const navigation = useNavigation<NavigationProps>();
  const theme = useTheme();
  const [startContent, { error }] = useMutation(api.content.start);
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

  const start = async () => {
    try {
      const response = await startContent({
        variables: {
          contentId: c.id,
        },
      });

      navigation.navigate("ContentSession", { contentId: c.id });
    } catch (err) {
      console.log(err);
      Alert.alert(
        "Error",
        "There was an error starting the course. Please try again."
      );
    }
  };

  const estimatedLen = Math.ceil(c.lengthSeconds / 60);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={start}
      style={{
        padding: 15,
        borderRadius: 15,
        borderColor: theme.border,
        borderWidth: 1,
        backgroundColor: theme.background,
        // shadow
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 0,
        },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 5,
        marginBottom: 15,
      }}
    >
      <View>
        <View
          style={{
            marginBottom: 10,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            flex: 1,
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              color: theme.header,
              fontSize: 18,
              flex: 1,
              marginRight: 20,
              fontFamily: "Raleway-SemiBold",
            }}
          >
            {c.title}
          </Text>

          <FastImage
            source={{
              uri: c.thumbnailImageUrl,
            }}
            style={{
              width: 25,
              height: 25,
              borderRadius: 5,
            }}
          />
        </View>

        <View>
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
                  fontFamily: "Raleway-Medium",
                }}
                numberOfLines={2}
              >
                {c.summary}
              </Text>

              <View
                style={{
                  marginTop: 15,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    flex: 1,
                    color: theme.header,
                    fontSize: 14,
                    fontFamily: "Raleway-Medium",
                  }}
                >
                  By {c.authorName}
                </Text>

                <View
                  style={{
                    display: "flex",
                    marginRight: 15,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faClock}
                    color={theme.text}
                    size={14}
                    style={{ marginRight: 5 }}
                  />

                  <Text
                    style={{
                      color: theme.text,
                      fontSize: 14,
                      fontFamily: "Raleway-Medium",
                    }}
                  >
                    {estimatedLen}m
                  </Text>
                </View>

                <View
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faCircleNotch}
                    color={theme.text}
                    size={14}
                    style={{ marginRight: 5 }}
                  />

                  <Text
                    style={{
                      color: theme.text,
                      fontSize: 14,
                      fontFamily: "Raleway-Medium",
                    }}
                  >
                    21%
                  </Text>
                </View>
              </View>

              {/* {(c.categories ?? []).length > 0 ? (
              <View
                style={{
                  marginTop: 8,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: colors.primary,
                    fontSize: 12,
                    fontFamily: "Raleway-Bold",
                    textTransform: "uppercase",
                  }}
                >
                  {(c.categories || []).join(" • ")}
                </Text>
              </View>
            ) : null} */}
            </View>

            {/* <Animated.View
            style={{
              marginLeft: 5,
              width: 55,
              height: 55,
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
              size={24}
              style={{ position: "relative", right: -2 }}
            />
          </Animated.View> */}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

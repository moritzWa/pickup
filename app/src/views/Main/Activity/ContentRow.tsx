import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  RefreshControl,
  Alert,
  Animated,
} from "react-native";
import React, { useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "src/hooks";
import { useMutation, useQuery } from "@apollo/client";
import { api } from "src/api";
import { Query } from "src/api/generated/types";
import { NavigationProps } from "src/navigation";
import { BaseContentFields, BaseCourseFields } from "src/api/fragments";
import { Button, colors } from "src/components";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faArrowRight,
  faCheck,
  faCheckCircle,
  faChevronRight,
  faPlay,
} from "@fortawesome/pro-solid-svg-icons";
import FastImage from "react-native-fast-image";
import { noop } from "lodash";

export const ContentRow = ({ content: c }: { content: BaseContentFields }) => {
  const navigation = useNavigation<NavigationProps>();
  const theme = useTheme();
  const [startCourse] = useMutation(api.courses.start);
  const animation = useRef(new Animated.Value(1)).current; // Initial scale value of 1

  const start = async (courseId: string) => {
    try {
      await startCourse({
        variables: {
          courseId,
        },
      });

      navigation.navigate("CourseDetails", { courseId: courseId });
    } catch (err) {
      console.log(err);
      Alert.alert(
        "Error",
        "There was an error starting the course. Please try again."
      );
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
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const estimatedLen = Math.ceil(c.lengthSeconds / 60);

  return (
    <View
      style={{
        margin: 5,
        borderColor: theme.border,
        borderRadius: 15,
        borderWidth: 1,
        paddingVertical: 15,
      }}
    >
      <View
        style={{
          paddingHorizontal: 15,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
          }}
        >
          <FastImage
            source={{
              uri: c.authorImageUrl,
            }}
            style={{
              width: 25,
              position: "relative",
              top: 2,
              marginRight: 10,
              height: 25,
              borderRadius: 40,
            }}
          />

          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: theme.header,
                fontSize: 16,
                fontFamily: "Raleway-SemiBold",
              }}
            >
              {c.title}
            </Text>

            <Text
              style={{
                marginTop: 5,
                color: theme.text,
                fontSize: 14,
                fontFamily: "Raleway-Medium",
              }}
            >
              {c.authorName}
              {"  "}•{"  "}
              {estimatedLen} mins
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 10,
              }}
            >
              <FontAwesomeIcon
                icon={faCheckCircle}
                color={colors.primary}
                size={16}
              />
              <Text
                style={{
                  color: theme.text,
                  fontSize: 14,
                  marginLeft: 5,
                  fontFamily: "Raleway-Medium",
                }}
              >
                Listened on July 12th
              </Text>
            </View>
          </View>

          {/* right arrow */}
          <View style={{ alignSelf: "center", alignItems: "center" }}>
            <FontAwesomeIcon
              icon={faChevronRight}
              color={theme.textSubtle}
              size={16}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

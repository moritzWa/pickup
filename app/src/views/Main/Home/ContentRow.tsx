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
import { colors } from "src/components";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowRight, faPlay } from "@fortawesome/pro-solid-svg-icons";
import { Impressions } from "./Github";
import FastImage from "react-native-fast-image";

export const ContentRow = ({ content: c }: { content: BaseContentFields }) => {
  const navigation = useNavigation<NavigationProps>();
  const theme = useTheme();
  const [startContent] = useMutation(api.content.start);
  const animation = useRef(new Animated.Value(1)).current; // Initial scale value of 1

  const start = async () => {
    try {
      await startContent({
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
              width: 45,
              marginRight: 10,
              height: 45,
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

            {(c.categories ?? []).length > 0 ? (
              <View
                style={{
                  marginTop: 10,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: theme.text,
                    fontSize: 12,
                    fontFamily: "Raleway-Bold",
                    textTransform: "uppercase",
                  }}
                >
                  {(c.categories || []).join(" • ")}
                </Text>
              </View>
            ) : null}
          </View>

          <Animated.View
            style={{
              width: 45,
              height: 45,
              borderRadius: 100,
              backgroundColor: colors.primary,
              justifyContent: "center",
              alignItems: "center",
              alignSelf: "center",
              transform: [{ scale: animation }],
            }}
          >
            <TouchableOpacity
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%",
                borderRadius: 25,
                backgroundColor: colors.pink60,
              }}
              activeOpacity={0.8}
              onPress={start}
            >
              <FontAwesomeIcon
                icon={faPlay}
                color={colors.white}
                size={24}
                style={{ position: "relative", right: -2 }}
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

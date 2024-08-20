import { View, Text, ScrollView, FlatList } from "react-native";
import React from "react";
import { useSelector } from "react-redux";
import { getQueue } from "src/redux/reducers/audio";
import { BaseContentFields } from "src/api/fragments";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faHeadset } from "@fortawesome/pro-solid-svg-icons";
import { useTheme } from "src/hooks";
import FastImage from "react-native-fast-image";
import Header from "src/components/Header";
import Close from "src/components/Close";
import { RouteProp, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "src/navigation";

const ContentDetails = () => {
  const { params } =
    useRoute<RouteProp<RootStackParamList, "ContentDetails">>();

  const theme = useTheme();
  const content = params.content ?? null;
  const plainText = (content?.content || "").replace(/<\/?[^>]+(>|$)/g, "");

  return (
    <ScrollView
      style={{
        paddingTop: 20,
      }}
    >
      <View style={{ zIndex: 100 }}>
        <Close />
      </View>

      <View style={{ marginTop: 45 }}>
        <Text
          style={{
            marginHorizontal: 15,
            fontFamily: "Raleway-Bold",
            fontSize: 22,
            marginTop: 5,
            marginBottom: 20,
            color: theme.header,
          }}
        >
          {content?.title}
        </Text>
        <Text
          style={{
            marginHorizontal: 15,
            fontFamily: "Raleway-Regular",
            lineHeight: 24,
            fontSize: 18,
            marginTop: 5,
            marginBottom: 20,
            color: theme.text,
          }}
        >
          {plainText}
        </Text>
      </View>
    </ScrollView>
  );
};

export default ContentDetails;

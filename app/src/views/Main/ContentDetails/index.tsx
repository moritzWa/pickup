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

  const content = params.content ?? null;

  return (
    <ScrollView
      style={{
        paddingTop: 20,
      }}
    >
      <View style={{ zIndex: 100 }}>
        <Close />
      </View>

      <View style={{ marginTop: 15 }}>
        <Text
          style={{
            marginHorizontal: 15,
            fontFamily: "Raleway-SemiBold",
            fontSize: 20,
            marginTop: 5,
            marginBottom: 20,
            marginRight: 50,
          }}
        >
          {content?.title}
        </Text>
        <Text
          style={{
            marginHorizontal: 15,
            fontFamily: "Raleway-Regular",
            fontSize: 16,
            marginTop: 5,
            marginBottom: 20,
            marginRight: 50,
          }}
        >
          {content?.content}
        </Text>
      </View>
    </ScrollView>
  );
};

export default ContentDetails;

import { RouteProp, useRoute } from "@react-navigation/native";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import Close from "src/components/Close";
import { useTheme } from "src/hooks";
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
            fontFamily: "Inter-Bold",
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
            fontFamily: "Inter-Regular",
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

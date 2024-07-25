import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  RefreshControl,
  Alert,
} from "react-native";
import React from "react";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "src/hooks";
import { useMutation, useQuery } from "@apollo/client";
import { api } from "src/api";
import { Query } from "src/api/generated/types";
import { NavigationProps } from "src/navigation";
import { BaseCourseFields } from "src/api/fragments";
import { colors } from "src/components";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faArrowRight,
  faCar,
  faCarBolt,
  faPlay,
} from "@fortawesome/pro-solid-svg-icons";
import { Impressions } from "./Github";
import { ContentRow } from "./ContentRow";
import { LinearGradient } from "expo-linear-gradient";

const generateImpressionsData = () => {
  const impressions = [];
  for (let i = 0; i < 365; i++) {
    impressions.push({ completed: Math.random() > 0.5 });
  }
  return impressions;
};

const impressionsData = generateImpressionsData();

const Home = () => {
  const navigation = useNavigation<NavigationProps>();
  const theme = useTheme();

  const { data, refetch, error } = useQuery<Pick<Query, "getContentFeed">>(
    api.content.feed
  );

  const [startCourse] = useMutation(api.courses.start);

  const content = data?.getContentFeed ?? [];

  const onRefresh = async () => {
    await refetch();
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FlatList
        data={content}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={onRefresh} />
        }
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 5, paddingBottom: 150 }}
        ListHeaderComponent={
          <View
            style={{
              padding: 10,
              paddingVertical: 25,
            }}
          >
            {/* <Impressions impressions={impressionsData} /> */}

            <Text
              style={{
                color: theme.header,
                fontSize: 28,
                fontWeight: "bold",
                fontFamily: "Raleway-Regular",
              }}
            >
              Hey, Andrew 👋
            </Text>
          </View>
        }
        renderItem={({ item: c }) => <ContentRow content={c} />}
      />

      <LinearGradient
        style={{
          position: "absolute",
          bottom: 93,
          height: 50,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          flexDirection: "row",
        }}
        colors={[colors.pink80, colors.pink50, colors.pink80]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity
          onPress={() => {
            // just go to the first content
            navigation.navigate("ContentSession", { contentId: content[0].id });
          }}
          style={{
            height: 50,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            flexDirection: "row",
          }}
          activeOpacity={1}
        >
          <Text
            style={{
              color: colors.white,
              fontFamily: "Raleway-SemiBold",
              textAlign: "center",
              fontSize: 18,
              fontWeight: "bold",
            }}
          >
            Car Mode
          </Text>

          <FontAwesomeIcon
            style={{ marginLeft: 10 }}
            icon={faCar}
            color={colors.white}
            size={20}
          />
        </TouchableOpacity>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default Home;

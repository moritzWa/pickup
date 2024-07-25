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
import { faArrowRight, faPlay } from "@fortawesome/pro-solid-svg-icons";
import { ContentRow } from "./ContentRow";

const Activity = () => {
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
        contentContainerStyle={{ padding: 5 }}
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
                fontSize: 26,
                fontWeight: "bold",
                fontFamily: "Raleway-Regular",
              }}
            >
              Your Activity
            </Text>
          </View>
        }
        renderItem={({ item: c }) => <ContentRow content={c} />}
      />
    </SafeAreaView>
  );
};

export default Activity;

import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
} from "react-native";
import React from "react";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "src/hooks";
import { useQuery } from "@apollo/client";
import { api } from "src/api";
import { Query } from "src/api/generated/types";
import { NavigationProps } from "src/navigation";
import { BaseCourseFields } from "src/api/fragments";
import { colors } from "src/components";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faPlay } from "@fortawesome/pro-solid-svg-icons";

const Activity = () => {
  const navigation = useNavigation<NavigationProps>();
  const theme = useTheme();

  const { data } = useQuery<Pick<Query, "getCourses">>(api.courses.list);

  const courses = data?.getCourses ?? [];

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FlatList
        data={courses}
        keyExtractor={(c) => c.id}
        ListHeaderComponent={
          <View
            style={{
              padding: 15,
            }}
          >
            <Text
              style={{
                color: theme.header,
                fontSize: 22,
                fontWeight: "bold",
              }}
            >
              Activity
            </Text>
          </View>
        }
        renderItem={({ item: c }) => <ActivityRow course={c} />}
      />
    </SafeAreaView>
  );
};

const ActivityRow = ({ course: c }: { course: BaseCourseFields }) => {
  const navigation = useNavigation<NavigationProps>();
  const theme = useTheme();

  return (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate("CourseDetails", {
          courseId: c.id,
        })
      }
      style={{
        margin: 10,
        padding: 20,
        borderColor: theme.border,
        borderRadius: 15,
        borderWidth: 1,
      }}
    >
      <Text
        style={{
          color: theme.header,
          fontSize: 18,
        }}
      >
        {c.title}
      </Text>

      <Text
        style={{
          color: theme.text,
          fontSize: 16,
          marginVertical: 5,
        }}
      >
        {c.subtitle}
      </Text>
    </TouchableOpacity>
  );
};

export default Activity;

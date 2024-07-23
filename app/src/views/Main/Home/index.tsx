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

const Home = () => {
  const navigation = useNavigation<NavigationProps>();
  const theme = useTheme();

  const { data, refetch, error } = useQuery<Pick<Query, "getCourses">>(
    api.courses.list
  );

  const [startCourse] = useMutation(api.courses.start);

  const courses = data?.getCourses ?? [];

  const onRefresh = async () => {
    await refetch();
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FlatList
        data={courses}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={onRefresh} />
        }
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
              Welcome, Andrew
            </Text>
          </View>
        }
        renderItem={({ item: c }) => <CourseRow course={c} />}
      />
    </SafeAreaView>
  );
};

const CourseRow = ({ course: c }: { course: BaseCourseFields }) => {
  const navigation = useNavigation<NavigationProps>();
  const theme = useTheme();
  const [startCourse] = useMutation(api.courses.start);

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

  return (
    <View
      style={{
        margin: 10,
        borderColor: theme.border,
        borderRadius: 15,
        borderWidth: 1,
        paddingTop: 20,
      }}
    >
      <View
        style={{
          paddingHorizontal: 20,
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
      </View>

      <View
        style={{
          marginTop: 0,
          padding: 15,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          style={{
            backgroundColor: theme.secondaryBackground,
            padding: 12,
            flex: 1,
            marginRight: 5,
            borderRadius: 25,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
          onPress={() =>
            navigation.navigate("CourseDetails", { courseId: c.id })
          }
        >
          <Text
            style={{
              color: theme.text,
              fontWeight: "bold",
              fontSize: 16,
            }}
          >
            Details
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            padding: 12,
            borderRadius: 25,
            backgroundColor: colors.pink60,
          }}
          onPress={() => {
            if (c.mostRecentLesson) {
              navigation.navigate("LessonDetails", {
                lessonId: c.mostRecentLesson?.id,
              });
            }
            if (c.isStarted) {
              navigation.navigate("CourseDetails", { courseId: c.id });
            } else {
              start(c.id);
            }
          }}
        >
          <Text
            style={{
              color: colors.white,
              fontWeight: "bold",
              fontSize: 16,
            }}
          >
            {c.isStarted ? "Continue" : "Start"}
          </Text>

          <FontAwesomeIcon
            icon={c.isStarted ? faPlay : faArrowRight}
            color={colors.white}
            size={20}
            style={{ marginLeft: 10 }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Home;

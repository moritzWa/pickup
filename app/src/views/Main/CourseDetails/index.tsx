import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import React, { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { api } from "src/api";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NavigationProps, RootStackParamList } from "src/navigation";
import {
  Query,
  QueryGetCourseArgs,
  QueryGetCourseLessonsArgs,
} from "src/api/generated/types";
import Header from "src/components/Header";
import { BaseLessonFields } from "src/api/fragments";
import { useTheme } from "src/hooks";
import { Button } from "src/components";
import StatusTag from "src/components/StatusTag";
import * as Haptics from "expo-haptics";

const CourseDetails = () => {
  const route = useRoute<RouteProp<RootStackParamList, "CourseDetails">>();
  const courseId = route.params?.courseId || "";

  const courseVariables = useMemo(
    (): QueryGetCourseArgs => ({
      courseId,
    }),
    [courseId]
  );

  const lessonsVariables = useMemo(
    (): QueryGetCourseLessonsArgs => ({
      courseId,
    }),
    [courseId]
  );

  const {
    data: lessonsData,
    error: lessonError,
    refetch: refetchLessons,
  } = useQuery<Pick<Query, "getCourseLessons">>(api.courses.lessons, {
    skip: !lessonsVariables.courseId,
    variables: lessonsVariables,
  });

  const {
    data: courseData,
    error,
    refetch: refetchCourse,
  } = useQuery<Pick<Query, "getCourse">>(api.courses.get, {
    skip: !courseVariables.courseId,
    variables: courseVariables,
  });

  const _onRefresh = () => {
    refetchLessons();
    refetchCourse();
  };

  const lessons = lessonsData?.getCourseLessons ?? [];
  const course = courseData?.getCourse;

  console.log(lessons);

  return (
    <View style={{ flex: 1 }}>
      <Header hasBackButton title={course?.title} />

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={_onRefresh} />
        }
        contentContainerStyle={{ flex: 1 }}
      >
        <View
          style={{
            padding: 10,
            height: 50,
          }}
        >
          <Text
            style={{
              fontSize: 16,
            }}
          >
            {course?.subtitle}
          </Text>
        </View>

        <View
          style={{
            padding: 10,
          }}
        >
          <Text style={{ fontSize: 20 }}>Lessons</Text>
        </View>

        <FlatList
          data={lessons}
          keyExtractor={(l) => l.id}
          renderItem={({ item }) => <LessonRow lesson={item} />}
        />
      </ScrollView>
    </View>
  );
};

const LessonRow = ({ lesson }: { lesson: BaseLessonFields }) => {
  const navigation = useNavigation<NavigationProps>();
  const theme = useTheme();

  const _onStartLesson = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // start a lesson
    navigation.navigate("LessonSession", {
      lessonId: lesson.id,
    });
  };

  return (
    <View
      style={{
        borderRadius: 10,
        margin: 10,
        padding: 10,
        borderColor: theme.border,
        borderWidth: 1,
      }}
    >
      <View
        style={{
          position: "absolute",
          top: 10,
          right: 10,
        }}
      >
        <StatusTag type="info" label={lesson.type} />
      </View>

      <Text
        style={{
          fontSize: 18,
        }}
      >
        {lesson.title}
      </Text>

      <Text
        style={{
          marginVertical: 5,
        }}
      >
        {lesson.subtitle}
      </Text>

      <View style={{ marginTop: 15 }}>
        <Button label="Start Lesson" onPress={_onStartLesson} />
      </View>
    </View>
  );
};

export default CourseDetails;

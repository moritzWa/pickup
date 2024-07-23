import {
  View,
  Text,
  Button,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as FileSystem from "expo-file-system";
import { Audio } from "expo-av";
import { useTheme } from "src/hooks";
import { colors } from "src/components";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faPlay } from "@fortawesome/pro-solid-svg-icons";
import { RouteProp, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "src/navigation";
import { useQuery } from "@apollo/client";
import { Query, QueryGetLessonArgs } from "src/api/generated/types";
import { api } from "src/api";
import Back from "src/components/Back";

const LessonSession = () => {
  const route = useRoute<RouteProp<RootStackParamList, "LessonSession">>();
  const lessonId = route.params?.lessonId || "";

  const lessonVariables = useMemo(
    (): QueryGetLessonArgs => ({
      lessonId,
    }),
    [lessonId]
  );

  const {
    data: lessonData,
    error,
    refetch: refetchCourse,
  } = useQuery<Pick<Query, "getLesson">>(api.lessons.get, {
    skip: !lessonVariables.lessonId,
    variables: lessonVariables,
  });

  const [recording, setRecording] = useState<Audio.Recording>();
  const [isRecording, setIsRecording] = useState(false);
  const silenceTimer = useRef<NodeJS.Timeout | null>(null);
  const audioAnalyzer = useRef(null);
  const levelCheckInterval = useRef(null);

  useEffect(() => {
    return () => {
      if (recording) {
        stopRecording();
      }
    };
  }, []);

  async function startRecording() {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);

      // Start monitoring audio levels
      startAudioLevelMonitoring(recording);
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  }

  async function stopRecording() {
    setIsRecording(false);
    if (!recording) {
      return;
    }

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (uri) {
        sendAudioToBackend(uri);
      }
    } catch (error) {
      console.error("Failed to stop recording", error);
    }

    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current);
      silenceTimer.current = null;
    }
  }

  const startAudioLevelMonitoring = (recordingObject: Audio.Recording) => {
    levelCheckInterval.current = setInterval(async () => {
      if (recordingObject) {
        try {
          const status = await recordingObject.getStatusAsync();

          if (status.isRecording) {
            const { metering = -160 } = status;
            if (metering > -50) {
              // Adjust this threshold as needed
              // Reset silence timer if sound is detected
              if (silenceTimer.current) {
                clearTimeout(silenceTimer.current);
              }
              silenceTimer.current = setTimeout(() => {
                stopRecording();
              }, 1500); // Stop after 1.5 seconds of silence
            }
          }
        } catch (error) {
          console.error("Error getting recording status:", error);
        }
      }
    }, 100); // Check every 100ms
  };

  const sendAudioToBackend = async (audioUri: string) => {
    try {
      // Read the file as a blob
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      const audioBlob = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const formData = new FormData();
      formData.append("audio", {
        uri: audioUri,
        type: "audio/m4a",
        name: "audio.m4a",
      } as any); // Use 'as any' to bypass TypeScript checking

      //   const response = await axios.post("YOUR_BACKEND_URL", formData, {
      //     headers: {
      //       "Content-Type": "multipart/form-data",
      //     },
      //   });
      console.log("Backend response:", response.data);
    } catch (error) {
      console.error("Error sending audio to backend:", error);
    }
  };

  const theme = useTheme();
  const SIZE = 125;
  const lesson = lessonData?.getLesson;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ marginLeft: 15 }}>
        <Back />
      </View>

      <View
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* make a play button that is colors.pink and uses fontawesome */}
        <View
          style={{
            width: SIZE,
            height: SIZE,
            borderRadius: 100,
            backgroundColor: colors.pink90,
            justifyContent: "center",
            alignItems: "center",
            alignSelf: "center",
          }}
        >
          <TouchableOpacity
            style={{
              width: SIZE - 25,
              height: SIZE - 25,
              borderRadius: 100,
              backgroundColor: colors.pink50,
              justifyContent: "center",
              alignItems: "center",
            }}
            activeOpacity={0.8}
            onPress={startRecording}
          >
            <FontAwesomeIcon
              style={{
                position: "relative",
                right: -3,
              }}
              icon={faPlay}
              color={colors.white}
              size={48}
            />
          </TouchableOpacity>
        </View>

        <Text
          style={{
            marginTop: 20,
            color: theme.header,
          }}
        >
          {isRecording ? "Recording..." : "Not recording"}
        </Text>
      </View>

      <TouchableOpacity
        style={{
          padding: 20,
          borderRadius: 20,
          margin: 10,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: theme.secondaryBackground,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            backgroundColor: theme.background,
            borderRadius: 40,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginRight: 10,
          }}
        >
          <Text
            style={{
              fontSize: 20,
            }}
          >
            🌴
          </Text>
        </View>

        <View>
          <Text
            style={{
              color: theme.header,
              fontSize: 16,
            }}
          >
            {lesson?.title}
          </Text>

          <Text
            style={{
              marginTop: 5,
              color: theme.text,
              fontSize: 14,
            }}
          >
            {lesson?.subtitle}
          </Text>
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default LessonSession;

import {
  View,
  Text,
  Button,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Animated,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SIZE = 150;

const LessonSession = () => {
  const route = useRoute<RouteProp<RootStackParamList, "LessonSession">>();
  const lessonId = route.params?.lessonId || "";
  const animation = useRef(new Animated.Value(1)).current; // Initial scale value of 1

  const [recording, setRecording] = useState<Audio.Recording>();
  const [isRecording, setIsRecording] = useState(false);
  const silenceTimer = useRef<NodeJS.Timeout | null>(null);
  const audioAnalyzer = useRef(null);
  const levelCheckInterval = useRef(null);
  const [timer, setTimer] = useState(0);

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

  useEffect(() => {
    return () => {
      if (recording) {
        stopRecording();
      }
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRecording) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1);
      }, 1000);
    } else {
      if (interval) {
        clearInterval(interval);
      }
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
      if (recording) {
        stopRecording();
      }
    };
  }, [isRecording]);

  async function startRecording() {
    try {
      await stopRecording(); // Stop any existing recording

      await Audio.requestPermissionsAsync();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recordingObject = new Audio.Recording();

      setRecording(recordingObject);

      await recordingObject.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      await recordingObject.startAsync();

      // Your state management here (if using React)
      setIsRecording(true);
      setTimer(0);

      console.log(recordingObject);

      // Start monitoring audio levels
      // startAudioLevelMonitoring(recordingObject);
    } catch (err) {
      console.error("Failed to start recording", err);
      console.log(recording);

      // stop the recording
      if (recording) {
        await stopRecording();
      }
    }
  }

  async function stopRecording() {
    setIsRecording(false);
    setTimer(0);

    try {
      if (!recording) {
        return;
      }

      try {
        await recording.stopAndUnloadAsync();

        const uri = recording.getURI();

        if (uri) {
          console.log("Recording saved to", uri);
          // sendAudioToBackend(uri);
        }
      } catch (error) {
        console.error("Failed to stop recording", error);
      }

      if (silenceTimer.current) {
        clearTimeout(silenceTimer.current);
        silenceTimer.current = null;
      }
    } catch (error) {
      console.error("Failed to unload recording", error);
    }
  }

  const handlePressIn = () => {
    Animated.spring(animation, {
      toValue: 0.85, // Scale down to 90%
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

  const _startOrStopRecording = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

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
  const lesson = lessonData?.getLesson;
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ position: "absolute", top: insets.top + 15, left: 15 }}>
        <Back />
      </View>

      {isRecording ? (
        <View
          style={{
            paddingHorizontal: 15,
            paddingVertical: 10,
            position: "absolute",
            top: insets.top + 15,
            right: 15,
            backgroundColor: colors.red100,
            borderRadius: 10,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: colors.red50,
              width: 10,
              height: 10,
              borderRadius: 100,
              marginRight: 10,
            }}
          />
          <Text style={{ color: colors.red, fontSize: 16 }}>
            {new Date(timer * 1000).toISOString().substr(11, 8)}
          </Text>
        </View>
      ) : (
        <View
          style={{
            paddingHorizontal: 15,
            paddingVertical: 10,
            position: "absolute",
            top: insets.top + 15,
            right: 15,
            backgroundColor: theme.secondaryBackground,
            borderRadius: 10,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: theme.text,
              width: 10,
              height: 10,
              borderRadius: 100,
              marginRight: 10,
            }}
          />
          <Text style={{ color: theme.text, fontSize: 16 }}>Not Recording</Text>
        </View>
      )}

      <View
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* make a play button that is colors.pink and uses fontawesome */}
        <Animated.View
          style={{
            width: SIZE,
            height: SIZE,
            borderRadius: 100,
            backgroundColor: colors.pink90,
            justifyContent: "center",
            alignItems: "center",
            alignSelf: "center",
            transform: [{ scale: animation }],
          }}
        >
          <TouchableOpacity
            style={{
              width: SIZE - 15,
              height: SIZE - 15,
              borderRadius: 100,
              backgroundColor: colors.pink50,
              justifyContent: "center",
              alignItems: "center",
            }}
            activeOpacity={0.8}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={_startOrStopRecording}
          >
            <FontAwesomeIcon
              style={{
                position: "relative",
                right: -3,
              }}
              icon={faPlay}
              color={colors.white}
              size={64}
            />
          </TouchableOpacity>
        </Animated.View>
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
              fontWeight: "bold",
              fontFamily: "Raleway-Italic",
              fontSize: 24,
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

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
import { useMe, useTheme } from "src/hooks";
import { colors } from "src/components";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faIslandTreePalm,
  faPause,
  faPlay,
  faRedo,
  faReplyAll,
  faTree,
} from "@fortawesome/pro-solid-svg-icons";
import { RouteProp, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "src/navigation";
import { useMutation, useQuery } from "@apollo/client";
import { Mutation, Query, QueryGetLessonArgs } from "src/api/generated/types";
import { api } from "src/api";
import Back from "src/components/Back";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Voice from "@react-native-voice/voice";
import * as Speech from "expo-speech";
import { storage } from "src/utils/firebase";

const SIZE = 150;

const ContentSession = () => {
  const route = useRoute<RouteProp<RootStackParamList, "ContentSession">>();
  const contentId = route.params?.contentId || "";
  const animation = useRef(new Animated.Value(1)).current; // Initial scale value of 1

  const { me } = useMe();
  const [respond, { error: respondError, data: respondData }] = useMutation<
    Pick<Mutation, "respond">
  >(api.lessons.respond);

  const [recording, setRecording] = useState<Audio.Recording>();
  const [lastRecordingUri, setLastRecordingUri] = useState<string | null>(null);
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
        Audio.RecordingOptionsPresets.LOW_QUALITY
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

        // const { transcription } = await Speech.speak(uri);
        if (uri) {
          setLastRecordingUri(uri);

          const fileData = await FileSystem.readAsStringAsync(uri, {
            encoding: "base64",
          });

          // log the size of the file data
          console.log("File size:", fileData.length);

          // await transcribe({
          //   variables: {
          //     lessonId,
          //     audioFileUrl: "",
          //   },
          // });
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

  const _playRecordingUri = async () => {
    try {
      if (lastRecordingUri) {
        const fileName = lastRecordingUri.split("/").pop();

        console.log(fileName);

        const fileRef = storage().ref(
          `users/${me?.authProviderId}/recordings/${Date.now()}-${fileName}`
        );

        const upload = fileRef.putFile(lastRecordingUri);

        await upload.then(async () => {
          const url = await fileRef.getDownloadURL();

          console.log(`audio url: ${url}`);

          await respond({
            variables: {
              lessonId,
              audioFileUrl: url,
            },
          });
        });

        // const fileObj = {
        //   uri: lastRecordingUri,
        //   name: "audio.aac",
        //   type: "audio/aac",
        // };

        // const { sound } = await Audio.Sound.createAsync(
        //   { uri: lastRecordingUri },
        //   { shouldPlay: true }
        // );

        // upload it to server
      }
    } catch (err) {
      console.log(err);
    }
  };

  const _playAudio = async (uri: string) => {
    try {
      console.log("recording====");
      console.log(uri);
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, volume: 1 }
      );
    } catch (err) {
      console.log(err);
    }
  };

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

  const _openLesson = () => {
    // TODO: lesson
  };

  const theme = useTheme();
  const lesson = lessonData?.getLesson;
  const insets = useSafeAreaInsets();

  if (__DEV__ && respondError) {
    console.log(respondError);
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <View style={{ position: "absolute", top: insets.top + 15, left: 15 }}>
        <Back />
      </View>

      {isRecording ? (
        <View
          style={{
            paddingVertical: 10,
            position: "absolute",
            top: insets.top + 15,
            right: 15,
            width: 130,
            backgroundColor: colors.red100,
            borderRadius: 100,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
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
            paddingVertical: 10,
            position: "absolute",
            top: insets.top + 15,
            width: 130,
            justifyContent: "center",
            right: 15,
            backgroundColor: theme.secondaryBackground,
            borderRadius: 100,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
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
            activeOpacity={1}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={_startOrStopRecording}
          >
            <FontAwesomeIcon
              style={{
                position: "relative",
                right: !isRecording ? -5 : 0,
              }}
              icon={isRecording ? faPause : faPlay}
              color={colors.white}
              size={64}
            />
          </TouchableOpacity>
        </Animated.View>

        {lastRecordingUri && (
          <View
            style={{
              padding: 15,
              marginTop: 15,
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              style={{
                padding: 10,
                paddingHorizontal: 15,
                backgroundColor: theme.header,
                borderRadius: 100,
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
              onPress={_playRecordingUri}
            >
              <FontAwesomeIcon
                icon={faRedo}
                color={theme.background}
                size={24}
                style={{ marginRight: 10 }}
              />
              <Text
                style={{
                  color: theme.background,
                  fontSize: 18,
                  fontFamily: "Raleway-Medium",
                }}
              >
                Play Recording
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {respondData ? (
          <>
            <Text
              style={{
                color: theme.text,
                marginTop: 15,
                fontSize: 16,
                fontFamily: "Raleway-Regular",
              }}
            >
              {respondData?.respond?.transcription}
            </Text>
            {/* click to play the responseAudioUrl */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={{
                padding: 15,
                backgroundColor: theme.header,
                borderRadius: 100,
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                marginTop: 15,
              }}
              onPress={async () => {
                // play the audio here

                await _playAudio(respondData?.respond?.responseAudioUrl || "");
              }}
            >
              <FontAwesomeIcon
                icon={faReplyAll}
                color={theme.background}
                size={24}
                style={{ marginRight: 10 }}
              />
              <Text
                style={{
                  color: theme.background,
                  fontSize: 18,
                  fontFamily: "Raleway-Medium",
                }}
              >
                Play Response
              </Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={_openLesson}
        style={{
          padding: 20,
          paddingVertical: 25,
          borderTopWidth: 1,
          borderColor: theme.border,
          paddingBottom: insets.bottom + 25,
          borderTopRightRadius: 30,
          borderTopLeftRadius: 30,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: theme.secondaryBackground,
        }}
      >
        <View
          style={{
            // wrap the text
            flex: 1,
          }}
        >
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 5,
            }}
          >
            <Text
              style={{
                color: theme.header,
                fontWeight: "bold",
                fontFamily: "Raleway-Bold",
                fontSize: 24,
                flex: 1,
              }}
            >
              {lesson?.title}
            </Text>

            <View
              style={{
                width: 30,
                height: 30,
                backgroundColor: colors.black,
                borderRadius: 40,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginRight: 10,
              }}
            >
              <FontAwesomeIcon
                icon={faIslandTreePalm}
                size={12}
                color={colors.white}
              />
            </View>
          </View>

          <Text
            style={{
              marginTop: 5,
              color: theme.text,
              fontSize: 18,
              fontFamily: "Raleway-Regular",
            }}
          >
            {lesson?.subtitle}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default ContentSession;

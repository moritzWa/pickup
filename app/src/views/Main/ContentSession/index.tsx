import {
  View,
  Text,
  Button,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Animated,
  StyleSheet,
  Dimensions,
} from "react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as FileSystem from "expo-file-system";
import { AVPlaybackStatus, Audio } from "expo-av";
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
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "src/navigation";
import { useMutation, useQuery } from "@apollo/client";
import {
  Mutation,
  Query,
  QueryGetContentArgs,
  QueryGetLessonArgs,
} from "src/api/generated/types";
import { api } from "src/api";
import Back from "src/components/Back";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Voice from "@react-native-voice/voice";
import * as Speech from "expo-speech";
import { storage } from "src/utils/firebase";
import { noop } from "lodash";
import FastImage from "react-native-fast-image";
import Slider from "@react-native-community/slider";
import { useSpeech } from "./useSpeech";

const SIZE = 150;

const ContentSession = () => {
  const route = useRoute<RouteProp<RootStackParamList, "ContentSession">>();
  const contentId = route.params?.contentId || "";
  const isCarMode =
    route.params?.isCarMode || false || route.name === "CarMode";

  const animation = useRef(new Animated.Value(1)).current; // Initial scale value of 1

  const { width } = Dimensions.get("window");

  const { me } = useMe();
  // const [respond, { error: respondError, data: respondData }] = useMutation<
  //   Pick<Mutation, "respond">
  // >(api.lessons.respond);

  const [recording, setRecording] = useState<Audio.Recording>();
  const [sound, setSound] = useState<Audio.Sound>();

  const [lastRecordingUri, setLastRecordingUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const [soundStatus, setSoundStatus] = useState<"none" | "paused" | "playing">(
    "none"
  );
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  const silenceTimer = useRef<NodeJS.Timeout | null>(null);
  const audioAnalyzer = useRef(null);
  const levelCheckInterval = useRef(null);
  const [timer, setTimer] = useState(0);
  const { startSpeech } = useSpeech();

  const contentVariables = useMemo(
    (): QueryGetContentArgs => ({
      contentId,
    }),
    [contentId]
  );

  const { data: contentData, error } = useQuery<Pick<Query, "getContent">>(
    api.content.get,
    {
      skip: !contentVariables.contentId,
      variables: contentVariables,
    }
  );

  const theme = useTheme();
  const content = contentData?.getContent;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const estimatedLen = Math.ceil((content?.lengthSeconds || 0) / 60);

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

  const updateStatus = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis || 0);
    } else {
      if (status.error) {
        console.log(`FATAL PLAYER ERROR: ${status.error}`);
      }
    }
  };

  async function startRecording() {
    try {
      // _detectSpeech();
      // await stopRecording(); // Stop any existing recording
      // await Audio.requestPermissionsAsync();
      // await Audio.setAudioModeAsync({
      //   allowsRecordingIOS: true,
      //   playsInSilentModeIOS: true,
      // });
      // const recordingObject = new Audio.Recording();
      // setRecording(recordingObject);
      // await recordingObject.prepareToRecordAsync(
      //   Audio.RecordingOptionsPresets.LOW_QUALITY
      // );
      // await recordingObject.startAsync();
      // recordingObject.setOnRecordingStatusUpdate((status) => {
      //   console.log("db: " + status.metering);
      // });
      // // Your state management here (if using React)
      // setIsRecording(true);
      // setTimer(0);
      // console.log(recordingObject);
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

  const pause = async () => {
    if (sound) {
      await sound.pauseAsync();
      setSoundStatus("paused");

      // set the position to be the correct one
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        setPosition(status.positionMillis);
      }
    }
  };

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

          // await respond({
          //   variables: {
          //     lessonId,
          //     audioFileUrl: url,
          //   },
          // });
        });

        // const fileObj = {
        //   uri: lastRecordingUri,
        //   name: "audio.aac",
        //   type: "audio/aac",
        // };

        // upload it to server
      }
    } catch (err) {
      console.log(err);
    }
  };

  const play = async () => {
    try {
      if (soundStatus === "paused" && sound) {
        // unpause and set to not paused
        await sound.playAsync();
        setSoundStatus("playing");
        return;
      }

      // we preload the sound (or try to)
      if (sound) {
        console.log(sound);
        // play it and set playing
        await sound.playAsync();
        setSoundStatus("playing");
        return;
      }

      if (!sound) {
        const newSound = await _loadSound();

        if (!newSound) {
          return;
        }

        setSound(newSound);
        setSoundStatus("playing");
        return;
      }

      // otherwise play
    } catch (err) {
      console.log(err);
    }
  };

  const playOrPause = async () => {
    if (soundStatus === "playing") {
      await pause();
      setSoundStatus("paused");
    } else {
      await play();
      setSoundStatus("playing");
    }
  };

  const _loadSound = async () => {
    try {
      if (content?.audioUrl) {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: content?.audioUrl },
          { shouldPlay: false }
        );

        setSound(newSound);
        newSound.setOnPlaybackStatusUpdate(updateStatus);

        return newSound;
      }

      return null;
    } catch (err) {
      console.log(err);
    }
  };

  // useEffect(() => {
  //   startSpeech();
  // }, []);

  // on page load try to load the sound
  useEffect(() => {
    if (content?.audioUrl) {
      _loadSound();
    }
  }, [content?.audioUrl]);

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

  const onSlidingComplete = async (value: number) => {
    if (sound) {
      await sound.setPositionAsync(value);
      if (soundStatus !== "playing") {
        await sound.playAsync();
        setSoundStatus("playing");
      }
    }
  };

  const formatTime = (timeMillis: number) => {
    const totalSeconds = Math.floor(timeMillis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  };

  const listenForSpeech = async () => {
    try {
      Voice.onSpeechStart = () => {
        console.log("Speech started.");
      };

      Voice.onSpeechEnd = () => {
        console.log("Speech ended.");
      };

      Voice.onSpeechResults = (e) => {
        console.log("Speech results.");
        console.log(e);
        // console.log(e.value[0]);
      };

      await Voice.start("en-US");
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    void listenForSpeech();

    return () => {
      console.log("destroying voice");
      Voice.destroy();
    };
  }, []);

  // get the time we are in the audio and the time left for the audio
  const currentTime = formatTime(position);

  // console.log(position, duration);

  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingBottom: isCarMode ? 65 : 0,
      }}
    >
      {!isCarMode && (
        <View
          style={{
            position: "absolute",
            zIndex: 100,
            top: insets.top + 20,
            left: 15,
          }}
        >
          <Back hideBack onPress={() => navigation.goBack()} />
        </View>
      )}

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
          alignItems: "flex-start",
          justifyContent: "flex-start",
          marginTop: 225,
        }}
      >
        {/* make a play button that is colors.pink and uses fontawesome */}
        <Animated.View
          style={{
            width: SIZE,
            height: SIZE,
            borderRadius: 100,
            backgroundColor:
              theme.theme === "dark" ? colors.purple20 : colors.purple90,
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
              backgroundColor: colors.primary,
              justifyContent: "center",
              alignItems: "center",
            }}
            activeOpacity={1}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={playOrPause}
          >
            <FontAwesomeIcon
              style={{
                position: "relative",
                right:
                  soundStatus === "none" || soundStatus === "paused" ? -5 : 0,
              }}
              icon={
                soundStatus === "none" || soundStatus === "paused"
                  ? faPlay
                  : faPause
              }
              color={colors.white}
              size={64}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* <TouchableOpacity
          activeOpacity={0.8}
          style={{
            padding: 10,
            marginTop: 15,
            paddingHorizontal: 15,
            alignSelf: "center",
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
        </TouchableOpacity> */}

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
      </View>

      <View
        style={[
          styles.container,
          {
            marginBottom: 30,
          },
        ]}
      >
        <Slider
          style={{
            width: width * 1.75,
            alignSelf: "center",
            height: 35,
            transform: [{ scaleX: 0.5 }, { scaleY: 0.5 }],
          }}
          minimumValue={0}
          maximumValue={duration}
          value={position}
          onSlidingComplete={onSlidingComplete}
          minimumTrackTintColor={theme.header}
          maximumTrackTintColor={theme.secondaryBackground2}
          thumbTintColor={theme.header}
          // change the size of the thumb
        />

        <View
          style={{
            width: "87%",
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            marginHorizontal: 15,
          }}
        >
          <Text
            style={{
              color: theme.text,
              fontSize: 14,
              fontFamily: "Raleway-Medium",
            }}
          >
            {formatTime(position)}
          </Text>

          <Text
            style={{
              color: theme.text,
              fontSize: 14,
              fontFamily: "Raleway-Medium",
            }}
          >
            -{formatTime(duration - position)}
          </Text>
        </View>
      </View>

      <View
        style={{
          marginHorizontal: 15,
          marginBottom: insets.bottom + 15,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            backgroundColor: theme.secondaryBackground,
            borderRadius: 30,
            padding: 15,
          }}
        >
          <FastImage
            source={{
              uri: content?.authorImageUrl,
            }}
            style={{
              width: 45,
              marginRight: 10,
              height: 45,
              borderRadius: 40,
              borderColor: theme.header,
              borderWidth: 1,
            }}
          />

          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: theme.header,
                fontSize: 18,
                fontFamily: "Raleway-Bold",
              }}
            >
              {content?.title}
            </Text>

            <Text
              style={{
                marginTop: 10,
                color: theme.text,
                fontSize: 16,
                fontFamily: "Raleway-Medium",
              }}
            >
              {content?.authorName}
              {"  "}•{"  "}
              {estimatedLen} mins
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
  },
  slider: {
    width: "90%",
    height: 40,
  },
  customThumb: {
    position: "absolute",
    top: 12,
    width: 40, // Adjust thumb size
    height: 40, // Adjust thumb size
    borderRadius: 20, // Make it circular
    justifyContent: "center",
    alignItems: "center",
  },
  innerThumb: {
    width: 20, // Inner thumb size
    height: 20, // Inner thumb size
    borderRadius: 10, // Make it circular
    backgroundColor: "#1EB1FC", // Thumb color
  },
});

export default ContentSession;

import { View, Text, Button, SafeAreaView } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import * as FileSystem from "expo-file-system";
import { Audio } from "expo-av";
import { useTheme } from "src/hooks";

const Lesson = () => {
  return (
    <SafeAreaView>
      <Text>Lesson</Text>

      <AudioStreamingComponent />
    </SafeAreaView>
  );
};

const AudioStreamingComponent = () => {
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

  return (
    <View>
      <Button
        title={isRecording ? "Stop Recording" : "Start Recording"}
        onPress={isRecording ? stopRecording : startRecording}
      />
      <Text
        style={{
          color: theme.header,
        }}
      >
        {isRecording ? "Recording..." : "Not recording"}
      </Text>
    </View>
  );
};

export default Lesson;

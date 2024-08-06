import { AppContext } from "App";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import * as FileSystem from "expo-file-system";
import { useContext } from "react";
import { JSHash, JSHmac, CONSTANTS } from "react-native-hash";
import { useDispatch } from "react-redux";
import {
  DefaultErrors,
  failure,
  FailureOrSuccess,
  success,
  UnexpectedError,
} from "src/core";
import {
  setAudioUrl,
  setCurrentMs,
  setDurationMs,
  setIsPlaying,
} from "src/redux/reducers/audio";

export const useAudio = () => {
  const { sound: globalSound } = useContext(AppContext);
  const dispatch = useDispatch();

  const getFileName = async (url: string): Promise<string> => {
    const hash = await JSHash("message", CONSTANTS.HashAlgorithms.sha256);
    const fileType = url.split(".").pop();
    return `audio-${hash}.${fileType}`;
  };

  const getStoredFiles = async () => {
    // Path to the documents directory
    const documentsPath = FileSystem.documentDirectory;

    if (!documentsPath) {
      return;
    }

    // List files in the documents directory
    const result = await FileSystem.readDirectoryAsync(documentsPath);

    console.log("Cached files: ", result.length);
  };

  const downloadAndPlayAudio = async (
    url: string
  ): Promise<FailureOrSuccess<DefaultErrors, Audio.Sound>> => {
    // await getStoredFiles();

    if (!globalSound) {
      return failure(new UnexpectedError("No sound object found"));
    }

    const fileName = await getFileName(url);
    const fileUri = (FileSystem.documentDirectory || "") + fileName;

    try {
      const { uri } = await FileSystem.downloadAsync(url, fileUri, {
        sessionType: FileSystem.FileSystemSessionType.BACKGROUND,
      });

      console.log("File downloaded to:", uri);

      const sound = new Audio.Sound();

      globalSound.current = sound;

      dispatch(setAudioUrl(url));

      // make it so it can play even if it is muted
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          //   console.log(status);
          dispatch(setCurrentMs(status.positionMillis));
          dispatch(setDurationMs(status.durationMillis ?? 0));
        }
      });

      // read file from memory
      await sound.loadAsync(
        {
          uri: uri,
        },
        {
          shouldPlay: false,
        }
      );

      await sound.playAsync();
      dispatch(setIsPlaying(true));

      return success(sound);
    } catch (error) {
      console.error(error);
      return failure(new UnexpectedError(error));
    }
  };

  const toggle = async (sound: Audio.Sound) => {
    try {
      const status = await sound.getStatusAsync();

      if (status.isLoaded) {
        // if playing -> pause
        if (status.isPlaying) {
          await sound.pauseAsync();
          dispatch(setIsPlaying(false));
          console.log("paused");
          return;
        }

        // if paused -> play
        await sound.playAsync();
        dispatch(setIsPlaying(true));
        console.log("playing");
        return;
      }

      await sound.playAsync();
      dispatch(setIsPlaying(true));
    } catch (error) {
      console.log(error);
    }
  };

  return {
    downloadAndPlay: downloadAndPlayAudio,
    toggle,
  };
};

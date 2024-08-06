import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { JSHash, JSHmac, CONSTANTS } from "react-native-hash";

export const useAudio = () => {
  // TODO: be able to preload and stuff as well

  const getFileName = async (url: string): Promise<string> => {
    const hash = await JSHash("message", CONSTANTS.HashAlgorithms.sha256);
    const fileType = url.split(".").pop();
    return `audio-${hash}.${fileType}`;
  };

  const getAudio = async (url: string) => {
    try {
      const fileName = getFileName(url);
      const fileUri = (FileSystem.documentDirectory || "") + fileName;

      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true }
      );

      sound.setOnPlaybackStatusUpdate((playbackStatus) => {
        if (playbackStatus.isLoaded) {
          //   setStatus('Playback finished.');
          sound.unloadAsync(); // Cleanup sound instance
        }
      });
    } catch (error) {
      console.error(error);
      //   setStatus('Error occurred while downloading or playing audio.');
    }
  };

  const downloadAndPlayAudio = async (url: string) => {
    const fileName = getFileName(url);
    const fileUri = (FileSystem.documentDirectory || "") + fileName;

    console.log(fileUri);

    try {
      const { uri } = await FileSystem.downloadAsync(url, fileUri);

      console.log("File downloaded to:", uri);

      const { sound } = await Audio.Sound.createAsync(
        { uri: uri },
        { shouldPlay: true }
      );

      sound.setOnPlaybackStatusUpdate((playbackStatus) => {
        if (playbackStatus.isLoaded) {
          //   setStatus('Playback finished.');
          sound.unloadAsync(); // Cleanup sound instance
        }
      });
    } catch (error) {
      console.error(error);
      //   setStatus('Error occurred while downloading or playing audio.');
    }
  };

  return {
    download: downloadAndPlayAudio,
  };
};

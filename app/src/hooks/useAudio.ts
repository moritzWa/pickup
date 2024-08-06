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

  const getAudio = async (url: string) => {
    try {
      await getStoredFiles();

      const fileName = await getFileName(url);
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
    // await getStoredFiles();

    const fileName = await getFileName(url);
    const fileUri = (FileSystem.documentDirectory || "") + fileName;

    try {
      const { uri } = await FileSystem.downloadAsync(url, fileUri, {
        sessionType: FileSystem.FileSystemSessionType.BACKGROUND,
      });

      console.log("File downloaded to:", uri);

      const sound = new Audio.Sound();

      //   console.log(sound);

      sound.setOnPlaybackStatusUpdate(console.log);

      // read file from memory
      await sound.loadAsync(
        {
          uri: url,
        },
        {
          shouldPlay: true,
        }
      );

      console.log("done loading sound");
    } catch (error) {
      console.error(error);
      //   setStatus('Error occurred while downloading or playing audio.');
    }
  };

  return {
    download: downloadAndPlayAudio,
  };
};

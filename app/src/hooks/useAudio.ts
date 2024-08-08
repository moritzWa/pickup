import { AppContext } from "App";
import BigNumber from "bignumber.js";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import * as FileSystem from "expo-file-system";
import { useContext, useMemo, useState } from "react";
import { JSHash, JSHmac, CONSTANTS } from "react-native-hash";
import TrackPlayer, { AddTrack, State, Track } from "react-native-track-player";
import { useDispatch, useSelector } from "react-redux";
import { BaseContentFields } from "src/api/fragments";
import {
  DefaultErrors,
  failure,
  FailureOrSuccess,
  success,
  UnexpectedError,
} from "src/core";
import {
  getCurrentAudioUrl,
  getCurrentMs,
  getDurationMs,
  getIsPlaying,
  getSpeed,
  setAudioUrl,
  setCurrentMs,
  setDurationMs,
  setIsPlaying,
  setSpeed,
} from "src/redux/reducers/audio";

export const useAudio = () => {
  const { sound: globalSound } = useContext(AppContext);
  const dispatch = useDispatch();

  const currentMs = useSelector(getCurrentMs);
  const durationMs = useSelector(getDurationMs);
  const isPlaying = useSelector(getIsPlaying);
  const audioUrl = useSelector(getCurrentAudioUrl);
  const speed = useSelector(getSpeed);

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
    url: string,
    other: Omit<Track, "url">
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

      const track: AddTrack = {
        ...other,
        url: uri,
      };

      await TrackPlayer.add([track]);

      await TrackPlayer.play();

      //   await sound.playAsync();
      dispatch(setIsPlaying(true));

      return success(sound);
    } catch (error) {
      console.error(error);
      return failure(new UnexpectedError(error));
    }
  };

  const downloadAndPlayContent = async (
    content: BaseContentFields
  ): Promise<FailureOrSuccess<DefaultErrors, Audio.Sound>> => {
    return downloadAndPlayAudio(content?.audioUrl || "", {
      title: content?.title || "",
      artist: content?.authorName || "",
      artwork: content?.thumbnailImageUrl || "",
    });
  };

  const toggle = async () => {
    try {
      const sound = globalSound?.current;
      if (!sound) {
        return;
      }

      const state = await TrackPlayer.getPlaybackState();

      // if playing -> pause
      if (state.state === State.Playing) {
        //   await sound.pauseAsync();
        await TrackPlayer.pause();
        dispatch(setIsPlaying(false));
        return;
      }

      // if paused -> play
      // await sound.playAsync();
      await TrackPlayer.play();
      dispatch(setIsPlaying(true));
    } catch (error) {
      console.log(error);
    }
  };

  const leftMs = (durationMs ?? 0) - (currentMs ?? 0);

  const leftMinutes = Math.floor(leftMs / 60_000);

  const percentFinished = useMemo(
    () =>
      Math.max(
        2,
        new BigNumber(currentMs ?? 0)
          .div(durationMs ?? Infinity)
          .multipliedBy(100)
          .toNumber()
      ),
    [currentMs, durationMs]
  );

  const skip = async (seconds: number) => {
    // track player to skip
    const state = await TrackPlayer.getPlaybackState();

    if (state.state === State.Playing) {
      const currentTime = await TrackPlayer.getProgress();
      await TrackPlayer.seekTo(currentTime.position + seconds);
    }

    // if (globalSound) {
    //   const currentPosition = await globalSound.current.getStatusAsync();
    //   if (currentPosition.isLoaded) {
    //     const newPosition = currentPosition.positionMillis + seconds * 1000;
    //     globalSound.current.setPositionAsync(newPosition);
    //   }
    // }
  };

  const setPosition = async (value: number) => {
    // track player to skip

    await TrackPlayer.seekTo(Math.floor(value / 1_000));

    // if (globalSound) {
    //   await globalSound.current.setPositionAsync(value);
    // }
  };

  const setTrackSpeed = async (speed: number) => {
    await TrackPlayer.setRate(speed);
    dispatch(setSpeed(speed));
  };

  const getQueue = async () => {
    const result = await TrackPlayer.getQueue();
  };

  const syncQueue = async () => {};

  // sync the queue. add to the queue. etc... (track player)

  return {
    downloadAndPlay: downloadAndPlayAudio,
    downloadAndPlayContent,
    toggle,
    percentFinished,
    leftMinutes,
    currentMs,
    durationMs,
    isPlaying,
    audioUrl,
    skip,
    setPosition,
    setSpeed: setTrackSpeed,
    speed,
  };
};

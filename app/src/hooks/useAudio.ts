import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import { AppContext } from "App";
import BigNumber from "bignumber.js";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import * as FileSystem from "expo-file-system";
import { isNil, noop } from "lodash";
import { useContext, useEffect, useMemo, useState } from "react";
import { JSHash, JSHmac, CONSTANTS } from "react-native-hash";
import TrackPlayer, {
  AddTrack,
  Event,
  State,
  Track,
  useTrackPlayerEvents,
} from "react-native-track-player";
import { useDispatch, useSelector } from "react-redux";
import { api } from "src/api";
import { BaseContentFields } from "src/api/fragments";
import {
  Mutation,
  Query,
  QueryGetNextContentArgs,
} from "src/api/generated/types";
import {
  DefaultErrors,
  failure,
  FailureOrSuccess,
  hasValue,
  success,
  UnexpectedError,
} from "src/core";
import {
  getCurrentAudioUrl,
  getCurrentContent,
  getCurrentMs,
  getDurationMs,
  getFeed,
  getIsPlaying,
  getQueue,
  getSpeed,
  setAudioUrl,
  setCurrentContent,
  setCurrentMs,
  setDurationMs,
  setIsPlaying,
  setQueue,
  setSpeed,
} from "src/redux/reducers/audio";
import { singletonHook } from "react-singleton-hook";

export type UseAudioReturn = ReturnType<typeof useAudioHook>;

const useAudioHook = () => {
  const dispatch = useDispatch();

  const queue = useSelector(getQueue);
  const feed = useSelector(getFeed);

  const [startContent, { error }] = useMutation(api.content.start);

  const currentContent = useSelector(getCurrentContent);
  const currentMs = useSelector(getCurrentMs);
  const durationMs = useSelector(getDurationMs);
  const isPlaying = useSelector(getIsPlaying);
  const audioUrl = useSelector(getCurrentAudioUrl);
  const speed = useSelector(getSpeed);

  const [removeFromQueue] = useMutation<Pick<Mutation, "removeFromQueue">>(
    api.content.removeFromQueue
  );

  const [getNextContent] = useLazyQuery<Pick<Query, "getNextContent">>(
    api.content.next
  );

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

  const downloadAndPlayContent = async (
    content: BaseContentFields
  ): Promise<FailureOrSuccess<DefaultErrors, Audio.Sound>> => {
    const url = content.audioUrl;

    console.log(`[downloading and playing ${url}]`);

    const fileName = await getFileName(url);
    const fileUri = (FileSystem.documentDirectory || "") + fileName;

    try {
      const { uri } = await FileSystem.downloadAsync(url, fileUri, {
        sessionType: FileSystem.FileSystemSessionType.BACKGROUND,
      });

      const sound = new Audio.Sound();

      dispatch(setAudioUrl(url));
      dispatch(setCurrentContent(content));

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

      const tracks = await TrackPlayer.getQueue();

      await TrackPlayer.remove(tracks.map((_t, i) => i));

      console.log(`[removed ${tracks.length} tracks from the queue]`);

      // await TrackPlayer.skip;
      const track: AddTrack = {
        url: uri,
        title: content?.title || "Title",
        artist: content?.authorName || "Author",
        artwork: content?.thumbnailImageUrl || "",
        metadata: {
          contentId: content.id,
        },
      };

      console.log(`[added ${track.title} to front of the queue]`);

      await TrackPlayer.add([track], 0);

      // await logQueue();

      await TrackPlayer.play();

      void startContent({
        variables: {
          contentId: content.id,
        },
        refetchQueries: [api.content.current],
      });

      //   await sound.playAsync();
      dispatch(setIsPlaying(true));

      return success(sound);
    } catch (error) {
      console.error(error);
      return failure(new UnexpectedError(error));
    }
  };

  const toggle = async () => {
    try {
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

  const playNext = async () => {
    // - [ ]  if it is in the queue, unqueue it
    // - [ ]  if elements left in queue, start playing it
    // - [ ]  if not, find the content right after it in the feed. or just pick the first content and play that.

    const queueElementIndex = queue.findIndex(
      (q) => q?.id === currentContent?.id
    );

    // if it is in the queue, remove it
    if (queueElementIndex !== -1) {
      console.log(`[removing ${currentContent?.title} from the queue]`);

      const queueElement = queue[queueElementIndex];

      await removeFromQueue({
        variables: {
          contentId: queueElement.id,
        },
        refetchQueries: [api.queue.list, api.content.feed],
      });
    }

    const nextContentVariables: QueryGetNextContentArgs = {
      afterContentId: currentContent?.id || "",
    };

    const nextItemResponse = await getNextContent({
      variables: nextContentVariables,
    });

    const nextItem = nextItemResponse?.data?.getNextContent;
    const content = nextItem?.content as BaseContentFields;

    console.log(`[next up is ${nextItem?.content?.title}]`);

    if (content) {
      dispatch(setCurrentContent(content));

      await downloadAndPlayContent(content);
    }
  };

  const playPrev = async () => {
    await TrackPlayer.skipToPrevious();
  };

  // ehhh might need to adjust this more...
  // const syncQueue = async (queue: BaseQueueFields[]) => {
  //   console.log(`[syncing queue ${queue.length}]`);

  //   const activeTrack = await TrackPlayer.getActiveTrack();
  //   const currentContentId = activeTrack?.metadata?.contentId;

  //   await TrackPlayer.removeUpcomingTracks();
  //   await TrackPlayer.remove(0);

  //   await logQueue();

  //   for (const q of queue) {
  //     const content = q.content!;

  //     // don't add the track if it is already the active one
  //     // if (cus

  //     await TrackPlayer.add({
  //       url: content.audioUrl || "",
  //       title: content.title || "",
  //       artist: content.authorName || "",
  //       artwork: content.thumbnailImageUrl || "",
  //       metadata: { contentId: content.id },
  //     });
  //   }

  //   logQueue();
  // };

  const logQueue = async () => {
    const queue = await TrackPlayer.getQueue();
    console.log(queue.map((q) => q.title));
  };

  useTrackPlayerEvents([Event.PlaybackState], async (data) => {
    // console.log(data.state);
    if (data.state === "ended") {
      console.log("ENDED");
      await playNext();
    }
  });

  useTrackPlayerEvents([Event.RemoteNext], async (data) => {
    await playNext();
  });

  useTrackPlayerEvents([Event.RemotePrevious], async (data) => {
    await playPrev();
  });

  // useEffect(() => {
  //   dispatch(setQueue(queue.map((q) => q.content).filter(hasValue)));
  // }, [queue]);

  // sync the queue. add to the queue. etc... (track player)

  return {
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
    syncQueue: noop,
    playNext,
    playPrev,
  };
};

export const useAudio = useAudioHook;
// singletonHook(
//   {
//     downloadAndPlayContent: async (): Promise<
//       FailureOrSuccess<DefaultErrors, Audio.Sound>
//     > => failure(new UnexpectedError("No sound object found")),
//     toggle: async () => {},
//     percentFinished: 0,
//     leftMinutes: 0,
//     currentMs: 0,
//     durationMs: 0,
//     audioUrl: "",
//     isPlaying: false,
//     skip: async () => {},
//     setPosition: async () => {},
//     setSpeed: async () => {},
//     speed: 1,
//     syncQueue: async () => {},
//     playNext: async () => {},
//     playPrev: async () => {},
//   },
//   useAudioHook
// );

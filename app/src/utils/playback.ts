import TrackPlayer, { Event } from "react-native-track-player";
import { useAudio } from "src/hooks/useAudio";
import { store } from "src/redux";
import {
  setCurrentMs,
  setDurationMs,
  setIsPlaying,
} from "src/redux/reducers/audio";

export const PlaybackService = async function () {
  TrackPlayer.addEventListener(Event.RemotePlay, async () => {
    await TrackPlayer.play();
    store.dispatch(setIsPlaying(true));
  });

  TrackPlayer.addEventListener(Event.RemotePause, async () => {
    await TrackPlayer.pause();
    store.dispatch(setIsPlaying(false));
  });

  // 15 second skip
  TrackPlayer.addEventListener(Event.RemoteJumpForward, async () => {
    const currentTime = await TrackPlayer.getProgress();
    await TrackPlayer.seekTo(currentTime.position + 15);
  });

  TrackPlayer.addEventListener(Event.RemoteJumpBackward, async () => {
    const currentTime = await TrackPlayer.getProgress();
    await TrackPlayer.seekTo(currentTime.position - 15);
  });

  TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, async (e) => {
    // console.log("PlaybackProgressUpdated", e);
    // store.dispatch(setCurrentMs(Math.ceil(e.position * 1_000)));
    // store.dispatch(setDurationMs(Math.ceil(e.duration * 1_000)));
  });

  TrackPlayer.addEventListener(Event.RemoteSeek, async (e) => {
    store.dispatch(setCurrentMs(Math.ceil(e.position * 1_000)));
    await TrackPlayer.seekTo(e.position);
  });
};

import { createAction, createReducer, createSelector } from "@reduxjs/toolkit";
import { AudioState, AuthStatus, ReduxState, UserState } from "../types";
import { Audio } from "expo-av";

// initial state
const initialState: AudioState = {
  audioUrl: null,
  currentContent: null,
  nextContent: null,
  queue: [],
  feed: [],
  currentMs: null,
  durationMs: null,
  isPlaying: false,
  speed: 1,
};

// actions
export const setAudioUrl =
  createAction<AudioState["audioUrl"]>("SET_AUDIO_URL");

export const setCurrentContent = createAction<AudioState["currentContent"]>(
  "SET_CURRENT_CONTENT"
);

export const setNextContent =
  createAction<AudioState["nextContent"]>("SET_NEXT_CONTENT");

export const setQueue = createAction<AudioState["queue"]>("SET_QUEUE");

export const setFeed = createAction<AudioState["feed"]>("SET_FEED");

export const setCurrentMs =
  createAction<AudioState["currentMs"]>("SET_CURRENT_MS");

export const setDurationMs =
  createAction<AudioState["durationMs"]>("SET_DURATION_MS");

export const setIsPlaying =
  createAction<AudioState["isPlaying"]>("SET_IS_PLAYING");

export const setSpeed = createAction<AudioState["speed"]>("SET_SPEED");

// reducer
export const audioReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(setAudioUrl, (state, action) => {
      state.audioUrl = action.payload;
    })
    .addCase(setCurrentMs, (state, action) => {
      state.currentMs = action.payload;
    })
    .addCase(setDurationMs, (state, action) => {
      state.durationMs = action.payload;
    })
    .addCase(setIsPlaying, (state, action) => {
      state.isPlaying = action.payload;
    })
    .addCase(setSpeed, (state, action) => {
      state.speed = action.payload;
    })
    .addCase(setCurrentContent, (state, action) => {
      state.currentContent = action.payload;
    })
    .addCase(setNextContent, (state, action) => {
      state.nextContent = action.payload;
    })
    .addCase(setQueue, (state, action) => {
      state.queue = action.payload;
    })
    .addCase(setFeed, (state, action) => {
      state.feed = action.payload;
    });
});

// selectors

export const getCurrentAudioUrl = (state: ReduxState): AudioState["audioUrl"] =>
  state.audio.audioUrl;

export const getCurrentMs = (state: ReduxState): AudioState["currentMs"] =>
  state.audio.currentMs;

export const getDurationMs = (state: ReduxState): AudioState["durationMs"] =>
  state.audio.durationMs;

export const getIsPlaying = (state: ReduxState): AudioState["isPlaying"] =>
  state.audio.isPlaying;

export const getSpeed = (state: ReduxState): AudioState["speed"] =>
  state.audio.speed;

export const getCurrentContent = (
  state: ReduxState
): AudioState["currentContent"] => state.audio.currentContent;

export const getNextContent = (state: ReduxState): AudioState["nextContent"] =>
  state.audio.nextContent;

export const getQueue = (state: ReduxState): AudioState["queue"] =>
  state.audio.queue;

export const getFeed = (state: ReduxState): AudioState["queue"] =>
  state.audio.feed;

export const getQueueContentIdSet = createSelector(
  getQueue,
  (queue) => new Set(queue.map((content) => content.id))
);

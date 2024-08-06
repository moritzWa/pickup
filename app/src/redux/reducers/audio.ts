import { createAction, createReducer } from "@reduxjs/toolkit";
import { AudioState, AuthStatus, ReduxState, UserState } from "../types";
import { Audio } from "expo-av";

// initial state
const initialState: AudioState = {
  audioUrl: null,
  currentMs: null,
  durationMs: null,
  isPlaying: false,
};

// actions
export const setAudioUrl =
  createAction<AudioState["audioUrl"]>("SET_AUDIO_URL");
export const setCurrentMs =
  createAction<AudioState["currentMs"]>("SET_CURRENT_MS");
export const setDurationMs =
  createAction<AudioState["durationMs"]>("SET_DURATION_MS");
export const setIsPlaying =
  createAction<AudioState["isPlaying"]>("SET_IS_PLAYING");

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

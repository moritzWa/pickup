import { createAction, createReducer } from "@reduxjs/toolkit";
import { AudioState, AuthStatus, ReduxState, UserState } from "../types";
import { Audio } from "expo-av";

// initial state
const initialState: AudioState = {
  audioUrl: null,
  sound: null,
  currentMs: null,
  durationMs: null,
};

// actions
export const setAudio = createAction<AudioState["sound"]>("SET_AUDIO");
export const setAudioUrl =
  createAction<AudioState["audioUrl"]>("SET_AUDIO_URL");
export const setCurrentMs =
  createAction<AudioState["currentMs"]>("SET_CURRENT_MS");
export const setDurationMs =
  createAction<AudioState["durationMs"]>("SET_DURATION_MS");

// reducer
export const audioReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(setAudio, (state, action) => {
      state.sound = action.payload.;
    })
    .addCase(setAudioUrl, (state, action) => {
      state.audioUrl = action.payload;
    })
    .addCase(setCurrentMs, (state, action) => {
      state.currentMs = action.payload;
    })
    .addCase(setDurationMs, (state, action) => {
      state.durationMs = action.payload;
    });
});

// selectors
export const getSound = (state: ReduxState): AudioState["sound"] =>
  state.audio.sound;

export const getAudioUrl = (state: ReduxState): AudioState["audioUrl"] =>
  state.audio.audioUrl;

export const getCurrentMs = (state: ReduxState): AudioState["currentMs"] =>
  state.audio.currentMs;

export const getDurationMs = (state: ReduxState): AudioState["durationMs"] =>
  state.audio.durationMs;

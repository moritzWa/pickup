import { createAction, createReducer, createSelector } from "@reduxjs/toolkit";
import { Maybe } from "src/core";
import { GlobalState, ReduxState } from "../types";

// initial state
const initialState: GlobalState = {
  isRecalculating: false,
  recalculateFinishEta: null,
  isImporting: false,
  isGlobalRuleMode: false,
  hasBanner: false,
  showConfetti: false,
  theme: "light",
  isIncognito: false,
};

// actions
export const setGlobalRuleMode = createAction<boolean>(
  "SET_GLOBAL_STATE_RULE_MODE"
);

export const setHasBanner = createAction<boolean>("SET_HAS_BANNER");
export const setIsIncognito = createAction<boolean>("SET_IS_INCOGNITO");

export const setShowConfetti = createAction<boolean>("SET_SHOW_CONFETTI");

export const setTheme = createAction<"light" | "dark">("SET_THEME");

// reducer
export const globalStateReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(setGlobalRuleMode, (state, action) => {
      state.isGlobalRuleMode = action.payload;
    })
    .addCase(setHasBanner, (state, action) => {
      state.hasBanner = action.payload;
    })
    .addCase(setShowConfetti, (state, action) => {
      state.showConfetti = action.payload;
    })
    .addCase(setTheme, (state, action) => {
      state.theme = action.payload;
    })
    .addCase(setIsIncognito, (state, action) => {
      state.isIncognito = action.payload;
    });
});

export const getIsGlobalRuleMode = (state: ReduxState): boolean =>
  state.global.isGlobalRuleMode;

export const getHasBanner = (state: ReduxState): boolean =>
  state.global.hasBanner;

export const getShowConfetti = (state: ReduxState): boolean =>
  state.global.showConfetti;

export const getTheme = createSelector(
  (state: ReduxState) => state.global.theme,
  (theme) => theme
);

export const getIsIncognito = (state: ReduxState): boolean =>
  state.global.isIncognito;

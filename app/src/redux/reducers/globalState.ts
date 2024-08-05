import { createAction, createReducer, createSelector } from "@reduxjs/toolkit";
import { Maybe } from "src/core";
import { GlobalState, ProfileTabFilter, ReduxState } from "../types";
import { ActivityFilter, ContentFeedFilter } from "src/api/generated/types";

// initial state
const initialState: GlobalState = {
  homeFilter: ContentFeedFilter.ForYou,
  profileFilter: ProfileTabFilter.All,
  activityFilter: ActivityFilter.New,
  theme: "dark",
};

// actions
export const setHomeFilter = createAction<ContentFeedFilter>("SET_HOME_FILTER");
export const setProfileFilter =
  createAction<ProfileTabFilter>("SET_PROFILE_FILTER");
export const setActivityFilter = createAction<ActivityFilter>(
  "SET_ACTIVITY_FILTER"
);
export const setTheme = createAction<"light" | "dark">("SET_THEME");

// reducer
export const globalStateReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(setHomeFilter, (state, action) => {
      state.homeFilter = action.payload;
    })
    .addCase(setProfileFilter, (state, action) => {
      state.profileFilter = action.payload;
    })
    .addCase(setActivityFilter, (state, action) => {
      state.activityFilter = action.payload;
    })
    .addCase(setTheme, (state, action) => {
      state.theme = action.payload;
    });
});

export const getHomeFilter = createSelector(
  (state: ReduxState) => state.global.homeFilter,
  (homeFilter) => homeFilter
);

export const getProfileFilter = createSelector(
  (state: ReduxState) => state.global.profileFilter,
  (profileFilter) => profileFilter
);

export const getActivityFilter = createSelector(
  (state: ReduxState) => state.global.activityFilter,
  (activityFilter) => activityFilter
);

export const getTheme = createSelector(
  (state: ReduxState) => state.global.theme,
  (theme) => theme
);

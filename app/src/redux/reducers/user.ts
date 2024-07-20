import { createAction, createReducer } from "@reduxjs/toolkit";
import { AuthStatus, ReduxState, UserState } from "../types";

// initial state
const initialState: UserState = {
  authStatus: "NOT_LOADED",
};

// actions
export const setUser = createAction("SET_USER");

export const logoutUser = createAction<void>("REMOVE_USER");

export const setUserAuthStateChanged = createAction<AuthStatus>(
  "SET_USER_AUTH_STATE_CHANGED"
);

// reducer
export const userReducer = createReducer(initialState, (builder) => {
  builder.addCase(setUserAuthStateChanged, (state, action) => {
    state.authStatus = action.payload;
  });
});

// selectors
export const getUserAuthStatus = (state: ReduxState): AuthStatus =>
  state.user.authStatus;

export const getUserIsLoggedIn = (state: ReduxState): boolean =>
  state.user.authStatus === "LOGGED_IN";

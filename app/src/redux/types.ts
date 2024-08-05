import { Audio } from "expo-av";
import { ActivityFilter, ContentFeedFilter } from "src/api/generated/types";
import { Maybe } from "src/core";

export enum WalletProvider {
  Phantom = "phantom",
}

export type AuthStatus =
  | "NOT_LOADED"
  | "LOADING"
  | "LOGGED_IN"
  | "NOT_LOGGED_IN";

export type UserState = {
  authStatus: AuthStatus;
};

export type AudioState = {
  // sound: Audio.Sound | null;
  audioUrl: string | null;
  currentMs: number | null;
  durationMs: number | null;
};

export enum ProfileTabFilter {
  All = "all",
  Bookmarks = "bookmarks",
}

export type GlobalState = {
  homeFilter: ContentFeedFilter;
  profileFilter: ProfileTabFilter;
  activityFilter: ActivityFilter;
  theme: "light" | "dark";
};

export type ReduxState = {
  user: UserState;
  global: GlobalState;
  audio: AudioState;
};

import { Audio } from "expo-av";
import { BaseContentFields } from "src/api/fragments";
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
  currentContent: Maybe<BaseContentFields>;
  nextContent: Maybe<BaseContentFields>;
  queue: BaseContentFields[];
  currentMs: number | null;
  durationMs: number | null;
  isPlaying: boolean;
  speed: number;
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

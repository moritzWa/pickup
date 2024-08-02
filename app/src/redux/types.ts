import { Audio } from "expo-av";
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

export type GlobalState = {
  isRecalculating: boolean;
  recalculateFinishEta: Maybe<Date>;
  isImporting: boolean;
  isGlobalRuleMode: boolean;
  hasBanner: boolean;
  showConfetti: boolean;
  isIncognito: boolean;
  theme: "light" | "dark";
};

export type ReduxState = {
  user: UserState;
  global: GlobalState;
  audio: AudioState;
};

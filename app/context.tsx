import { createContext } from "react";
import { UseAudioReturn } from "src/hooks/useAudio";

export const AppContext = createContext<{
  audio: UseAudioReturn | null;
}>({
  audio: null,
});

import { SpeechResultsEvent } from "@react-native-voice/voice";
import { useCallback, useState } from "react";
import Voice from "@react-native-voice/voice";

export const useSpeech = () => {
  const [speaking, setSpeaking] = useState<boolean>(false);
  const [result, setResult] = useState<string | undefined>("");

  const onSpeechStartHandler = useCallback(() => {
    console.log("Speech started.");
  }, []);

  const onSpeechEndHandler = useCallback(() => {
    console.log("Speech ended.");
    setSpeaking(false);
  }, []);

  const onSpeechResultsHandler = useCallback((data: SpeechResultsEvent) => {
    console.log(data);
    if (data.value !== undefined) {
      setResult(data.value[0]);
    }
  }, []);

  const startSpeech = useCallback(async () => {
    setSpeaking(true);

    // start it in enlglish and attach listeners

    Voice.onSpeechStart = onSpeechStartHandler;
    // listen
    Voice.onSpeechEnd = onSpeechEndHandler;
    Voice.onSpeechRecognized = (e) => {
      console.log("Speech recognized.");
      console.log(e);
    };
    Voice.onSpeechResults = (e) => {
      console.log("Speech results.");
      console.log(e);
      onSpeechResultsHandler(e);
    };

    // console.log(Voice);

    console.log("starting speech detection");

    console.log(Voice.getSpeechRecognitionServices());
    await Voice.start("en-US");
  }, [onSpeechStartHandler]);

  return { result, speaking, startSpeech };
};

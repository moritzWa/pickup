import { useEffect } from "react";
import { LogLevel, OneSignal } from "react-native-onesignal";
import { constants } from "src/config";

export const useOneSignal = () => {
  useEffect(() => {
    // Remove this method to stop OneSignal Debugging
    OneSignal.Debug.setLogLevel(LogLevel.Verbose);

    // OneSignal Initialization
    OneSignal.initialize(constants.oneSignalAppId);
  }, []);
};

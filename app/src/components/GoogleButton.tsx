import React from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { colors } from ".";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { IS_IPAD, constants } from "src/config";
import * as Haptics from "expo-haptics";
import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import FastImage from "react-native-fast-image";
import { auth } from "src/utils/firebase";
import { useTheme } from "src/hooks";

const GoogleImage = require("src/assets/social/google-2.png");

GoogleSignin.configure({
  webClientId: constants.firebase.webClientId,
});

type GoogleProps = {
  onSuccess: (u: FirebaseAuthTypes.UserCredential) => void;
  onError: (e: any) => void;
  label?: string;
};

export const GoogleButton = ({ label, onSuccess, onError }: GoogleProps) => {
  const [isLoading, setLoading] = React.useState(false);
  const theme = useTheme();

  const loginGoogle = async () => {
    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Get the users ID token
      const { idToken } = await GoogleSignin.signIn();

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      // Sign-in the user with the credential
      const userCred = await auth().signInWithCredential(googleCredential);

      onSuccess(userCred);
    } catch (err) {
      const e = err as any;

      // don't error for cancel
      if (e.code === statusCodes.SIGN_IN_CANCELLED) {
        return;
      }

      onError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={{
        backgroundColor: theme.secondaryBackground,
        marginTop: 10,
        paddingVertical: IS_IPAD ? 20 : 15,
        paddingHorizontal: 25,
        borderRadius: 10,
        alignItems: "center",
        marginBottom: 5,
        display: "flex",
        flexDirection: "row",
      }}
      activeOpacity={1}
      disabled={isLoading}
      onPress={loginGoogle}
    >
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <FastImage
          source={GoogleImage}
          style={{
            width: 20,
            height: 20,
            position: "absolute",
            left: 0,
            top: 2,
          }}
        />

        {isLoading ? (
          <ActivityIndicator color={colors.black} />
        ) : (
          <Text
            style={{
              color: colors.black,
              fontFamily: "Raleway-Bold",
              textAlign: "center",
              fontSize: IS_IPAD ? 24 : 16,
            }}
          >
            {label || "Continue"} with Google
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

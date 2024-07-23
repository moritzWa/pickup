import React from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { colors } from ".";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { constants } from "src/config";
import * as Haptics from "expo-haptics";
import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import FastImage from "react-native-fast-image";
import { auth } from "src/utils/firebase";
import {
  AppleRequestResponse,
  appleAuth,
} from "@invertase/react-native-apple-authentication";

const AppleImage = require("src/assets/social/white-apple.png");

type AppleButtonProps = {
  onSuccess: (
    u: FirebaseAuthTypes.UserCredential,
    data: AppleRequestResponse
  ) => void;
  onError: (e: any) => void;
  label?: string;
};

export const AppleButton = ({
  label,
  onSuccess,
  onError,
}: AppleButtonProps) => {
  const [isLoading, setLoading] = React.useState(false);

  const loginWithApple = async () => {
    try {
      setLoading(true);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Start the sign-in request
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        // As per the FAQ of react-native-apple-authentication, the name should come first in the following array.
        // See: https://github.com/invertase/react-native-apple-authentication#faqs
        requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
      });

      // Ensure Apple returned a user identityToken
      if (!appleAuthRequestResponse.identityToken) {
        throw new Error("Apple Sign-In failed - no identify token returned");
      }

      // Create a Firebase credential from the response
      const { identityToken, nonce } = appleAuthRequestResponse;
      const appleCredential = auth.AppleAuthProvider.credential(
        identityToken,
        nonce
      );

      // Sign the user in with the credential
      const userCred = await auth().signInWithCredential(appleCredential);

      onSuccess(userCred, appleAuthRequestResponse);
    } catch (err) {
      const e = err as any;

      // don't error for cancel
      if (e.code === "1000") {
        return;
      }

      onError(err);
    } finally {
    }
    setLoading(false);
  };

  return (
    <TouchableOpacity
      style={{
        backgroundColor: colors.black,
        borderWidth: 2,
        marginTop: 10,
        borderColor: colors.gray20,
        paddingVertical: 15,
        paddingHorizontal: 25,
        borderRadius: 50,
        alignItems: "center",
        marginBottom: 5,
        display: "flex",
        flexDirection: "row",
      }}
      disabled={isLoading}
      activeOpacity={1}
      onPress={loginWithApple}
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
          source={AppleImage}
          resizeMode="contain"
          style={{
            width: 20,
            height: 20,
            position: "absolute",
            left: 0,
            top: 0,
          }}
        />

        {isLoading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text
            style={{
              color: colors.white,
              fontFamily: "Raleway-Semibold",
              textAlign: "center",
              fontSize: 16,
            }}
          >
            {label || "Sign up"} with Apple
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

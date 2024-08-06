import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  TouchableOpacity,
} from "react-native";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Input, colors } from "../../../components";
import Button from "src/components/Button";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { FirebaseError } from "firebase/app";
import { useNavigation } from "@react-navigation/native";
import { NavigationProps, PhoneVerificationParams } from "../../../navigation";
import auth from "@react-native-firebase/auth";
import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import * as Haptics from "expo-haptics";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { IS_IPAD, constants } from "src/config";
import { MultiFactorError } from "firebase/auth";
import { isNil, noop } from "lodash";
import FastImage from "react-native-fast-image";
import { GoogleButton } from "src/components/GoogleButton";
import {
  Mutation,
  MutationCreateUserArgs,
  Query,
} from "src/api/generated/types";
import { ApolloError, useLazyQuery, useMutation } from "@apollo/client";
import { api } from "src/api";
import Back from "src/components/Back";
import { AppleButton } from "src/components/AppleButton";
import { useTheme } from "src/hooks/useTheme";
import { AppleRequestResponse } from "@invertase/react-native-apple-authentication";

const Login = () => {
  const insets = useSafeAreaInsets();
  const { header, background, text } = useTheme();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const navigation = useNavigation<NavigationProps>();
  const [getMe] = useLazyQuery<Pick<Query, "me">>(api.users.me);
  const [createUser, { loading, error }] = useMutation<
    Pick<Mutation, "createUser">,
    MutationCreateUserArgs
  >(api.users.create);

  const _onSuccess2FA = async () => {
    navigation.navigate("Main");
  };

  const _parseFirebaseError = (message: string, error: any) => {
    const { code } = error;

    if (code === "auth/multi-factor-auth-required") {
      const resolver = auth().getMultiFactorResolver(error as MultiFactorError);

      const params: PhoneVerificationParams = {
        flowType: "sign_in",
        multiFactorError: error,
        multiFactorHint: resolver.hints[0],
        session: resolver.session,
        onSuccess: _onSuccess2FA,
      };

      // Alert.alert("phone verification: ", params);

      navigation.navigate("PhoneVerification", params);

      return;
    }

    // if the user closes the google sign in, don't need to alert
    if (code === statusCodes.SIGN_IN_CANCELLED) {
      return;
    }

    Alert.alert(message);
  };

  const _onLogin = async () => {
    try {
      if (!password) {
        alert("Please enter a password");
        return;
      }

      if (!email) {
        alert("Please enter an email");
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      await auth().signInWithEmailAndPassword(email, password);

      navigation.navigate("Main");
    } catch (err) {
      // parse the firebase error and alert

      console.log(err);
      const { code } = err as any;

      if (code === "auth/multi-factor-auth-required") {
        const resolver = auth().getMultiFactorResolver(err as MultiFactorError);

        const params: PhoneVerificationParams = {
          flowType: "sign_in",
          multiFactorError: err as any,
          multiFactorHint: resolver.hints[0],
          session: resolver.session,
          onSuccess: _onSuccess2FA,
        };

        // Alert.alert("phone verification: ", params);

        navigation.navigate("PhoneVerification", params);

        return;
      }

      // if the user closes the google sign in, don't need to alert
      if (code === statusCodes.SIGN_IN_CANCELLED) {
        return;
      }

      Alert.alert(
        (err as any)?.message ||
          "Something went wrong logging in. Please contact support and we'll help you out!"
      );
    }
  };

  const _onThirdPartyError = (err: any) => {
    // alert the error message
    console.log(err.code);
    return _parseFirebaseError(err?.message, err);

    // Alert.alert("Error", err?.message || "Something went wrong");
  };

  const _onGoogleAuthSuccess = async (u: FirebaseAuthTypes.UserCredential) => {
    try {
      const meResponse = await getMe();

      const me = meResponse.data?.me;

      // if already has a user -> just go to the home page
      if (me) {
        return navigation.navigate("Main");
      }

      const variables: MutationCreateUserArgs = {
        email: u.user?.email || "",
        name: u.user?.displayName || "",
        isMobile: true,
      };

      const response = await createUser({
        variables,
      });

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      navigation.navigate("Main");
    } catch (err) {
      console.log("=== error ===");
      console.log(err);
      if (err instanceof ApolloError) {
        // log the full error with fields

        // error alert
        Alert.alert("Error", err.message);
      }
    }
  };

  const _onAppleAuthSuccess = async (
    u: FirebaseAuthTypes.UserCredential,
    appleData: AppleRequestResponse
  ) => {
    try {
      const meResponse = await getMe();

      const me = meResponse.data?.me;

      // if already has a user -> just go to the home page
      if (me) {
        return navigation.navigate("Main", { screen: "Home" });
      }

      const nameFromApple =
        appleData && appleData.fullName
          ? `${appleData.fullName?.givenName || ""} ${
              appleData.fullName?.familyName || ""
            }`.trim()
          : null;

      const variables: MutationCreateUserArgs = {
        email: u.user?.email || "",
        name: appleData.fullName
          ? nameFromApple || ""
          : u.user?.displayName || "",
      };

      const response = await createUser({
        variables,
      });

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      navigation.navigate("Main");
    } catch (err) {
      console.log("=== error ===");
      console.log(err);
      if (err instanceof ApolloError) {
        // log the full error with fields

        // error alert
        Alert.alert("Error", err.message);
      }
    }
  };

  return (
    <View
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        backgroundColor: background,
        paddingHorizontal: 20,
        alignItems: "center",
      }}
    >
      <View
        style={{
          maxWidth: IS_IPAD ? 500 : undefined,
          width: "100%",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          flexDirection: "row",
        }}
      >
        <Back />
      </View>

      <KeyboardAwareScrollView
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        style={{
          flexDirection: "column",
          display: "flex",
          height: "100%",
          maxWidth: IS_IPAD ? 500 : undefined,
          width: IS_IPAD ? "100%" : undefined,
        }}
      >
        <Text
          style={{
            fontSize: 28,
            textAlign: "left",
            width: "100%",
            marginTop: 25,
            marginBottom: 25,
            color: header,
            fontFamily: "Raleway-Bold",
          }}
        >
          Welcome back 👋
        </Text>

        <Input
          autoComplete="email"
          label="Email"
          autoFocus
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={(text) => setEmail(text)}
        />
        <Input
          secureTextEntry
          label="Password"
          autoComplete="password"
          placeholder="Password"
          value={password}
          onChangeText={(text) => setPassword(text)}
        />

        <Button
          label="Log in"
          style={{
            marginTop: 20,
            marginBottom: 5,
          }}
          onPress={_onLogin}
        />

        <Text style={{ textAlign: "center", color: text, marginVertical: 15 }}>
          — or —
        </Text>

        <GoogleButton
          label="Log in"
          onSuccess={_onGoogleAuthSuccess}
          onError={_onThirdPartyError}
        />

        <AppleButton
          label="Log in"
          onSuccess={_onAppleAuthSuccess}
          onError={_onThirdPartyError}
        />
      </KeyboardAwareScrollView>
    </View>
  );
};

export default Login;

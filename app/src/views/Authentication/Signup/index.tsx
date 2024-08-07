import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import React, { useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Input, colors } from "src/components";
import Button from "src/components/Button";
import Back from "src/components/Back";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { ApolloError, useLazyQuery, useMutation } from "@apollo/client";
import { api } from "src/api";
import {
  Mutation,
  MutationCreateUserArgs,
  Query,
} from "src/api/generated/types";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/core";
import { NavigationProps } from "src/navigation";
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { GoogleButton } from "src/components/GoogleButton";
import { AppleButton } from "src/components/AppleButton";
import { useTheme } from "src/hooks/useTheme";
import { AppleRequestResponse } from "@invertase/react-native-apple-authentication";

const Signup = () => {
  const navigation = useNavigation<NavigationProps>();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const { background, text, header } = useTheme();

  const [createUser, { loading, error }] = useMutation<
    Pick<Mutation, "createUser">,
    MutationCreateUserArgs
  >(api.users.create);

  const [getMe] = useLazyQuery<Pick<Query, "me">>(api.users.me);

  const _onSignUpEmail = async () => {
    try {
      if (!email || !email.includes("@")) {
        return Alert.alert("Error", "Email is required");
      }

      if (!password) {
        return Alert.alert("Error", "Password is required");
      }

      const variables: MutationCreateUserArgs = {
        email,
        name: fullName,
        password,
      };

      const response = await createUser({
        variables,
      });

      const user = response.data?.createUser?.user;
      const token = response.data?.createUser?.token;

      if (!token) return;

      await auth().signInWithCustomToken(token);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (!user?.name) {
        return navigation.navigate("FullName");
      }

      return navigation.navigate("Interests");
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

  const _onThirdPartyAuthError = (err: any) => {
    // alert the error message
    Alert.alert("Error", err?.message || "Something went wrong");
  };

  const _onGoogleAuthSuccess = async (u: FirebaseAuthTypes.UserCredential) => {
    try {
      const meResponse = await getMe({
        fetchPolicy: "network-only",
      });

      const me = meResponse.data?.me;

      // if already has a user -> just go to the home page
      if (me) {
        if (!me?.name) {
          return navigation.navigate("FullName");
        }

        return navigation.navigate("Interests");
      }

      const variables: MutationCreateUserArgs = {
        email: u.user?.email || "",
        name: u.user?.displayName || "",
      };

      const response = await createUser({
        variables,
      });

      const user = response.data?.createUser?.user;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (!user?.name) {
        return navigation.navigate("FullName");
      }

      return navigation.navigate("Interests");
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
      const meResponse = await getMe({
        fetchPolicy: "network-only",
      });

      const me = meResponse.data?.me;

      // if already has a user -> just go to the home page
      if (me) {
        if (!me?.name) {
          return navigation.navigate("FullName");
        }

        return navigation.navigate("Interests");
      }

      const nameFromApple =
        appleData && appleData.fullName
          ? `${appleData.fullName?.givenName || ""} ${
              appleData.fullName?.familyName || ""
            }`.trim()
          : null;

      const variables: MutationCreateUserArgs = {
        email: u.user?.email || "",
        name: nameFromApple ? nameFromApple || "" : u.user?.displayName || "",
      };

      const response = await createUser({
        variables,
      });

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const newUser = response.data?.createUser;

      if (!newUser?.user.name) {
        return navigation.navigate("FullName");
      }

      return navigation.navigate("Interests");
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
      }}
    >
      <View style={{ paddingHorizontal: 15 }}>
        <Back />
      </View>

      <KeyboardAwareScrollView
        // keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        style={{
          flexDirection: "column",
          display: "flex",
          height: "100%",
          paddingHorizontal: 15,
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontFamily: "Raleway-Bold",
            textAlign: "left",
            width: "100%",
            marginTop: 25,
            marginBottom: 25,
            color: header,
          }}
        >
          Create your account
        </Text>

        <Input
          autoComplete="name"
          label="Full name"
          placeholder="Full name"
          textContentType="name"
          value={fullName}
          returnKeyType="next"
          onChangeText={(text) => setFullName(text)}
        />
        <Input
          keyboardType="email-address"
          inputMode="email"
          textContentType="emailAddress"
          autoComplete="email"
          label="Email"
          placeholder="Email"
          value={email}
          returnKeyType="next"
          autoCapitalize="none"
          onChangeText={(text) => setEmail(text)}
        />
        <Input
          secureTextEntry={!showPassword}
          label={
            <View
              style={{
                alignItems: "center",
                display: "flex",
                flexDirection: "row",
                marginBottom: 5,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  flex: 1,
                  color: text,
                  fontFamily: "Raleway-Regular",
                }}
              >
                Password
              </Text>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Raleway-Regular",
                    color: text,
                  }}
                >
                  {showPassword ? "Hide" : "Show"} Password
                </Text>
              </TouchableOpacity>
            </View>
          }
          autoComplete="password"
          placeholder="Password"
          value={password}
          returnKeyType="done"
          onChangeText={(text) => setPassword(text)}
        />

        <Button
          label="Sign up"
          style={{
            marginTop: 20,
            marginBottom: 10,
          }}
          onPress={_onSignUpEmail}
        />

        <Text style={{ textAlign: "center", color: text, marginVertical: 15 }}>
          — or —
        </Text>

        <GoogleButton
          onSuccess={_onGoogleAuthSuccess}
          onError={_onThirdPartyAuthError}
        />

        <AppleButton
          onSuccess={_onAppleAuthSuccess}
          onError={_onThirdPartyAuthError}
        />
      </KeyboardAwareScrollView>
    </View>
  );
};

export default Signup;

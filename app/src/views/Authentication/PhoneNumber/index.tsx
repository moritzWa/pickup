import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { FirebaseError } from "firebase/app";
import {
  parsePhoneNumber,
  parsePhoneNumberFromString,
} from "libphonenumber-js";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  NativeSyntheticEvent,
  Text,
  TextInput,
  TextInputChangeEventData,
  TouchableOpacity,
  View,
} from "react-native";
import { Button, Input, colors } from "src/components";
import { auth } from "src/utils/firebase";
// import the types for react native firebase
import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import * as Haptics from "expo-haptics";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "src/hooks/useTheme";
import { NavigationProps, RootStackParamList } from "src/navigation";
import { useMutation } from "@apollo/client";
import { api } from "src/api";
import { Mutation, MutationUpdateUserArgs } from "src/api/generated/types";
import Header from "src/components/Header";

export function PhoneNumber() {
  const { params } = useRoute<RouteProp<RootStackParamList, "PhoneNumber">>();
  const { background, header, text } = useTheme();

  const onSuccess = params?.onSuccess;

  const [updateUser] = useMutation<
    Pick<Mutation, "updateUser">,
    MutationUpdateUserArgs
  >(api.users.update);

  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProps>();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [isSendingCode, setIsSendingCode] = useState<boolean>(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState<boolean>(false);

  const verifyInputRef = useRef<TextInput>(null);

  const _onSubmit = async function () {
    try {
      if (step === "phone") {
        console.log(phoneNumber);

        const parsedPhoneNumber = parsePhoneNumber(phoneNumber, "US"); // Replace 'US' with the relevant default country code

        if (!parsedPhoneNumber || !parsedPhoneNumber.isValid()) {
          // toast log it
          Alert.alert("Please enter a valid phone number.");
          return;
        }

        const formattedNumber =
          parsedPhoneNumber?.format("E.164") ?? phoneNumber;

        const variables: MutationUpdateUserArgs = {
          phoneNumber: formattedNumber,
        };

        await updateUser({
          variables,
        });

        if (onSuccess) {
          onSuccess();
          return;
        }

        navigation.navigate("EnablePushNotifications");

        return;
      }

      // if (step === "code") {
      //   await _verifyCode();

      //   return;
      // }
    } catch (err) {
      // console.log(err);
      Alert.alert((err as any)?.message || "An error occurred.");
    }
  };

  const _sendCode = async () => {
    try {
      setIsSendingCode(true);

      const user = auth().currentUser;

      const userSession = user
        ? await auth().multiFactor(user).getSession()
        : null;

      if (!userSession) {
        Alert.alert("No session. Please refresh and try again.");
        return;
      }

      const parsedPhoneNumber = parsePhoneNumberFromString(phoneNumber, "US"); // Replace 'US' with the relevant default country code

      if (!parsedPhoneNumber || !parsedPhoneNumber.isValid()) {
        // toast log it
        Alert.alert("Please enter a valid phone number.");
        return;
      }

      const formattedNumber = parsedPhoneNumber?.format("E.164") ?? phoneNumber;

      const phoneOptions: FirebaseAuthTypes.PhoneMultiFactorEnrollInfoOptions =
        {
          phoneNumber: formattedNumber,
          session: userSession,
        };

      // Sends a text message to the user
      const verificationId = await auth().verifyPhoneNumberForMultiFactor(
        phoneOptions
      );

      setVerificationId(verificationId);
      setStep("code");
    } catch (err) {
      if ((err as any)?.code) {
        const e = err as FirebaseError;

        if (e.code === "auth/too-many-requests") {
          Alert.alert("Too many requests. Please try again later.");

          return;
        }

        Alert.alert((err as any)?.message || "Invalid phone number.");
        return;
      }

      Alert.alert((err as any)?.message || "Invalid phone number.");
    } finally {
      setIsSendingCode(false);
    }
  };

  const _verifyCode = async () => {
    try {
      setIsVerifyingCode(true);

      const user = auth().currentUser;

      if (!verificationId) return;
      if (!verificationCode) return;

      // Ask user for the verification code. Then:
      const cred = auth.PhoneAuthProvider.credential(
        verificationId,
        verificationCode
      );
      const multiFactorAssertion =
        auth.PhoneMultiFactorGenerator.assertion(cred);

      //   if (flowType === "enroll") {
      //     if (!user) {
      //       Alert.alert(
      //         "User is missing. Please refresh and try again, and if the problem persists, contact support."
      //       );

      //       return;
      //     }

      //     Alert.alert(
      //       "Enrolling on mobile isn't supported. Please use our website and enroll on the 'Settings' page."
      //     );

      //     return;
      //   }
    } catch (err) {
      console.log(err);

      if (err instanceof FirebaseError) {
        console.log(err.message);
        console.log(err.code);
        if (err.code === "auth/code-expired") {
          Alert.alert("Code expired. Please try again.");

          return;
        }
      }

      Alert.alert((err as any)?.message || "Invalid verification code.");

      throw err;
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const _onChange = (inputNumber: string) => {
    const parsedNumber = parsePhoneNumberFromString(inputNumber, "US"); // Replace 'US' with the relevant country code if needed

    // Format the number or keep the raw input if it's not a valid number yet
    const formattedNumber = parsedNumber
      ? parsedNumber.formatNational()
      : inputNumber;
    setPhoneNumber(formattedNumber);
  };

  useEffect(() => {
    if (!verificationId) return;
    if (!verificationCode) return;
    if (verificationCode.length !== 6) return;
    _verifyCode();
  }, [verificationCode, verificationId]);

  return (
    <View
      style={{
        backgroundColor: background,
      }}
    >
      <Header hasBackButton />
      {/* <View
      style={{
        justifyContent: "flex-start",
        width: "100%",
        paddingVertical: 10,
      }}
    >
      <Back />
    </View> */}

      <KeyboardAwareScrollView
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        style={{
          flexDirection: "column",
          display: "flex",
          height: "100%",
          paddingHorizontal: 20,
        }}
      >
        <Text
          style={{
            fontSize: 28,
            textAlign: "left",
            width: "100%",
            marginTop: 25,
            color: header,
            fontFamily: "Inter-Bold",
          }}
        >
          Add your phone
        </Text>

        <Text
          style={{
            fontSize: 16,
            textAlign: "left",
            width: "100%",
            marginTop: 10,
            marginBottom: 25,
            color: text,
          }}
        >
          This helps your friends discover and follow the content you listen to.
        </Text>

        {step === "phone" && (
          <Input
            value={phoneNumber}
            onChangeText={_onChange}
            autoFocus
            label="Phone Number"
            // label="Client Full Name"
            placeholder="123-456-7890"
            autoComplete="tel"
            keyboardType="phone-pad"
            // ref={verifyInputRef}
          />
        )}

        {step === "code" && (
          <>
            <Input
              value={verificationCode}
              autoFocus
              onChangeText={(c) => setVerificationCode(c)}
              // label="Client Full Name"
              placeholder="Enter your verification code"
              autoComplete="one-time-code"
              keyboardType="number-pad"
              textContentType="oneTimeCode"
            />

            {/* text to resend the code */}

            <TouchableOpacity
              disabled={isSendingCode}
              activeOpacity={1}
              onPress={_sendCode}
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 10,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Inter-Semibold",
                  color: colors.primary,
                }}
              >
                Resend code
              </Text>
              {isSendingCode && (
                <ActivityIndicator size="small" style={{ marginLeft: 10 }} />
              )}
            </TouchableOpacity>
          </>
        )}

        <Button
          style={{ marginTop: 30 }}
          onPress={_onSubmit}
          loading={step === "phone" ? isSendingCode : isVerifyingCode}
          label={step === "phone" ? "Continue" : "Verify Code"}
        />
      </KeyboardAwareScrollView>
    </View>
  );
}

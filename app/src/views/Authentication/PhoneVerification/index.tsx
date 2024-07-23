import React from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { auth } from "src/utils/firebase";
import { Button, Input, colors } from "src/components";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { Maybe } from "src/core";
import { FirebaseError } from "firebase/app";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
// import the types for react native firebase
import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { RootStackParamList } from "src/navigation";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useTheme } from "src/hooks/useTheme";

export function PhoneVerification() {
  const { params } =
    useRoute<RouteProp<RootStackParamList, "PhoneVerification">>();
  const { background, header, text } = useTheme();

  const flowType = params?.flowType;
  const multiFactorError = params?.multiFactorError;
  const session = params?.session;
  const multiFactorHint = params?.multiFactorHint;
  const onSuccess = params?.onSuccess;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [step, setStep] = useState<"phone" | "code">(
    multiFactorHint ? "code" : "phone"
  );
  const [isSendingCode, setIsSendingCode] = useState<boolean>(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState<boolean>(false);

  const verifyInputRef = useRef<TextInput>(null);

  const _onSubmit = async function () {
    try {
      if (step === "phone") {
        await _sendCode();
        return;
      }

      if (step === "code") {
        await _verifyCode();

        return;
      }
    } catch (err) {
      // console.log(err);
    }
  };

  const _sendCode = async () => {
    try {
      setIsSendingCode(true);

      const user = auth().currentUser;

      const userSession =
        session || (user ? await auth().multiFactor(user).getSession() : null);

      if (!userSession) {
        Alert.alert("No session. Please refresh and try again.");
        return;
      }

      if (multiFactorHint) {
        // Send SMS verification code.
        console.log("[sending verification code]");

        const verificationId =
          await auth().verifyPhoneNumberWithMultiFactorInfo(
            multiFactorHint,
            userSession
          );

        setVerificationId(verificationId);
        setStep("code");

        verifyInputRef.current?.focus();
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

      if (flowType === "sign_in" && multiFactorError) {
        const multiFactorResolver =
          auth().getMultiFactorResolver(multiFactorError);

        await multiFactorResolver.resolveSignIn(multiFactorAssertion);

        console.log("[signed in 2 factor]");

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        navigation.goBack();

        // Note: the on success is responsible
        // for closing the modal. this is bc the on success may have a navigate()
        // and a navigate will need to close the modal before progressing
        if (onSuccess) {
          await onSuccess();
        }

        return;
      }

      console.log("unhandled: ", flowType);
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

  const _onChange = (event: any) => {
    const inputNumber = event.target.value;
    const parsedNumber = parsePhoneNumberFromString(inputNumber, "US"); // Replace 'US' with the relevant country code if needed

    // Format the number or keep the raw input if it's not a valid number yet
    const formattedNumber = parsedNumber
      ? parsedNumber.formatNational()
      : inputNumber;
    setPhoneNumber(formattedNumber);
  };

  useEffect(() => {
    if (!multiFactorHint?.uid) return;
    // hack to wait for render so the recaptcha can load
    _sendCode();
  }, [multiFactorHint?.uid]);

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
        paddingHorizontal: 20,
      }}
    >
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
          }}
        >
          {flowType === "sign_in" ? "Sign in with" : ""} Two-Factor
          Authentication
        </Text>

        {multiFactorHint && (
          <Text
            style={{
              marginBottom: 10,
              color: text,
            }}
          >
            We sent a code to {multiFactorHint.displayName?.toLowerCase()}
          </Text>
        )}

        {step === "phone" && (
          <Input
            value={phoneNumber}
            onChange={_onChange}
            autoFocus
            label="Phone Number"
            // label="Client Full Name"
            placeholder="123-456-7890"
            autoComplete="tel"
            keyboardType="phone-pad"
            ref={verifyInputRef}
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
                  fontFamily: "Raleway-Semibold",
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
          label={step === "phone" ? "Send Code" : "Verify Code"}
        />
      </KeyboardAwareScrollView>
    </View>
  );
}

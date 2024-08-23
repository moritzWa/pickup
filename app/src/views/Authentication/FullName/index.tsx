import { ApolloError, useMutation } from "@apollo/client";
import { useNavigation } from "@react-navigation/core";
import * as Haptics from "expo-haptics";
import React, { useEffect } from "react";
import { Alert, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "src/api";
import { Mutation, MutationUpdateUserArgs } from "src/api/generated/types";
import { Input } from "src/components";
import Back from "src/components/Back";
import Button from "src/components/Button";
import { useMe } from "src/hooks";
import { useTheme } from "src/hooks/useTheme";
import { NavigationProps } from "src/navigation";

const FullName = () => {
  const navigation = useNavigation<NavigationProps>();
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const { background, text, header } = useTheme();

  const [updateUser, { loading, error }] = useMutation<
    Pick<Mutation, "updateUser">,
    MutationUpdateUserArgs
  >(api.users.update);

  const { me } = useMe();

  useEffect(() => {
    if (me?.name) {
      setFullName(me?.name);
    }
  }, [me?.name]);

  const _onUpdate = async () => {
    try {
      if (!fullName) {
        return Alert.alert("Please type your full name.");
      }

      const variables: MutationUpdateUserArgs = {
        name: fullName,
      };

      await updateUser({
        variables,
        refetchQueries: [api.users.me],
      });

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

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
            fontFamily: "Inter-Bold",
            textAlign: "left",
            width: "100%",
            marginTop: 25,
            marginBottom: 25,
            color: header,
          }}
        >
          What is your name?
        </Text>

        <Input
          autoComplete="name"
          autoFocus
          label="Full name"
          placeholder="Full name"
          textContentType="name"
          value={fullName}
          returnKeyType="next"
          onChangeText={(text) => setFullName(text)}
        />

        <Button
          label="Continue"
          style={{
            marginTop: 20,
            marginBottom: 10,
          }}
          onPress={_onUpdate}
        />
      </KeyboardAwareScrollView>
    </View>
  );
};

export default FullName;

import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSelector } from "react-redux";
import { api, apolloClient } from "src/api";
import BigNumber from "bignumber.js";
import { useInterval } from "src/hooks/useInterval";
import { useTheme } from "src/hooks/useTheme";
import { Button, Input } from "src/components";
import * as yup from "yup";
import { useMe } from "src/hooks";
import {
  Mutation,
  MutationUpdateUserArgs,
  Query,
} from "src/api/generated/types";
import { debounce } from "lodash";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Header from "src/components/Header";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

const schema = yup.object().shape({
  name: yup.string().required("Name is required."),
  username: yup.string().required("Username is required."),
  description: yup.string(),
});

type FormValues = {
  name: string;
  username: string;
  description: string;
};

const DEFAULT_VALUES: FormValues = {
  name: "",
  username: "",
  description: "",
};

const EditProfile = () => {
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const { me } = useMe();
  const [name, setName] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const [hasLoadedMe, setHasLoadedMe] = useState(false);
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!me) return;
    if (hasLoadedMe) return;
    setName(me.name || "");
    setUsername(me.username || "");
    setDescription(me.description);
    setHasLoadedMe(true);
  }, [me, setHasLoadedMe, hasLoadedMe]);

  const [updateProfile, { loading: loadingUpdateProfile, error }] = useMutation<
    Pick<Mutation, "updateUser">,
    MutationUpdateUserArgs
  >(api.users.update);

  const [
    checkValidUsername,
    {
      data: checkValidUsernameData,
      loading: loadingCheckValidUsername,
      error: checkValidUsernameError,
    },
  ] = useLazyQuery<Pick<Query, "checkValidUsername">>(
    api.users.checkValidUsername
  );

  const isValidUsername = useMemo(
    () => (checkValidUsernameError ? false : true),
    [checkValidUsernameError]
  );

  const checkValidUsernameDebounced = useCallback(
    debounce((username: string) => {
      checkValidUsername({
        variables: {
          username,
        },
      });
    }, 400),
    [checkValidUsername]
  );

  useEffect(() => {
    checkValidUsernameDebounced(username);
    // checkValidUsername({
    //   variables: {
    //     username: usernameValue,
    //   },
    // });
  }, [checkValidUsername, username]);

  const onSubmit = async () => {
    try {
      if (loadingUpdateProfile || loadingCheckValidUsername) return;

      const values = {
        name,
        username,
        description,
      };

      if (!values.name) {
        Alert.alert("Please enter your name.");
        return;
      }

      if (!values.username) {
        Alert.alert("Please enter your username.");
        return;
      }

      if (!isValidUsername) {
        Alert.alert(
          checkValidUsernameError?.message || "Please enter a valid username"
        );
        return;
      }

      await updateProfile({
        variables: {
          name: values.name,
          username: values.username,
          description: values.description,
        },
        refetchQueries: [api.users.me, api.users.getProfile],
      });

      navigation.goBack();
    } catch (e) {
      console.error(e);
      const message = (e as any)?.message || "An error occurred.";

      Alert.alert(message);
    }
  };

  if (!me) {
    return (
      <View
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={theme.activityIndicator} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Header
        containerStyle={{ paddingTop: 15 }}
        hasBackButton
        title="Edit Profile"
        rightIcon={
          //  save button
          <Button
            label="Save"
            onPress={onSubmit}
            style={{
              height: 35,
              paddingHorizontal: 0,
              width: 80,
              borderRadius: 100,
            }}
            loading={loadingUpdateProfile}
          />
        }
      />
      <KeyboardAwareScrollView
        contentContainerStyle={{
          padding: 15,
          paddingBottom: 100,
        }}
        // make it so you can click the buttons in the scroll view
        keyboardShouldPersistTaps="handled"
      >
        <Input label="Name" required value={name} onChangeText={setName} />

        <Input
          label="Username"
          required
          errorMessage={checkValidUsernameError?.message}
          value={username}
          onChangeText={setUsername}
        />

        <Input
          label="Description"
          value={description}
          onChangeText={setDescription}
          autoCapitalize="none"
          autoCorrect={false}
          numberOfLines={4}
          style={{
            minHeight: 100,
            paddingTop: 10,
          }}
          multiline={true}
          textAlignVertical="top"
        />

        {/* <Button
          style={{ marginTop: 40 }}
          loading={loading}
          onPress={onSubmit}
          label={"Save changes"}
        /> */}
      </KeyboardAwareScrollView>
    </View>
  );
};

export default EditProfile;

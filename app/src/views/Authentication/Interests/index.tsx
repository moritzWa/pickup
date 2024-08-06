import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import React, { useEffect, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Input, colors } from "src/components";
import Button from "src/components/Button";
import Back from "src/components/Back";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import {
  ApolloError,
  useLazyQuery,
  useMutation,
  useQuery,
} from "@apollo/client";
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
import { useIsFocused } from "@react-navigation/native";

const Interests = () => {
  const navigation = useNavigation<NavigationProps>();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const fullTheme = useTheme();
  const { background, text, header } = fullTheme;

  const isFocused = useIsFocused();
  const {
    data: categoriesData,
    error: categoryError,
    refetch,
  } = useQuery<Pick<Query, "getCategories">>(api.categories.list);

  const [createUser, { loading, error }] = useMutation<
    Pick<Mutation, "createUser">,
    MutationCreateUserArgs
  >(api.users.create);

  const [getMe] = useLazyQuery<Pick<Query, "me">>(api.users.me);

  const categories = categoriesData?.getCategories || [];

  useEffect(() => void refetch(), [isFocused]);

  const _continue = async () => {
    try {
      // TODO:
      return navigation.navigate("Main");
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
            marginBottom: 15,
            color: header,
          }}
        >
          What type of content are you interested in?
        </Text>

        <Input
          placeholder="Type here..."
          textContentType="name"
          value={fullName}
          numberOfLines={4}
          multiline
          style={{
            height: 80,
            alignItems: "flex-start",
          }}
          returnKeyType="next"
          onChangeText={(text) => setFullName(text)}
        />

        <Text
          style={{
            fontSize: 16,
            marginTop: 20,
            textAlign: "left",
            fontFamily: "Raleway-Medium",
            color: text,
          }}
        >
          Suggestions:
        </Text>

        <View
          style={{
            marginVertical: 25,
            marginTop: 10,
            // just display flex and wrap
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "flex-start",
            alignItems: "center",
          }}
        >
          {categories.map((category) => (
            <TouchableOpacity
              activeOpacity={0.8}
              style={{
                padding: 10,
                paddingHorizontal: 15,
                marginRight: 5,
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 5,
                borderRadius: 100,
                backgroundColor:
                  category?.backgroundColor || fullTheme.secondaryBackground,
              }}
              key={category.value}
            >
              <Text
                style={{
                  fontFamily: "Raleway-Medium",
                  fontSize: 12,
                  color: category?.textColor || text,
                }}
              >
                {category.emoji}
              </Text>
              <Text
                style={{
                  fontFamily: "Raleway-Medium",
                  fontSize: 16,
                  marginLeft: 10,
                  color: category?.textColor || text,
                }}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          label="Continue"
          style={{
            marginTop: 20,
            marginBottom: 10,
          }}
          onPress={_continue}
        />
      </KeyboardAwareScrollView>
    </View>
  );
};

export default Interests;

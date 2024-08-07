import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
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
  CategoryInfo,
  Mutation,
  MutationCreateUserArgs,
  MutationSetInterestsArgs,
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

  const [description, setDescription] = React.useState("");

  const fullTheme = useTheme();
  const { background, text, header } = fullTheme;

  const [selected, setSelected] = useState<Set<string>>(new Set([]));

  const isFocused = useIsFocused();
  const {
    data: categoriesData,
    error: categoryError,
    refetch,
  } = useQuery<Pick<Query, "getCategories">>(api.categories.list);

  const [setInterests, { loading, error }] = useMutation<
    Pick<Mutation, "setInterests">,
    MutationSetInterestsArgs
  >(api.users.setInterests);

  const categories = categoriesData?.getCategories || [];

  useEffect(() => void refetch(), [isFocused]);

  const _continue = async () => {
    try {
      if (selected.size < 3) {
        Alert.alert("Error", "Please select at least 3 interests");
        return;
      }

      const variables: MutationSetInterestsArgs = {
        interestDescription: description,
        interestCategories: Array.from(selected),
      };

      await setInterests({
        variables,
      });

      return navigation.navigate("EnablePushNotifications");
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

  const addOrRemove = (value: string) => {
    if (selected.has(value)) {
      selected.delete(value);
    } else {
      selected.add(value);
    }

    setSelected(new Set(selected));
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
          value={description}
          numberOfLines={4}
          multiline
          style={{
            height: 80,
            alignItems: "flex-start",
          }}
          returnKeyType="next"
          onChangeText={(text) => setDescription(text)}
        />

        <View
          style={{
            marginVertical: 25,
            // just display flex and wrap
          }}
        >
          {categories.map((section) => (
            <View
              style={{
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Raleway-Bold",
                  color: text,
                  marginBottom: 10,
                  textTransform: "uppercase",
                }}
              >
                {section.label}
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "flex-start",
                  alignItems: "center",
                }}
              >
                {section.categories.map((category) => (
                  <Category
                    category={category}
                    isActive={selected.has(category.value)}
                    onPress={() => addOrRemove(category.value)}
                  />
                ))}
              </View>
            </View>
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

const Category = ({
  category,
  isActive,
  onPress,
}: {
  category: CategoryInfo;
  isActive: boolean;
  onPress: () => void;
}) => {
  const fullTheme = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
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
        backgroundColor: isActive
          ? colors.primary
          : category?.backgroundColor || fullTheme.secondaryBackground,
      }}
      key={category.value}
    >
      <Text
        style={{
          fontFamily: "Raleway-Medium",
          fontSize: 12,
          color: category?.textColor || fullTheme.text,
        }}
      >
        {category.emoji}
      </Text>
      <Text
        style={{
          fontFamily: isActive ? "Raleway-Bold" : "Raleway-SemiBold",
          fontSize: 16,
          marginLeft: 10,
          color: isActive
            ? colors.white
            : category?.textColor || fullTheme.text,
        }}
      >
        {category.label}
      </Text>
    </TouchableOpacity>
  );
};

export default Interests;

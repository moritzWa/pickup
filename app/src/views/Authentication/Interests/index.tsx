import { ApolloError, useMutation, useQuery } from "@apollo/client";
import { useNavigation } from "@react-navigation/core";
import { useIsFocused } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "src/api";
import {
  Category,
  CategorySection,
  Mutation,
  MutationSetInterestsArgs,
  Query,
} from "src/api/generated/types";
import { Input, colors } from "src/components";
import Back from "src/components/Back";
import Button from "src/components/Button";
import { useTheme } from "src/hooks/useTheme";
import { NavigationProps } from "src/navigation";

const Interests = () => {
  const navigation = useNavigation<NavigationProps>();
  const insets = useSafeAreaInsets();

  const [description, setDescription] = React.useState("");

  const fullTheme = useTheme();
  const { background, text, header } = fullTheme;

  const [selected, setSelected] = useState<Set<string>>(new Set());

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

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  const addOrRemove = (value: string) => {
    setSelected((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      return newSet;
    });
  };

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

      const result = await setInterests({
        variables,
      });

      return navigation.navigate("EnablePushNotifications");
    } catch (err) {
      console.log("=== error ===");
      console.log(JSON.stringify(err, null, 2));
      if (err instanceof ApolloError) {
        console.log(
          "Apollo Error details:",
          JSON.stringify(err.graphQLErrors, null, 2)
        );
        console.log(
          "Network Error details:",
          JSON.stringify(err.networkError, null, 2)
        );
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
          placeholder="I'm currently struggling with/challenged by..."
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
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "flex-start",
            alignItems: "flex-start",
          }}
        >
          {categories.map((section: CategorySection) => (
            <View
              style={{
                marginBottom: 20,
                width: "100%",
              }}
              key={section.name}
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
                {section.name}
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "flex-start",
                  alignItems: "center",
                }}
              >
                {section.categories.map((category: Category) => (
                  <React.Fragment key={category.name}>
                    <CategoryButton
                      category={category}
                      isActive={selected.has(category.name)}
                      onPress={() => {
                        addOrRemove(category.name);
                        toggleCategory(category.name);
                      }}
                    />
                    {expandedCategories.has(category.name) &&
                      category.subcategories && (
                        <>
                          {category.subcategories.map((subcategory: string) => (
                            <CategoryButton
                              key={subcategory}
                              category={{
                                name: subcategory,
                                emoji: "",
                              }}
                              isActive={selected.has(subcategory)}
                              onPress={() => addOrRemove(subcategory)}
                            />
                          ))}
                        </>
                      )}
                  </React.Fragment>
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

type CategoryButtonProps = {
  category: {
    name: string;
    emoji: string;
  };
  isActive: boolean;
  onPress: () => void;
};

const CategoryButton = ({
  category,
  isActive,
  onPress,
}: CategoryButtonProps) => {
  const fullTheme = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={{
        padding: 8,
        paddingHorizontal: 12,
        marginRight: 5,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 5,
        borderRadius: 100,
        backgroundColor: isActive
          ? colors.primary
          : fullTheme.secondaryBackground,
      }}
    >
      {category.emoji && (
        <Text
          style={{
            fontFamily: "Raleway-Medium",
            fontSize: 12,
            marginRight: 5,
            color: fullTheme.text,
          }}
        >
          {category.emoji}
        </Text>
      )}

      <Text
        style={{
          fontFamily: isActive ? "Raleway-Bold" : "Raleway-SemiBold",
          fontSize: 16,
          color: isActive ? colors.white : fullTheme.text,
        }}
      >
        {category.name}
      </Text>
    </TouchableOpacity>
  );
};

export default Interests;

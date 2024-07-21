import { View, Text, TouchableOpacity, SafeAreaView } from "react-native";
import React from "react";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "src/hooks";

const Home = () => {
  const navigation = useNavigation();
  const theme = useTheme();

  return (
    <SafeAreaView>
      <Text
        style={{
          color: theme.header,
        }}
      >
        Home
      </Text>

      <TouchableOpacity onPress={() => navigation.navigate("Lesson")}>
        <Text
          style={{
            color: theme.header,
          }}
        >
          Go to Lesson
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default Home;

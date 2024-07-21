import { View, Text } from "react-native";
import React from "react";
import { useTheme } from "src/hooks";

const Courses = () => {
  const theme = useTheme();

  return (
    <View>
      <Text
        style={{
          color: theme.header,
        }}
      >
        Courses
      </Text>
    </View>
  );
};

export default Courses;

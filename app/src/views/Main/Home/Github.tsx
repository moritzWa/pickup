import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
const SCREEN_WIDTH = Dimensions.get("window").width;
const DOT_SIZE = 3;
const DOT_MARGIN = 2;
const NUM_COLUMNS = Math.floor(SCREEN_WIDTH / (DOT_SIZE + DOT_MARGIN));

export const Impressions = ({ impressions }) => {
  return (
    <View style={styles.container}>
      {impressions.map((impression, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            { backgroundColor: impression.completed ? "#4caf50" : "#e0e0e0" },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 20,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    margin: DOT_MARGIN / 2,
  },
});

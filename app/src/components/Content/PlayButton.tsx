import {
  faBookReader,
  faPause,
  faPlay,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import React from "react";
import { Animated, TouchableOpacity } from "react-native";
import { colors } from "src/components";

const IMAGE_SIZE = 35;

export const PlayButton = ({
  animation,
  playOrPause,
  c,
  isActive,
  isPlaying,
}: {
  animation: Animated.Value;
  playOrPause: () => void;
  c: any;
  isActive: boolean;
  isPlaying: boolean;
}) => {
  return (
    <Animated.View
      style={{
        width: IMAGE_SIZE,
        height: IMAGE_SIZE,
        marginRight: 0,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 100,
        backgroundColor: colors.primary,
        alignSelf: "center",
        transform: [{ scale: animation }],
      }}
    >
      <TouchableOpacity onPress={playOrPause} activeOpacity={1}>
        <FontAwesomeIcon
          icon={
            c.audioUrl
              ? isActive && isPlaying
                ? faPause
                : faPlay
              : faBookReader
          }
          color={colors.white}
          size={16}
          style={{
            position: "relative",
            right: c.audioUrl ? (isActive && isPlaying ? 0 : -1) : 0.5,
          }}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

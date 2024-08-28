import React from "react";
import { Text, View } from "react-native";
import { BaseContentFields } from "src/api/fragments";
import { IS_IPAD } from "src/config";
import { useTheme } from "src/hooks";
import { CircularProgress } from "./ContentRow";

export const ContentSessionProgress = ({
  content,
  isActive,
}: {
  content: BaseContentFields;
  isActive: boolean;
}) => {
  const theme = useTheme();

  return (
    <View>
      {content.contentSession?.percentFinished ? (
        <View
          style={{
            display: "flex",
            marginLeft: 5,
            flexDirection: "row",
            alignItems: "center",
            // marginRight: 15,
          }}
        >
          <CircularProgress
            size={IS_IPAD ? 26 : 14}
            strokeWidth={IS_IPAD ? 5 : 3}
            bg={isActive ? theme.textSubtle : theme.textSubtle}
            percentage={content.contentSession?.percentFinished || 0}
          />

          <Text
            style={{
              marginLeft: 5,
              color: theme.text,
              fontSize: 14,
              fontFamily: "Inter-Medium",
            }}
          >
            {content.contentSession?.percentFinished}%
          </Text>
        </View>
      ) : null}
    </View>
  );
};

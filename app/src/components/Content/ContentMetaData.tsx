import { faNewspaper, faPodcast } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { truncate } from "lodash";
import moment from "moment";
import React from "react";
import { Text, View } from "react-native";
import { BaseContentFields } from "src/api/fragments";
import { useTheme } from "src/hooks";
import { Separator } from "./ContentRowComponents";

export const ContentMetaData = ({
  content,
}: {
  content: BaseContentFields;
}) => {
  const theme = useTheme();

  const hasContentSessionProgress =
    (content.contentSession &&
      !!content.contentSession?.percentFinished &&
      content.contentSession?.percentFinished > 0) ??
    false;

  return (
    <View
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Text
        style={{
          color: theme.textSecondary,
          fontSize: 14,
          fontFamily: "Inter-Medium",
          alignItems: "center",
        }}
      >
        <FontAwesomeIcon
          icon={content.type === "article" ? faNewspaper : faPodcast}
          color={theme.textSecondary}
          size={14}
          style={{ marginBottom: -2, height: 14 }}
        />
        <Separator />
        {content.authorName && (
          <>
            {truncate(content.authorName || "", {
              length: 18,
              omission: "…",
            })}
            <Separator />
          </>
        )}
        {content.releasedAt && (
          <>
            {moment(content.releasedAt).format("M/D/YY")}
            <Separator />
          </>
        )}
        {content.lengthFormatted}
        {hasContentSessionProgress && <Separator />}
        {hasContentSessionProgress && (
          <>{content.contentSession?.percentFinished}%</>
        )}
      </Text>
    </View>
  );
};

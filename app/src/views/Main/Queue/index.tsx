import { faHeadset } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import React from "react";
import { FlatList, Text, View } from "react-native";
import FastImage from "react-native-fast-image";
import { useSelector } from "react-redux";
import { BaseContentFields } from "src/api/fragments";
import Close from "src/components/Close";
import { getDescription } from "src/components/Content/contentHelpers";
import { useTheme } from "src/hooks";
import { getQueue } from "src/redux/reducers/audio";

const Queue = () => {
  const queue = useSelector(getQueue);
  const theme = useTheme();

  return (
    <View
      style={{
        paddingTop: 20,
      }}
    >
      <View style={{ zIndex: 100 }}>
        <Close />
      </View>

      <View style={{ marginTop: 15 }}>
        <FlatList
          data={queue}
          ListHeaderComponent={
            <Text
              style={{
                marginHorizontal: 15,
                fontFamily: "Inter-Bold",
                fontSize: 24,
                marginTop: 5,
                marginBottom: 20,
                marginRight: 50,
                color: theme.header,
              }}
            >
              Your Queue
            </Text>
          }
          renderItem={({ item }) => <QueueRow content={item} />}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={() => (
            <Text
              style={{
                textAlign: "center",
                fontSize: 22,
                color: theme.text,
                paddingVertical: 100,
                fontFamily: "Inter-Medium",
              }}
            >
              Your queue is empty.
            </Text>
          )}
        />
      </View>
    </View>
  );
};

// TODO: merge this with ContentRow?
const QueueRow = ({ content }: { content: BaseContentFields }) => {
  const theme = useTheme();

  return (
    <View
      style={{
        display: "flex",
        padding: 15,
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 15,
        marginHorizontal: 10,
        marginBottom: 10,
        flexDirection: "row",
        alignItems: "flex-start",
      }}
    >
      <FastImage
        style={{
          width: 40,
          marginRight: 10,
          height: 40,
          borderRadius: 10,
        }}
        resizeMode="cover"
        source={{
          uri: content.thumbnailImageUrl ?? undefined,
        }}
      />

      <View style={{ flex: 1 }}>
        <Text
          numberOfLines={2}
          style={{
            color: theme.header,
            fontFamily: "Inter-Bold",
            fontSize: 16,
            marginBottom: 5,
          }}
        >
          {content.title}
        </Text>

        <Text
          style={{
            color: theme.text,
            fontSize: 14,
            fontFamily: "Inter-Medium",
            marginBottom: 10,
          }}
          numberOfLines={2}
        >
          {getDescription(content)}
        </Text>

        <View
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start",
          }}
        >
          <FontAwesomeIcon
            icon={faHeadset}
            style={{
              color: theme.text,
            }}
          />

          <Text
            style={{
              marginLeft: 5,
              color: theme.text,
              fontFamily: "Inter-Regular",
              fontSize: 14,
            }}
          >
            {Math.ceil(content.lengthSeconds / 60)}min
          </Text>
        </View>
      </View>
    </View>
  );
};

export default Queue;
